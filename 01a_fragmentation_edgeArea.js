// ecosystem fragmentation - edge effect // gt degradaçao - mapbiomas
// any issue, bug or report write to dhemerson.costa@ipam.org.br and/or mrosa@arcplan.com.br

// -- * definitions
// definir classes a serem consideradas como vegetação nativa (nas quais o efeito de borda e tamanho do fragmento serão estimados)
// 3 (form. florestal), 4 (form. savânica), 5 (mangue), 6 (florestal alagável), 11 (wetland), 12 (campo)
var native_classes = {
  'amazonia':       [3, 4, 5, 6, 11, 12],
  'caatinga':       [3, 4, 5, 11, 12],
  'cerrado':        [3, 4, 5, 11, 12],
  'mata_atlantica': [3, 4, 5, 11, 12],
  'pampa':          [3, 4, 5, 11, 12],
  'pantanal':       [3, 4, 5, 11, 12]
};

// definir classes que serão ignoradas (ex: as quais não podem produzir efeitos de borda sobre as classes de veg. nativa)
// 13 (outras form. não florestais), 29 (afloramento rochoso), 32 (apicum), 33 (água), 49 (restinga arborea), 50 (restinga herbacea)
var ignore_classes = {
  'amazonia':       [13, 29, 32, 33, 49, 50],
  'caatinga':       [13, 29, 32, 33, 49, 50],
  'cerrado':        [13, 29, 32, 33, 49, 50],
  'mata_atlantica': [13, 29, 32, 33, 49, 50],
  'pampa':          [13, 29, 32, 49, 33, 50],
  'pantanal':       [13, 29, 32, 49, 33, 50]
};

// definir conjunto de distancias (em metros) para estimar a área sobre efeito de borda
//var edge_rules = [30, 60, 90, 120, 150, 300, 600, 1000];
var edge_rules = [30, 60, 90];


// Set years to be processed 
//var years_list = [1985, 1986, 1987, 1988, 1989, 1990, 1991, 1992, 1993, 1994, 1995,
//                  1996, 1997, 1998, 1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006,
//                  2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017,
//                  2018, 2019, 2020, 2021, 2022];
var years_list = [1985, 2022];

// * -- end of definitions

// * -- ingest infrastructure data
//var dnit_roads = ee.Image('projects/mapbiomas-workspace/DEGRADACAO/INFRASTRUCTURE/dnit_roads_image');
//Map.addLayer(dnit_roads, {}, 'Estradas');

// * -- end o f infrastructure data

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

// for each edge rule (distance)
edge_rules.forEach(function(distance_i) {
  
  // build recipes
  var edge_degrad = ee.Image([]);
  var edge_anthropogenic = ee.Image([]);

  // for each year
  years_list.forEach(function(year_j) {
  
    // read collection 
    var collection = ee.Image('projects/mapbiomas-workspace/public/collection8/mapbiomas_collection80_integration_v1')
      .select('classification_' + year_j);
      //.blend(dnit_roads);
  
    // for each biome, compute fragmentation by using specific criteria
    biomes_name.forEach(function(biome_k) {
      // get native vegetation map
      var native_mask = collection
        .remap({from: native_classes[biome_k].concat(ignore_classes[biome_k]),
                to: native_classes[biome_k].concat(ignore_classes[biome_k]),
                defaultValue: 21
        })
        // add infrastructure
        //.blend(dnit_roads.remap([1], [21]))
        .updateMask(biomes.eq(biomes_dict[biome_k]));
      
      // mask collection to retain raw classes
      var collection_i = collection.updateMask(native_mask.neq(21));
      //Map.addLayer(collection_i.randomVisualizer(), {}, year_i + ' ' + distance_i + ' ' + biome_k);
      
      // -- * get edge effect
      // retain anthropogenic classes to be used as reference for the edge 
      var anthropogenic = native_mask.updateMask(native_mask.eq(21));
      
      // compute edge 
      var edge = anthropogenic.distance(ee.Kernel.euclidean(distance_i + 10, 'meters'), false);
      edge = edge.mask(edge.lt(distance_i)).mask(collection).selfMask().updateMask(biomes.eq(biomes_dict[biome_k]));
      
        // remove edges over ignored classes
      ignore_classes[biome_k].forEach(function(class_m) {
        edge = edge.updateMask(collection_i.neq(class_m));
      });
      
      // compute classes that causes edge effect (1px)
      if (distance_i === 30) {
         var edge_out = edge.distance(ee.Kernel.euclidean(35, 'meters'), false);
         edge_out = edge_out.mask(edge_out.lt(distance_i)).mask(anthropogenic).selfMask().updateMask(biomes.eq(biomes_dict[biome_k]));
         
        // blend into recipe
        var anthropogenic_estimate = ee.Image(0).blend(edge_out).selfMask().rename('pressure_' + distance_i + 'm_' + year_j);
        //Map.addLayer(edge_out.randomVisualizer())
        // bind into recipe
        
      }
     
      
      // blend into recipes
      var edge_estimate = ee.Image(0).blend(edge).selfMask().rename('edge_' + distance_i + 'm_' + year_j);
      

    });
  });
  print(edge_degrad)
});


/*



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
  from: [1,  3, 4, 5, 49, 11, 12, 32, 29, 50, 13, 15, 19, 39, 20, 40, 62, 41, 36, 46, 47, 48, 9, 21, 23, 24, 30, 25, 33, 31],
  to: [  27, 1, 10, 1,  1, 10, 10, 10, 10, 10, 10, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14,14, 22, 22, 22, 22, 26, 26]
});

// plot
Map.addLayer(view_collection, vis, 'Mapbiomas 2021', false);
Map.addLayer(edge_anthropogenic, {'palette': ('purple')}, 'Classes que causam degradação');
Map.addLayer(edge_degrad, {'palette': ('red')}, 'Degradação por borda');
Map.addLayer(size_degrad, {'palette': ('orange')}, 'Degradação por tamanho');

// Retain classes from edge to export edge 
var inner = collection.select('classification_2021').updateMask(edge_degrad).rename('edge_native_class');
var out = collection.select('classification_2021').updateMask(edge_anthropogenic).rename('edge_anthropogenic_class');
var size_class = collection.select('classification_2021').updateMask(size_degrad).rename('size_class');

// Build image to export
var toExport = inner.addBands(edge_degrad).addBands(out).addBands(edge_anthropogenic).addBands(size_class).addBands(size_degrad);
print(toExport);

// Export asset
Export.image.toAsset({
		image: toExport,
    description: 'FRAGMENTATION_V2',
    assetId: 'projects/mapbiomas-workspace/DEGRADACAO/FRAGMENTATION/FRAGMENTATION_V2',
    region: biomes.geometry(),
    scale: 30,
    maxPixels: 1e13,
});

*/
