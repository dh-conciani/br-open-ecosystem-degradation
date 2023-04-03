// Ecosystem State Change
// GT Degradação- MapBiomas
// dhemerson.costa@ipam.org.br

// set assessment packages
// check legned ids here:
var native_classes = [3, 4, 5, 11, 12, 13, 29, 32, 49, 50];
var anthropogenic_classes = [15, 18, 19, 39, 20, 40, 62, 41, 36, 46, 47, 48, 9, 21, 24, 30];
var dont_apply = [27, 33];
var soil = [25];

// set the years to be used in the process
var years_list = [
  1985, 1986, 1987, 1988, 1989, 1990, 1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999, 2000, 2001, 2002, 2003,
  2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021
  ];

// get mapbiomas native vegetation classes over time-series
var mapbiomas_native = ee.Image(years_list.map(function(year_i) {
  return ee.Image('projects/mapbiomas-workspace/public/collection7/mapbiomas_collection70_integration_v2')
            .select('classification_' + year_i)
            .remap({
               from: classes,
               to:   classes,
               defaultValue: 0
            })
            .rename('classification_' + year_i)
            .selfMask()
            .updateMask(
              ee.Image('projects/mapbiomas-workspace/public/collection7/mapbiomas_collection70_integration_v2')
                .select('classification_2021'));
  })
);

// remap all native vegetation classes to [1] 
var native_bin = ee.Image(years_list.map(function(year_i) {
  return mapbiomas_native
            .select('classification_' + year_i)
            .remap({
               from: classes,
               to:   ee.List.repeat(1, ee.List(classes).length()),
               defaultValue: 0
            })
            .rename('classification_' + year_i)
            .selfMask()
            .updateMask(
               mapbiomas_native.select('classification_2021')
              );
  })
);

// read brazil boundaries
var brazil = ee.Image('projects/mapbiomas-workspace/AUXILIAR/biomas-2019-raster');

// get years as native vegetation 
var native_freq = native_bin.reduce('sum').unmask(0).updateMask(brazil).rename('native_freq');

// get stable native vegetation
var stable = mapbiomas_native.select('classification_1985').updateMask(native_freq.eq(37));

// secondary vegetation age
var secondary = ee.Image('projects/mapbiomas-workspace/public/collection7_1/mapbiomas_collection71_secondary_vegetation_age_v1')
                 .select('secondary_vegetation_age_2021')
                 .unmask(0)
                 .updateMask(brazil);



// data visualization
var vis = {
    'min': 0,
    'max': 49,
    'palette': require('users/mapbiomas/modules:Palettes.js').get('classification6')
};

Map.addLayer(native_freq,  {palette: ['white', 'green', 'yellow', 'orange', 'red'], min:0, max:37}, 'Years as native vegetation', false);
Map.addLayer(stable, vis, 'Stable native vegetation', false);
Map.addLayer(secondary, {palette: ['red', 'orange', 'yellow', 'green'], min:1, max:15}, 'Secondary vegetation age', false);



// read disturbance frequencies
var disturbance = ee.Image('projects/mapbiomas-workspace/DEGRADACAO/DISTURBIOS/disturbance_frequency/brazil_disturbance_frequency_2');

// isolate each one
var fire_freq = disturbance.select('fire_freq');
var deforestation_freq = disturbance.select('deforestation_freq');
var anthropogenic_freq = disturbance.select('anthropogenic_freq');

Map.addLayer(anthropogenic_freq, {palette: ['white', 'green', 'yellow', 'orange', 'red'], min:0, max:10}, 'Years as anthropic', false);
Map.addLayer(deforestation_freq, {palette: ['white', 'green', 'yellow', 'orange', 'red'], min:0, max:5}, 'Number of veg. loss events', false);
Map.addLayer(fire_freq, {palette: ['white', 'green', 'yellow', 'orange', 'red'], min:0, max:15}, 'Fire Count', false);

