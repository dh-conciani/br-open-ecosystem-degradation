// get time-series of degradation vectors and compute statistical summaries
// dhemerson.costa@ipam.org.br (ipam and mapbiomas brazil) 

// fire
var fire = ee.Image('projects/mapbiomas-workspace/public/collection7/mapbiomas-fire-collection1-1-annual-burned-coverage-1');
var fire_freq = ee.Image('projects/mapbiomas-workspace/public/collection7/mapbiomas-fire-collection1-1-fire-frequency-1');
fire_freq = fire_freq.select(['fire_frequency_1985_2021']).divide(100).int();

Map.addLayer(fire_freq.randomVisualizer());

// lcluc change


// deforestation 


// climatic

