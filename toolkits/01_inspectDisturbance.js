// toolkit para inspecionar dados de disturbio para os biomas
// dhemerson.costa@ipam.org.br

// ler dados
var disturbance_interaction = ee.Image('projects/mapbiomas-workspace/DEGRADACAO/DISTURBIOS/disturbance_frequency/brazil_disturbance_frequency_agreement_2');

// carregar mosaico 2021
var landsat = ee.ImageCollection('projects/nexgenmap/MapBiomas2/LANDSAT/BRAZIL/mosaics-2')
    .filterMetadata('year', 'equals', 2021);
    //.filterMetadata('biome', 'equals', 'CERRADO');
    
// Plot Landsat
Map.addLayer(landsat, {
        bands: ['swir1_median', 'nir_median', 'red_median'],
        gain: [0.08, 0.07, 0.2],
        gamma: 0.85
    },
    'Landsat 2021', false);

Map.addLayer(disturbance_interaction, {
  palette: ['#C0C0C0', '#606060', '#20F0E2', '#FFEC33', '#EF9A2C', '#529CA8', '#00F318', 'red'], 
  min: 1, max: 8
  }, 'Disturbance');

// crair legenda
var legends = [
  ['No disturbance', 1, '#C0C0C0'],
  ['Fire',  2, '#606060'],
  ['Veg. loss', 3, '#20F0E2'],
  ['Anthropogenic use',   4, '#FFEC33'],
  ['Fire + Anthropogenic use',   5, '#EF9A2C'],
  ['Fire + Veg. loss', 6, '#529CA8'],
  ['Veg. loss + Anthropogenic use', 7, '#00F318'],
  ['Fire + Veg. loss + Anthropogenic use', 8, 'red']
];


var lines = legends.map(function(list){
  var line = ui.Panel({
    // widgets:,
    layout:ui.Panel.Layout.Flow('horizontal'),
    style:{margin:'0px'}
  });
  
  // simbolo // -> https://texticulos.com/simbolos-e-caracteres/caracteres-especiais/
  line.add(ui.Label('▉',{color:list[2],fontSize:'20px',margin:'4px 0px 0px 0px'}));
  
  // nome
  line.add(ui.Label('' + list[1] + ' - ' + list[0]),{margin:'0px'});
  
  return line;
  
});
  
legends = ui.Panel({
  widgets:lines,
  layout:ui.Panel.Layout.Flow('vertical'),
  style:{margin:'0px',position:'bottom-left'}
});

Map.add(legends);
