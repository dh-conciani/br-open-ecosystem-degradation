// export dashboard landing page assets
// dhemerson.costa@ipam.org.br

// list years to be processed
var years = [1985, 1986, 1987, 1988, 1989, 1990, 1991, 1992, 1993, 1994, 1995, 1996, 1997,
             1998, 1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010,
             2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022];

// set classes to be processed
var classList = [3, 4, 5, 6, 11, 12, 49, 50];

////////////// edge size ************
var edge_asset = 'projects/mapbiomas-workspace/DEGRADACAO/COLECAO/BETA/PROCESS/edge_area/';
var edge_version = '2';
var edge_sizes = [1000, 600, 300, 150, 120, 90, 60, 30];

// build recipe
var recipe_edges = ee.Image([]);

// for each year 
years.forEach(function(year_i) {
  // set temp file
  var tempFile = ee.Image(0);
  // for each edge size 
  edge_sizes.forEach(function(size_i) {
    // read file 
    var edge = ee.Image(edge_asset + 'edge_' + size_i + 'm_v' + edge_version);
    // perform remap 
    edge = edge.remap({
      'from': classList,
      'to': ee.List.repeat({'value': size_i, 'count': classList.length})
    });
    // store edge size 
    tempFile = tempFile.blend(edge).selfMask();
  });
  // store per year 
  recipe_edges = recipe_edges.addBands(tempFile.rename('edge_' + year_i));
});

print('edges', recipe_edges);
Map.addLayer(recipe_edges.select(37).randomVisualizer(), {}, 'edges');

// Edge area
Export.image.toAsset({
  image: recipe_edges,
  description: 'edge_v' + edge_version,
  assetId: 'projects/mapbiomas-workspace/DEGRADACAO/COLECAO/BETA/PROCESS/summary/edge_v' + edge_version,
  region: recipe_edges.geometry(),
  scale: 30,
  maxPixels: 1e13,
  pyramidingPolicy: {
        '.default': 'mode'
    }
});

////////////// patch ************
var patch_asset = 'projects/mapbiomas-workspace/DEGRADACAO/COLECAO/BETA/PROCESS/patch_size/';
var patch_version = '3';
var patch_sizes = [75, 50, 25, 10, 5, 3];

// build recipe
var recipe_patches = ee.Image([]);

// for each year 
years.forEach(function(year_i) {
  // set temp file
  var tempFile = ee.Image(0);
  // for each patch size 
  patch_sizes.forEach(function(size_i) {
    // read file 
    var patch = ee.Image(patch_asset + 'size_' + size_i + 'ha_v' + patch_version);
    // perform remap 
    patch = patch.remap({
      'from': classList,
      'to': ee.List.repeat({'value': size_i, 'count': classList.length})
    });
    // store edge size 
    tempFile = tempFile.blend(patch).selfMask();
  });
  // store per year 
  recipe_patches = recipe_patches.addBands(tempFile.rename('patch_' + year_i));
});

print('patches', recipe_patches);
Map.addLayer(recipe_patches.select(37).randomVisualizer(), {}, 'patches');

// Edge area
Export.image.toAsset({
  image: recipe_patches,
  description: 'patch_v' + edge_version,
  assetId: 'projects/mapbiomas-workspace/DEGRADACAO/COLECAO/BETA/PROCESS/summary/patch_v' + patch_version,
  region: recipe_patches.geometry(),
  scale: 30,
  maxPixels: 1e13,
  pyramidingPolicy: {
        '.default': 'mode'
    }
});

////////////// isolation ************
