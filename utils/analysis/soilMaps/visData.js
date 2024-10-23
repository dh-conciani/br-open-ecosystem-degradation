// inspect map soil v4
// dhemerson.costa@ipam.org.br

// set year 
var year = 2021;

// read biomes
var biomes = ee.Image('projects/mapbiomas-workspace/AUXILIAR/biomas-2019-raster');


// read lulc
var mapbiomas = ee.Image('projects/mapbiomas-public/assets/brazil/lulc/collection9/mapbiomas_collection90_integration_v1')
  .select('classification_' + year);
  
// get soil maps
var soil = ee.ImageCollection('projects/nexgenmap/MapBiomas2/LANDSAT/DEGRADACAO/LAYER_SOILV4')
  .filterMetadata('biome', 'equals', 'CERRADO')
  .filterMetadata('version', 'equals', '4')
  .filterMetadata('year', 'equals', 2021)
  .mosaic()
  .gt(0)
  .rename('soil_' + year)
  .unmask(0);

// perform agreement
var agreement = ee.Image(0).where(mapbiomas.eq(25).and(soil.eq(1)), 1)
                           .where(mapbiomas.eq(25).and(soil.eq(0)), 2)
                           .where(mapbiomas.neq(25).and(soil.eq(1)), 3)
                           .selfMask()
                           .updateMask(biomes.eq(4));



Map.addLayer(agreement, {palette: ['white', 'red', 'blue'], min:1, max:3}, 'MapSoil')
