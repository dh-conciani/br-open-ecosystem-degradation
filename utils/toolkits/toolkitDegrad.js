

var mapbiomas = require('users/workspaceipam/packpages:toolkits/datasets/beta').get('MapBiomas Public Data');
var mosaico_mapbiomas = require('users/workspaceipam/packpages:toolkits/datasets/beta').get('Mosaico Mapbiomas');
// var fogo = require('users/geomapeamentoipam/MapBiomas__Fogo:00_Tools/Datasets.js').get('MapBiomas-Fogo');


// read collection
var collection = ee.Image('projects/mapbiomas-workspace/public/collection7_1/mapbiomas_collection71_integration_v1')
  .select('classification_2021');

// get mapbiomas pallete
// var vis = {
//           'min': 0,
//           'max': 62,
//           'palette': require('users/mapbiomas/modules:Palettes.js').get('classification7'),
//           'format': 'png'
//       };

// get state change

/////////////////////
// camadas para serem incorporadas ao toolkit
// gt degradação 

// mudança no regime de fogo
var fire_change = ee.Image('projects/mapbiomas-workspace/DEGRADACAO/FOGO/fire_regime_changes_v1');
print('fire regime change', fire_change);

// plot fire regime layer
// Map.addLayer(fire_change, {palette: ['blue', 'white', 'red'], min: -0.5, max: 0.5}, '[Fogo] Mudança na frequência');

// mudança estrutural
var structural_change = ee.Image('projects/mapbiomas-workspace/DEGRADACAO/TRAJECTORIES/COL71/STRUCTURAL_CHANGE_V4');
print('structural change', structural_change);

var structure_change= structural_change.select('structure_change');
var direction = structural_change.select('direction');
var age = structural_change.select('age');


/*
- FOGO
Mudança no regime do fogo
Frequencia de fogo (85-22)
- MUDANÇA ESTRUTURAL
Mudança na estrutura
Direção da mudança
Idade
- VEGETAÇÃO SECUNDÁRIA
Idade da vegetação secundaria (86-21)
//
- FRAGMENTAÇÃO
Efeito de borda
Tamanho do fragmento
- EXPOSIÇÃO DE SOLO
Frequência de solo exposto
*/

