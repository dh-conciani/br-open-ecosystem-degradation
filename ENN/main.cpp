#include <gdal_priv.h>
#include <gdal_alg.h>
#include <ogrsf_frmts.h>
#include <cpl_conv.h>

#include "nanoflann.hpp"

#include <omp.h>

#include <algorithm>
#include <atomic>
#include <chrono>
#include <cmath>
#include <cstdint>
#include <filesystem>
#include <iomanip>
#include <iostream>
#include <limits>
#include <mutex>
#include <numeric>
#include <optional>
#include <sstream>
#include <stdexcept>
#include <string>
#include <unordered_map>
#include <vector>

namespace fs = std::filesystem;

/* =========================
 PARAMETERS
 ========================= */

struct Params {
  std::vector<int> years = {2024};
  
  double searchRadiusM = 20000.0;
  int nThreads = 23;
  
  std::string patchPathTemplate =
    "/mnt/Files-Geo/Arquivos/DEGRADACAO/LSMETRICS/COL101/results/fragment_id_%d.tif";
  
  std::string gridPath =
    "/mnt/Files-Geo/Arquivos/DEGRADACAO/LSMETRICS/COL10/hex/degradation-fragmentation-enn-tiles.shp";
  
  std::string outDir = "enn_tiles_cpp";
  std::string logDir = "enn_tiles_cpp/logs";
  
  int kUse = 256;
  
  int tileStart = 1;
  int tileEnd = -1;
};

/* =========================
 LOGGING
 ========================= */

static std::mutex gLogMutex;

static std::string nowStr() {
  auto now = std::chrono::system_clock::now();
  std::time_t t = std::chrono::system_clock::to_time_t(now);
  std::tm tm{};
#ifdef _WIN32
  localtime_s(&tm, &t);
#else
  localtime_r(&t, &tm);
#endif
  std::ostringstream oss;
  oss << std::put_time(&tm, "%Y-%m-%d %H:%M:%S");
  return oss.str();
}

static void logLine(const std::string& msg) {
  std::lock_guard<std::mutex> lock(gLogMutex);
  std::cout << "[" << nowStr() << "] " << msg << "\n";
}

/* =========================
 HELPERS
 ========================= */

static void ensureDir(const std::string& p) {
  fs::create_directories(p);
}

static std::string fmtPatchPath(const std::string& templ, int year) {
  char buf[4096];
  std::snprintf(buf, sizeof(buf), templ.c_str(), year);
  return std::string(buf);
}

static bool fileExists(const std::string& p) {
  return fs::exists(p);
}

static double metersToDeg(double m, double latDeg) {
  const double latRad = latDeg * M_PI / 180.0;
  const double mPerDegLat =
    111132.92 - 559.82 * std::cos(2 * latRad) + 1.175 * std::cos(4 * latRad);
  const double mPerDegLon =
    111412.84 * std::cos(latRad) - 93.5 * std::cos(3 * latRad);
  return m / std::min(mPerDegLat, mPerDegLon);
}

static void lonlatToLocalM(double lon, double lat, double lat0Deg, double& outX, double& outY) {
  const double lat0 = lat0Deg * M_PI / 180.0;
  const double mPerDegLat =
    111132.92 - 559.82 * std::cos(2 * lat0) + 1.175 * std::cos(4 * lat0);
  const double mPerDegLon =
    111412.84 * std::cos(lat0) - 93.5 * std::cos(3 * lat0);
  outX = lon * mPerDegLon;
  outY = lat * mPerDegLat;
}

/* =========================
 NODATA
 ========================= */

struct NoDataInfo {
  bool hasNoData = false;
  int32_t value = 0;
};

static NoDataInfo getNoDataInfo(GDALDataset* ds) {
  GDALRasterBand* band = ds->GetRasterBand(1);
  if (!band) throw std::runtime_error("Raster band 1 not found");
  
  int hasNd = 0;
  double nd = band->GetNoDataValue(&hasNd);
  
  NoDataInfo out;
  out.hasNoData = (hasNd != 0);
  out.value = static_cast<int32_t>(std::llround(nd));
  return out;
}

static inline bool isNoData(int32_t v, const NoDataInfo& nd) {
  return nd.hasNoData && v == nd.value;
}

/* =========================
 GRID TILES
 ========================= */

struct TileJob {
  int index1 = 0;
  long long fid = 0;
  std::string wkt;
};

