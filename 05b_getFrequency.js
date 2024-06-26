// combine degradation layers and get intersections
// dhemerson.costa@ipam.org.br

// note: fire was applied only into forest class (see lines XXX-YYY)

// set output version
var output_version = '11'; 

// define params 
var config = {
  // min
  'params' : {
    'edge': 30,         // lte
    'patch': 10,        // lte
    'isolation': 20,    // lte
    'fire': 3,          // gte
    'secondary': 6,     // lte
  },
  // max
  //'params' : {
  //  'edge': 150,         // lte
  //  'patch': 50,        // lte
  //  'isolation': 5,    // lte
  //  'fire': 1,          // gte
  //  'secondary': 37,     // lte
  //},
  'bands': {
    'edge' : 'edge_',
    'patch': 'patch_',
    'isolation': 'isolation_',
    'fire': 'age_',
    'secondary': 'age_',
    'classification': 'classification_'
  },
  'assets': {
    'edge' : 'projects/mapbiomas-workspace/DEGRADACAO/COLECAO/BETA/PROCESS/summary/edge_v3',
    'patch': 'projects/mapbiomas-workspace/DEGRADACAO/COLECAO/BETA/PROCESS/summary/patch_v4',
    'isolation': 'projects/mapbiomas-workspace/DEGRADACAO/COLECAO/BETA/PROCESS/summary/isolation_v9',
    'fire': 'projects/mapbiomas-workspace/DEGRADACAO/COLECAO/BETA/PROCESS/fire/age_v1',
    'secondary': 'projects/mapbiomas-workspace/DEGRADACAO/COLECAO/BETA/PROCESS/secondary_vegetation/secondary_vegetation_age_v1',
    'classification': 'projects/mapbiomas-workspace/public/collection8/mapbiomas_collection80_integration_v1'
  },
  'nativeClasses': [3, 4, 5, 6, 11, 12, 49, 50]
};

// set years
var yearsList = [
  1986, 1987, 1988, 1989, 1990, 1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999, 2000,
  2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016,
  2017, 2018, 2019, 2020, 2021, 2022
  ];

// perform combination 
var recipe = ee.Image([]);
yearsList.forEach(function(year_i) {
  // get edge
  var edge = ee.Image(config.assets.edge)
    .select(config.bands.edge + year_i)
    .lte(config.params.edge)
    .unmask(0);
    
  // get patch size
  var patch = ee.Image(config.assets.patch)
    .select(config.bands.patch + year_i)
    .lte(config.params.patch)
    .unmask(0);
    
  // get isolation 
  var isolation = ee.Image(config.assets.isolation)
    .select(config.bands.isolation + year_i)
    .lte(config.params.isolation)
    .unmask(0);
  
  // fire 
  var fire = ee.Image(config.assets.fire)
    .select(config.bands.fire + year_i)
    // get only fire in forests
    .updateMask(ee.Image(config.assets.classification)
      .select(config.bands.classification + year_i)
      .eq(3))
    // now, extrzct only the age and apply filter
    .divide(100)
    .round()
    .gte(config.params.fire)
    .unmask(0);
  
  // secondary vegetation
  var secondary = ee.Image(config.assets.secondary)
    .select(config.bands.secondary + year_i)
    .divide(100)
    .round()
    .lte(config.params.secondary)
    .unmask(0);
    
  //Map.addLayer(secondary.randomVisualizer())
  
  // build frequency 
  var frequency = edge.add(patch).add(isolation).add(fire).add(secondary).selfMask();
  
  // get native mask
  var nativeMask = ee.Image(config.assets.classification)
    .select(config.bands.classification + year_i)
    .remap({
      'from': config.nativeClasses,
      'to': [6, 6, 6, 6, 6, 6, 6, 6],
      //'defaultValue': 0
    });
  
  //Map.addLayer(nativeMask.randomVisualizer(), {}, 'nativeMask')
  
  // add 'healthy' vegetation
  frequency = nativeMask.blend(frequency).multiply(100)
    // add native class
    .add(ee.Image(config.assets.classification).select(config.bands.classification + year_i))
    .rename('frequency_' + year_i);
    
  // store
  recipe = recipe.addBands(frequency);
  
});

// inspect
print(recipe);

// plot
Map.addLayer(recipe.select('frequency_2022').divide(100).round(), {palette: ['#FFFF59', '#FCAD2B', '#F92611', '#E40887', '#050004', '#32a65e', ], min:1, max:6}, 'frequency 2022');

// export
Export.image.toAsset({
		image: recipe,
    description: 'degradation_v' + output_version,
    assetId: 'projects/mapbiomas-workspace/DEGRADACAO/COLECAO/BETA/PROCESS/summary/degradation_v' + output_version,
    pyramidingPolicy: 'mode',
    region: geometry,
    scale: 30,
    maxPixels: 1e13
})
