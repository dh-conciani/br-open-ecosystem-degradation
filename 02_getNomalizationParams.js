// get normalization parameters per variable~biome~class
// dhemerson.costa@ipam.org.br

// insert metadata
var root = 'projects/mapbiomas-workspace/DEGRADACAO/DISTURBIOS/disturbance_frequency/brazil_disturbance_frequency_';
var input_version = 2;

var output = 'projects/mapbiomas-workspace/DEGRADACAO/DISTURBIOS/PARAMETROS/DISTURBANCE_FREQUENCY';
var output_version = 2;

// read distubance database 
var disturbance = ee.Image(root + input_version);

// read mapbiomas collection 7 in the last year
var mapbiomas = ee.Image('projects/mapbiomas-workspace/public/collection7/mapbiomas_collection70_integration_v2')
  .select(['classification_2021']);

// set classes in which parameters will be estimated (only native vegetation)
var classes = [3, 4, 5, 11, 12, 13, 32, 49, 50];
//var classes = [4, 12];

// read normalization territory (biomes)
var territory = ee.FeatureCollection('projects/mapbiomas-workspace/AUXILIAR/biomas-2019');


// set function to get the maximum value to be used in [range] normalization 
var getParams = function(image, feature) {
  var class_params = classes.map(function(class_j) {
    var disturbance_ij = disturbance.updateMask(mapbiomas.eq(class_j));
    // get maximum value 
    var max_values = disturbance_ij.rename(['anthropogenic_freq_max', 'deforestation_freq_max', 'fire_freq_max', 'sum_of_disturbance_max'])
      .reduceRegion({
        reducer: ee.Reducer.max(),
        geometry: feature.geometry(),
        scale: 30,
        maxPixels: 1e13
    });
    // get miminum
    var min_values = disturbance_ij.rename(['anthropogenic_freq_min', 'deforestation_freq_min', 'fire_freq_min', 'sum_of_disturbance_min'])
      .reduceRegion({
        reducer: ee.Reducer.min(),
        geometry: feature.geometry(),
        scale: 30,
        maxPixels: 1e13
    });
    // return params for the class [j]
     return feature.set(max_values)
                   .set(min_values)
                   .set('class_id', class_j);
                
  });
  // return params for the feature [i]
  return ee.FeatureCollection(class_params).flatten();
};

// compute params
var params = getParams(disturbance, territory);
print(params);

// export as GEE asset
Export.table.toAsset({'collection': params, 
                      'description': 'params_disturbance_frequency_class_biome_v' + output_version,
                      'assetId': output + '/' + 'params_disturbance_frequency_class_biome_v' + output_version});