struct GridLoadResult {
  std::vector<TileJob> jobs;
  std::string srsWkt;
};

static GridLoadResult loadTiles(const std::string& gridPath, int tileStart1, int tileEnd1) {
  GDALDataset* vds = static_cast<GDALDataset*>(
    GDALOpenEx(gridPath.c_str(), GDAL_OF_VECTOR, nullptr, nullptr, nullptr)
  );
  if (!vds) throw std::runtime_error("Failed to open grid: " + gridPath);
  
  OGRLayer* layer = vds->GetLayer(0);
  if (!layer) {
    GDALClose(vds);
    throw std::runtime_error("Failed to open layer from grid");
  }
  
  std::string srsWkt;
  if (OGRSpatialReference* srs = layer->GetSpatialRef()) {
    char* tmp = nullptr;
    srs->exportToWkt(&tmp);
    if (tmp) {
      srsWkt = tmp;
      CPLFree(tmp);
    }
  }
  
  std::vector<TileJob> jobs;
  layer->ResetReading();
  
  OGRFeature* feat = nullptr;
  int idx1 = 0;
  
  while ((feat = layer->GetNextFeature()) != nullptr) {
    ++idx1;
    
    if (idx1 < tileStart1) {
      OGRFeature::DestroyFeature(feat);
      continue;
    }
    if (tileEnd1 > 0 && idx1 > tileEnd1) {
      OGRFeature::DestroyFeature(feat);
      break;
    }
    
    OGRGeometry* geom = feat->GetGeometryRef();
    if (!geom) {
      OGRFeature::DestroyFeature(feat);
      continue;
    }
    
    char* wktRaw = nullptr;
    geom->exportToWkt(&wktRaw);
    
    long long fid = idx1;
    int fld = feat->GetFieldIndex("FID");
    if (fld >= 0 && feat->IsFieldSet(fld)) {
      fid = feat->GetFieldAsInteger64(fld);
    }
    
    TileJob j;
    j.index1 = idx1;
    j.fid = fid;
    j.wkt = wktRaw ? std::string(wktRaw) : "";
    
    if (wktRaw) CPLFree(wktRaw);
    OGRFeature::DestroyFeature(feat);
    
    if (!j.wkt.empty()) jobs.push_back(std::move(j));
  }
  
  GDALClose(vds);
  return GridLoadResult{jobs, srsWkt};
}

/* =========================
 RASTER WINDOW / GT
 ========================= */

struct GeoTransform {
  double gt[6]{};
};

struct RasterWindow {
  int xOff = 0;
  int yOff = 0;
  int xSize = 0;
  int ySize = 0;
};

struct RasterData {
  int width = 0;
  int height = 0;
  std::vector<int32_t> values;
};

static GeoTransform getGT(GDALDataset* ds) {
  GeoTransform g;
  if (ds->GetGeoTransform(g.gt) != CE_None) {
    throw std::runtime_error("Failed to read geotransform");
  }
  return g;
}

static void worldToPixel(const GeoTransform& gt, double x, double y, double& px, double& py) {
  px = (x - gt.gt[0]) / gt.gt[1];
  py = (y - gt.gt[3]) / gt.gt[5];
}

static void pixelToWorld(const GeoTransform& gt, double px, double py, double& x, double& y) {
  x = gt.gt[0] + px * gt.gt[1] + py * gt.gt[2];
  y = gt.gt[3] + px * gt.gt[4] + py * gt.gt[5];
}

static std::optional<RasterWindow> geometryEnvelopeToWindow(
    OGRGeometry* geom,
    GDALDataset* ds
) {
  OGREnvelope env;
  geom->getEnvelope(&env);
  
  const GeoTransform gt = getGT(ds);
  
  double px0, py0, px1, py1;
  worldToPixel(gt, env.MinX, env.MaxY, px0, py0);
  worldToPixel(gt, env.MaxX, env.MinY, px1, py1);
  
  int xOff = std::max(0, static_cast<int>(std::floor(std::min(px0, px1))));
  int yOff = std::max(0, static_cast<int>(std::floor(std::min(py0, py1))));
  int xEnd = std::min(ds->GetRasterXSize(), static_cast<int>(std::ceil(std::max(px0, px1))));
  int yEnd = std::min(ds->GetRasterYSize(), static_cast<int>(std::ceil(std::max(py0, py1))));
  
  if (xEnd <= xOff || yEnd <= yOff) return std::nullopt;
  
  return RasterWindow{xOff, yOff, xEnd - xOff, yEnd - yOff};
}

