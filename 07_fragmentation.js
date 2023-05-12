// ecosystem fragmentation 
// gt degradaçao - mapbiomas

// -- * definitions
// set distance (in meters) to be used as edge degradation  
var edge_rules = {
  'amazonia': 90,
  'caatinga': 90,
  'cerrado': 90,
  'mata_atlantica': 90,
  'pampa': 90,
  'pantanal': 90
};

// set patche size (in hectares) to be used as size degradation 
var patch_size_rules = {
  'amazonia': 5,
  'caatinga': 5,
  'cerrado': 5,
  'mata_atlantica': 5,
  'pampa': 5,
  'pantanal': 5
};

// ignore water-native as edge?
var ignore_water_rule = {
  'amazonia': true,
  'caatinga': true,
  'cerrado': true,
  'mata_atlantica': true,
  'pampa': true,
  'pantanal': true
};

// * -- end of definitions

// read biome 
var biomes = ee.Image('projects/mapbiomas-workspace/AUXILIAR/biomas-2019-raster');

// build biomes dictionary


// read collection
var collection = ee.Image('projects/mapbiomas-workspace/public/collection7_1/mapbiomas_collection71_integration_v1')
  .select('classification_2021');

// build native vegetation mask (with a rule to ignore edges from water-native)
var native_mask = collection
  .remap({from: [3, 4, 5, 11, 12, 49, 50, 33],
          to:   [1, 1, 1,  1,  1,  1,  1, 1],
          defaultValue: 21
  });

// mask collection to retain raw classes
collection = collection.updateMask(native_mask.neq(21));

// -- * get edge effect
// retain anthropogenic classes to be used as reference for the edge 
var anthropogenic = native_mask.updateMask(native_mask.eq(21));

// compute edge 
var edge = anthropogenic.distance(ee.Kernel.euclidean(edge_size, 'meters'), false);
edge = edge.mask(edge.lt(edge_size)).mask(collection).selfMask();

// remove edge 'wrongly' caused by water
edge = edge.updateMask(collection.neq(33));
// * --

// -- * get patch size
// dissolve all native veg. classes into each one
var native_l0 = collection.remap({
  from: [3, 4, 5, 11, 12, 49, 50, 33],
  to:   [1, 1, 1,  1,  1,  1,  1, 33]
});

// get patch sizes
var patch_size = native_l0.updateMask(native_l0.neq(33)).connectedPixelCount(1024, true);
// * -- 



// get mapbiomas pallete
var vis = {
          'min': 0,
          'max': 62,
          'palette': require('users/mapbiomas/modules:Palettes.js').get('classification7'),
          'format': 'png'
      };

// plot
Map.addLayer(collection, vis, 'Vegetação Nativa');
Map.addLayer(patch_size, {palette: ["db0000","faff00","099300"], min:1, max:500}, 'Tamanho do Fragmento');
Map.addLayer(edge, {palette: ['#FF0000', '#F65E5E', '#FDACAC'], min:1, max:edge_size}, 'Efeito de borda - ' + edge_size + 'm');

