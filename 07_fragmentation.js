// ecosystem fragmentation 
// gt degradaçao - mapbiomas

// -- * definitions
// definir distancia (em metrosd) de degradação por efeito de borda
var edge_rules = {
  'amazonia': 90,
  'caatinga': 90,
  'cerrado': 90,
  'mata_atlantica': 90,
  'pampa': 90,
  'pantanal': 90
};

// definir degradação por tamanho do fragmento (em hectares)
var patch_size_rules = {
  'amazonia': 5,
  'caatinga': 5,
  'cerrado': 5,
  'mata_atlantica': 5,
  'pampa': 5,
  'pantanal': 5
};

// definir criterio de degradação por idade da vegetação secundaria (em anos)
var secondary_rules = {
  'amazonia': 37,
  'caatinga': 37,
  'cerrado': 37,
  'mata_atlantica': 37,
  'pampa': 37,
  'pantanal': 37
};

// o bioma vai ignorar que a interface agua-vegetação nativa pode causar efeito de borda? 
var ignore_water_rule = {
  'amazonia': true,
  'caatinga': true,
  'cerrado': true,
  'mata_atlantica': true,
  'pampa': true,
  'pantanal': true
};

// * -- end of definitions

// read biomes
var biomes = ee.Image('projects/mapbiomas-workspace/AUXILIAR/biomas-2019-raster');
//Map.addLayer(biomes.randomVisualizer(),{}, 'Biomas');

// build biomes dictionary
var biomes_name = ['amazonia', 'caatinga', 'cerrado', 'mata_atlantica', 'pampa', 'pantanal'];
var biomes_dict = {
  'amazonia': 1,
  'caatinga': 5,
  'cerrado': 4,
  'mata_atlantica': 2,
  'pampa': 6,
  'pantanal': 3
};

// read collection
var collection = ee.Image('projects/mapbiomas-workspace/public/collection7_1/mapbiomas_collection71_integration_v1')
  .select('classification_2021');

// for each biome, compute fragmentation by using specific criteria
biomes_name.forEach(function(biome_i) {
  // apply water-native rule
  if (ignore_water_rule[biome_i] === true) {
    print(biome_i + ' IGNORED water edges');
    var native_mask = collection
      .remap({from: [3, 4, 5, 11, 12, 49, 50, 33],
              to:   [1, 1, 1,  1,  1,  1,  1, 1],
              defaultValue: 21
    }).updateMask(biomes.eq(biomes_dict[biome_i]));
  }
  
  if (ignore_water_rule[biome_i] === false) {
    print(biome_i + ' APPLIED water edges');
    var native_mask = collection
      .remap({from: [3, 4, 5, 11, 12, 49, 50],
              to:   [1, 1, 1,  1,  1,  1,  1],
              defaultValue: 21
    }).updateMask(biomes.eq(biomes_dict[biome_i]));
  }
  
  // mask collection to retain raw classes
  var collection_i = collection.updateMask(native_mask.neq(21));


  // -- * get edge effect
  // retain anthropogenic classes to be used as reference for the edge 
  var anthropogenic = native_mask.updateMask(native_mask.eq(21));

  // compute edge 
  var edge = anthropogenic.distance(ee.Kernel.euclidean(edge_rules[biome_i], 'meters'), false);
  edge = edge.mask(edge.lt(edge_rules[biome_i])).mask(collection).selfMask().updateMask(biomes.eq(biomes_dict[biome_i]));
  //Map.addLayer(edge);
  
   // apply water-native rule
  if (ignore_water_rule[biome_i] === true) {
    // remove edge 'wrongly' caused by water
    edge = edge.updateMask(collection_i.neq(33));
  // * --
  }
  
  // -- * get patche size 
  // dissolve all native veg. classes into each one
  var native_l0 = collection_i.remap({
    from: [3, 4, 5, 11, 12, 49, 50, 33],
    to:   [1, 1, 1,  1,  1,  1,  1, 33]
  });
  
  // get patch sizes
  var patch_size = native_l0.updateMask(native_l0.neq(33)).connectedPixelCount(1024, true);
  // * -- 
  Map.addLayer(patch_size);

  
  
})

/*












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

*/
