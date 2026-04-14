suppressPackageStartupMessages({
  library(parallel)
})

# -----------------------------
# USER PARAMETERS
# -----------------------------
years <- c(2024)

searchRadius_m <- 20000
n_cores <- 23

patch_path_template <- "./results/fragment_id_%d.tif"
grid_path <- "../COL10/hex/degradation-fragmentation-enn-tiles.shp"

out_dir <- "enn_tiles_nabor"
log_dir <- file.path(out_dir, "logs")

# Smaller chunks usually behave better for RAM/cache than 200k
chunk_size <- 200000

# Keep same neighbor cap logic as original approach
k_use <- 256

dir.create(out_dir, showWarnings = FALSE, recursive = TRUE)
dir.create(log_dir, showWarnings = FALSE, recursive = TRUE)

ts <- function() format(Sys.time(), "%Y-%m-%d %H:%M:%S")

# -----------------------------
# HELPERS
# -----------------------------
meters_to_deg <- function(m, lat_deg) {
  lat_rad <- lat_deg * pi / 180
  m_per_deg_lat <- 111132.92 - 559.82 * cos(2 * lat_rad) + 1.175 * cos(4 * lat_rad)
  m_per_deg_lon <- 111412.84 * cos(lat_rad) - 93.5 * cos(3 * lat_rad)
  m / pmin(m_per_deg_lat, m_per_deg_lon)
}

lonlat_to_local_m <- function(lon, lat, lat0_deg) {
  lat0 <- lat0_deg * pi / 180
  m_per_deg_lat <- 111132.92 - 559.82 * cos(2 * lat0) + 1.175 * cos(4 * lat0)
  m_per_deg_lon <- 111412.84 * cos(lat0) - 93.5 * cos(3 * lat0)
  cbind(lon * m_per_deg_lon, lat * m_per_deg_lat)
}

