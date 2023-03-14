// get area by territory 
// dhemerson.costa@ipam.org.br

// an adaptation from:
// calculate area of @author João Siqueira

// set image to be computed
var image = ee.Image('projects/mapbiomas-workspace/DEGRADACAO/DISTURBIOS/disturbance_frequency/ecosystem_changes_2');

// disturbance frequency data
var disturbance = ee.Image('projects/mapbiomas-workspace/DEGRADACAO/DISTURBIOS/disturbance_frequency/brazil_disturbance_frequency_agreement_2');

// mapbiomas data (last year)
var mapbiomas = ee.Image('projects/mapbiomas-workspace/public/collection7/mapbiomas_collection70_integration_v2')
                  .select(['classification_2021']);
                  
// native classes in which statistics will be processed
var classes = [3, 4, 5, 11, 12, 13, 32, 49, 50];

// disturbance classes to be assessed
var disturbances = [1, 2, 3, 4, 5, 6, 7, 8];

// define classification regions 
var territory = ee.Image('projects/mapbiomas-workspace/AUXILIAR/biomas-2019-raster')
        .rename('territory');

// plot regions
Map.addLayer(territory.randomVisualizer());

// change the scale if you need.
var scale = 30;

// define the years to bem computed 
var bands = ['number_of_classes', 'tree_cover_change'];

// define a Google Drive output folder 
var driverFolder = 'AREA-EXPORT-DEGRADATION';
                
// Image area in km2
var pixelArea = ee.Image.pixelArea().divide(10000);
  
// create recipe to bind data
var recipe = ee.FeatureCollection([]);

disturbances.forEach(function(disturbance_i) {
  
    classes.forEach(function(class_j) {
    
    // get the classification for the file[i] 
    var asset_ij = image.updateMask(mapbiomas.eq(class_j)).updateMask(disturbance.eq(disturbance_i));
    Map.addLayer(asset_ij.randomVisualizer(), {}, 'class ' + class_j + ' traj ', disturbance_i, false);
    
    // Geometry to export
    var geometry = asset_ij.geometry();
    
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
                    .set('disturbance_1985_2021', classId)
                    .set('area', area)
                    .set('class_id', class_j)
                    .set('disturbance_id', disturbance_i);
                    
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
            var image = asset_ij.select(band_i);
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
  
});

Export.table.toDrive({
        collection: recipe,
        description: 'ecosystem_changes_2',
        folder: driverFolder,
        fileFormat: 'CSV'
  });