static RasterData readRasterWindow(GDALDataset* ds, const RasterWindow& w) {
  GDALRasterBand* band = ds->GetRasterBand(1);
  if (!band) throw std::runtime_error("Raster band 1 not found");
  
  RasterData r;
  r.width = w.xSize;
  r.height = w.ySize;
  r.values.resize(static_cast<size_t>(r.width) * r.height);
  
  CPLErr err = band->RasterIO(
    GF_Read,
    w.xOff, w.yOff, w.xSize, w.ySize,
    r.values.data(),
    w.xSize, w.ySize,
    GDT_Int32,
    0, 0, nullptr
  );
  if (err != CE_None) throw std::runtime_error("RasterIO read failed");
  
  return r;
}

/* =========================
 GEOMETRY / CRS
 ========================= */

static OGRGeometry* reconstructGeometryFromWkt(const std::string& wkt) {
  OGRGeometry* geom = nullptr;
  char* wktMutable = CPLStrdup(wkt.c_str());
  char* pWkt = wktMutable;
  
  OGRErr err = OGRGeometryFactory::createFromWkt(&pWkt, nullptr, &geom);
  CPLFree(wktMutable);
  
  if (err != OGRERR_NONE || !geom) {
    throw std::runtime_error("Failed to reconstruct geometry from WKT");
  }
  
  return geom;
}

static OGRGeometry* cloneAndTransformToRasterCRS(
    OGRGeometry* geom,
    const std::string& gridSrsWkt,
    GDALDataset* rasterDs
) {
  OGRGeometry* out = geom->clone();
  if (!out) throw std::runtime_error("Failed to clone geometry");
  
  const char* rasterProj = rasterDs->GetProjectionRef();
  if (gridSrsWkt.empty() || rasterProj == nullptr || std::string(rasterProj).empty()) {
    return out;
  }
  
  OGRSpatialReference srcSRS;
  OGRSpatialReference dstSRS;
#if GDAL_VERSION_NUM >= 3000000
  srcSRS.SetAxisMappingStrategy(OAMS_TRADITIONAL_GIS_ORDER);
  dstSRS.SetAxisMappingStrategy(OAMS_TRADITIONAL_GIS_ORDER);
#endif
  
  if (srcSRS.importFromWkt(gridSrsWkt.c_str()) != OGRERR_NONE) return out;
  if (dstSRS.importFromWkt(rasterProj) != OGRERR_NONE) return out;
  
  if (srcSRS.IsSame(&dstSRS)) return out;
  
  OGRCoordinateTransformation* ct = OGRCreateCoordinateTransformation(&srcSRS, &dstSRS);
  if (!ct) {
    OGRGeometryFactory::destroyGeometry(out);
    throw std::runtime_error("Failed to create CRS transform");
  }
  
  if (out->transform(ct) != OGRERR_NONE) {
    OCTDestroyCoordinateTransformation(ct);
    OGRGeometryFactory::destroyGeometry(out);
    throw std::runtime_error("Failed to transform geometry");
  }
  
  OCTDestroyCoordinateTransformation(ct);
  return out;
}

/* =========================
 MASKS
 ========================= */

