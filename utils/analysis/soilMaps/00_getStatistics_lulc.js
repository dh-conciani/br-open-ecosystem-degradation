// get area by territory 
// dhemerson.costa@ipam.org.br

// -- * 

// define the years to bem computed 
var years = ee.List.sequence({'start': 1985, 'end': 2021, 'step':1}).getInfo()
// *-- 
// set probability
var prob = 0.95

// -- *
// compute areas in hectares
var pixelArea = ee.Image.pixelArea().divide(10000);

// change scale if you need (in meters)
var scale = 30;

// * --
// define a Google Drive output folder 
var driverFolder = 'soilMaps_v4';
// * -- 

// -- *
// read biomes
var biomes = ee.Image('projects/mapbiomas-workspace/AUXILIAR/biomas-2019-raster');

var territory =  ee.Image('projects/mapbiomas-workspace/AUXILIAR/estados-2016-raster')
  .updateMask(biomes.eq(4))
  .rename('territory');
  
Map.addLayer(territory.randomVisualizer());

// get geometry bounds
var geometry = territory.geometry();
  
  // convert a complex object to a simple feinature collection 
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
                  .set('state_id', territory)
                  .set('class_id', classId)
                  .set('area', area)
                  .set('limiar', String(prob*100));
                  
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
        
        // get lcluc
        var lcluc = ee.Image('projects/mapbiomas-public/assets/brazil/lulc/collection9/mapbiomas_collection90_integration_v1')
          .select('classification_' + year);
  
        // get soil maps
        var soil = ee.ImageCollection('projects/nexgenmap/MapBiomas2/LANDSAT/DEGRADACAO/LAYER_SOILV4')
          .filterMetadata('biome', 'equals', 'CERRADO')
          .filterMetadata('version', 'equals', '4')
          .filterMetadata('year', 'equals', year)
          .map(function(image) {
            return image.rename('classification_' + year)
          })
          .mosaic()
          .gte(prob)
          .rename('soil_' + year)
          .selfMask()

        
        // get agrement
        var image = lcluc.updateMask(soil.eq(1)).updateMask(biomes.eq(4));
        //Map.addLayer(image.randomVisualizer(), {}, String(year), false)
        
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
  
  // store
  areas = ee.FeatureCollection(areas).flatten();
  
// export data
Export.table.toDrive({
      collection: areas,
      description: 'lulc_soilMaps_v4_' + String(prob*100),
      folder: driverFolder,
      fileFormat: 'CSV'
});
