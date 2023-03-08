// get time-series of degradation vectors and compute statistical summaries
// dhemerson.costa@ipam.org.br (ipam and mapbiomas brazil) 

// get mapbiomas land cover (col 7)
var mapbiomas = ee.Image('projects/mapbiomas-workspace/public/collection7/mapbiomas_collection70_integration_v2');
  
// get only native vegetation in the last year (2021)
var mapbiomas_native = mapbiomas.select(['classification_2021']).remap({
  from: [3, 4, 5, 11, 12, 13, 32, 49, 50],
  to:   [3, 4, 5, 11, 12, 13, 32, 49, 50],
  defaultValue: 0})
  .rename('native_vegetation');
  
// function to get info only for native vegetation and fill masked values as zero
var fillMap = function(image) {
  return image.updateMask(mapbiomas_native.neq(0))
  .unmask(0)
  .updateMask(mapbiomas.select(0));
};

// reclassify anthropogenic classes to 'farming' over the entire time-series
// set the years to be used in the process
var years_list = [
  1985, 1986, 1987, 1988, 1989, 1990, 1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999, 2000, 2001, 2002, 2003,
  2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021
  ];

// perform the reclassification
var mapbiomas_anthropogenic = ee.Image(
  years_list.map(function(year_i) {
    var x = mapbiomas.select(['classification_' + year_i])
      .remap({
        from: [15, 18, 19, 39, 20, 40, 62, 41, 36, 46, 47, 48, 9,  21, 24, 30, 25], 
        to:   [14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14],
        defaultValue: null
      });
    // store 
    return x.rename('classification_' + year_i);
  })
);






// get fire frequency from mapbiomas fogo (col 1)
var fire_freq = fillMap(
  ee.Image('projects/mapbiomas-workspace/public/collection7/mapbiomas-fire-collection1-1-fire-frequency-1')
  .select(['fire_frequency_1985_2021']).divide(100).int()
  .rename('fire_freq')
  );

// get deforestation frequency from mapbiomas lcluc (col 7.1)
var deforestation = fillMap(
  ee.Image('projects/mapbiomas-workspace/public/collection7_1/mapbiomas_collection71_deforestation_frequency_v1')
  .select(['desmatamento_frequencia_1987_2020']).divide(100).int()
  .rename('deforestation_freq')
  );

// years as anthropogenic use





// climatic

// read palettes
var vis = {
    'min': 0,
    'max': 49,
    'palette': require('users/mapbiomas/modules:Palettes.js').get('classification6')
};

// plot data
Map.addLayer(mapbiomas_anthropogenic.select(['classification_2021']), vis, 'anthropogenic 2021')
//Map.addLayer(mapbiomas, vis, 'land cover 2021', false);
Map.addLayer(mapbiomas_native, vis, 'native vegetation 2021', false);
Map.addLayer(fire_freq, {palette: ['white', 'green', 'yellow', 'orange', 'red'], min:0, max:15}, 'fire_freq');
Map.addLayer(deforestation, {palette: ['white', 'green', 'yellow', 'orange', 'red'], min:0, max:5}, 'deforestation freq');
