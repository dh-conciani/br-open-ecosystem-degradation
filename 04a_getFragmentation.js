// ecosystem fragmentation 
// gt degradaçao - mapbiomas

// -- * definitions
// definir classes a serem consideradas como vegetação nativa (nas quais o efeito de borda e tamanho serão estimados)
var native_classes = {
  'amazonia':       [3, 4, 5, 11, 12],
  'caatinga':       [3, 4, 5, 11, 12],
  'cerrado':        [3, 4, 5, 11, 12],
  'mata_atlantica': [3, 4, 5, 11, 12],
  'pampa':          [3, 4, 5, 11, 12],
  'pantanal':       [3, 4, 5, 11, 12]
};

// definir classes que serão ignoradas (as quais não podem produzir efeito de borda sobre classes de vegetação nativa)
var ignore_classes = {
  'amazonia':       [29, 49, 50, 33],
  'caatinga':       [29, 49, 50, 33],
  'cerrado':        [29, 33],
  'mata_atlantica': [29, 49, 50, 33],
  'pampa':          [29, 49, 50, 33],
  'pantanal':       [29, 49, 50, 33]
};

// definir distancia (em metros) de degradação por efeito de borda
var edge_rules = {
  'amazonia':       90,
  'caatinga':       90,
  'cerrado':        90,
  'mata_atlantica': 90,
  'pampa':          90,
  'pantanal':       90
};

// definir degradação por tamanho do fragmento (em hectares)
var patch_size_rules = {
  'amazonia':       5,
  'caatinga':       5,
  'cerrado':        5,
  'mata_atlantica': 5,
  'pampa':          5,
  'pantanal':       5
};

// definir criterio de degradação por idade da vegetação secundaria (em anos)
var secondary_rules = {
  'amazonia':       37,
  'caatinga':       37,
  'cerrado':        37,
  'mata_atlantica': 37,
  'pampa':          37,
  'pantanal':       37
};

// * -- end of definitions

// read biomes
var biomes = ee.Image('projects/mapbiomas-workspace/AUXILIAR/biomas-2019-raster');
//Map.addLayer(biomes.randomVisualizer(),{}, 'Biomas');

// build biomes dictionary
var biomes_name = ['amazonia', 'caatinga', 'cerrado', 'mata_atlantica', 'pampa', 'pantanal'];
var biomes_dict = {
  'amazonia':       1,
  'caatinga':       5,
  'cerrado':        4,
  'mata_atlantica': 2,
  'pampa':          6,
  'pantanal':       3
};

// read collection
var collection = ee.Image('projects/mapbiomas-workspace/public/collection7_1/mapbiomas_collection71_integration_v1')
  .select('classification_2021');

// create recipes
var edge_degrad = ee.Image(0);
var size_degrad = ee.Image(0);
var secondary_degrad = ee.Image(0);

// for each biome, compute fragmentation by using specific criteria
biomes_name.forEach(function(biome_i) {
  
  // get native vegetation map
  var native_mask = collection
    .remap({from: native_classes[biome_i].concat(ignore_classes[biome_i]),
            to: native_classes[biome_i].concat(ignore_classes[biome_i]),
            defaultValue: 21
    }).updateMask(biomes.eq(biomes_dict[biome_i]));
  
  // mask collection to retain raw classes
  var collection_i = collection.updateMask(native_mask.neq(21));


  // -- * get edge effect
  // retain anthropogenic classes to be used as reference for the edge 
  var anthropogenic = native_mask.updateMask(native_mask.eq(21));

  // compute edge 
  var edge = anthropogenic.distance(ee.Kernel.euclidean(edge_rules[biome_i] + 10, 'meters'), false);
  edge = edge.mask(edge.lt(edge_rules[biome_i])).mask(collection).selfMask().updateMask(biomes.eq(biomes_dict[biome_i]));

  // remove edges over ignored classes
  ignore_classes[biome_i].forEach(function(class_i) {
    edge = edge.updateMask(collection_i.neq(class_i));
  });
  

  // -- * get patche size 
  // dissolve all native veg. classes into each one
  var native_l0 = collection_i.remap({
    from: native_classes[biome_i],
    //from: [3, 4, 5, 11, 12, 49, 50, 33],
    to: 
    //to:   [1, 1, 1,  1,  1,  1,  1, 33]
  });
  
  // get patch sizes
  // convert ha to number of pixels
  var size_criteria = parseInt((patch_size_rules[biome_i] * 10000) / 900);
  // compute patche sizes
  var patch_size = native_l0.updateMask(native_l0.neq(33))
    .connectedPixelCount(size_criteria + 5, true);
  
  // get only patches smaller than the criteria
  var size_degradation = patch_size.lte(size_criteria).selfMask();
  
  // -- * get degradation by secondary vegetation age
  var secondary =  ee.Image('projects/mapbiomas-workspace/public/collection7_1/mapbiomas_collection71_secondary_vegetation_age_v1')
    .updateMask(biomes.eq(biomes_dict[biome_i]))
    .select('secondary_vegetation_age_2021')
    .updateMask(collection_i.neq(33))
    .selfMask();
    secondary= secondary.updateMask(secondary.lt(secondary_rules[biome_i]));
  
  // * --
  print(biome_i + ' rules:',
    //'ignore water as edge: ' + ignore_water_rule[biome_i],
    'edge distance: ' + edge_rules[biome_i] + ' meters',
    'patche size: ' + size_criteria + ' px',
    'secondary age: less than ' + secondary_rules[biome_i] + ' years'
    );

  // blend into recipes
  edge_degrad = edge_degrad.blend(edge).selfMask().rename('edge_degradation');
  size_degrad = size_degrad.blend(size_degradation).selfMask().rename('patche_size_degradation');
  secondary_degrad = secondary_degrad.blend(secondary).selfMask().rename('secondary_veg_degradation');
});

// get mapbiomas pallete
var vis = {
          'min': 0,
          'max': 62,
          'palette': require('users/mapbiomas/modules:Palettes.js').get('classification7'),
          'format': 'png'
      };

// remap collection to provide view
var view_collection = collection.remap({
  from: [3, 4, 5, 49, 11, 12, 32, 29, 50, 13, 15, 19, 39, 20, 40, 62, 41, 36, 46, 47, 48, 9, 21, 23, 24, 30, 25, 33, 31],
  to: [  1, 10, 1,  1, 10, 10, 10, 10, 10, 10, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14,14, 22, 22, 22, 22, 26, 26]
});

// plot
Map.addLayer(view_collection, vis, 'Mapbiomas 2021', false);
Map.addLayer(edge_degrad, {'palette': ('red')}, 'Degradação por borda');
Map.addLayer(size_degrad, {'palette': ('orange')}, 'Degradação por tamanho');
Map.addLayer(secondary_degrad, {'palette': ('yellow')}, 'Degradado por idade');
