// bind assets to consider water as native in pantanal 
// dhemerson.costa@ipam.org.br

// set root 
var root = 'projects/mapbiomas-workspace/DEGRADACAO/ISOLATION/';

// set versions to be merged 
var withoutWater = '6';
var withWater = '7';

// set isolation grid params
var params = {
  'med': ['25', '50', '100'],
  'dist': ['05', '10', '20'],
  'gde': ['100', '500', '100']
};

// set biomes id to apply water as native
var biomesToApply = [3];  // only pantanal 



// get biomes asset
var biomes = ee.Image('projects/mapbiomas-workspace/AUXILIAR/biomas-2019-raster');

params.dist.forEach(function(i) {
  
})


nat_uso_frag25__dist20k_1000
