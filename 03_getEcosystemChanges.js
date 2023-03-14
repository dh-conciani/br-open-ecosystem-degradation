// compute native vegetation state change (mapbiomas) and tree cover change

// read disturbance combination
var combination = ee.Image('projects/mapbiomas-workspace/DEGRADACAO/DISTURBIOS/disturbance_frequency/brazil_disturbance_frequency_agreement_2');

// list years to be processed - gfcc
var years_gfcc = [2000, 2005, 2010, 2015];

// list years to be processed - mapbiomas
var years_mapbiomas = [
  1985, 1986, 1987, 1988, 1989, 1990, 1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999, 2000, 2001, 2002, 2003,
  2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021];

// transpose gfcc into imagecollection to multi-band per-year data
var gfcc = ee.Image(years_gfcc.map(function(year_i) {
  return  ee.ImageCollection('NASA/MEASURES/GFCC/TC/v3')
            .filter(ee.Filter.date(year_i + '-01-01', year_i + '-12-30'))
            .select('tree_canopy_cover')
            .mean()
            .rename('tc_' + year_i)
            .updateMask(combination);
            }
          )
        );

// get changes in tree cover
var gfcc_change = gfcc.select('tc_2015').subtract(gfcc.select('tc_2000'));

// get mapbiomas native vegetation classes over time-series
var mapbiomas_native = ee.Image(years_mapbiomas.map(function(year_i) {
  return ee.Image('projects/mapbiomas-workspace/public/collection7/mapbiomas_collection70_integration_v2')
            .select('classification_' + year_i)
            .remap({
               from: [3, 4, 5, 11, 12, 13, 32, 49, 50],
               to:   [3, 4, 5, 11, 12, 13, 32, 49, 50],
               defaultValue: 0
            })
            .rename('classification_' + year_i)
            .selfMask()
            .updateMask(
              ee.Image('projects/mapbiomas-workspace/public/collection7/mapbiomas_collection70_integration_v2')
                .select('classification_2021'));
  })
);

// get the number of native vegetation classes
var calculateNumberOfClasses = function (image) {
    return image.reduce(ee.Reducer.countDistinctNonNull())
                .rename('number_of_classes');
};

var native_classes = calculateNumberOfClasses(mapbiomas_native);

Map.addLayer(native_classes, {palette:['green', 'yellow', 'red'], min:1, max:3}, 'classes')




//Map.addLayer(gfcc,  {min: 0.0, max: 100.0, palette: ['ffffff', 'afce56', '5f9c00', '0e6a00', '003800']}, 'Tree Canopy Cover');
Map.addLayer(gfcc_change, {palette:['red', 'yellow', 'green'], min: -20, max: 20}, 'change');
Map.addLayer(combination, {
  palette: ['#C0C0C0', '#606060', '#20F0E2', '#FFEC33', '#EF9A2C', '#529CA8', '#00F318', 'red'], 
  min: 1, max: 8
  }, 'Disturbance');
