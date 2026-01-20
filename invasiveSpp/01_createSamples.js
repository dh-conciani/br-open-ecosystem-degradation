// get spectral signatures 
// set year
var year = 2024;

// read biomas
var biomas = ee.FeatureCollection('projects/mapbiomas-workspace/AUXILIAR/biomas-2019')
  .filterMetadata('Bioma', 'equals', 'Cerrado');

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


print(samples.first())
Export.table.toAsset({
  collection: samples,
  description: 'invasiveSpecies_samples_cerrado_v1',
  assetId: 'users/dh-conciani/degradation/invasive_spp/samplesSpectra_v1'
});

Map.addLayer(urochloa, {color: 'red'}, 'urochloa')
Map.addLayer(melinis, {color: 'purple'}, 'melinis')
print(urochloa.size())
print(melinis.size())
