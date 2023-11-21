// get fire frequency with native coverage (runs in native level)
// by: IPAM, wallace.silva@ipam.org.br
// any issue and/or bug, please report to dhemerson.costa@ipam.org.br and mrosa@arcplan.com.br


// --- --- --- DATASETS
// read coverage by mapbiomas collection 8 
var coverage = ee.Image('projects/mapbiomas-workspace/public/collection8/mapbiomas_collection80_integration_v1');
// --- --- FIRE FREQUENCY
// read frequency fire by mapbiomas fogo collection 2.1
var frequency = ee.Image('projects/mapbiomas-workspace/FOGO_COL2/SUBPRODUTOS/mapbiomas-fire-collection2-fire-frequency-coverage-v2');
  // .aside(print)

// get geometry for export params
var region = coverage.geometry();


// --- --- --- PROCESS
// formated image for frequency information
var fire_frequency = frequency
  .divide(100)
  .int16()
  .slice(0,38);
  // .aside(print);

// --- --- NATIVE COVERAGE
// set classes to be computed native coverage
// 3 (forest), 4 (savanna), 5 (mangrove), 6 (flooded forest), 11 (wetland), 12 (grassland)
var native_classes = [3, 4, 5, 6, 11, 12, 49, 50];

// set native coverage image
var native_coverage = ee.Image(
  ee.List(native_classes).iterate(function(current,previous){
      var i = ee.Number(current);

      var before = ee.Image(previous)
        .where(coverage.eq(i),i);

      return before;
    }, 
    coverage.multiply(0)
  )
).selfMask();

// --- --- CROSSING
var fire_frequency_native_coverege = fire_frequency
  .multiply(100)
  .unmask(0)
  .add(native_coverage);

var oldBands = fire_frequency_native_coverege.bandNames();
var newBands = oldBands.iterate(function(current,previous){
  return ee.List(previous)
    .add(ee.String('frequency_').cat(ee.String(current).slice(-4)));
},[]);

fire_frequency_native_coverege = fire_frequency_native_coverege
  .select(oldBands,newBands);

print('fire_frequency_native_coverege',fire_frequency_native_coverege);

// --- --- --- PLOT
var visParams = {
  coverage:{
    min:0,
    max:62,
    palette:[],
    bands:['classification_2022']
  },
  frequency:{
    min:0,
    max:3800,
    palette:[],
    bands:['frequency_2022']
  },
  frequency_2:{
    min:0,
    max:38,
    palette:[],
    bands:['fire_frequency_1985_2022']
  }
};

Map.addLayer(region,{},'region',false);
Map.addLayer(coverage,visParams.coverage,'coverage');
Map.addLayer(native_coverage,visParams.coverage,'native_coverage');

Map.addLayer(fire_frequency_native_coverege,visParams.frequency,'fire_frequency_native_coverege');
Map.addLayer(fire_frequency,visParams.frequency_2,'fire_frequency');

// --- --- --- EXPORT

// Set properties in metadata image
var properties = {
  'version':1,
  'product':'frequency'
};
// set export image
var recipe = fire_frequency_native_coverege.set(properties);
var description = 'frequency_v'+properties.version;
var assetId = 'projects/mapbiomas-workspace/DEGRADACAO/COLECAO/BETA/PROCESS/fire/' + description;

print(ui.Label('Exporting image:'),recipe,ui.Label(' for address:'+assetId));

// export
 Export.image.toAsset({
	image: recipe,
  description:'W-GT_Degradacao-'+description,
  assetId: assetId,
  region: region,
  pyramidingPolicy:'mode',
  scale: 30,
  maxPixels: 1e13,
});

