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
  'bigFrag': ['100', '500', '1000'],
  'bandName' : 'nat_'
};

// get biomes asset
var biomes = ee.Image('projects/mapbiomas-workspace/AUXILIAR/biomas-2019-raster');

// set biomes id to apply water as native
var biomesToApply = [3];  // only pantanal 

// set years to be processed
var yearsList = [1985, 1986, 1987, 1988, 1989, 1990, 1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999,
                 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014,
                 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022];

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
      
      // for each biome to adjust 
      biomesToApply.forEach(function(biome_m) {
        // for each year
        yearsList.forEach(function(year_n) {
          // get data
          var WithoutWater_ijkmn = isolWithoutWater.select(params.bandName + year_n).aside(print)
          
        })
        

        
        
      });
        
    });
  });
  

})


