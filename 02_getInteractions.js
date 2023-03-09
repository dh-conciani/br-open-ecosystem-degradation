// combine disturbance products to compute interactions
// dhemerson.costa@ipam.org.br

// set version to export
var version = 2;
var output = 'projects/mapbiomas-workspace/DEGRADACAO/DISTURBIOS/disturbance_frequency';


// get only native vegetation in the last year (2021)
var mapbiomas_native =  ee.Image('projects/mapbiomas-workspace/public/collection7/mapbiomas_collection70_integration_v2')
    .select(['classification_2021']).remap({
      from: [3, 4, 5, 11, 12, 13, 32, 49, 50],
      to:   [3, 4, 5, 11, 12, 13, 32, 49, 50],
      defaultValue: 0})
    .rename('native_vegetation')
    .selfMask()
    .aside(Map.addLayer);


// read disturbance frequencies
var disturbance = ee.Image('projects/mapbiomas-workspace/DEGRADACAO/DISTURBIOS/disturbance_frequency/brazil_disturbance_frequency_2')
                    .updateMask(mapbiomas_native);

// isolate each one
var fire_freq = disturbance.select('fire_freq');
var deforestation_freq = disturbance.select('deforestation_freq');
var anthropogenic_freq = disturbance.select('anthropogenic_freq');

// compute the spatial correlation 
var combination = ee.Image(0).where(fire_freq.eq(0).and(deforestation_freq.eq(0).and(anthropogenic_freq.eq(0))), 1) // no disturbance
                             .where(fire_freq.gt(0).and(deforestation_freq.eq(0).and(anthropogenic_freq.eq(0))), 2) // single disturbance: only fire
                             .where(fire_freq.eq(0).and(deforestation_freq.gt(0).and(anthropogenic_freq.eq(0))), 3) // single disturbance: only deforestation
                             .where(fire_freq.eq(0).and(deforestation_freq.eq(0).and(anthropogenic_freq.gt(0))), 4) // single disturbance: only anthropogenic use 
                             .where(fire_freq.gt(0).and(deforestation_freq.eq(0).and(anthropogenic_freq.gt(0))), 5) // multiple disturbance: fire + anthropogenic use
                             .where(fire_freq.gt(0).and(deforestation_freq.gt(0).and(anthropogenic_freq.eq(0))), 6) // multiple disturbance: fire + deforestation
                             .where(fire_freq.eq(0).and(deforestation_freq.gt(0).and(anthropogenic_freq.gt(0))), 7) // multiple disturbance: anthropic + deforestation
                             .where(fire_freq.gt(0).and(deforestation_freq.gt(0).and(anthropogenic_freq.gt(0))), 8) // multiple disturbance: fire + deforestation + anthropic
                             .selfMask();

// plot
Map.addLayer(combination.randomVisualizer());

// add metadata
combination = combination.set('territory', 'BRAZIL')
                         .set('collection', 1)
                         .set('version', version)
                         .set('source', 'ipam')
                         .set('theme', 'degradation');
  
// export
Export.image.toAsset({
    "image": combination.toInt8(),
    "description": 'brazil_disturbance_frequency_agreement_' + version,
    "assetId": output + '/' + 'brazil_disturbance_frequency_agreement_' + version,
    "scale": 30,
    "pyramidingPolicy": {
        '.default': 'mode'
    },
    "maxPixels": 1e13,
    "region": disturbance.select(0).geometry()
});  
