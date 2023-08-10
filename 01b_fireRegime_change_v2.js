// compute fire regime changes
// gt degradação 
// dhemerson.costa@ipam.org.br

// set periods
var periods = [
  [1985, 1991], 
  [1992, 1998],
  [1999, 2006],
  [2007, 2013],
  [2014, 2018],
  [2019, 2022]
  ];

// set native classes
var native_classes = [3, 4, 11, 12];

// set criteria
var criteria = 3;

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

// compute period metrics
// set recipe
//var periods_sum = ee.Image([]);
var periods_mean = ee.Image([]);
//var periods_return = ee.Image([]);

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
  //print(period_image);

  // get metrics for each period
  // sum (fire count)
  var period_sum = period_image.reduce(ee.Reducer.sum());                
  
  // mean (fire count / number of years)
  var period_mean = period_sum.divide(period_image.bandNames().size());  
  
  // fire return interval ([number of years / fire count] + 1)  
  var period_return = ee.Image(period_image.bandNames().size())
    .updateMask(period_sum)
    .divide(period_sum);
    
  // store
  periods_mean = periods_mean.addBands(period_mean.rename(period_i[0] + '_' + period_i[1]));
  
  //Map.addLayer(period_sum, {palette:['green', 'yellow', 'red'], min:0, max:8}, 'SUM [' + period_i[0] + '-' + period_i[1] + ']', false);
  //Map.addLayer(period_mean, {palette:['green', 'yellow', 'red'], min:0, max:0.9}, 'MEAN [' + period_i[0] + '-' + period_i[1] + ']', false);
  //Map.addLayer(period_return, {palette:['red', 'yellow', 'green'], min:0, max:8}, 'RETURN [' + period_i[0] + '-' + period_i[1] + ']', false);

});

//print('mean freq.', periods_mean);
Map.addLayer(periods_mean, {}, 'mean frequency', false);

// Select all bands except the last one
var bandNames = periods_mean.bandNames();
var historicalMean = periods_mean.select(bandNames.slice(0, bandNames.length().subtract(1)));

// compute historical mean
historicalMean = historicalMean.reduce(ee.Reducer.mean());

//print('historicalMean', historicalMean);
Map.addLayer(historicalMean, {}, 'historicalMean', false);

// compute difference (observed frequency - expected frequency [mean of historical])
var difference_freq = periods_mean.select(ee.String(periods_mean.bandNames().get(-1)))
  .subtract(historicalMean);

print('unfiltered', difference_freq);
Map.addLayer(difference_freq,  {palette: ['blue', 'white', 'red'], min: -0.3, max: 0.3}, 'freq. difference (unfiltered)', false);

// Now we neeed to extract historical patterns to filter expected changes
// Get the band names
var bandNames = periods_mean.bandNames();

// Initialize an empty image to store the subtracted bands
var subtracted = ee.Image();

// Iterate over the bands and subtract them from the previous band
for (var i = 1; i < bandNames.length().getInfo(); i++) {
  var currentBandName = ee.String(bandNames.get(i));
  var previousBandName = ee.String(bandNames.get(i - 1));
  
  var currentBand = periods_mean.select(currentBandName);
  var previousBand = periods_mean.select(previousBandName);
  
  var subtractedBand = currentBand.subtract(previousBand);
  
  subtracted = subtracted.addBands(subtractedBand);
}

// discard first band (no previous time)
var changes = subtracted.select(bandNames.slice(1));

// Select all bands except the last one
var bandNames = changes.bandNames();
var changes_wLast = changes.select(bandNames.slice(0, bandNames.length().subtract(1)));

// Compute the net over historical series 
var historicalChange_sd = changes_wLast.reduce(ee.Reducer.stdDev());

// Now, use historicalChange_sd to mask pixels within historical change interval (+sd and -sd)
var filtered_difference = difference_freq.where(difference_freq.lte(historicalChange_sd)
  .and(difference_freq.gte(historicalChange_sd.multiply(-1))), 0);
  
print(filtered_difference);
Map.addLayer(filtered_difference,  {palette: ['blue', 'white', 'red'], min: -0.3, max: 0.3}, 'freq. difference (filtered)');

// Export
Export.image.toAsset({
		image: filtered_difference.rename('fire_regime_changes'),
    description: 'fire_regime_changes_v2',
    assetId: 'projects/mapbiomas-workspace/DEGRADACAO/FOGO/fire_regime_changes_v2',
    region: collection.geometry(),
    scale: 30,
    maxPixels: 1e13,
});

//Map.addLayer(collection.geometry(), {}, 'geometry', false);