static std::vector<uint8_t> rasterizeGeometryMask(
    GDALDataset* refDs,
    const RasterWindow& w,
    OGRGeometry* geom
) {
  GDALDriver* memDrv = GetGDALDriverManager()->GetDriverByName("MEM");
  if (!memDrv) throw std::runtime_error("MEM driver not found");
  
  GDALDataset* memDs = memDrv->Create("", w.xSize, w.ySize, 1, GDT_Byte, nullptr);
  if (!memDs) throw std::runtime_error("Failed to create MEM raster");
  
  double gtFull[6];
  refDs->GetGeoTransform(gtFull);
  
  double gtWin[6] = {
    gtFull[0] + w.xOff * gtFull[1] + w.yOff * gtFull[2],
                                                    gtFull[1],
                                                          gtFull[2],
                                                                gtFull[3] + w.xOff * gtFull[4] + w.yOff * gtFull[5],
                                                                                                                gtFull[4],
                                                                                                                      gtFull[5]
  };
  
  memDs->SetGeoTransform(gtWin);
  memDs->SetProjection(refDs->GetProjectionRef());
  
  int bandList[1] = {1};
  double burnVal[1] = {1.0};
  OGRGeometryH hGeom = reinterpret_cast<OGRGeometryH>(geom);
  
  CPLErr err = GDALRasterizeGeometries(
    memDs, 1, bandList,
    1, &hGeom,
    nullptr, nullptr,
    burnVal,
    nullptr, nullptr, nullptr
  );
  if (err != CE_None) {
    GDALClose(memDs);
    throw std::runtime_error("Rasterize failed");
  }
  
  std::vector<uint8_t> mask(static_cast<size_t>(w.xSize) * w.ySize, 0);
  CPLErr err2 = memDs->GetRasterBand(1)->RasterIO(
    GF_Read,
    0, 0, w.xSize, w.ySize,
    mask.data(),
    w.xSize, w.ySize,
    GDT_Byte,
    0, 0, nullptr
  );
  GDALClose(memDs);
  
  if (err2 != CE_None) {
    throw std::runtime_error("Mask RasterIO failed");
  }
  
  return mask;
}

/* =========================
 BOUNDARY MASK
 ========================= */

static std::vector<uint8_t> computeBoundaryMask(
    const RasterData& r,
    const std::vector<uint8_t>& bufferMask,
    const NoDataInfo& nd
) {
  std::vector<uint8_t> out(static_cast<size_t>(r.width) * r.height, 0);
  
  auto idx = [&](int x, int y) -> size_t {
    return static_cast<size_t>(y) * r.width + x;
  };
  
  for (int y = 0; y < r.height; ++y) {
    for (int x = 0; x < r.width; ++x) {
      size_t i = idx(x, y);
      
      if (!bufferMask[i]) continue;
      
      int32_t v = r.values[i];
      if (isNoData(v, nd)) continue;
      
      bool boundary = false;
      
      const int dx[4] = {-1, 1, 0, 0};
      const int dy[4] = {0, 0, -1, 1};
      
      for (int k = 0; k < 4; ++k) {
        int nx = x + dx[k];
        int ny = y + dy[k];
        
        if (nx < 0 || nx >= r.width || ny < 0 || ny >= r.height) {
          boundary = true;
          break;
        }
        
        size_t j = idx(nx, ny);
        
        if (!bufferMask[j]) {
          boundary = true;
          break;
        }
        
        int32_t nv = r.values[j];
        
        if (isNoData(nv, nd) || nv != v) {
          boundary = true;
          break;
        }
      }
      
      out[i] = boundary ? 1 : 0;
    }
  }
  
  return out;
}

/* =========================
 KD TREE
 ========================= */

struct Point2D {
  double x;
  double y;
  int32_t pid;
};

struct PointCloud {
  std::vector<Point2D>* pts = nullptr;
  
  inline size_t kdtree_get_point_count() const { return pts->size(); }
  
  inline double kdtree_get_pt(const size_t idx, const size_t dim) const {
    return (dim == 0) ? (*pts)[idx].x : (*pts)[idx].y;
  }
  
  template <class BBOX>
  bool kdtree_get_bbox(BBOX&) const { return false; }
};

using KDTree = nanoflann::KDTreeSingleIndexAdaptor<
  nanoflann::L2_Simple_Adaptor<double, PointCloud>,
  PointCloud,
  2
>;

static std::vector<Point2D> buildBoundaryPoints(
    const RasterData& r,
    const RasterWindow& w,
    GDALDataset* ds,
    const std::vector<uint8_t>& boundaryMask,
    double lat0,
    const NoDataInfo& nd
) {
  std::vector<Point2D> pts;
  pts.reserve(100000);
  
  const GeoTransform gt = getGT(ds);
  
  for (int y = 0; y < r.height; ++y) {
    for (int x = 0; x < r.width; ++x) {
      size_t i = static_cast<size_t>(y) * r.width + x;
      if (!boundaryMask[i]) continue;
      
      int32_t pid = r.values[i];
      if (isNoData(pid, nd)) continue;
      
      double lon, lat;
      pixelToWorld(gt, w.xOff + x + 0.5, w.yOff + y + 0.5, lon, lat);
      
      double mx, my;
      lonlatToLocalM(lon, lat, lat0, mx, my);
      
      pts.push_back(Point2D{mx, my, pid});
    }
  }
  
  return pts;
}

