// export edge area per biome 
// dhemerson.costa@ipam.org.br -- mapbiomas gt degradação 

// an adaptation from:
// calculate area of @author João Siqueira

// set input image collection
var native_edge = ee.ImageCollection('projects/mapbiomas-workspace/DEGRADACAO/COLECAO/BETA/PROCESS/edge_area');

// set version
var version = 2;

// define years to be computed
var bands = [1985, 1986, 1987, 1988, 1989, 1990, 1991, 1992, 1993, 1994, 1995,
             1996, 1997, 1998, 1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006,
             2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017,
             2018, 2019, 2020, 2021, 2022];

// define distances
var distances = [30, 60, 90, 120, 150, 300, 600, 1000];

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

// get stats
distances.forEach(function(distance_i) {
  
  // filter image
  var image_i = native_edge
    .filterMetadata('version', 'equals', version)
    .filterMetadata('distance', 'equals', distance_i)
    .min();

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
                    .set('class', classId)
                    .set('distance', distance_i)
                    .set('area', area);
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
            var image = image_i.select('edge_' + distance_i + 'm_' + band_i);
              
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

// export 
Export.table.toDrive({
      collection: recipe,
      description: 'edge_area',
      folder: driverFolder,
      fileFormat: 'CSV'
});
