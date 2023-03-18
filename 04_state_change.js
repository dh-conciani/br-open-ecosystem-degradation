// detect trajectories and state changes over native vegetation 
var classes = [3, 4, 5, 11, 12, 13, 32, 49, 50];

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

// function to count age since last state change
var time_since_last_state_change = function(image) {
  var image_i = mapbiomas_native.select('classification_' + year_i);
}