/* =========================
 ENN CORE — matches R:
 per-cell nearest valid other fragment,
 then min by pid
 ========================= */

static std::unordered_map<int32_t, uint16_t> computeENNByFragment(
    const std::vector<Point2D>& pts,
    double searchRadiusM,
    int kUse
) {
  if (pts.empty()) return {};
  
  PointCloud cloud;
  cloud.pts = const_cast<std::vector<Point2D>*>(&pts);
  
  KDTree index(2, cloud, nanoflann::KDTreeSingleIndexAdaptorParams(10));
  index.buildIndex();
  
  const int kNow = std::min<int>(kUse, static_cast<int>(pts.size()));
  if (kNow <= 0) return {};
  
  std::vector<double> dmin(pts.size(), std::numeric_limits<double>::quiet_NaN());
  
#pragma omp parallel for schedule(dynamic, 256)
  for (long long ii = 0; ii < static_cast<long long>(pts.size()); ++ii) {
    size_t i = static_cast<size_t>(ii);
    
    const double queryPt[2] = {pts[i].x, pts[i].y};
    
    std::vector<uint32_t> idx(kNow);
    std::vector<double> distSqr(kNow);
    
    size_t found = index.knnSearch(queryPt, kNow, idx.data(), distSqr.data());
    
    double best = std::numeric_limits<double>::infinity();
    
    for (size_t j = 0; j < found; ++j) {
      size_t n = idx[j];
      
      if (n == i) continue;
      if (pts[n].pid == pts[i].pid) continue;
      
      double d = std::sqrt(distSqr[j]);
      if (d > searchRadiusM) continue;
      
      if (d < best) best = d;
    }
    
    if (std::isfinite(best)) {
      dmin[i] = best;
    }
  }
  
  std::unordered_map<int32_t, double> bestByPid;
  
  for (size_t i = 0; i < pts.size(); ++i) {
    if (!std::isfinite(dmin[i])) continue;
    
    int32_t pid = pts[i].pid;
    auto it = bestByPid.find(pid);
    if (it == bestByPid.end() || dmin[i] < it->second) {
      bestByPid[pid] = dmin[i];
    }
  }
  
  std::unordered_map<int32_t, uint16_t> out;
  out.reserve(bestByPid.size());
  
  for (const auto& kv : bestByPid) {
    double d = std::round(kv.second);
    if (d < 0) continue;
    if (d > 65535.0) d = 65535.0;
    out[kv.first] = static_cast<uint16_t>(d);
  }
  
  return out;
}

/* =========================
 WRITE OUTPUT
 ========================= */

static void writeOutputTile(
    GDALDataset* refDs,
    const RasterWindow& w,
    const std::vector<uint16_t>& outVals,
    const std::string& outPath
) {
  GDALDriver* drv = GetGDALDriverManager()->GetDriverByName("GTiff");
  if (!drv) throw std::runtime_error("GTiff driver not found");
  
  char* options[] = {
    const_cast<char*>("COMPRESS=LZW"),
    const_cast<char*>("TILED=YES"),
    const_cast<char*>("BIGTIFF=IF_SAFER"),
    nullptr
  };
  
  GDALDataset* outDs = drv->Create(
    outPath.c_str(),
    w.xSize, w.ySize, 1,
    GDT_UInt16,
    options
  );
  if (!outDs) throw std::runtime_error("Failed to create output raster");
  
  double gtFull[6];
  refDs->GetGeoTransform(gtFull);
  
  double gtWin[6] = {
    gtFull[0] + w.xOff * gtFull[1] + w.yOff * gtFull[2],
                                                    gtFull[1],
                                                          gtFull[2],
                                                                gtFull[3] + w.xOff * gtFull[4] + w.yOff * gtFull[5],
                                                                                                                gtFull[4],
                                                                                                                      gtFull[5]
  };
  
  outDs->SetGeoTransform(gtWin);
  outDs->SetProjection(refDs->GetProjectionRef());
  
  GDALRasterBand* band = outDs->GetRasterBand(1);
  band->SetNoDataValue(0);
  
  CPLErr err = band->RasterIO(
    GF_Write,
    0, 0, w.xSize, w.ySize,
    const_cast<uint16_t*>(outVals.data()),
    w.xSize, w.ySize,
    GDT_UInt16,
    0, 0, nullptr
  );
  if (err != CE_None) {
    GDALClose(outDs);
    throw std::runtime_error("RasterIO write failed");
  }
  
  GDALClose(outDs);
}

