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

////////////////////////////// crair legenda
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

///////////////////////////////// painel de classes mapbiomas 
// ler plaheta
var palette = require('users/mapbiomas/modules:Palettes.js').get('classification7');

var Chart = {

    options: {
        'title': 'Inspector',
        'legend': 'none',
        'chartArea': {
            left: 30,
            right: 2,
        },
        'titleTextStyle': {
            color: '#ffffff',
            fontSize: 10,
            bold: true,
            italic: false
        },
        'tooltip': {
            textStyle: {
                fontSize: 10,
            },
            // isHtml: true
        },
        'backgroundColor': '#21242E',
        'pointSize': 6,
        'crosshair': {
            trigger: 'both',
            orientation: 'vertical',
            focused: {
                color: '#dddddd'
            }
        },
        'hAxis': {
            // title: 'Date', //muda isso aqui
            slantedTextAngle: 90,
            slantedText: true,
            textStyle: {
                color: '#ffffff',
                fontSize: 8,
                fontName: 'Arial',
                bold: false,
                italic: false
            },
            titleTextStyle: {
                color: '#ffffff',
                fontSize: 10,
                fontName: 'Arial',
                bold: true,
                italic: false
            },
            viewWindow: {
                max: 37,
                min: 0
            },
            gridlines: {
                color: '#21242E',
                interval: 1
            },
            minorGridlines: {
                color: '#21242E'
            }
        },
        'vAxis': {
            title: 'Class', // muda isso aqui
            textStyle: {
                color: '#ffffff',
                fontSize: 10,
                bold: false,
                italic: false
            },
            titleTextStyle: {
                color: '#ffffff',
                fontSize: 10,
                bold: false,
                italic: false
            },
            viewWindow: {
                max: 50,
                min: 0
            },
            gridlines: {
                color: '#21242E',
                interval: 2
            },
            minorGridlines: {
                color: '#21242E'
            }
        },
        'lineWidth': 0,
        // 'width': '300px',
        // 'height': '200px',
        'margin': '0px 0px 0px 0px',
        'series': {
            0: { color: '#21242E' }
        },

    },

    assets: {
        image: ee.Image('projects/mapbiomas-workspace/public/collection7/mapbiomas_collection70_integration_v2'),
        fire: ee.Image('projects/mapbiomas-workspace/public/collection7/mapbiomas-fire-collection1-1-annual-burned-coverage-1')
    },

    data: {
        image: null,
        point: null
    },

    legend: {
       0: { 'color': palette[0], 'name': 'Ausência de dados' },
       1: { 'color': 'white', 'name': 'Fire'}, 
        3: { 'color': palette[3], 'name': 'Formação Florestal' },
        4: { 'color': palette[4], 'name': 'Formação Savânica' },
        5: { 'color': palette[5], 'name': 'Mangue' },
        49: { 'color': palette[49], 'name': 'Restinga Florestal' },
        11: { 'color': palette[11], 'name': 'Área Úmida Natural não Florestal' },
        12: { 'color': palette[12], 'name': 'Formação Campestre' },
        32: { 'color': palette[32], 'name': 'Apicum' },
        29: { 'color': palette[29], 'name': 'Afloramento Rochoso' },
        50: { 'color': palette[50], 'name': 'Restinga Herbácea/Arbustiva' },
        13: { 'color': palette[13], 'name': 'Outra Formação não Florestal' },
        18: { 'color': palette[18], 'name': 'Agricultura' },
        39: { 'color': palette[39], 'name': 'Soja' },
        20: { 'color': palette[20], 'name': 'Cana' },
        40: { 'color': palette[40], 'name': 'Arroz' },
        62: { 'color': palette[62], 'name': 'Algodão' },
        41: { 'color': palette[41], 'name': 'Outras Lavouras Temporárias' },
        46: { 'color': palette[46], 'name': 'Café' },
        47: { 'color': palette[47], 'name': 'Citrus' },
        48: { 'color': palette[48], 'name': 'Outras Lavaouras Perenes' },
        9: { 'color': palette[9], 'name': 'Silvicultura' },
        15: { 'color': palette[15], 'name': 'Pastagem' },
        21: { 'color': palette[21], 'name': 'Mosaico de Usos, Áreas abandonadas' },
        22: { 'color': palette[22], 'name': 'Área não Vegetada' },
        23: { 'color': palette[23], 'name': 'Praia e Duna' },
        24: { 'color': palette[24], 'name': 'Infraestrutura Urbana' },
        30: { 'color': palette[30], 'name': 'Mineração' },
        25: { 'color': palette[25], 'name': 'Outra Área não Vegetada' },
        33: { 'color': palette[33], 'name': 'Rio, Lago e Oceano' },
        31: { 'color': palette[31], 'name': 'Aquicultura' },
    },

    loadData: function () {
        Chart.data.image = ee.ImageCollection(Chart.assets.image).min();
    },

    init: function () {
        Chart.loadData();
        Chart.ui.init();
    },

    getSamplePoint: function (image, points) {

        var sample = image.sampleRegions({
            'collection': points,
            'scale': 30,
            'geometries': true
        });

        return sample;
    },

    ui: {

        init: function () {

            Chart.ui.form.init();
            Chart.ui.activateMapOnClick();

        },

        activateMapOnClick: function () {

            Map.onClick(
                function (coords) {
                    var point = ee.Geometry.Point(coords.lon, coords.lat);

                    var bandNames = Chart.data.image.bandNames();

                    var newBandNames = bandNames.map(
                        function (bandName) {
                            var name = ee.String(ee.List(ee.String(bandName).split('_')).get(1));

                            return name;
                        }
                    );

                    var image = Chart.data.image.select(bandNames, newBandNames);

                    Chart.ui.inspect(image, point);
                }
            );
        },

        refreshGraph: function (sample) {

            sample.evaluate(
                function (featureCollection) {

                    if (featureCollection !== null) {
                        // print(featureCollection.features);

                        var pixels = featureCollection.features.map(
                            function (features) {
                                return features.properties;
                            }
                        );

                        var bands = Object.getOwnPropertyNames(pixels[0]);

                        // Add class value
                        var dataTable = bands.map(
                            function (band) {
                                var value = pixels.map(
                                    function (pixel) {
                                        return pixel[band];
                                    }
                                );

                                return [band].concat(value);
                            }
                        );

                        // Add point style and tooltip
                        dataTable = dataTable.map(
                            function (point) {
                                var color = Chart.legend[point[1]].color;
                                var name = Chart.legend[point[1]].name;
                                var value = String(point[1]);

                                var style = 'point {size: 4; fill-color: ' + color + '}';
                                var tooltip = 'year: ' + point[0] + ', class: [' + value + '] ' + name;

                                return point.concat(style).concat(tooltip);
                            }
                        );

                        var headers = [
                            'serie',
                            'id',
                            { 'type': 'string', 'role': 'style' },
                            { 'type': 'string', 'role': 'tooltip' }
                        ];

                        dataTable = [headers].concat(dataTable);

                        Chart.ui.form.chartInspector.setDataTable(dataTable);

                    }
                }
            );
        },

        refreshMap: function () {

            var pointLayer = Map.layers().filter(
                function (layer) {
                    return layer.get('name') === 'Point';
                }
            );

            if (pointLayer.length > 0) {
                Map.remove(pointLayer[0]);
                Map.addLayer(Chart.data.point, {}, 'Point');
            } else {
                Map.addLayer(Chart.data.point, {}, 'Point');
            }

        },

        inspect: function (image, point) {

            // aqui pode fazer outras coisas além de atualizar o gráfico
            Chart.data.point = Chart.getSamplePoint(image, ee.FeatureCollection(point));

            Chart.ui.refreshMap(Chart.data.point);
            Chart.ui.refreshGraph(Chart.data.point);

        },

        form: {

            init: function () {

                Chart.ui.form.panelChart.add(Chart.ui.form.chartInspector);
                Chart.ui.form.chartInspector.setOptions(Chart.options);

                Chart.ui.form.chartInspector.onClick(
                    function (xValue, yValue, seriesName) {
                        print(xValue, yValue, seriesName);
                    }
                );

                Map.add(Chart.ui.form.panelChart);
            },

            panelChart: ui.Panel({
                'layout': ui.Panel.Layout.flow('vertical'),
                'style': {
                    'width': '450px',
                    // 'height': '200px',
                    'position': 'bottom-right',
                    'margin': '0px 0px 0px 0px',
                    'padding': '0px',
                    'backgroundColor': '#21242E'
                },
            }),

            chartInspector: ui.Chart([
                ['Serie', ''],
                ['', -1000], // número menor que oin mínimo para não aparecer no gráfico na inicialização
            ])
        }
    }
};

