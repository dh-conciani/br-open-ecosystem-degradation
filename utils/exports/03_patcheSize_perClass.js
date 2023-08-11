// get age of structural change by class, type and direction (for each territory) 
// dhemerson.costa@ipam.org.br

// an adaptation from:
// calculate area of @author João Siqueira

// structural change
var native_edge = ee.Image('projects/mapbiomas-workspace/DEGRADACAO/FRAGMENTATION/FRAGMENTATION_V2');

// define bands to be computed
var bands = ['size_area'];

// native classes in which statistics will be processed
var classes = [3, 4, 11, 12];

// Load the base ecoregions for Cerrado
var ecoregions = ee.FeatureCollection('users/geomapeamentoipam/AUXILIAR/territorios/ecoregions_cerrado');
var ecoregions_img = ee.Image().paint(ecoregions, 'region');

// Multiply ecoregions by 100 to create a territory layer
var territory = ecoregions_img.multiply(100);
Map.addLayer(territory.randomVisualizer());

// change the scale if you need.
var scale = 30;

// define a Google Drive output folder 
var driverFolder = 'AREA-EXPORT-DEGRADATION';
                
// Image area in hectares
var pixelArea = ee.Image.pixelArea().divide(10000);
  
// create recipe to bind data
var recipe = ee.FeatureCollection([]);

// for each class [i]
classes.forEach(function(class_i) {
  // get the classification for the class [i]
  var asset_i = native_edge.updateMask(native_edge.select('size_class').eq(class_i));
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
                        .set('distance', classId)
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
      description: 'native_patche_size_per_class_cerrado',
      folder: driverFolder,
      fileFormat: 'CSV'
});
