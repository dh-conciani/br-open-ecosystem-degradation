// definir criterio de degradação por idade da vegetação secundaria (em anos)
var secondary_rules = {
  'amazonia':       37,
  'caatinga':       37,
  'cerrado':        37,
  'mata_atlantica': 37,
  'pampa':          37,
  'pantanal':       37
};

 // -- * get degradation by secondary vegetation age
 var secondary =  ee.Image('projects/mapbiomas-workspace/public/collection7_1/mapbiomas_collection71_secondary_vegetation_age_v1')
    .updateMask(biomes.eq(biomes_dict[biome_i]))
    .select('secondary_vegetation_age_2021')
    .updateMask(native_l0.eq(1))
    .selfMask();
    secondary= secondary.updateMask(secondary.lt(secondary_rules[biome_i]));
  
  // * --


var  secondary_degrad = secondary_degrad.blend(secondary).selfMask().rename('secondary_veg_degradation');

Map.addLayer(secondary_degrad, {'palette': ('yellow')}, 'Degradado por idade');
