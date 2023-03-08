// normalize disturbance frequencies by using 'range' [min-max] per variable~biome 
// dhemerson.costa@ipam.org.br

// insert metadata
var root = 'projects/mapbiomas-workspace/DEGRADACAO/DISTURBIOS/disturbance_frequency/brazil_disturbance_frequency_';
var input_version = 1;
var output_version = 2;

// read distubance database 
var disturbance = ee.Image(root + input_version);

// set funciton to get the maximum value to be used in normalization 
var getMax = function(image) {
  return image.reduceRegion({
    reducer: ee.Reducer.max(),
    geometry: geometry,
    scale: 30,
    maxPixels: 1e13
  });
};

// set funciton to get the minimum value to be used in normalization 
var getMin = function(image) {
  return image.reduceRegion({
    reducer: ee.Reducer.max(),
    geometry: geometry,
    scale: 30,
    maxPixels: 1e13
  });
};


print(max, min)
// Print the maximum value
//print('Maximum value:', max.get('band_name'));






// Define the visualization parameters.
var vizParams = {
  bands: ['deforestation_freq', 'fire_freq', 'anthropogenic_freq'],
  min: 0,
  max: 3,
};

Map.addLayer(disturbance, vizParams, 'Disturbance RGB')
