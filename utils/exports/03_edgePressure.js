// get edge pressure by class 
// dhemerson.costa@ipam.org.br -- gt degradação mapbiomas

// an adaptation from:
// calculate area of @author João Siqueira

// read edge area
var native_edge = ee.ImageCollection('projects/mapbiomas-workspace/DEGRADACAO/COLECAO/BETA/PROCESS/edge_area')
  .filterMetadata('version', 'equals', 1)
  .filterMetadata('distance', 'equals', 30)
  .min();

// read edge pressure
var edge_pressure = ee.ImageCollection('projects/mapbiomas-workspace/DEGRADACAO/COLECAO/BETA/PROCESS/edge_pressure')
  .filterMetadata('version', 'equals', 1)
  .filterMetadata('distance', 'equals', 30)
  .min();

// define bands to be computed
var bands = [1985, 1986, 1987, 1988, 1989, 1990, 1991, 1992, 1993, 1994, 1995,
             1996, 1997, 1998, 1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006,
             2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017,
             2018, 2019, 2020, 2021, 2022];

// native classes in which statistics will be processed
var classes = [3, 4, 5, 6, 11, 12];

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

// for each class [i]
classes.forEach(function(class_i) {

      // Geometry to export
      var geometry = native_edge.geometry();
      
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
                        .set('native_class', class_i)
                        .set('pressure_class', classId)
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
              
            // get the classification for the class [i]
            var edge_i = native_edge.select('edge_30m_' + band_i)
              // select only class i
              .updateMask(native_edge.select('edge_30m_' + band_i).eq(class_i));

            // compute a buffer arround the interest native class
            var buffer_i = edge_i.distance(ee.Kernel.euclidean(35, 'meters'), false);
            
            // get only for anthropogenic classes [ignore intersects with other native classes]
            buffer_i = buffer_i.updateMask(native_edge.select('edge_30m_' + band_i).unmask(99).eq(99));
                         
            // use it to get only anthropogenic classes that causes edge effect for each native class
            var anthropogenic_i = edge_pressure.select('pressure_30m_' + band_i).updateMask(buffer_i.select(0));

            // store to process
            var asset_i = anthropogenic_i; 
              
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
      description: 'edge_pressure',
      folder: driverFolder,
      fileFormat: 'CSV'
});
