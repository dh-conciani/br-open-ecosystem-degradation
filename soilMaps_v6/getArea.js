// export irrigation stats per municipality
// dhemerson.costa@ipam.org.br


var asset = 'projects/nexgenmap/MapBiomas2/LANDSAT/DEGRADACAO/LAYER_SOILV6';
var imgCol = ee.ImageCollection(asset).map(
                          function(img){
                              return img.gt(9800).copyProperties(img);
                      });
                      
print(imgCol.limit(3));
print(imgCol.size())

var lstYear=  [
        1985, 1986, 1987, 1988, 1989, 1990, 1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 
        1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 
        2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024
    ];
    
var collection = ee.Image('projects/mapbiomas-public/assets/brazil/lulc/collection10/mapbiomas_brazil_collection10_integration_v2');


var recipe = ee.Image([]);
lstYear.forEach(
    function(nyear){
        var mosaicY = imgCol.filter(ee.Filter.eq('year', nyear)).sum();
        // get collection
        var col_i = collection.select('classification_' + nyear);
        
        // combine
        mosaicY = mosaicY.multiply(100).add(col_i)
        
        //print(" >>> year " + String(nyear) ,  mosaicY);
        Map.addLayer(mosaicY, {min:1, max: 12, palette: ['green', 'yellow', 'red']}, 'class_' + String(nyear), false);
        recipe = recipe.addBands(mosaicY.rename('classification_' + nyear));
});


// read territories
var territory = ee.Image('projects/mapbiomas-workspace/AUXILIAR/biomas-2019-raster')
  .rename('territory');

// change the scale if you need.
var scale = 30;

// define the years to be computed 
var years = lstYear;

// define a Google Drive output folder 
var driverFolder = 'soilMapsV6';

// get the classification for the file[i] 
var asset_i = recipe;

// Image area in hectares
var pixelArea = ee.Image.pixelArea().divide(10000);

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
                .set('territory', territory)
                .set('class_id', classId)
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
            maxPixels: 1e13
        });
        
    territotiesData = ee.List(territotiesData.get('groups'));
    var areas = territotiesData.map(convert2table);
    areas = ee.FeatureCollection(areas).flatten();
    return areas;
};

// perform per year 
var areas = years.map(
    function (year) {
        var image = asset_i.select('classification_' + year);
        var areas = calculateArea(image, territory, geometry);
        // set additional properties
        areas = areas.map(
            function (feature) {
                return feature.set('year', year);
            }
        );
        return areas;
    }
);

areas = ee.FeatureCollection(areas).flatten();
  
Export.table.toDrive({
    collection: areas,
    description: 'degradation-soilMapsv6-frequency-by-class',
    folder: driverFolder,
    fileFormat: 'CSV'
});

