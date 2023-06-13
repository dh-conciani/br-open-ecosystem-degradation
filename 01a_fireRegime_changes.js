// compute fire regime changes
// gt degradação 
// dhemerson.costa@ipam.org.br

// set periods
var periods = [
  [1985, 1995], 
  [1996, 2005],
  [2006, 2015],
  [2016, 2022]
  ];

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
var fire_bin = ee.Image([]); // empty recipe 

ee.List.sequence({'start': 1985, 'end': 2022}).getInfo().forEach(function(year_i) {
  // get year i
  var x = fire.select('burned_coverage_' + year_i)
    // and remap them
    .remap({
      'from': [0],
      'to': [0],
      'defaultValue': 1 
    }).rename('fire_bin_' + year_i)
      .unmask(0)
      .updateMask(collection_last); // select only native vegetation in the last year
      
    // store
    fire_bin = fire_bin.addBands(x);
});

// compute period frequency 
periods.forEach(function(period_i) {
  // get period images
  var period_image = ee.Image([]); // empty recipe
  
  ee.List.sequence({'start': period_i[0], 'end': period_i[1]}).getInfo()
    .forEach(function(year_ij) {
    var x = fire_bin.select('fire_bin_' + year_ij);
    
    // store
    period_image = period_image.addBands(x);
  });
  
  // return 
  print(period_image);

  // get period metrics  
  // sum (fire count)
  var period_sum = period_image.reduce(ee.Reducer.sum());                
  
  // mean (fire count / number of years)
  var period_mean = period_sum.divide(period_image.bandNames().size());  
  
  // fire return interval ([number of years / fire count] + 1)  
  var period_return = ee.Image(period_image.bandNames().size())
    .updateMask(period_sum)
    .divide(period_sum);
  
  
  
  Map.addLayer(period_sum, {palette:['green', 'yellow', 'red'], min:0, max:8}, 'SUM [' + period_i[0] + '-' + period_i[1] + ']', false);
  Map.addLayer(period_mean, {palette:['blue', 'pink', 'purple'], min:0, max:0.9}, 'MEAN [' + period_i[0] + '-' + period_i[1] + ']', false);
  Map.addLayer(period_return, {palette:['red', 'yellow', 'green'], min:0, max:8}, 'RETURN [' + period_i[0] + '-' + period_i[1] + ']', false);

});


//Map.addLayer(collection_last.randomVisualizer());
//Map.addLayer(fire.select('burned_coverage_2022').randomVisualizer());
//Map.addLayer(fire_bin.select('fire_bin_2022').randomVisualizer());