var personal_covariates = [
    {
        type:'IMAGE',
        supergroup:'MapBiomas Public Data',
        group:'Coleção 7.1',
        name: 'Uso e Cobertura',
        id:'projects/mapbiomas-workspace/public/collection7_1/mapbiomas_collection71_integration_v1',
        // info:'Módulo de dados produzidos pela Rede MapBiomas (https://mapbiomas.org/). Atualmente para a predição dos estoques de carbono são utilizados os dados da Coleção 7 - publicada em agosto de 2022, com 27 classes de legenda cobrindo o período de 1985 - 2021.',
        bandName:'classification',
        years:[1985,1986,1987,1988,1989,1990,1991,1992,1993,1994,1995,1996,1997,1998,1999,2000,2001,2002,2003,2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021],
        require:function(id){return ee.Image(id);
        },
        legend:[
            // {value:1, label:"Floresta"},
            {value:3, label:"Formação Florestal"}, 
            {value:4, label:"Formação Savânica"}, 
            {value:5, label:"Mangue"}, 
            {value:49, label:"Restinga Arborizada"}, 
            // {value:10, label:"Formação Natural não Florestal"},
            {value:11, label:"Campo Alagado e Área Pantanosa"}, 
            {value:12, label:"Formação Campestre"}, 
            {value:32, label:"Apicum"}, 
            {value:29, label:"Afloramento Rochoso"}, 
            {value:50, label:"Restinga Herbácea"}, 
            {value:13, label:"Outras Formações não Florestais"}, 
            // {value:14, label:"Agropecuária"}, 
            {value:15, label:"Pastagem"}, 
            // {value:18, label:"Agricultura"}, 
            // {value:19, label:"Lavoura Temporária"}, 
            {value:39, label:"Soja"}, 
            {value:20, label:"Cana"}, 
            {value:40, label:"Arroz (beta)"}, 
            {value:62, label:"Algodão (beta)"}, 
            {value:41, label:"Outras Lavouras Temporárias"},
            // {value:36, label:"Lavoura Perene"}, 
            {value:46, label:"Café"},
            {value:47, label:"Citrus"}, 
            {value:48, label:"Outras Lavouras Perenes"}, 
            {value:9, label:"Silvicultura"},
            {value:21, label:"Mosaico de Usos"}, 
            // {value:22, label:"Área não Vegetada"}, 
            {value:23, label:"Praia, Duna e Areal"}, 
            {value:24, label:"Área Urbanizada"}, 
            {value:30, label:"Mineração"}, 
            {value:25, label:"Outras Áreas não Vegetadas"}, 
            // {value:26, label:"Corpo D'água"}, 
            {value:33, label:"Rio, Lago e Oceano"}, 
            {value:31, label:"Aquicultura"}, 
            {value:27, label:"Não observado"}, 
          ],
        visParams:{
          palette:require('users/mapbiomas/modules:Palettes.js').get('classification7'),
          min:0,
          max:62
      },
    },
   {
      'type':'IMAGE',
      'id':'projects/mapbiomas-workspace/public/collection7_1/mapbiomas-fire-collection2-monthly-burned-coverage-1',
      'name':'Col.2  Área queimada anual',

      require:function(id){
        return ee.Image(id)
        .gte(1);
      },

      'supergroup':'MapBiomas Public Data',
      'group':'Coleção 7.1',

      'bandName':'burned_coverage',
      years:[1985,1986,1987,1988,1989,1990,1991,1992,1993,1994,1995,1996,1997,1998,1999,2000,2001,2002,2003,2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022],
      
      'visParams':{
          'min':0,
          'max':1,
          'palette': ['ffffff','800000'],
        },
      simbol:'🔥',

    },

   {
      'type':'IMAGE',
      'name':'Mudança no regime de fogo',

      'supergroup':'GT Degradação',
      'group':'FOGO',
      
      'bandName':'fire_regime_changes',
      
      'visParams':{palette: [
        '0000ff',
        'ffffff', 
        'ff0000'
      ], min: -0.5, max: 0.5},
      require:function(){return ee.Image('projects/mapbiomas-workspace/DEGRADACAO/FOGO/fire_regime_changes_v1').multiply(-1);
      },
   },
   {
      'type':'IMAGE',
      'name':'Frequência do fogo (85-22)',

      'supergroup':'GT Degradação',
      'group':'FOGO',
      
      'bandName':'fire_frequency_1985_2022',
      
      'visParams':{palette: [
        'FFFFFF','F8D71F','DAA118','BD6C12','9F360B','810004','4D0709'
      ], min: 0, max: 37},
      require:function(){return ee.Image('projects/mapbiomas-workspace/public/collection7_1/mapbiomas-fire-collection2-fire-frequency-1')
        .divide(100).int16().select('fire_frequency_1985_2022');
      },
   },
   {
      'type':'IMAGE',
      'name':'Mudança na estrutura',

      'supergroup':'GT Degradação',
      'group':'MUDANÇA NA ESTRUTURA DA VEG. NATIVA',
      
      'bandName':'structure_change',
      
      'visParams':{palette:[
          '#FFFF00', '#FF00E0'
        ], min:0, max:1},
      require:function(){return ee.Image('projects/mapbiomas-workspace/DEGRADACAO/TRAJECTORIES/COL71/STRUCTURAL_CHANGE_V4')
        .select('structure_change')
        .remap([4,5],[0,1])
        .rename('structure_change');},
      legend:[
          // {value:0, label:'Não observado'},
          {value:0,label:'Mudança temporária'},
          {value:1,label:'Mudança persistente'},
      ]
   },

   {
      'type':'IMAGE',
      'name':'Direção da Mudança',

      'supergroup':'GT Degradação',
      'group':'MUDANÇA NA ESTRUTURA DA VEG. NATIVA',
      
      'bandName':'direction',
      'visParams':{palette: ['#FC0000', '#66EA05'], min:0, max:1},

      require:function(){return ee.Image('projects/mapbiomas-workspace/DEGRADACAO/TRAJECTORIES/COL71/STRUCTURAL_CHANGE_V4')
        .select('direction')
        .remap([3,4],[0,1])
        .rename('direction');},
      legend:[
          // {value:0, label:'Não observado'},
          {value:0,label:'Raleamento'},
          {value:1,label:'Adensamento'},
      ]
   },
   {
      'type':'IMAGE',
      'name':'Idade',

      'supergroup':'GT Degradação',
      'group':'MUDANÇA NA ESTRUTURA DA VEG. NATIVA',
      
      'bandName':'age',
      
      'visParams':{
        palette: ['800000','9b2226','ae2012','bb3e03','ca6702','ee9b00','94d2bd','005f73','0a9396','0000ff','000080','001219'], 
        min:1,
        max:30
      },

      require:function(){return ee.Image('projects/mapbiomas-workspace/DEGRADACAO/TRAJECTORIES/COL71/STRUCTURAL_CHANGE_V4')
        .select('age');},
   },

   {
      'type':'IMAGE',
      'name':'Idade da veg. secundaria (86-21)',

      'supergroup':'GT Degradação',
      'group':'VEGETAÇÃO SECUNDARIA',
      
      'bandName':'secondary_vegetation_age_2021',
      
      'visParams':{
        palette: [
          '#ffffe5','#f7fcb9','#d9f0a3','#addd8e','#78c679','#41ab5d','#238443','#006837','#004529'
        ], 
        min:1,
        max:35
      },

      require:function(){return ee.Image('projects/mapbiomas-workspace/public/collection7_1/mapbiomas_collection71_secondary_vegetation_age_v1')
        .select('secondary_vegetation_age_2021')
        .selfMask();},
   },

//
/*
{
      'type':'IMAGE',
      'name':'Frequência de solo exposto (85-21)',

      'supergroup':'GT Degradação',
      'group':'EXPOSIÇÃO DE SOLO',
      
      'bandName':'classification',
      
      'visParams':{
        palette: ['800000','9b2226','ae2012','bb3e03','ca6702','ee9b00','94d2bd','005f73','0a9396','0000ff','000080','001219'], 
        min:1,
        max:35
      },

      require:function(){return ee.Image(0).select('classification');},
  },


  {
      'type':'IMAGE',
      'name':'Efeito de borda',

      'supergroup':'GT Degradação',
      'group':'FRAGMENTAÇÃO',
      
      'bandName':'classification',
      
      'visParams':{
        palette:  require('users/mapbiomas/modules:Palettes.js').get('classification7'),
        min:0,
        max:62
      },

      require:function(){return ee.Image(0).select('classification');},
  },
  {
      'type':'IMAGE',
      'name':'Tamanho do fragmento',

      'supergroup':'GT Degradação',
      'group':'FRAGMENTAÇÃO',
      
      'bandName':'classification',
      
      'visParams':{
        palette: [], 
        min:0,
        max:1000
      },
      
      'unit':'ha',

      require:function(){return ee.Image(0).select('classification');},
  },
  */
];

var covariates =  personal_covariates;
  // .concat(mapbiomas)
  // .concat(degradacao)
  // .concat(mosaico_mapbiomas)


var kyoshy_object = {
  covariates:covariates,

  // Ano de starting
  year:2021,
  years:[
    1985,1986,1987,1988,1989,
    1990,1991,1992,1993,1994,
    1995,1996,1997,1998,1999,
    2000,2001,2002,2003,2004,
    2005,2006,2007,2008,2009,
    2010,2011,2012,2013,2014,
    2015,2016,2017,2018,2019,
    2020,2021,2022
  ],
  table:'Paises',
  region:'Brazil',

  // auxiliarPanel:false,

  // logo:"data:image/png;base64,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"
};

//print('kyoshy_object',kyoshy_object);
// require('users/workspaceipam/packpages:toolkits/kyoshi/avatar/staging').start(kyoshy_object);
require('users/workspaceipam/packpages:toolkits/kyoshi/avatar/production').start(kyoshy_object);
