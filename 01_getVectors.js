// get time-series of degradation vectors and compute statistical summaries
// dhemerson.costa@ipam.org.br (ipam and mapbiomas brazil) 

// get mapbiomas land cover
var mapbiomas = ee.Image('projects/mapbiomas-workspace/public/collection7/mapbiomas_collection70_integration_v2')
  .select(['classification_2021']);
  
// get only native vegetation
var mapbiomas_native = mapbiomas.remap({
  from: [3, 4, 5, 11, 12, 13, 32, 49, 50],
  to:   [3, 4, 5, 11, 12, 13, 32, 49, 50],
  defaultValue: 0})
  .rename('native_vegetation');

// function to get info only for native vegetation and fill masked values as zero
var fill_map = function(image) {
  return image.updateMask(mapbiomas_native.neq(0))
  .unmask(0)
  .updateMask(mapbiomas);
};

// get fire frequency from mapbiomas fogo (col 1)
var fire_freq = fill_map(
  ee.Image('projects/mapbiomas-workspace/public/collection7/mapbiomas-fire-collection1-1-fire-frequency-1')
  .select(['fire_frequency_1985_2021']).divide(100).int()
  .rename('fire_freq')
  );

// get deforestation frequency from mapbiomas lcluc (col 7.1)
var deforestation = fill_map(
  ee.Image('projects/mapbiomas-workspace/public/collection7_1/mapbiomas_collection71_deforestation_frequency_v1')
  .select(['desmatamento_frequencia_1987_2020']).divide(100).int()
  .rename('deforestation_freq')
  );

// years as anthropogenic use




// climatic

// read palettes
var vis = {
    'min': 0,
    'max': 49,
    'palette': require('users/mapbiomas/modules:Palettes.js').get('classification6')
};

// plot data
//Map.addLayer(mapbiomas, vis, 'land cover 2021', false);
Map.addLayer(mapbiomas_native, vis, 'native vegetation 2021', false);
Map.addLayer(fire_freq, {palette: ['white', 'green', 'yellow', 'orange', 'red'], min:0, max:15}, 'fire_freq');
Map.addLayer(deforestation, {palette: ['white', 'green', 'yellow', 'orange', 'red'], min:0, max:5}, 'deforestation freq');
