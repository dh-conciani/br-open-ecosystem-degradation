// get normalization parameters per variable~biome~class
// dhemerson.costa@ipam.org.br

// insert metadata
var root = 'projects/mapbiomas-workspace/DEGRADACAO/DISTURBIOS/disturbance_frequency/brazil_disturbance_frequency_';
var input_version = 1;
var output_version = 2;

// read distubance database 
var disturbance = ee.Image(root + input_version);

// read mapbiomas collection 7 in the last year
var mapbiomas = ee.Image('projects/mapbiomas-workspace/public/collection7/mapbiomas_collection70_integration_v2')
  .select(['classification_2021']);

// set classes in which parameters will be estimated (only native vegetation)
var classes = [3, 4, 5, 11, 12, 13, 32, 49, 50];

// read normalization territory (biomes)
var territory = ee.FeatureCollection('projects/mapbiomas-workspace/AUXILIAR/biomas-2019').first();


// set funciton to get the maximum value to be used in [range] normalization 
var getMax = function(image, feature) {
  return image.reduceRegion({
    reducer: ee.Reducer.max(),
    geometry: feature.geometry(),
    scale: 30,
    maxPixels: 1e13
  });
};

// set funciton to get the minimum value to be used in [range] normalization 
var getMin = function(image) {
  return image.reduceRegion({
    reducer: ee.Reducer.max(),
    geometry: feature.geometry(),
    scale: 30,
    maxPixels: 1e13
  });
};

Map.addLayer(territory.geometry())

var x = getMax(disturbance, territory);
print(x)
