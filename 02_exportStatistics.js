// get area by territory 
// dhemerson.costa@ipam.org.br

// an adaptation from:
// calculate area of @author João Siqueira

// native classes
var classes = [3, 4, 5, 11, 12, 13, 32, 49, 50];

// define classification regions 
var territory = ee.Image('projects/mapbiomas-workspace/AUXILIAR/biomas-2019-raster')
        .rename('territory');

// plot regions
Map.addLayer(territory.randomVisualizer());

// change the scale if you need.
var scale = 30;

// define the years to bem computed 
var bands = ['anthropogenic_freq', 'deforestation_freq', 'fire_freq', 'sum_of_disturbance'];

// define a Google Drive output folder 
var driverFolder = 'AREA-EXPORT-DEGRADATION';

// get the classification for the file[i] 
var asset_i = ee.Image('projects/mapbiomas-workspace/DEGRADACAO/DISTURBIOS/disturbance_frequency/brazil_disturbance_frequency_2');
                
// Image area in km2
var pixelArea = ee.Image.pixelArea().divide(10000);
  
// Geometry to export
var geometry = asset_i.geometry();

classes.forEach(function(class_i) {
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
                  .set('freq_id', classId)
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
  
  Export.table.toDrive({
      collection: areas,
      description: 'disturbance_freq_per_biome_class_id_' + class_i,
      folder: driverFolder,
      fileFormat: 'CSV'
  });
});
