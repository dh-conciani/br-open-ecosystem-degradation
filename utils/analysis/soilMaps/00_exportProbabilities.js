var lstGra =  [
    4119, 4120, 4121, 4122, 4123, 4124, 4125, 4126, 4127, 4128, 4129, 4130, 
    4131, 4132, 4133, 4134, 4135, 4136, 4435, 4436, 4437, 4438, 4439, 4440, 
    4441, 4442, 4443, 4444, 4445, 4446, 4447, 4448, 4449, 4450, 4451, 4452, 
    4223, 4224, 4225, 4226, 4227, 4228, 4229, 4230, 4231, 4232, 4233, 4234, 
    4235, 4236, 4237, 4238, 4239, 4240, 4241, 4013, 4014, 4015, 4016, 4017, 
    4018, 4019, 4020, 4021, 4022, 4023, 4024, 4025, 4026, 4027, 4028, 4029, 
    4030, 4331, 4332, 4333, 4334, 4335, 4336, 4337, 4338, 4339, 4340, 4341, 
    4342, 4343, 4344, 4345, 4346, 4347, 4864, 4865, 4866, 4867, 4868, 4869,
    ]
var assetMapbiomas = 'projects/mapbiomas-public/assets/brazil/lulc/collection9/mapbiomas_collection90_integration_v1';
var asset_grid_Br = 'projects/nexgenmap/SAD_MapBiomas/DL/SHP_grades_BR_35pathces_AllBrV3';
var classmappingV4 = 'projects/nexgenmap/MapBiomas2/LANDSAT/DEGRADACAO/LAYER_SOILV4';
var asset_biomas =  'projects/mapbiomas-workspace/AUXILIAR/biomas-2019';

// var shp_biomas = ee.FeatureCollection(asset_biomas)
// print("shp biomas ", hp_biomas);
var gridBiomas = ee.FeatureCollection(asset_grid_Br).filter(ee.Filter.inList('indice', lstGra ))
print(gridBiomas.limit(4))
var bandaAct = 'classification_2021';
Map.addLayer(gridBiomas, {color: 'green'}, 'grid');

var layerSoil =  ee.ImageCollection(classmappingV4)
                        .filter(ee.Filter.eq('biome', 'CERRADO'))
                        .filter(ee.Filter.eq('year', 2021))
print(layerSoil.limit(3))
print("número de mapas ", layerSoil.size())
layerSoil = layerSoil.mosaic()
var layerSoilYY = layerSoil.select(bandaAct).rename('class_soil');
print(layerSoil)
var mapbiomas = ee.Image(assetMapbiomas).select(bandaAct);
var maskMinera = mapbiomas.neq(30);
var maskUrbano = mapbiomas.neq(24);
var maskAgua = mapbiomas.neq(33);
var maskExclusao = maskMinera.multiply(maskUrbano).multiply(maskAgua);

var layerSoilMap = mapbiomas.eq(25).selfMask().rename('class_ANV');

layerSoilYY = layerSoilYY.updateMask(maskExclusao);
Map.addLayer(layerSoilYY.gt(0), {max: 1, palette: 'red'}, 'soil');

// layerSoilYY = layerSoilYY.addBands(layerSoilMap.selfMask());

var lstId = [4119, 4120, 4121, 4122];
lstId.forEach(function(idGrid){
    var gradetmp = gridBiomas.filter(ee.Filter.eq('indice', idGrid)).geometry()
    var soiltmp = layerSoilYY.clip(gradetmp);
    print(soiltmp)
    // ee.Reducer.fixedHistogram(min, max, steps, cumulative)
    var dictRed = soiltmp.select(['class_soil']).reduceRegion({
                            reducer: ee.Reducer.fixedHistogram({min: 0, max: 1, steps: 50, cumulative: true}),
                            geometry: gradetmp,
                            scale: 30,
                            maxPixels: 1e9
                        });
                        
    print(idGrid, dictRed.get('class_soil'));
    // , 'class_ANV'layerSoilMap.clip(gradetmp)
    var dictCount = soiltmp.select(['class_soil']).updateMask(layerSoilMap.clip(gradetmp)).reduceRegion({
                            reducer: ee.Reducer.fixedHistogram({min: 0, max: 1, steps: 50, cumulative: true}),
                            geometry: gradetmp,
                            scale: 30,
                            maxPixels: 1e9
                        });
    print(idGrid, dictCount.get('class_soil'));
})
