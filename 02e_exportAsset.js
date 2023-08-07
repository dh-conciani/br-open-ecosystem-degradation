// read structural changes layer
// dhemerson.costa@ipam.org.br

// read as imageCollection and convert to ee.Image()
var layers = ee.ImageCollection('projects/mapbiomas-workspace/DEGRADACAO/TRAJECTORIES/COL71/QUALIFY_CHANGES_V1')
  // insert the number of bands (will be used to discard null tiles)
  .map(function(image) {
    return image.set({'n_bands': image.bandNames().length()});
  })
  // filter only tiles with data
  .filterMetadata('n_bands', 'equals', 3)
  // convert imageCollection into ee.Image  
  .mosaic()
  // rename bands
  .select(
    ['b1', 'b2', 'b3'],
    ['structure_change', 'trajectory', 'age']);
    

// Get layers and parse results
var type = layers.select('structure_change').divide(100).round();
var direction = layers.select('structure_change').mod(100).divide(10).rename('direction');
var age = layers.select('age');

// Plot layers
Map.addLayer(type, {palette: ['#FFFF00', '#FF00E0'], min:4, max:5}, 'Tipo de mudança');
Map.addLayer(direction, {palette: ['#FC0000', '#66EA05'], min:3, max:4}, 'Direção da mudança');
Map.addLayer(age, {palette: ['red', 'orange', 'yellow'], min:1, max:20}, 'Idade da mudança');

// Combine
var image = type.addBands(direction).addBands(age).aside(print);

// Export
Export.image.toAsset({
		image: image,
    description: 'STRUCTURAL_CHANGE_V4',
    assetId: 'projects/mapbiomas-workspace/DEGRADACAO/TRAJECTORIES/COL71/STRUCTURAL_CHANGE_V4',
    region: geometry,
    scale: 30,
    maxPixels: 1e13,
});
