// get the first qualification approach for the native vegetation 
// dhemerson.costa@ipam.org.br

// read mapbiomas collection 7.1 
var mapbiomas_collection = ee.Image('projects/mapbiomas-workspace/public/collection7_1/mapbiomas_collection71_integration_v1');

// get only native vegetation 
var mapbiomas_native = mapbiomas_collection
  // select only the last year
  .select('classification_2021')
  // select only native vegetation
  .remap({from: [3, 4, 11, 12],
          to: [3, 4, 11, 12],
          defaultValue: 0
}).selfMask();

// get the number of nv classes over the times series
var nClass = mapbiomas_collection.updateMask(mapbiomas_native).reduce(ee.Reducer.countDistinctNonNull());
var stable = mapbiomas_native.updateMask(nClass.eq(1));

// remap 
stable = stable.remap({
  from: [3, 4, 11, 12],
  to: [5, 5, 5, 5]
}).selfMask();

// Get unstable traj native vegetation
var unstable_trajs = ee.ImageCollection('projects/mapbiomas-workspace/DEGRADACAO/TRAJECTORIES/COL71/V1')
      .mosaic();

// bind images
var binded = unstable_trajs.blend(stable);

// export 
Export.image.toAsset({
		image: binded,
    description: 'native_trajs_v2',
    assetId: 'projects/mapbiomas-workspace/DEGRADACAO/TRAJECTORIES/COL71/native_trajs_v2',
    pyramidingPolicy: 'mode',
    region: mapbiomas_collection.geometry(),
    scale: 30,
    maxPixels: 1e13
});

Map.addLayer(stable.randomVisualizer(), {}, 'stable', false);
Map.addLayer(unstable_trajs.randomVisualizer(), {}, 'unstable trajs', false);
Map.addLayer(binded.randomVisualizer(), {}, 'binded', false)

Map.addLayer(ee.Image('projects/mapbiomas-workspace/DEGRADACAO/TRAJECTORIES/COL71/native_trajs_v1').randomVisualizer(), {}, 'exported')
