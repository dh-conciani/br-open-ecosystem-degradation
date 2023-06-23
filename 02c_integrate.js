// get the first qualification approach for the native vegetation 
// dhemerson.costa@ipam.org.br

// get biomes
var biomes = ee.Image('projects/mapbiomas-workspace/AUXILIAR/biomas-raster');
Map.addLayer(biomes.randomVisualizer(), {}, 'biomes', false);

/////////////////////////////////////////////
// GET STABLE CLASSES AND TRAJECTORIES
// read mapbiomas collection 7.1 
var mapbiomas_collection = ee.Image('projects/mapbiomas-workspace/public/collection7/mapbiomas_collection70_integration_v2');

// Apply exception rules
var filtered_collection = ee.Image([]);
ee.List.sequence({'start': 1985, 'end': 2021}).getInfo().forEach(function(year_i) {
  // get collection
  var x = mapbiomas_collection.select('classification_' + year_i);
  // Rule 1. Convert 11 and 33 to 12 in the Pantanal 
  var y = x.where(x.eq(11).or(x.eq(33)).and(biomes.eq(3)), 12)
    .rename('classification_' + year_i);
    
  // bind
  filtered_collection = filtered_collection.addBands(y);
});

//Map.addLayer(mapbiomas_collection.select('classification_2021').randomVisualizer(), {}, 'original', false);
//Map.addLayer(filtered_collection.select('classification_2021').randomVisualizer(), {}, 'filtered', false);
//Map.addLayer(filtered_collection, {}, 'filtered all', false);


// get only native vegetation 
var mapbiomas_native = filtered_collection
  // select only the last year
  .select('classification_2021')
  // select only native vegetation
  .remap({from: [3, 4, 11, 12],
          to:   [3, 4, 11, 12],
          defaultValue: 0
}).selfMask();

// Get the number of nv classes over the times series
var nClass_filtered = filtered_collection.updateMask(mapbiomas_native).reduce(ee.Reducer.countDistinctNonNull());
var nClass_collection = mapbiomas_collection.updateMask(mapbiomas_native).reduce(ee.Reducer.countDistinctNonNull());

// Get stable pixels
var stable_filtered = mapbiomas_native.updateMask(nClass_filtered.eq(1));
var stable_collection = mapbiomas_native.updateMask(nClass_collection.eq(1));

// Remove stable water 
var stable = stable_filtered.where(stable_collection.eq(33), 0);

// remap 
var stable = stable_filtered.remap({
                from: [3, 4, 11, 12],
                  to: [5, 5, 5, 5]}).selfMask();

//////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////
// GET TRAJECTORIES OF UNSTABLE AREAS

// Get unstable traj native vegetation
var unstable = ee.ImageCollection('projects/mapbiomas-workspace/DEGRADACAO/TRAJECTORIES/COL71/V1').mosaic();
var unstable_pantanal = ee.ImageCollection('projects/mapbiomas-workspace/DEGRADACAO/TRAJECTORIES/COL71/V1_PANTANAL').mosaic();

//Map.addLayer(unstable.randomVisualizer(), {}, 'unstable v1s', false);
//Map.addLayer(unstable_pantanal.randomVisualizer(), {}, 'unstable v1 pantanal', false);

// integrate pantanal version over the general version
unstable = unstable.blend(unstable_pantanal);
//Map.addLayer(unstable.randomVisualizer(), {}, 'blended', false);


/////////////// BIND DATA (STABLE + UNSTABLE)
// bind images
var binded = unstable.blend(stable);

// export 
Export.image.toAsset({
		image: binded,
    description: 'NV_CHANGE_V3',
    assetId: 'projects/mapbiomas-workspace/DEGRADACAO/TRAJECTORIES/COL71/NV_CHANGE_V3',
    pyramidingPolicy: 'mode',
    region: mapbiomas_collection.geometry(),
    scale: 30,
    maxPixels: 1e13
});

Map.addLayer(unstable.randomVisualizer(), {}, 'unstable trajs', false);
Map.addLayer(stable.randomVisualizer(), {}, 'stable', false);
Map.addLayer(binded.randomVisualizer(), {}, 'binded', false);