# -----------------------------
# WORKER FUNCTION
# -----------------------------
enn_worker <- function(i, year, searchRadius_m, out_dir, log_dir, chunk_size, k_use) {
  
  suppressPackageStartupMessages({
    library(terra)
    library(nabor)
    library(data.table)
    library(matrixStats)
  })
  
  # Prevent CPU oversubscription inside each worker
  options(nabor.num.threads = 1)
  
  # patch_global and grid_global are loaded once per worker in clusterEvalQ()
  patch <- get("patch_global", envir = .GlobalEnv)
  grid  <- get("grid_global",  envir = .GlobalEnv)
  
  log_path <- file.path(
    log_dir,
    sprintf("tile_i%05d_%d.log", i, year)
  )
  
  logf <- function(...) {
    cat(
      sprintf(
        "[%s] %s\n",
        format(Sys.time(), "%Y-%m-%d %H:%M:%S"),
        paste(..., collapse = "")
      ),
      file = log_path,
      append = TRUE
    )
  }
  
  logf("===== TILE START =====")
  
  tile <- grid[i]
  fid <- if ("FID" %in% names(tile)) tile$FID else i
  
  out_file <- file.path(out_dir, paste0("ENN_", fid, "_", year, ".tif"))
  
  if (file.exists(out_file)) {
    logf("Output exists -> skipping")
    return(TRUE)
  }
  
  cent <- crds(centroids(project(tile, "EPSG:4326")), df = TRUE)
  lat0 <- cent[1, 2]
  deg_buf <- meters_to_deg(searchRadius_m, lat0)
  
  logf("Centroid lat=", round(lat0, 4), " deg_buf=", signif(deg_buf, 4))
  
  tile_ll  <- project(tile, crs(patch))
  tile_buf <- buffer(tile_ll, deg_buf)
  
  r <- try(crop(patch, tile_buf), silent = TRUE)
  
  if (inherits(r, "try-error") || ncell(r) == 0) {
    logf("Empty crop -> writing NA raster")
    rr <- mask(crop(patch[[1]], tile_ll), tile_ll)
    writeRaster(rr * NA, out_file, overwrite = TRUE)
    return(TRUE)
  }
  
  r <- mask(r, tile_buf)
  
  bnd <- boundaries(r, inner = TRUE)
  bnd_id <- mask(r, bnd == 1)
  
  v <- values(bnd_id, mat = FALSE)
  cells <- which(!is.na(v))
  
  if (length(cells) == 0) {
    logf("No boundary cells -> writing NA raster")
    rr <- mask(crop(r, tile_ll), tile_ll)
    writeRaster(rr * NA, out_file, overwrite = TRUE)
    return(TRUE)
  }
  
  pid_all <- v[cells]
  n_pid <- data.table::uniqueN(pid_all)
  
  logf("Boundary cells=", length(cells), " unique fragments=", n_pid)
  
  # -----------------------------
  # SINGLE FRAGMENT CASE
  # -----------------------------
  if (n_pid == 1) {
    logf("Single fragment in tile -> ENN = 60 everywhere")
    rr <- mask(crop(r, tile_ll), tile_ll)
    rr[!is.na(rr)] <- 60
    writeRaster(rr, out_file, overwrite = TRUE)
    logf("Tile done (single-fragment)")
    return(TRUE)
  }
  
  xy_ll <- xyFromCell(bnd_id, cells)
  xy_m  <- lonlat_to_local_m(xy_ll[, 1], xy_ll[, 2], lat0)
  
  n_all <- length(pid_all)
  k_now <- min(k_use, n_all)
  
  logf("Starting neighbor search with k=", k_now, " chunk_size=", chunk_size)
  
  dmin <- rep(NA_real_, n_all)
  
  # Process in chunks to control memory use
  for (s in seq.int(1L, n_all, by = chunk_size)) {
    e <- min(s + chunk_size - 1L, n_all)
    idx <- s:e
    
    nn <- nabor::knn(
      data  = xy_m,
      query = xy_m[idx, , drop = FALSE],
      k     = k_now
    )
    
    nbr_ids  <- nn$nn.idx
    nbr_dist <- nn$nn.dist
    
    # Filter once
    outside_radius <- nbr_dist > searchRadius_m
    nbr_dist[outside_radius] <- NA_real_
    
    # Map neighbor rows to fragment ids with fewer copies
    nbr_pid <- pid_all[nbr_ids]
    dim(nbr_pid) <- dim(nbr_ids)
    
    # Exclude same fragment
    same_frag <- nbr_pid == pid_all[idx]
    nbr_dist[same_frag] <- NA_real_
    
    # rowMins is much faster than apply(..., min)
    d_chunk <- matrixStats::rowMins(nbr_dist, na.rm = TRUE)
    
    # rowMins returns Inf when a row is all-NA after filtering
    d_chunk[!is.finite(d_chunk)] <- NA_real_
    dmin[idx] <- d_chunk
    
    if ((s == 1L) || ((s - 1L) %% (chunk_size * 10L) == 0L)) {
      logf("Processed rows ", s, "-", e, " of ", n_all)
    }
  }
  
  logf("Neighbor search complete")
  
  enn_by_pid <- data.table(pid = pid_all, d = dmin)[
    !is.na(d),
    .(enn_m = min(d)),
    by = pid
  ]
  
  logf("Fragments with ENN=", nrow(enn_by_pid))
  
  if (nrow(enn_by_pid) == 0) {
    logf("No ENN found -> writing NA raster")
    rr <- mask(crop(r, tile_ll), tile_ll)
    writeRaster(rr * NA, out_file, overwrite = TRUE)
    return(TRUE)
  }
  
  enn_r <- classify(r, as.matrix(enn_by_pid), others = NA)
  enn_tile <- mask(crop(enn_r, tile_ll), tile_ll)
  
  enn_tile <- round(enn_tile, 0)
  
  writeRaster(
    enn_tile,
    out_file,
    overwrite = TRUE,
    datatype = "INT4U",   # unsigned 16-bit equivalent in terra/GDAL
    NAflag = 0
  )
  
  logf("Tile done OK")
  TRUE
}

# -----------------------------
# DRIVER
# -----------------------------
for (year in years) {
  
  cat(sprintf("\n[%s] ===== PROCESSING YEAR %d =====\n", ts(), year))
  
  # Only load grid on master to get tile count
  grid_master <- terra::vect(grid_path)
  tiles <- seq_len(nrow(grid_master))
  
  cl <- makeCluster(n_cores, type = "PSOCK")
  
  # Export scalar objects and helper functions
  clusterExport(
    cl,
    varlist = c(
      "enn_worker",
      "meters_to_deg",
      "lonlat_to_local_m",
      "patch_path_template",
      "grid_path",
      "searchRadius_m",
      "out_dir",
      "log_dir",
      "chunk_size",
      "k_use",
      "year"
    ),
    envir = environment()
  )
  
  # Load libraries and heavy spatial data once per worker for this year
  clusterEvalQ(cl, {
    suppressPackageStartupMessages({
      library(terra)
      library(nabor)
      library(data.table)
      library(matrixStats)
    })
    
    terraOptions(tempdir = tempdir())
    
    patch_global <- rast(sprintf(patch_path_template, year))
    grid_global  <- vect(grid_path)
    
    NULL
  })
  
  invisible(parLapply(
    cl,
    tiles,
    enn_worker,
    year = year,
    searchRadius_m = searchRadius_m,
    out_dir = out_dir,
    log_dir = log_dir,
    chunk_size = chunk_size,
    k_use = k_use
  ))
  
  stopCluster(cl)
}
