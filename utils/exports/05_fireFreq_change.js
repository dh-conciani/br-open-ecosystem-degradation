// get age of structural change by class, type and direction (for each territory) 
// dhemerson.costa@ipam.org.br

// an adaptation from:
// calculate area of @author João Siqueira

// collection
var collection = ee.Image('projects/mapbiomas-workspace/public/collection7_1/mapbiomas_collection71_integration_v1');

// fire regime changes
var fire_change = ee.Image('projects/mapbiomas-workspace/DEGRADACAO/FOGO/fire_regime_changes_v2');

// define bands to be computed
var bands = ['fire_regime_changes'];

// native classes in which statistics will be processed
var classes = [3, 4, 11, 12];

// get biomes territory
var territory = ee.Image('projects/mapbiomas-workspace/AUXILIAR/biomas-2019-raster');
Map.addLayer(territory.randomVisualizer());

// change the scale if you need.
var scale = 30;

// define a Google Drive output folder 
var driverFolder = 'AREA-EXPORT-DEGRADATION-BIOMES';
                
// Image area in hectares
var pixelArea = ee.Image.pixelArea().divide(10000);
  
// create recipe to bind data
var recipe = ee.FeatureCollection([]);

// for each class
classes.forEach(function(class_i) {
  // get the classification for the class [i]
  var asset_i = fire_change.updateMask(collection.select('classification_2021').eq(class_i));
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
                        .set('ecoregion', territory)
                        .set('class', class_i)
                        .set('fire_change_index', classId)
                        .set('area', area)
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
        
        // apply function
        areas = ee.FeatureCollection(areas).flatten();
        // store
        recipe = recipe.merge(areas);
});

// store
Export.table.toDrive({
      collection: recipe,
      description: 'fire_regime_changes',
      folder: driverFolder,
      fileFormat: 'CSV'
});
