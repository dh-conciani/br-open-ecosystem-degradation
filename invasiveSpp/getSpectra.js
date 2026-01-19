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

// select random stable sample of reference classes
var savanna = trainingPoints.filterMetadata('reference', 'equals', 4)
  .randomColumn('rand', 12345)   // seed for reproducibility
  .sort('rand')
  .limit(500);
  
var grassland = trainingPoints.filterMetadata('reference', 'equals', 12)
  .randomColumn('rand', 12345)   // seed for reproducibility
  .sort('rand')
  .limit(500);
  
var pasture = trainingPoints.filterMetadata('reference', 'equals', 15)
  .randomColumn('rand', 12345)   // seed for reproducibility
  .sort('rand')
  .limit(500);
  
// merge
var samples = savanna.merge(grassland).merge(pasture);
samples = samples.merge(urochloa).merge(melinis);
print(samples.size())
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
  properties: ['reference'],   // keep your label column(s); add more if you need
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
