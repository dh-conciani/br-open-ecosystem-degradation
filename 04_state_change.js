// Ecosystem Changes
// GT Degradação- MapBiomas
// dhemerson.costa@ipam.org.br

// Read Mapbiomas Collection 7.1
var collection = ee.Image('projects/mapbiomas-workspace/public/collection7/mapbiomas_collection70_integration_v2').toArray();

// Set trajectory
var trajectory = [3, 3, 4, 4, 4, 3, 3, 3, 3, 3, 3, 3, 3, 12, 12];

// Set t=0
var new_trajectory = [trajectory[0]];

print('input trajectory', trajectory);

// Iterate over indices of trajectory array
for (var i = 1; i < trajectory.length; i++) {
  // Check if next class is different
  if (trajectory[i] != trajectory[i - 1]) {
    new_trajectory = new_trajectory.concat(trajectory[i]);
  }
}

print('filtered trajectory', new_trajectory);

// Initialize an empty array to store the frequency of filtered trajectory
var freq = [];

// Iterate over the filtered trajectory
for (var i = 0; i < new_trajectory.length; i++) {
  var count = 0; // Initialize count to 0 for each element in filtered_trajectory
  var elem = new_trajectory[i];
  var lastPos = -1; // Initialize last position to -1 to avoid pushing the first position of the element
  
  // Iterate over the original trajectory to find positions of the current element
  for (var j = 0; j < trajectory.length; j++) {
    if (trajectory[j] == elem && j > lastPos) { // If element matches and j is greater than last position, increment count and store position
      count++;
      lastPos = j;
    }
  }
  
  // Store the frequency of current element
  freq.push(count);
}

print(freq); // [2, 3, 8]



/*
// Function to filter only unique values in a given trajectory
var onlyUnique = function(value, index, array) {
  return array.indexOf(value) === index;
};

// Set example
var x = [4, 4, 4, 3, 3, 3, 4, 4, 12, 12, 12, 4, 4, 4, 4, 4, 4, 4, 4];
print('input', x);

// filter unique
var unique = x.filter(onlyUnique);

print('unique', unique)




var res1 = ee.Number.parse(x.join(''));

print('as discrete', res1)

*/
//var x = collection.toArray();

//Map.addLayer(x);
//print(x);




/*



var cartas = ee.FeatureCollection('projects/mapbiomas-workspace/AUXILIAR/cartas')
print(cartas.limit(2))



// Set years to be used
var years_list = [
  1985, 1986, 1987, 1988, 1989, 1990, 1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999, 2000, 2001, 2002, 2003,
  2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021
  ];

// create recipe for changes
var recipe = ee.Image([]);

// 













// Read MapBiomas Transitions
var transitions = ee.Image('projects/mapbiomas-workspace/public/collection7_1/mapbiomas_collection71_transitions_v1');












// Set definitions
var classes = {
  //input: [3, 4, 11, 12],
  input: [4],
  //native: [3, 4, 5, 11, 12, 13, 29, 32, 49, 50],
  anthropogenic:  [15, 18, 19, 39, 20, 40, 62, 41, 36, 46, 47, 48, 9, 21, 24, 30],
  ignore: [27, 33, 5 , 13, 29, 49, 50],
  soil: [25]
  };



/*
// For each input class
classes.input.forEach(function(class_i) {
  // Remap over the collection 
  var remmaped = ee.Image(years_list.map(function(year_i) {
    // Get input as unique classes
    var x = collection.select('classification_' + year_i).remap({
      from: classes.input, 
      to: classes.input
    })
  })
  )
})






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

// Get stable native vegetation 
//var stable_mask = ee.Image(0).where(native_or_ignore_freq.eq(37), 1).updateMask(brazil);
//var stable = collection.select('classification_2021').updateMask(native_or_ignore_freq.eq(37));


// Start processing 













// data visualization
var vis = {
    'min': 0,
    'max': 49,
    'palette': require('users/mapbiomas/modules:Palettes.js').get('classification6')
};

Map.addLayer(native_freq,  {palette: ['white', '#46084e', '#e4242e', '#ff6d00', '#ffd600', '#51bd1f'], min:0, max:37}, 'Frequência VN', false);
Map.addLayer(ignore_freq,  {palette: ['white', '#b3cde0', '#6497b1', '#005b96', '#03396c', '#011f4b'], min:0, max:37}, 'Freq. Água', false);
Map.addLayer(native_or_ignore_freq,  {palette: ['white', '#46084e', '#e4242e', '#ff6d00', '#ffd600', '#51bd1f'], min:0, max:37}, 'Freq VN + Água', false);


//Map.addLayer(stable_mask, vis, 'Estável como VN+Água (Freq=37)', false);



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





/*
// Set period
var periods = [
  [1985, 2021]
  ];

// For each period
periods.forEach(function(period_i) {
  // Get bandnames for the period [i] 
  var bands = Array.apply(null, Array(period_i[1] - period_i[0] + 1)).map(function (_, i) {
    return 'classification_' + (period_i[0] + i).toString();
              }
          );
  
  // Filter MapBiomas for the period
  var collection_i = collection.select(bands);
  
  // Get the number of classes
  var nClasses = collection_i.reduce(ee.Reducer.countDistinctNonNull()).rename('number_of_classes');
  
  // Get the number of changes
  var nChanges = collection_i.reduce(ee.Reducer.countRuns()).subtract(1).rename('number_of_changes');
  
  // Get stable 
  var stable = collection_i.select(0).multiply(nClasses.eq(1));
  
  // Inspect
  Map.addLayer(nClasses,  {palette: ["#ffffff", "#C8C8C8","#AE78B2", "#772D8F", "#4C226A", "#22053A"], min:0, max:5}, period_i + ' Number of classes', false);
  Map.addLayer(nChanges, {palette: ["#C8C8C8", "#FED266", "#FBA713", "#cb701b", "#a95512", "#662000", "#cb181d"], min:0, max:7}, period_i + ' Number of changes', false);
  Map.addLayer(stable, {palette: require('users/mapbiomas/modules:Palettes.js').get('classification6'), min:0, max:49}, period_i + ' Stable', false);
  


});


*/
