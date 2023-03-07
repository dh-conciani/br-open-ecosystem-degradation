// get time-series of degradation vectors and compute statistical summaries
// dhemerson.costa@ipam.org.br (ipam and mapbiomas brazil) 

// fire
var fire_freq = ee.Image('projects/mapbiomas-workspace/public/collection7/mapbiomas-fire-collection1-1-fire-frequency-1')
  .select(['fire_frequency_1985_2021']).divide(100).int();

// deforestation (from natural to anthropogenic)
var deforestation = ee.Image('projects/mapbiomas-workspace/public/collection7_1/mapbiomas_collection71_deforestation_frequency_v1')
  .select(['desmatamento_frequencia_1987_2020']).divide(100).int();


// lcluc change 


// climatic

Map.addLayer(fire_freq.randomVisualizer(), {}, 'fire_freq');
Map.addLayer(deforestation.randomVisualizer(), {}, 'deforestation freq');
