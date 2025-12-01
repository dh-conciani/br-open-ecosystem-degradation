// get native mask (reference areas)

// set years to be processed
var years = [ 
  1985, 1986, 1987, 1988, 1989, 1990, 1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024
];


// set collection
var collection = ee.Image('projects/mapbiomas-public/assets/brazil/lulc/collection10/mapbiomas_brazil_collection10_integration_v2')

// remap 
var col_remap = ee.Image([]);
years.forEach(function(year_i) {
  
  var collection_i = collection.select('classification_' + year_i)
    .remap({
      'from':  [3, 4, 5, 6, 11, 12, 49, 50],
      'to':    [3, 4, 5, 6, 11, 12, 49, 50],
      'defaultValue': 0
    }).selfMask()
    
  // store
  col_remap = col_remap.addBands(
    collection_i.rename('classification_' + year_i));
  
})

// save as gee asset
Export.image.toAsset({
  	image: col_remap,
    description: 'reference_col10_v1',
    assetId: 'projects/mapbiomas-brazil/assets/DEGRADATION/COLLECTION-10/' + 'reference_col10_v1',
    region: collection.geometry(),
    scale: 30,
    maxPixels: 1e13,
    priority: 999
  });

