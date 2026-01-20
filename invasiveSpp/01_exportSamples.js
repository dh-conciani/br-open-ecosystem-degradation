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
print(samples.first())


Export.table.toAsset({
      collection: samples,
      description: 'invasiveSpecies_samples_cerrado_v1',
      assetId: 'users/dh-conciani/degradation/invasive_spp/samplesSpectra_v1'
})
