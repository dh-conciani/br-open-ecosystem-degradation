var samples = ee.FeatureCollection('users/dh-conciani/degradation/invasive_spp/samplesSpectra_v1')
var year = 2024

// get collection 10
var collection = ee.Image('projects/mapbiomas-public/assets/brazil/lulc/collection10/mapbiomas_brazil_collection10_integration_v2');
  

//  load landsat mosaic
var mosaic = ee.ImageCollection('projects/nexgenmap/MapBiomas2/SENTINEL/mosaics-3')
  .filterMetadata('biome', 'equals', 'CERRADO')
  .filterMetadata('year', 'equals', year)
  .mosaic()
  .addBands(collection.select('classification_' + year))
  .aside(print)
  

// 1) Sample spectral values at point locations
var scale = 30; // Landsat
var samplesWithSpectra = mosaic.sampleRegions({
  collection: samples,
  properties: ['class_id', 'class_name'],   // keep your label column(s); add more if you need
  scale: scale,
  geometries: false ,           // set false if you don't want lon/lat geometry in output
  tileScale: 8
});

print('Samples w/ spectra:', samplesWithSpectra.limit(5));

// 2) Export to Google Drive as CSV
Export.table.toDrive({
  collection: samplesWithSpectra,
  description: 'samples_invasiveSpecies_spectra_' + year,
  folder: 'GEE_exports',      // change or remove if you want root
  fileNamePrefix: 'samples_invasiveSpecies_spectra_' + year,
  fileFormat: 'CSV'
});
