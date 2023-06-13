
// compute fire regime changes
// gt degradação 
// dhemerson.costa@ipam.org.br

// set periods
var periods = [
  [1985, 2000], 
  [2001, 2022]
  ];
  
//periods.forEach(function(i) {
//  print(i)
//})

// set native classes
var native_classes = [3, 4, 11, 12];


///////////////////////////
// read luluc collection 
var collection = ee.Image('projects/mapbiomas-workspace/public/collection7/mapbiomas_collection70_integration_v2');

// get last year classification
var collection_last = collection.select('classification_2021')
  // and remmap to retain only native vegetation
  .remap({
    'from': native_classes,
    'to': ee.List.repeat(1, native_classes.length),
    'defaultValue': 0
    }).selfMask();

// read mapbiomas fire data
var fire = ee.Image('projects/mapbiomas-workspace/public/collection7_1/mapbiomas-fire-collection2-annual-burned-coverage-1');

// binarize fire-data for each year
var fire_bin = ee.Image([]);
ee.List.sequence({'start': 1985, 'end': 2022}).getInfo().forEach(function(year_i) {
  // get year i
  var x = fire.select('burned_coverage_' + year_i)
    // and remap them
    .remap({
      'from': [0],
      'to': [0],
      'defaultValue': 1 
    }).rename('fire_bin_' + year_i)
      .selfMask();
      
    // store
    fire_bin = fire_bin.addBands(x);
});


print (fire_bin)

Map.addLayer(collection_last.randomVisualizer());
Map.addLayer(fire.select('burned_coverage_2022').randomVisualizer());
Map.addLayer(fire_bin.select('fire_bin_2022').randomVisualizer());
