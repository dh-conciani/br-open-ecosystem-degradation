// get spectral signatures 
// set year
var year = 2024;

// read biomas
var biomas = ee.FeatureCollection('projects/mapbiomas-workspace/AUXILIAR/biomas-2019')
  .filterMetadata('Bioma', 'equals', 'Cerrado');

// get reference points of invasive species
var urochloa = ee.FeatureCollection('users/dh-conciani/degradation/invasive_spp/urochloa')
  .filterBounds(biomas)
  .map(function(f) {
    return ee.Feature(f.geometry(), {
      'reference': 'urochloa'});
  });
  
var melinis = ee.FeatureCollection('users/dh-conciani/degradation/invasive_spp/melinis')
  .filterBounds(biomas)
  .map(function(f) {
    return ee.Feature(f.geometry(), {
      'reference': 'melinis'});
  });
  

// get collection 10
var collection = ee.Image('projects/mapbiomas-public/assets/brazil/lulc/collection10/mapbiomas_brazil_collection10_integration_v2');

// read stable samples 
var trainingPoints = ee.FeatureCollection('projects/ee-ipam-cerrado/assets/Collection_11/sample/points/samplePoints_v2');

// make stable classes explicit and numeric
var savanna = trainingPoints.filterMetadata('reference', 'equals', 4)
  .randomColumn('rand', 12345).sort('rand').limit(500)
  .map(function(f){ return f.set({'class_id': 4, 'class_name': 'savanna'}); });

var grassland = trainingPoints.filterMetadata('reference', 'equals', 12)
  .randomColumn('rand', 12345).sort('rand').limit(500)
  .map(function(f){ return f.set({'class_id': 12, 'class_name': 'grassland'}); });

var pasture = trainingPoints.filterMetadata('reference', 'equals', 15)
  .randomColumn('rand', 12345).sort('rand').limit(500)
  .map(function(f){ return f.set({'class_id': 15, 'class_name': 'pasture'}); });

// invasive species with numeric ids too
var urochloa = ee.FeatureCollection('users/dh-conciani/degradation/invasive_spp/urochloa')
  .filterBounds(biomas)
  .map(function(f){ return ee.Feature(f.geometry()).set({'class_id': 100, 'class_name': 'urochloa'}); });

var melinis = ee.FeatureCollection('users/dh-conciani/degradation/invasive_spp/melinis')
  .filterBounds(biomas)
  .map(function(f){ return ee.Feature(f.geometry()).set({'class_id': 101, 'class_name': 'melinis'}); });

// merge and KEEP ONLY clean fields (avoids any weird nested props from trainingPoints)
var samples = savanna.merge(grassland).merge(pasture).merge(urochloa).merge(melinis)
  .select(['class_id', 'class_name']);  // geometry is kept automatically


/*
print(samples.first())
Export.table.toAsset({
  collection: samples,
  description: 'invasiveSpecies_samples_cerrado_v1',
  assetId: 'users/dh-conciani/degradation/invasive_spp/samplesSpectra_v1'
});
*/


//  load landsat mosaic
var mosaic = ee.ImageCollection('projects/nexgenmap/MapBiomas2/LANDSAT/BRAZIL/mosaics-2')
  .filterMetadata('biome', 'equals', 'CERRADO')
  .filterMetadata('year', 'equals', year)
  .mosaic()
  .addBands(collection.select('classification_' + year));
  
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
