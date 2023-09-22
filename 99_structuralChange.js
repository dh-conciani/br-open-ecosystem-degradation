// get woody enchorachment and thinning in brazilian native vegetation 
// gt degradação - mapbiomas- dhemerson.costa@ipam.org.br

// read collection 8
var collection = ee.Image('projects/mapbiomas-workspace/public/collection8/mapbiomas_collection80_integration_v1');

// set native classes
var native_classes =          [3, 4, 5, 6, 11, 12];
var native_classes_adjusted = [3, 4, 3, 3, 12, 12];

// set ignored classes
var ignore_classes = [27, 33];

// set assessment classes
var assess_classes = [3, 4, 12];

// set persistence rule to validate a temporal patch 
var persistence = 3;

// set years to be processed
var years_list = [1985, 1986, 1987, 1988, 1989, 1990, 1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999,
                  2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014,
                  2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022];

// remap collection to structural levels
// build an empty recipe
var collection_x = ee.Image([]);
// for each year
years_list.forEach(function(year_i) {
  // get collection for the year [i]
  var x = collection.select('classification_' + year_i)
    // remap native classes to structural levels
    .remap({'from': native_classes.concat(ignore_classes),
            'to': native_classes_adjusted.concat(ignore_classes),
            'defaultValue': 0
    }) // mask anthropogenic areas
    //.selfMask()
    // rename
    .rename('classification_' + year_i);
  
  // store the result at recipe
  collection_x = collection_x.addBands(x);
});

// ps. consider water
// temporal filter to remove temporal patches smaller than persistence rule
// 3yr? 5yr? 

// temporal filter to fill zero's with previous native class

// temporal filter to perform enchroachment/thinning rule

// temporal filter to mask anthropogenic years



print(collection_x);




/*
// get native vegetation in the last year
var collection_last = collection.select('classification_' + years_list[years_list.length - 1])
  // and retain only native vegetation + ignored classes
  .remap({'from': native_classes.concat(ignore_classes),
          // remmaping them to value == 1
          'to': ee.List.repeat({'value': 1, 'count': native_classes.concat(ignore_classes).length}),
          // non-declared vlaues assumes values == 0
          'defaultValue': 0 }
          )// and will be masked as NULL
          .selfMask();

// mask the entire collection by using last  
collection = collection.updateMask(collection_last);

*/



// compute the number of classes per pixel ()
// get per pixel number of classes
var n_classes = collection_x.reduce(ee.Reducer.countDistinctNonNull());


// get palette
var vis = {
    'min': 0,
    'max': 62,
    'palette': require('users/mapbiomas/modules:Palettes.js').get('classification7')
};

// plot
Map.addLayer(collection_x.select('classification_' + years_list[years_list.length - 1]), vis, 'last year collection');
Map.addLayer(collection_x, {}, 'collection');

Map.addLayer(n_classes, {palette: ['green', 'yellow', 'red'], min:1, max:3}, 'number of native class changes');
