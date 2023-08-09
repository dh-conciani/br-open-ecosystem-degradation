// get area by territory 
// dhemerson.costa@ipam.org.br

// an adaptation from:
// calculate area of @author João Siqueira

// trajectories data
var trajs = ee.Image('projects/mapbiomas-workspace/DEGRADACAO/TRAJECTORIES/COL71/native_trajs_v2');

// mapbiomas data (last year)
var mapbiomas = ee.Image('projects/mapbiomas-workspace/public/collection7_1/mapbiomas_collection71_integration_v1')
                  .select(['classification_2021']);
                  
// native classes in which statistics will be processed
var classes = [3, 4, 11, 12, 33];

// define classification regions 
var territory = ee.Image('projects/mapbiomas-workspace/AUXILIAR/biomas-2019-raster')
        .rename('territory');

// plot regions
Map.addLayer(territory.randomVisualizer());

// change the scale if you need.
var scale = 30;

// define the years to bem computed 
var bands = ['b1'];

// define a Google Drive output folder 
var driverFolder = 'AREA-EXPORT-DEGRADATION';
                
// Image area in km2
var pixelArea = ee.Image.pixelArea().divide(10000);
  
// create recipe to bind data
var recipe = ee.FeatureCollection([]);

classes.forEach(function(class_i) {
  
  // get the classification for the file[i] 
  var asset_i = trajs.updateMask(mapbiomas.eq(class_i));
  Map.addLayer(asset_i.randomVisualizer(), {}, 'class ' + class_i);
  
  // Geometry to export
  var geometry = asset_i.geometry();
  
  // convert a complex object to a simple feature collection 
  var convert2table = function (obj) {
    obj = ee.Dictionary(obj);
      var territory = obj.get('territory');
      var classesAndAreas = ee.List(obj.get('groups'));
      
      var tableRows = classesAndAreas.map(
          function (classAndArea) {
              classAndArea = ee.Dictionary(classAndArea);
              var classId = classAndArea.get('class');
              var area = classAndArea.get('sum');
              var tableColumns = ee.Feature(null)
                  .set('biome', territory)
                  .set('band', classId)
                  .set('area', area)
                  .set('class_id', class_i);
                  
              return tableColumns;
          }
      );
  
      return ee.FeatureCollection(ee.List(tableRows));
  };
  
  // compute the area
  var calculateArea = function (image, territory, geometry) {
      var territotiesData = pixelArea.addBands(territory).addBands(image)
          .reduceRegion({
              reducer: ee.Reducer.sum().group(1, 'class').group(1, 'territory'),
              geometry: geometry,
              scale: scale,
              maxPixels: 1e12
          });
          
      territotiesData = ee.List(territotiesData.get('groups'));
      var areas = territotiesData.map(convert2table);
      areas = ee.FeatureCollection(areas).flatten();
      return areas;
  };
  
  // perform per year 
  var areas = bands.map(
      function (band_i) {
          var image = asset_i.select(band_i);
          var areas = calculateArea(image, territory, geometry);
          // set additional properties
          areas = areas.map(
              function (feature) {
                  return feature.set('variable', band_i);
              }
          );
          return areas;
      }
  );
  
  areas = ee.FeatureCollection(areas).flatten();
  
  recipe = recipe.merge(areas);

});

Export.table.toDrive({
      collection: recipe,
      description: 'trajectories_per_biome_class',
      folder: driverFolder,
      fileFormat: 'CSV'
});
