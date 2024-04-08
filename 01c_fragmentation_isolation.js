// bind assets to consider water as native in pantanal 
// dhemerson.costa@ipam.org.br

// set root 
var root = 'projects/mapbiomas-workspace/DEGRADACAO/ISOLATION/';

// set versions to be merged 
var withoutWater = '6';
var withWater = '7';

// set isolation grid params
var params = {
  'mediumFrag': ['25', '50', '100'],
  'distance': ['05', '10', '20'],
  'bigFrag': ['100', '500', '1000']
};

// get biomes asset
var biomes = ee.Image('projects/mapbiomas-workspace/AUXILIAR/biomas-2019-raster');

// set biomes id to apply water as native
var biomesToApply = [3];  // only pantanal 

// for each med frag
params.mediumFrag.forEach(function(medium_i) {
  // for each distance 
  params.distance.forEach(function(distance_j) {
    // for each big frag
    params.bigFrag.forEach(function(big_k) {
      
      // skip when mediumFrag and bigfrag have same values 
      if(medium_i === big_k) {
        return null;
      }
      
      // read isolation for a given param - without water 
      var isolWithoutWater = ee.Image(
        root + 'nat_uso_frag' + medium_i + '__dist' + distance_j + 'k__' + big_k + '_v' + withoutWater + '_85_22'
        );
        
       var isolWithWater = ee.Image(
        root + 'nat_uso_frag' + medium_i + '__dist' + distance_j + 'k__' + big_k + '_v' + withWater + '_85_22');
      print(isolWithWater);
        
    })
  })
  

})


