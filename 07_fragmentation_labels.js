// get patch ids (in natural level)
// any issue and/or bug, please report to dhemerson.costa@ipam.org.br and mrosa@arcplan.com.br

// set version
var version = 5;

// -- * definitions
// set classes to be computed  
// 3 (forest), 4 (savanna), 5 (mangrove), 6 (flooded forest), 11 (wetland), 12 (grassland)
var native_classes = {
  'amazonia':       [3, 4, 5, 6, 11, 12, 49, 50],
  'caatinga':       [3, 4, 5, 11, 12, 49, 50],
  'cerrado':        [3, 4, 5, 11, 12, 49, 50],
  'mata_atlantica': [3, 4, 5, 11, 12, 49, 50],
  'pampa':          [3, 4, 5, 11, 12, 49, 50],
  'pantanal':       [3, 4, 5, 11, 12, 49, 50, 33]
};

// Set years to be processed 
var years_list = [1985, 1986, 1987, 1988, 1989, 1990, 1991, 1992, 1993, 1994, 1995, 1996, 1997, 
                  1998, 1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010,
                  2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023];

// read biomes
var biomes = ee.Image('projects/mapbiomas-workspace/AUXILIAR/biomas-2019-raster');

// build biomes dictionary
var biomes_name = ['amazonia'];
var biomes_dict = {
  'amazonia':       1,
  'caatinga':       5,
  'cerrado':        4,
  'mata_atlantica': 2,
  'pampa':          6,
  'pantanal':       3
};

// build recipe for the size
var recipe_id = ee.Image([]);
  
  // for each year
  years_list.forEach(function(year_j) {
    
    // build recipe for the year 
    var recipe_year = ee.Image(0);
    
    // read collection 
    var collection = ee.Image('projects/mapbiomas-public/assets/brazil/lulc/collection9/mapbiomas_collection90_integration_v1')
      .select('classification_' + year_j);
      
    // for each biome
    biomes_name.forEach(function(biome_k) {
      // get native vegetation map
      var native_mask = collection
        .remap({from: native_classes[biome_k],
                to: native_classes[biome_k],
                defaultValue: 21
        }).updateMask(biomes.eq(biomes_dict[biome_k]));
      
      // mask collection to retain raw classes
      var collection_i = collection.updateMask(native_mask.neq(21));
      
      // dissolve all native veg. classes into each one
      var native_l0 = collection_i.remap({
        from: native_classes[biome_k],
        to: ee.List.repeat(1, ee.List(native_classes[biome_k]).length())
      });
      
      var connect = native_l0.connectedComponents({
      connectedness: ee.Kernel.square(1),
      maxSize:1024
      })
      
      // insert into recipe
      // recipe_year = recipe_year.blend(connect).selfMask();
      
      // store into recipe
      recipe_id = recipe_id.addBands(connect.select('labels').rename('labels_' + year_j))
        .reproject('EPSG:4326', null, 30);
        
      Map.addLayer(recipe_id.randomVisualizer(), {}, 'recipe')
      
      });
    
  });
  
  //Map.addLayer(recipe_id.select('labels_2023').randomVisualizer(), {}, 'labels 2023');


  // Set properties
  recipe_id = recipe_id.set({'version': version})

  // Export 
  print(recipe_id);

  // Export
   Export.image.toAsset({
		image: recipe_id,
    description: 'labels_col9_v' + version,
    assetId: 'projects/mapbiomas-workspace/DEGRADACAO/COLECAO/BETA/PROCESS/labels/' + 'labels_col9_v' + version,
    region: biomes.geometry(),
    scale: 30,
    maxPixels: 1e13,
  });