/* =========================
 TILE PROCESSING
 ========================= */

static bool processTile(
    const TileJob& job,
    GDALDataset* ds,
    const Params& p,
    int year,
    const std::string& gridSrsWkt
) {
  std::ostringstream outName;
  outName << p.outDir << "/ENN_" << job.fid << "_" << year << ".tif";
  const std::string outFile = outName.str();
  
  if (fileExists(outFile)) return true;
  
  NoDataInfo nd = getNoDataInfo(ds);
  
  OGRGeometry* geomGrid = reconstructGeometryFromWkt(job.wkt);
  OGRGeometry* geomRaster = cloneAndTransformToRasterCRS(geomGrid, gridSrsWkt, ds);
  OGRGeometryFactory::destroyGeometry(geomGrid);
  
  if (!geomRaster) {
    throw std::runtime_error("Geometry transform failed");
  }
  
  // centroid in raster CRS, then to EPSG:4326 for lat0
  OGRPoint centroidPt;
  if (geomRaster->Centroid(&centroidPt) != OGRERR_NONE) {
    OGRGeometryFactory::destroyGeometry(geomRaster);
    throw std::runtime_error("Failed to compute centroid");
  }
  
  OGRPoint centroid4326 = centroidPt;
  
  OGRSpatialReference rasterSRS;
#if GDAL_VERSION_NUM >= 3000000
  rasterSRS.SetAxisMappingStrategy(OAMS_TRADITIONAL_GIS_ORDER);
#endif
  const char* rasterProj = ds->GetProjectionRef();
  
  if (rasterProj && std::string(rasterProj).size() > 0 &&
      rasterSRS.importFromWkt(rasterProj) == OGRERR_NONE) {
    
    OGRSpatialReference llSRS;
#if GDAL_VERSION_NUM >= 3000000
    llSRS.SetAxisMappingStrategy(OAMS_TRADITIONAL_GIS_ORDER);
#endif
    llSRS.importFromEPSG(4326);
    
    OGRCoordinateTransformation* ct =
      OGRCreateCoordinateTransformation(&rasterSRS, &llSRS);
    
    if (ct) {
      centroid4326.transform(ct);
      OCTDestroyCoordinateTransformation(ct);
    }
  }
  
  const double lat0 = centroid4326.getY();
  const double degBuf = metersToDeg(p.searchRadiusM, lat0);
  
  // Assumes raster CRS is lon/lat degrees, matching your R workflow.
  OGRGeometry* bufferGeom = geomRaster->Buffer(degBuf);
  if (!bufferGeom) {
    OGRGeometryFactory::destroyGeometry(geomRaster);
    throw std::runtime_error("Failed to create buffer geometry");
  }
  
  auto winOpt = geometryEnvelopeToWindow(bufferGeom, ds);
  if (!winOpt.has_value()) {
    OGRGeometryFactory::destroyGeometry(bufferGeom);
    OGRGeometryFactory::destroyGeometry(geomRaster);
    return true;
  }
  
  RasterWindow w = *winOpt;
  RasterData r = readRasterWindow(ds, w);
  
  std::vector<uint8_t> bufferMask = rasterizeGeometryMask(ds, w, bufferGeom);
  std::vector<uint8_t> tileMask   = rasterizeGeometryMask(ds, w, geomRaster);
  
  OGRGeometryFactory::destroyGeometry(bufferGeom);
  
  bool anyHabitat = false;
  for (size_t i = 0; i < bufferMask.size(); ++i) {
    if (!bufferMask[i]) continue;
    if (!isNoData(r.values[i], nd)) {
      anyHabitat = true;
      break;
    }
  }
  
  if (!anyHabitat) {
    std::vector<uint16_t> out(static_cast<size_t>(w.xSize) * w.ySize, 0);
    writeOutputTile(ds, w, out, outFile);
    OGRGeometryFactory::destroyGeometry(geomRaster);
    return true;
  }
  
  std::vector<uint8_t> boundaryMask = computeBoundaryMask(r, bufferMask, nd);
  
  size_t boundaryCount = 0;
  std::unordered_map<int32_t, int> fragSeen;
  
  for (size_t i = 0; i < boundaryMask.size(); ++i) {
    if (!boundaryMask[i]) continue;
    int32_t v = r.values[i];
    if (isNoData(v, nd)) continue;
    ++boundaryCount;
    fragSeen[v]++;
  }
  
  std::vector<uint16_t> out(static_cast<size_t>(w.xSize) * w.ySize, 0);
  
  if (boundaryCount == 0) {
    writeOutputTile(ds, w, out, outFile);
    OGRGeometryFactory::destroyGeometry(geomRaster);
    return true;
  }
  
  if (fragSeen.size() == 1) {
    for (size_t i = 0; i < out.size(); ++i) {
      if (!tileMask[i]) continue;
      if (!isNoData(r.values[i], nd)) {
        out[i] = 60;
      }
    }
    writeOutputTile(ds, w, out, outFile);
    OGRGeometryFactory::destroyGeometry(geomRaster);
    return true;
  }
  
  std::vector<Point2D> pts = buildBoundaryPoints(r, w, ds, boundaryMask, lat0, nd);
  std::unordered_map<int32_t, uint16_t> ennByPid =
    computeENNByFragment(pts, p.searchRadiusM, p.kUse);
  
  for (size_t i = 0; i < out.size(); ++i) {
    if (!tileMask[i]) continue;
    
    int32_t pid = r.values[i];
    if (isNoData(pid, nd)) continue;
    
    auto it = ennByPid.find(pid);
    if (it != ennByPid.end()) {
      out[i] = it->second;
    }
  }
  
  writeOutputTile(ds, w, out, outFile);
  
  OGRGeometryFactory::destroyGeometry(geomRaster);
  return true;
}

