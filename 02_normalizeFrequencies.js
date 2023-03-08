// normalize disturbance frequencies by variable~biome
// dhemerson.costa@ipam.org.br

// insert metadata
var root = 'projects/mapbiomas-workspace/DEGRADACAO/DISTURBIOS/disturbance_frequency/brazil_disturbance_frequency_';
var input_version = 1;
var output_version = 2;

// read distubance database 
var disturbance = ee.Image(root + input_version);


Map.addLayer(disturbance.randomVisualizer())