Chart.init();

//////////////////////////////////////
// adicionar dado de area queimada
var fire = ee.Image('projects/mapbiomas-workspace/public/collection7/mapbiomas-fire-collection1-1-annual-burned-coverage-1');

// years to be processed
var years = [1985, 1986, 1987, 1988, 1989, 1990, 1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998,
             1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012,
             2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021];

// binarize
var fire_bin = ee.Image(years.map(function(year_i) {
  return fire.select('burned_coverage_' + year_i)
             .remap({
               from: [1],
               to: [1],
               defaultValue: 1
             })
             .rename('classification_' + year_i);
}));

print(fire_bin);


var Chart = {

    options: {
        'title': 'Fire Inspector',
        'legend': 'none',
        'chartArea': {
            left: 30,
            right: 2,
        },
        'titleTextStyle': {
            color: '#ffffff',
            fontSize: 10,
            bold: true,
            italic: false
        },
        'tooltip': {
            textStyle: {
                fontSize: 10,
            },
            // isHtml: true
        },
        'backgroundColor': '#21242E',
        'pointSize': 6,
        'crosshair': {
            trigger: 'both',
            orientation: 'vertical',
            focused: {
                color: '#dddddd'
            }
        },
        'hAxis': {
            // title: 'Date', //muda isso aqui
            slantedTextAngle: 90,
            slantedText: true,
            textStyle: {
                color: '#ffffff',
                fontSize: 8,
                fontName: 'Arial',
                bold: false,
                italic: false
            },
            titleTextStyle: {
                color: '#ffffff',
                fontSize: 10,
                fontName: 'Arial',
                bold: true,
                italic: false
            },
            viewWindow: {
                max: 37,
                min: 0
            },
            gridlines: {
                color: '#21242E',
                interval: 1
            },
            minorGridlines: {
                color: '#21242E'
            }
        },
        'vAxis': {
            title: 'Class', // muda isso aqui
            textStyle: {
                color: '#ffffff',
                fontSize: 10,
                bold: false,
                italic: false
            },
            titleTextStyle: {
                color: '#ffffff',
                fontSize: 10,
                bold: false,
                italic: false
            },
            viewWindow: {
                max: 1,
                min: 0
            },
            gridlines: {
                color: '#21242E',
                interval: 2
            },
            minorGridlines: {
                color: '#21242E'
            }
        },
        'lineWidth': 0,
        // 'width': '300px',
        // 'height': '200px',
        'margin': '0px 0px 0px 0px',
        'series': {
            0: { color: '#21242E' }
        },

    },

    assets: {
        image: fire_bin,
    },

    data: {
        image: null,
        point: null
    },

    legend: {
      1: { 'color': 'white', 'name': 'Fire'}
    },

    loadData: function () {
        Chart.data.image = ee.ImageCollection(Chart.assets.image).min();
    },

    init: function () {
        Chart.loadData();
        Chart.ui.init();
    },

    getSamplePoint: function (image, points) {

        var sample = image.sampleRegions({
            'collection': points,
            'scale': 30,
            'geometries': true
        });

        return sample;
    },

    ui: {

        init: function () {

            Chart.ui.form.init();
            Chart.ui.activateMapOnClick();

        },

        activateMapOnClick: function () {

            Map.onClick(
                function (coords) {
                    var point = ee.Geometry.Point(coords.lon, coords.lat);

                    var bandNames = Chart.data.image.bandNames();

                    var newBandNames = bandNames.map(
                        function (bandName) {
                            var name = ee.String(ee.List(ee.String(bandName).split('_')).get(1));

                            return name;
                        }
                    );

                    var image = Chart.data.image.select(bandNames, newBandNames);

                    Chart.ui.inspect(image, point);
                }
            );
        },

        refreshGraph: function (sample) {

            sample.evaluate(
                function (featureCollection) {

                    if (featureCollection !== null) {
                        // print(featureCollection.features);

                        var pixels = featureCollection.features.map(
                            function (features) {
                                return features.properties;
                            }
                        );

                        var bands = Object.getOwnPropertyNames(pixels[0]);

                        // Add class value
                        var dataTable = bands.map(
                            function (band) {
                                var value = pixels.map(
                                    function (pixel) {
                                        return pixel[band];
                                    }
                                );

                                return [band].concat(value);
                            }
                        );

                        // Add point style and tooltip
                        dataTable = dataTable.map(
                            function (point) {
                                var color = Chart.legend[point[1]].color;
                                var name = Chart.legend[point[1]].name;
                                var value = String(point[1]);

                                var style = 'point {size: 4; fill-color: ' + color + '}';
                                var tooltip = 'year: ' + point[0] + ', class: [' + value + '] ' + name;

                                return point.concat(style).concat(tooltip);
                            }
                        );

                        var headers = [
                            'serie',
                            'id',
                            { 'type': 'string', 'role': 'style' },
                            { 'type': 'string', 'role': 'tooltip' }
                        ];

                        dataTable = [headers].concat(dataTable);

                        Chart.ui.form.chartInspector.setDataTable(dataTable);

                    }
                }
            );
        },

        refreshMap: function () {

            var pointLayer = Map.layers().filter(
                function (layer) {
                    return layer.get('name') === 'Point';
                }
            );

            if (pointLayer.length > 0) {
                Map.remove(pointLayer[0]);
                Map.addLayer(Chart.data.point, {}, 'Point');
            } else {
                Map.addLayer(Chart.data.point, {}, 'Point');
            }

        },

        inspect: function (image, point) {

            // aqui pode fazer outras coisas além de atualizar o gráfico
            Chart.data.point = Chart.getSamplePoint(image, ee.FeatureCollection(point));

            Chart.ui.refreshMap(Chart.data.point);
            Chart.ui.refreshGraph(Chart.data.point);

        },

        form: {

            init: function () {

                Chart.ui.form.panelChart.add(Chart.ui.form.chartInspector);
                Chart.ui.form.chartInspector.setOptions(Chart.options);

                Chart.ui.form.chartInspector.onClick(
                    function (xValue, yValue, seriesName) {
                        print(xValue, yValue, seriesName);
                    }
                );

                Map.add(Chart.ui.form.panelChart);
            },

            panelChart: ui.Panel({
                'layout': ui.Panel.Layout.flow('vertical'),
                'style': {
                    'width': '450px',
                    // 'height': '200px',
                    'position': 'bottom-right',
                    'margin': '0px 0px 0px 0px',
                    'padding': '0px',
                    'backgroundColor': '#21242E'
                },
            }),

            chartInspector: ui.Chart([
                ['Serie', ''],
                ['', -1000], // número menor que oin mínimo para não aparecer no gráfico na inicialização
            ])
        }
    }
};

Chart.init();

