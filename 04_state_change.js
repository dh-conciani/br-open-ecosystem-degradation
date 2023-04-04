// Ecosystem State Change
// GT Degradação- MapBiomas
// dhemerson.costa@ipam.org.br

// Set IDs 'packages'
// Check ids here: https://mapbiomas-br-site.s3.amazonaws.com/downloads/_EN__C%C3%B3digos_da_legenda_Cole%C3%A7%C3%A3o_7.pdf
var native_classes = [3, 4, 5, 11, 12, 13, 29, 32, 49, 50];
var anthropogenic_classes = [15, 18, 19, 39, 20, 40, 62, 41, 36, 46, 47, 48, 9, 21, 24, 30];
var ignore_classes = [27, 33];
var soil_classes = [25];

// Set years to be used
var years_list = [
  1985, 1986, 1987, 1988, 1989, 1990, 1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999, 2000, 2001, 2002, 2003,
  2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021
  ];

// Read Mapbiomas Collection 7.1
var collection = ee.Image('projects/mapbiomas-workspace/public/collection7/mapbiomas_collection70_integration_v2');

// Get native vegetation as binaries
var native_bin = ee.Image(years_list.map(function(year_i) {
    // Select native vegetation classes for the year [i]
    var native_bin_i = collection.select('classification_' + year_i).remap({
               from: native_classes,
               // And binarize them (0= Absent, 1= Present)
               to:   ee.List.repeat({value:1, count: ee.List(native_classes).length()}),
               defaultValue: 0
            }).rename('classification_' + year_i);
            
  return native_bin_i;
  })
);

// Get "no apply" classes as binaries 
var ignore_bin = ee.Image(years_list.map(function(year_i) {
    // Select native vegetation classes for the year [i]
    var ignore_bin_i = collection.select('classification_' + year_i).remap({
               from: ignore_classes,
               // And binarize them (0= Absent, 1= Present)
               to:   ee.List.repeat({value:1, count: ee.List(ignore_classes).length()}),
               defaultValue: 0
            }).rename('classification_' + year_i);
            
  return ignore_bin_i;
  })
);


// Read Brazil boundaries
var brazil = ee.Image('projects/mapbiomas-workspace/AUXILIAR/biomas-2019-raster');

// Compute the number of years as native vegetation 
var native_freq = native_bin.reduce('sum').unmask(0).updateMask(brazil).rename('native_freq');

// Compute the number of years as native vegetation 
var ignore_freq = ignore_bin.reduce('sum').unmask(0).updateMask(brazil).rename('ignore_freq');

// Compute the number of years as native vegetation or ignored
var native_or_ignore_freq = native_freq.add(ignore_freq);

// 








// Get stable native vegetation 
//var stable_mask = ee.Image(0).where(native_or_ignore_freq.eq(37), 1).updateMask(brazil);
//var stable = collection.select('classification_2021').updateMask(native_or_ignore_freq.eq(37));




// data visualization
var vis = {
    'min': 0,
    'max': 49,
    'palette': require('users/mapbiomas/modules:Palettes.js').get('classification6')
};

Map.addLayer(native_freq,  {palette: ['white', '#46084e', '#e4242e', '#ff6d00', '#ffd600', '#51bd1f'], min:0, max:37}, 'Frequência VN', false);
Map.addLayer(ignore_freq,  {palette: ['white', '#b3cde0', '#6497b1', '#005b96', '#03396c', '#011f4b'], min:0, max:37}, 'Freq. Água', false);
Map.addLayer(native_or_ignore_freq,  {palette: ['white', '#46084e', '#e4242e', '#ff6d00', '#ffd600', '#51bd1f'], min:0, max:37}, 'Freq VN + Água', false);


Map.addLayer(stable_mask, vis, 'Estável como VN+Água (Freq=37)', false);



/*
// secondary vegetation age
var secondary = ee.Image('projects/mapbiomas-workspace/public/collection7_1/mapbiomas_collection71_secondary_vegetation_age_v1')
                 .select('secondary_vegetation_age_2021')
                 .unmask(0)
                 .updateMask(brazil);
                 
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
*/