/* =========================
 MAIN
 ========================= */

int main() {
  try {
    GDALAllRegister();
    OGRRegisterAll();
    
    Params p;
    ensureDir(p.outDir);
    ensureDir(p.logDir);
    
    omp_set_num_threads(p.nThreads);
    
    logLine("Loading tile grid...");
    GridLoadResult grid = loadTiles(p.gridPath, p.tileStart, p.tileEnd);
    
    if (grid.jobs.empty()) {
      logLine("No tiles found.");
      return 0;
    }
    
    for (int year : p.years) {
      std::string rasterPath = fmtPatchPath(p.patchPathTemplate, year);
      
      logLine("===== PROCESSING YEAR " + std::to_string(year) + " =====");
      logLine("Raster: " + rasterPath);
      logLine("Tiles: " + std::to_string(grid.jobs.size()));
      logLine("Threads: " + std::to_string(p.nThreads));
      
      auto t0 = std::chrono::steady_clock::now();
      std::atomic<int> done{0};
      const int total = static_cast<int>(grid.jobs.size());
      
#pragma omp parallel
{
  GDALDataset* ds = static_cast<GDALDataset*>(GDALOpen(rasterPath.c_str(), GA_ReadOnly));
  
  if (!ds) {
#pragma omp critical
{
  std::cerr << "Failed to open raster in thread: " << rasterPath << "\n";
}
  } else {
#pragma omp for schedule(dynamic, 1)
    for (int i = 0; i < total; ++i) {
      try {
        processTile(grid.jobs[i], ds, p, year, grid.srsWkt);
      } catch (const std::exception& e) {
#pragma omp critical
{
  std::cerr << "[" << nowStr() << "] Tile "
            << grid.jobs[i].index1 << " failed: "
            << e.what() << "\n";
}
      }
      
      int d = ++done;
      if (d % std::max(1, p.nThreads) == 0 || d == total) {
        auto now = std::chrono::steady_clock::now();
        double elapsedMin =
          std::chrono::duration<double>(now - t0).count() / 60.0;
        double rate = elapsedMin / d;
        double eta = rate * (total - d);
        
        logLine(
          "Year " + std::to_string(year) +
            " | done " + std::to_string(d) + "/" + std::to_string(total) +
            " tiles | elapsed " + std::to_string(elapsedMin) +
            " min | ETA " + std::to_string(eta) + " min"
        );
      }
    }
    
    GDALClose(ds);
  }
}
    }
    
    logLine("All done.");
    return 0;
  } catch (const std::exception& e) {
    std::cerr << "Fatal error: " << e.what() << "\n";
    return 1;
  }
}