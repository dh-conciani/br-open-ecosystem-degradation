// export reference lcluc dataset 
// dhemerson.costa@ipam.org.br

// set native classes
var native_classes = [3, 4, 5, 6, 11, 12, 49, 50];

// set version
var version = 1;

// set output 
var output = 'projects/mapbiomas-workspace/DEGRADACAO/COLECAO/BETA/PROCESS/reference_native';

// read mapbiomas 
var collection = ee.Image('projects/mapbiomas-workspace/public/collection8/mapbiomas_collection80_integration_v1');

// Set years to be processed 
var years_list = [1985, 1986, 1987, 1988, 1989, 1990, 1991, 1992, 1993, 1994, 1995,
                  1996, 1997, 1998, 1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006,
                  2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017,
                  2018, 2019, 2020, 2021, 2022];

// for each year 
var recipe = ee.Image([]);
years_list.forEach(function(year_i) {
  // select year i
  var collection_i = collection.select('classification_' + year_i)
    // retain only native classes
    .remap({
      'from': native_classes,
      'to': native_classes,
      'defaultValue': 0
    })
    .rename('classification_' + year_i)
    .selfMask();
    
    // bind
    recipe = recipe.addBands(collection_i);
});


Map.addLayer(recipe.select('classification_2022').randomVisualizer());
Map.addLayer(recipe.select('classification_1985').randomVisualizer());

// export
  Export.image.toAsset({
		image: recipe,
    description: 'reference_v' + version,
    assetId: output + '/' + 'reference_v' + version,
    region: collection.geometry(),
    scale: 30,
    maxPixels: 1e13
    });
