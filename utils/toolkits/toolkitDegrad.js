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
        group:'Coleção 8',
        name: 'Col8 Uso e Cobertura',
        id:'projects/mapbiomas-workspace/public/collection8/mapbiomas_collection80_integration_v1',
        // info:'Módulo de dados produzidos pela Rede MapBiomas (https://mapbiomas.org/). Atualmente para a predição dos estoques de carbono são utilizados os dados da Coleção 7 - publicada em agosto de 2022, com 27 classes de legenda cobrindo o período de 1985 - 2021.',
        bandName:'classification',
        years:[1985,1986,1987,1988,1989,1990,1991,1992,1993,1994,1995,1996,1997,1998,1999,2000,2001,2002,2003,2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022],
        require:function(id){return ee.Image(id);
        },
        legend:[
            // {value:1, label:"Floresta"},
            {value:3, label:"Formação Florestal"}, 
            {value:4, label:"Formação Savânica"}, 
            {value:5, label:"Mangue"}, 
            {value:6, label:"Floresta Alagável"}, 
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
            {value:35, label:"Dendê"}, 
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
          palette:require('users/mapbiomas/modules:Palettes.js').get('classification8'),
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
      'group':'Coleção 8',

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
      type:'IMAGE',
      supergroup:'MapBiomas Public Data',
      group:'Coleção 8',
      name: 'Trajetórias de classes naturais (85-22)',
      // info:'Módulo de dados produzidos pela Rede MapBiomas (https://mapbiomas.org/). Atualmente para a predição dos estoques de carbono são utilizados os dados da Coleção 7 - publicada em agosto de 2022, com 27 classes de legenda cobrindo o período de 1985 - 2021.',
      id:'projects/mapbiomas-workspace/public/collection8/mapbiomas_collection80_integration_v1',
      bandName:'trajectories',
      // years:options.years,
      require:function(id){return trajectory(ee.Image(id),[1985,2022],[3,4,5,6,11,12,33])},
      legend:[
        {value: 0, label: "Máscara"},
        {value: 1, label: "Presença🡪Perda🡪Ausência"},
        {value: 2, label: "Ausência🡪Ganho🡪Presença"},
        {value: 3, label: "Presença🡪Alternância🡪Perda🡪Ausência"},
        {value: 4, label: "Ausência🡪Alternância🡪Ganho🡪Presença"},
        {value: 5, label: "Presença🡪Alternância🡪Presença"},
        {value: 6, label: "Ausência🡪Alternância🡪Ausência"},
        {value: 7, label: "Presença🡪Estável🡪Presença"},
        {value: 8, label: "Ausência🡪Estável🡪Ausência"},
      ],
      visParams:{
        'min': 0,
        'max': 8,
        'palette': [
            "#ffffff", //[0] Mask 
            "#941004", //[1] Presence🡪Loss🡪Absence
            "#020e7a", //[2] Absence🡪Gain🡪Presence
            "#f5261b", //[3] Presence🡪Alternation🡪Loss🡪Absence
            "#14a5e3", //[4] Absence🡪Alternation🡪Gain🡪Presence
            "#8b8000", //[5] Presence🡪Alternation🡪Presence
            "#ffff00", //[6] Absence🡪Alternation🡪Absence
            "#666666", //[7] Presence🡪Stable🡪Presence
            "#cfcfcf", //[8] Absence🡪Stable🡪Absence
        ],
      },
    },

    {
      type:'IMAGE',
      supergroup:'MapBiomas Public Data',
      group:'Coleção 8',
      name: 'Trajetórias de água e campo alagado  (85-22)',
      // info:'Módulo de dados produzidos pela Rede MapBiomas (https://mapbiomas.org/). Atualmente para a predição dos estoques de carbono são utilizados os dados da Coleção 7 - publicada em agosto de 2022, com 27 classes de legenda cobrindo o período de 1985 - 2021.',
      id:'projects/mapbiomas-workspace/public/collection8/mapbiomas_collection80_integration_v1',
      bandName:'trajectories',
      // years:options.years,
      require:function(id){return trajectory(ee.Image(id),[1985,2022],[11,33])},
      legend:[
        {value: 0, label: "Máscara"},
        {value: 1, label: "Presença🡪Perda🡪Ausência"},
        {value: 2, label: "Ausência🡪Ganho🡪Presença"},
        {value: 3, label: "Presença🡪Alternância🡪Perda🡪Ausência"},
        {value: 4, label: "Ausência🡪Alternância🡪Ganho🡪Presença"},
        {value: 5, label: "Presença🡪Alternância🡪Presença"},
        {value: 6, label: "Ausência🡪Alternância🡪Ausência"},
        {value: 7, label: "Presença🡪Estável🡪Presença"},
        {value: 8, label: "Ausência🡪Estável🡪Ausência"},
      ],
      visParams:{
        'min': 0,
        'max': 8,
        'palette': [
            "#ffffff", //[0] Mask 
            "#941004", //[1] Presence🡪Loss🡪Absence
            "#020e7a", //[2] Absence🡪Gain🡪Presence
            "#f5261b", //[3] Presence🡪Alternation🡪Loss🡪Absence
            "#14a5e3", //[4] Absence🡪Alternation🡪Gain🡪Presence
            "#8b8000", //[5] Presence🡪Alternation🡪Presence
            "#ffff00", //[6] Absence🡪Alternation🡪Absence
            "#666666", //[7] Presence🡪Stable🡪Presence
            "#cfcfcf", //[8] Absence🡪Stable🡪Absence
        ],
      },
    },

    {
      type:'IMAGE',
      supergroup:'MapBiomas Public Data',
      group:'Coleção 8',
      name: 'Trajetórias de água, campo alagado e campestres  (85-22)',
      // info:'Módulo de dados produzidos pela Rede MapBiomas (https://mapbiomas.org/). Atualmente para a predição dos estoques de carbono são utilizados os dados da Coleção 7 - publicada em agosto de 2022, com 27 classes de legenda cobrindo o período de 1985 - 2021.',
      id:'projects/mapbiomas-workspace/public/collection8/mapbiomas_collection80_integration_v1',
      bandName:'trajectories',
      // years:options.years,
      require:function(id){return trajectory(ee.Image(id),[1985,2022],[11,33,12])},
      legend:[
        {value: 0, label: "Máscara"},
        {value: 1, label: "Presença🡪Perda🡪Ausência"},
        {value: 2, label: "Ausência🡪Ganho🡪Presença"},
        {value: 3, label: "Presença🡪Alternância🡪Perda🡪Ausência"},
        {value: 4, label: "Ausência🡪Alternância🡪Ganho🡪Presença"},
        {value: 5, label: "Presença🡪Alternância🡪Presença"},
        {value: 6, label: "Ausência🡪Alternância🡪Ausência"},
        {value: 7, label: "Presença🡪Estável🡪Presença"},
        {value: 8, label: "Ausência🡪Estável🡪Ausência"},
      ],
      visParams:{
        'min': 0,
        'max': 8,
        'palette': [
            "#ffffff", //[0] Mask 
            "#941004", //[1] Presence🡪Loss🡪Absence
            "#020e7a", //[2] Absence🡪Gain🡪Presence
            "#f5261b", //[3] Presence🡪Alternation🡪Loss🡪Absence
            "#14a5e3", //[4] Absence🡪Alternation🡪Gain🡪Presence
            "#8b8000", //[5] Presence🡪Alternation🡪Presence
            "#ffff00", //[6] Absence🡪Alternation🡪Absence
            "#666666", //[7] Presence🡪Stable🡪Presence
            "#cfcfcf", //[8] Absence🡪Stable🡪Absence
        ],
      },
    },

   {
      'type':'IMAGE',
      'name':'Frequência do fogo (85-22)',

      'supergroup':'GT Degradação',
      'group':'FOGO',
      
      'bandName':'fire_frequency_1985',
      
      'visParams':{palette: ['FFFFFF','F8D71F','DAA118','BD6C12','9F360B','810004','4D0709'], min: 0, max: 37},

      years:[1985,1986,1987,1988,1989,1990,1991,1992,1993,1994,1995,1996,1997,1998,1999,2000,2001,2002,2003,2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022],

      require:function(){return ee.Image('projects/mapbiomas-workspace/public/collection7_1/mapbiomas-fire-collection2-fire-frequency-1')
        .divide(100).int16().slice(0,38);
      },
   },

   {
      'type':'IMAGE',
      'name':'Mudança na estrutura',

      'supergroup':'GT Degradação',
      'group':'MUDANÇA NA ESTRUTURA DA VEG. NATIVA',
      
      'bandName':'classification',
      'visParams':{palette:['#AF00FB', '#FF0000', 'white', '#23FF00', '#0D5202'], min:-2, max:2},
      'years':[1985,1986,1987,1988,1989,1990,1991,1992,1993,1994,1995,1996,1997,1998,1999,2000,2001,2002,2003,2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022],

      require:function(){return ee.Image('projects/mapbiomas-workspace/DEGRADACAO/COLECAO/BETA/PROCESS/structure_change/structure_change_v1')},
      // legend:[
          // {value:0, label:'Não observado'},
          // {value:-2,label:'Raleamento'},
          // {value:-1,label:'Adensamento'},
          // {value:0,label:'Raleamento'},
          // {value:1,label:'Adensamento'},
          // {value:2,label:'Adensamento'},
      // ]
   },
   {
      'type':'IMAGE',
      'name':'Idade',

      'supergroup':'GT Degradação',
      'group':'MUDANÇA NA ESTRUTURA DA VEG. NATIVA',
      
      'bandName':'classification',
      'years':[1985,1986,1987,1988,1989,1990,1991,1992,1993,1994,1995,1996,1997,1998,1999,2000,2001,2002,2003,2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022],

      'visParams':{
        palette: ['800000','9b2226','ae2012','bb3e03','ca6702','ee9b00','94d2bd','005f73','0a9396','0000ff','000080','001219'], 
        min:1,
        max:30
      },

      require:function(){return ee.Image('projects/mapbiomas-workspace/DEGRADACAO/COLECAO/BETA/PROCESS/structure_change/age_v1');},
   },

   {
      'type':'IMAGE',
      'name':'Idade da veg. secundaria (86-22)',

      'supergroup':'GT Degradação',
      'group':'VEGETAÇÃO SECUNDARIA',
      
      'bandName':'secondary_vegetation_age',
      
      'visParams':{
        palette: [
          '#ffffe5','#f7fcb9','#d9f0a3','#addd8e','#78c679','#41ab5d','#238443','#006837','#004529'
        ], 
        min:1,
        max:35
      },
      years:[1986,1987,1988,1989,1990,1991,1992,1993,1994,1995,1996,1997,1998,1999,2000,2001,2002,2003,2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022],

      require:function(){return ee.Image('projects/mapbiomas-workspace/public/collection8/mapbiomas_collection80_secondary_vegetation_age_v1')
        .selfMask();
      },
   },

///*
{
      'type':'IMAGE',
      'name':'Solo exposto',

      'supergroup':'GT Degradação',
      'group':'EXPOSIÇÃO DE SOLO',
      
      'bandName':'classification',
      'years':[1985,1986,1987,1988,1989,1990,1991,1992,1993,1994,1995,1996,1997,1998,1999,2000,2001,2002,2003,2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022],
      'visParams':{
      palette: [
        'fff5eb','7f2704'
        ],
        min:0,
        max:1
      },
      
      legend:[
        {value:0,label:'Não observado'},
        {value:1,label:'Solo exposto'}
      ],

      require:function(){
        var col = ee.ImageCollection('projects/mapbiomas-workspace/DEGRADACAO/COLECAO/BETA/PROCESS/CAMADA_SOLO');
        return  ee.Image(col.aggregate_array('year').distinct().sort()
          .iterate(function(current,previous){
            var year = ee.Number(current).int();
            var mosaic = col.filter(ee.Filter.eq('year',year)).mosaic()
              .rename(ee.String('classification_').cat(year));
              
              return ee.Image(previous).addBands(mosaic);
            },ee.Image().select()));
  },
  },
{
      'type':'IMAGE',
      'name':'Frequencia de solo exposto (85-22',

      'supergroup':'GT Degradação',
      'group':'EXPOSIÇÃO DE SOLO',
      
      'bandName':'solo_exposto',
      // 'years':[1985,1986,1987,1988,1989,1990,1991,1992,1993,1994,1995,1996,1997,1998,1999,2000,2001,2002,2003,2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022],
      'visParams':{
      palette: ['FFFFFF','F8D71F','DAA118','BD6C12','9F360B','810004','4D0709'],
        min:0,
        max:30
      },
      
      // legend:[
      //   {value:0,label:'Não observado'},
      //   {value:1,label:'Solo exposto'}
      // ],

      require:function(){
        var col = ee.ImageCollection('projects/mapbiomas-workspace/DEGRADACAO/COLECAO/BETA/PROCESS/CAMADA_SOLO');
        return  ee.Image(col.aggregate_array('year').distinct().sort()
          .iterate(function(current,previous){
            var year = ee.Number(current).int();
            var mosaic = col.filter(ee.Filter.eq('year',year)).mosaic()
              .rename(ee.String('classification_').cat(year));
              
              return ee.Image(previous).addBands(mosaic);
            },ee.Image().select())).reduce('sum').rename('solo_exposto');
  },
  },
//*/

  {
      'type':'IMAGE',
      'name':'Frequência DAM NDFI (87-22)',

      'supergroup':'GT Degradação',
      'group':'NDFI',
      
      'bandName':'dam',
      
      'visParams':{
        'min': 0,
        'max': 12, // o max ´é em  torno de 40, mas para melhorar a vis, foi setado 12
        'palette': [
          '#000004',
          '#320A5A',
          '#781B6C',
          '#BB3654',
          '#EC6824',
          '#FBB41A',
          '#FCFFA4',
          ],
        'format': 'png'
      },

      require:function(){
         return ee.ImageCollection('projects/imazon-simex/DEGRADATION/dam-frequency-c2')
            .filter('version == "3"')
            .select(0)
            .map(function(image){
              var i = image.unmask(0)
              return i
              .int16()
              .rename('dam')
            }).reduce(
          ee.Reducer.sum()
        ).selfMask()
          .rename('dam');

      },
  },
  {
      'type':'IMAGE',
      'name':'Borda (vetor de pressão)',

      'supergroup':'GT Degradação',
      'group':'FRAGMENTAÇÃO',
      
      'bandName':'pressure_30m',
      
      'visParams':{
        palette:  require('users/mapbiomas/modules:Palettes.js').get('classification8'),
        min:0,
        max:62
      },
      years:[1985,1986,1987,1988,1989,1990,1991,1992,1993,1994,1995,1996,1997,1998,1999,2000,2001,2002,2003,2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022],

      require:function(){return ee.Image('projects/mapbiomas-workspace/DEGRADACAO/COLECAO/BETA/PROCESS/edge_pressure/pressure_30m_v1');},
      legend:[
        // {value:1, label:"Floresta"},
        // {value:3, label:"Formação Florestal"}, 
        // {value:4, label:"Formação Savânica"}, 
        // {value:5, label:"Mangue"}, 
        // {value:49, label:"Restinga Arborizada"}, 
        // {value:10, label:"Formação Natural não Florestal"},
        // {value:11, label:"Campo Alagado e Área Pantanosa"}, 
        // {value:12, label:"Formação Campestre"}, 
        // {value:32, label:"Apicum"}, 
        // {value:29, label:"Afloramento Rochoso"}, 
        // {value:50, label:"Restinga Herbácea"}, 
        // {value:13, label:"Outras Formações não Florestais"}, 
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
        {value:35, label:"Dendê"}, 
        {value:9, label:"Silvicultura"},
        {value:21, label:"Mosaico de Usos"}, 
        // {value:22, label:"Área não Vegetada"}, 
        // {value:23, label:"Praia, Duna e Areal"}, 
        {value:24, label:"Área Urbanizada"}, 
        {value:30, label:"Mineração"}, 
        {value:25, label:"Outras Áreas não Vegetadas"}, 
        // {value:26, label:"Corpo D'água"}, 
        {value:33, label:"Rio, Lago e Oceano"}, 
        {value:31, label:"Aquicultura"}, 
        // {value:27, label:"Não observado"}, 
      ],

  },

/*
  {
      'type':'IMAGE',
      'name':'DNIT',

      'supergroup':'GT Degradação',
      'group':'INFRAESTRUTURA',
      
      'bandName':'constant',
      
      'visParams':{
        palette: ['800000','9b2226','ae2012','bb3e03','ca6702','ee9b00','94d2bd','005f73','0a9396','0000ff','000080','001219'], 
        min:1,
        max:35
      },

      require:function(){return ee.Image('projects/mapbiomas-workspace/DEGRADACAO/INFRASTRUCTURE/dnit_roads_image');},
  },
*/
  {
    'id':'projects/mapbiomas-workspace/FOGO_COL2/PRODUTOS_REGIME_DO_FOGO/mapbiomas-fire-collection2-time-before-fire-v1',
    'type':'IMAGE',
    'name':'Tempo médio de retorno do fogo (85-22)',
    
    require:function(id){
      return ee.Image(id)
        .updateMask(ee.Image('projects/mapbiomas-workspace/public/collection7_1/mapbiomas-fire-collection2-monthly-burned-coverage-1'))
        .reduce('mean')
        .rename('classification')
        .multiply(10)
        .round()
        .divide(10)
        .float();
    },

    'supergroup':'GT Degradação',
    'group':'FOGO',
    
    'bandName':'classification',
    // years:[1986,1987,1988,1989,1990,1991,1992,1993,1994,1995,1996,1997,1998,1999,2000,2001,2002,2003,2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022],

    'visParams':{
        min:1,
        max:10,
        palette:['800000','9b2226','ae2012','bb3e03','ca6702','ee9b00','94d2bd','005f73','0a9396','0000ff','000080','001219']
      },
    'unit':'Tempo médio de retorno',

  },  
  {
    'id':'projects/mapbiomas-workspace/FOGO_COL2/PRODUTOS_REGIME_DO_FOGO/mapbiomas-fire-collection2-time-before-fire-v1',
    'type':'IMAGE',
    'name':'Tempo antes o fogo',
    
    require:function(id){
      return ee.Image(id);
    },
    
    'supergroup':'GT Degradação',
    'group':'FOGO',
    
    'bandName':'classification',
    years:[1986,1987,1988,1989,1990,1991,1992,1993,1994,1995,1996,1997,1998,1999,2000,2001,2002,2003,2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022],

    'visParams':{
        min:1,
        max:37,
        palette:['800000','9b2226','ae2012','bb3e03','ca6702','ee9b00','94d2bd','005f73','0a9396','0000ff','000080','001219']
      },
    'unit':'anos antes da detecção',

    },
  {
      'id':'projects/mapbiomas-workspace/FOGO_COL2/PRODUTOS_REGIME_DO_FOGO/mapbiomas-fire-collection2-time-after-fire-v1',
      'type':'IMAGE',
      'name':'Tempo após o fogo',

      require:function(id){
        return ee.Image(id);
        },

      'supergroup':'GT Degradação',
      'group':'FOGO',

      'bandName':'classification',
      years:[1986,1987,1988,1989,1990,1991,1992,1993,1994,1995,1996,1997,1998,1999,2000,2001,2002,2003,2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022],
      
      'visParams':{
          min:1,
          max:37,
          palette:['800000','9b2226','ae2012','bb3e03','ca6702','ee9b00','94d2bd','005f73','0a9396','0000ff','000080','001219']
        },
      'unit':'anos após a detecção',

    },

];

function trajectory (lulc,period,classes) {
  var count = period[1] - period[0] + 1;

  var bands = Array.apply(null, Array(count)).map(
      function (_, i) {
          return 'classification_' + (period[0] + i).toString();
      }
  );

  var calculateNumberOfChanges = function (image) {
    var nChanges = image.reduce(ee.Reducer.countRuns()).subtract(1);    return nChanges.rename('number_of_changes');
  };
  
  var calculateNumberOfPresence = function (image) {
    var nChanges = image.reduce(ee.Reducer.sum());    return nChanges.rename('number_of_presence');
  };
  
  var calculateNumberOfClasses = function (image) {
  
      var nClasses = image.reduce(ee.Reducer.countDistinctNonNull());
  
    return nClasses.rename('number_of_classes');
  };

  // lulc images 
  var imagePeriod = lulc.select(bands);

  // number of classes
  var nClasses = calculateNumberOfClasses(imagePeriod);

  // number of changes
  var nChanges = calculateNumberOfChanges(imagePeriod);

  // stable
  var stable = imagePeriod.select(0).multiply(nClasses.eq(1));

  // Map.addLayer(stable, visParams.stable, 'Stable', false);
  // Map.addLayer(nClasses, visParams.number_of_classes, 'Number of classes', false);

  // trajectories
  // classIds.forEach(
  function trajectories (classList) {
    var classIdsMask = ee.List(bands).iterate(
        function (band, allMasks) {
            var mask = imagePeriod.select([band])
                .remap(classList, ee.List.repeat(1, classList.length), 0);

            return ee.Image(allMasks).addBands(mask);
        },
        ee.Image().select()
    );

    classIdsMask = ee.Image(classIdsMask).rename(bands);

    // number of presence
    var nPresence = calculateNumberOfPresence(classIdsMask);

    // nChanges in classList
    var nChanges = calculateNumberOfChanges(classIdsMask);

    // nChanges rules in the analisys
    var nChangesEq0 = nChanges.eq(0); //  no change
    var nChangesEq1 = nChanges.eq(1); //  1 change
    var nChangesGt1 = nChanges.gt(1); // >1 changes
    // var nChangesGt2 = nChanges.gt(2); // >2 changes

    // lulc classIds masks for the first year and last year 
    var t1 = classIdsMask.select(bands[0]);
    var tn = classIdsMask.select(bands[bands.length - 1]);

    // categories
    var abAbCh0 = t1.eq(0).and(nChangesEq0);
    var prPrCh0 = t1.eq(1).and(nChangesEq0);
    var abPrCh1 = t1.eq(0).and(nChangesEq1).and(tn.eq(1));
    var prAbCh1 = t1.eq(1).and(nChangesEq1).and(tn.eq(0));
    var abPrCh2 = t1.eq(0).and(nChangesGt1).and(tn.eq(1));
    var prAbCh2 = t1.eq(1).and(nChangesGt1).and(tn.eq(0));
    var abAbCh1 = t1.eq(0).and(nChangesGt1).and(tn.eq(0));
    var prPrCh1 = t1.eq(1).and(nChangesGt1).and(tn.eq(1));

    // (*) the classes Ab-Ab and Pr-Pr the classes were joined
    // var trajectories = ee.Image(0)
    //     .where(prAbCh1, 1)  //[1] Pr-Ab Ch=1 | Loss without Alternation
    //     .where(abPrCh1, 2)  //[2] Ab-Pr Ch=1 | Gain without Alternation
    //     .where(prAbCh2, 3)  //[3] Pr-Ab Ch>2 | Loss with Alternation
    //     .where(abPrCh2, 4)  //[4] Ab-Pr Ch>2 | Gain with Alternation
    //     .where(abAbCh1, 5)  //[5] Ab-Ab Ch>1 | Stable with Alternation (Ab-Ab)
    //     .where(prPrCh1, 5)  //[5] Pr-Pr Ch>1 | Stable with Alternation (Pr-Pr)
    //     .where(prPrCh0, 6)  //[6] Pr-Pr Ch=0 | Stable Presence
    //     .where(abAbCh0, 7); //[7] Ab-Ab Ch=0 | Stable Absence
    var traject = ee.Image(0)
        .where(prAbCh1, 1)  // [1] Presence🡪Loss🡪Absence
        .where(abPrCh1, 2)  // [2] Absence🡪Gain🡪Presence
        .where(prAbCh2, 3)  // [3] Presence🡪Alternation🡪Loss🡪Absence
        .where(abPrCh2, 4)  // [4] Absence🡪Alternation🡪Gain🡪Presence
        .where(prPrCh1, 5)  // [5] Presence🡪Alternation🡪Presence
        .where(abAbCh1, 6)  // [6] Absence🡪Alternation🡪Absence
        .where(prPrCh0, 7)  // [7] Presence🡪Stable🡪Presence
        .where(abAbCh0, 8); // [8] Absence🡪Stable🡪Absence

    return traject.rename('trajectories').selfMask();

    // trajectoriesClassIds[classList[0]].number_of_presence = nPresence;
    // trajectoriesClassIds[classList[0]].number_of_changes = nChanges;
    // trajectoriesClassIds[classList[0]].trajectories = trajectories;
}

return trajectories(classes);
// );
// print(image)


}

var bandnames_landsat = [
  // {bandName:"blue_median",visParams:{min:0, max:603}},
  // {bandName:"blue_median_wet",visParams:{min:1, max:476}},
  // {bandName:"blue_median_dry",visParams:{min:0, max:732}},
  // {bandName:"blue_min",visParams:{min:0, max:410}},
  // {bandName:"blue_stdDev",visParams:{min:0, max:206}},
  // {bandName:"green_median",visParams:{min:0, max:860}},
  // {bandName:"green_median_dry",visParams:{min:0, max:1052}},
  // {bandName:"green_median_wet",visParams:{min:5, max:814}},
  // {bandName:"green_median_texture",visParams:{min:0, max:376}},
  // {bandName:"green_min",visParams:{min:0, max:686}},
  // {bandName:"green_stdDev",visParams:{min:0, max:205}},
  // {bandName:"red_median",visParams:{min:0, max:1053}},
  // {bandName:"red_median_dry",visParams:{min:0, max:1263}},
  // {bandName:"red_min",visParams:{min:0, max:718}},
  // {bandName:"red_median_wet",visParams:{min:1, max:814}},
  // {bandName:"red_stdDev",visParams:{min:0, max:279}},
  // {bandName:"nir_median",visParams:{min:0, max:2927}},
  // {bandName:"nir_median_dry",visParams:{min:0, max:2910}},
  // {bandName:"nir_median_wet",visParams:{min:0, max:3407}},
  // {bandName:"nir_min",visParams:{min:0, max:2575}},
  // {bandName:"nir_stdDev",visParams:{min:0, max:590}},
  // {bandName:"swir1_median",visParams:{min:0, max:2782}},
  // {bandName:"swir1_median_dry",visParams:{min:0, max:3119}},
  // {bandName:"swir1_median_wet",visParams:{min:20, max:2415}},
  // {bandName:"swir1_min",visParams:{min:0, max:2191}},
  // {bandName:"swir1_stdDev",visParams:{min:0, max:519}},
  // {bandName:"swir2_median",visParams:{min:0, max:1743}},
  // {bandName:"swir2_median_wet",visParams:{min:9, max:1327}},
  // {bandName:"swir2_median_dry",visParams:{min:0, max:2063}},
  // {bandName:"swir2_min",visParams:{min:0, max:1167}},
  // {bandName:"swir2_stdDev",visParams:{min:0, max:459}},
  // {bandName:"ndvi_median_dry",visParams:{min:0, max:16574}},
  // {bandName:"ndvi_median_wet",visParams:{min:0, max:17982}},
  {bandName:"ndvi_median",visParams:{min:0, max:17342}},
  // {bandName:"ndvi_amp",visParams:{min:0, max:4511}},
  // {bandName:"ndvi_stdDev",visParams:{min:0, max:1615}},
  // {bandName:"ndwi_median",visParams:{min:0, max:13375}},
  // {bandName:"ndwi_median_dry",visParams:{min:0, max:13119}},
  // {bandName:"ndwi_median_wet",visParams:{min:0, max:13630}},
  // {bandName:"ndwi_amp",visParams:{min:0, max:4670}},
  // {bandName:"ndwi_stdDev",visParams:{min:0, max:1711}},
  // {bandName:"evi2_median",visParams:{min:1733, max:14271}},
  // {bandName:"evi2_median_dry",visParams:{min:4262, max:13919}},
  // {bandName:"evi2_median_wet",visParams:{min:4262, max:15006}},
  // {bandName:"evi2_amp",visParams:{min:0, max:3230}},
  // {bandName:"evi2_stdDev",visParams:{min:0, max:1127}},
  // {bandName:"savi_median_dry",visParams:{min:2418, max:13919}},
  // {bandName:"savi_median_wet",visParams:{min:2418, max:14942}},
  // {bandName:"savi_median",visParams:{min:0, max:14271}},
  // {bandName:"savi_stdDev",visParams:{min:0, max:1063}},
  // {bandName:"pri_median_dry",visParams:{min:427, max:8761}},
  // {bandName:"pri_median",visParams:{min:0, max:8377}},
  // {bandName:"pri_median_wet",visParams:{min:170, max:8123}},
  // {bandName:"gcvi_median",visParams:{min:0, max:52872}},
  // {bandName:"gcvi_median_dry",visParams:{min:4, max:44651}},
  // {bandName:"gcvi_median_wet",visParams:{min:538, max:74634}},
  // {bandName:"gcvi_stdDev",visParams:{min:0, max:11154}},
  // {bandName:"hallcover_median",visParams:{min:1751320, max:1838320}},
  // {bandName:"hallcover_stdDev",visParams:{min:0, max:7230}},
  // {bandName:"cai_median",visParams:{min:10000, max:17015}},
  // {bandName:"cai_median_dry",visParams:{min:10000, max:17529}},
  // {bandName:"cai_stdDev",visParams:{min:0, max:693}},
  // {bandName:"gv_median",visParams:{min:0, max:37}},
  // {bandName:"gv_median_dry",visParams:{min:0, max:33}},
  // {bandName:"gv_median_wet",visParams:{min:0, max:45}},
  // {bandName:"gv_max",visParams:{min:0, max:50}},
  // {bandName:"gv_min",visParams:{min:0, max:29}},
  // {bandName:"gv_amp",visParams:{min:0, max:38}},
  // {bandName:"gv_stdDev",visParams:{min:0, max:13}},
  // {bandName:"gvs_median",visParams:{min:0, max:86}},
  // {bandName:"gvs_median_dry",visParams:{min:0, max:80}},
  // {bandName:"gvs_median_wet",visParams:{min:0, max:92}},
  // {bandName:"gvs_max",visParams:{min:0, max:96}},
  // {bandName:"gvs_min",visParams:{min:0, max:76}},
  // {bandName:"gvs_amp",visParams:{min:0, max:69}},
  // {bandName:"gvs_stdDev",visParams:{min:0, max:25}},
  // {bandName:"npv_median",visParams:{min:0, max:11}},
  // {bandName:"npv_median_dry",visParams:{min:0, max:12}},
  // {bandName:"npv_median_wet",visParams:{min:0, max:9}},
  // {bandName:"npv_max",visParams:{min:0, max:14}},
  // {bandName:"npv_min",visParams:{min:0, max:7}},
  // {bandName:"npv_amp",visParams:{min:0, max:11}},
  // {bandName:"npv_stdDev",visParams:{min:0, max:3}},
  // {bandName:"soil_median",visParams:{min:0, max:20}},
  // {bandName:"soil_median_dry",visParams:{min:0, max:25}},
  // {bandName:"soil_median_wet",visParams:{min:0, max:13}},
  // {bandName:"soil_max",visParams:{min:0, max:30}},
  // {bandName:"soil_min",visParams:{min:0, max:10}},
  // {bandName:"soil_amp",visParams:{min:0, max:24}},
  // {bandName:"soil_stdDev",visParams:{min:0, max:8}},
  // {bandName:"cloud_median",visParams:{min:0, max:5}},
  // {bandName:"cloud_median_dry",visParams:{min:0, max:7}},
  // {bandName:"cloud_median_wet",visParams:{min:0, max:5}},
  // {bandName:"cloud_max",visParams:{min:0, max:10}},
  // {bandName:"cloud_min",visParams:{min:0, max:3}},
  // {bandName:"cloud_amp",visParams:{min:0, max:9}},
  // {bandName:"cloud_stdDev",visParams:{min:0, max:3}},
  // {bandName:"shade_median",visParams:{min:0, max:74}},
  // {bandName:"shade_median_dry",visParams:{min:0, max:79}},
  // {bandName:"shade_median_wet",visParams:{min:0, max:73}},
  // {bandName:"shade_max",visParams:{min:0, max:87}},
  // {bandName:"shade_min",visParams:{min:0, max:65}},
  // {bandName:"shade_amp",visParams:{min:0, max:27}},
  // {bandName:"shade_stdDev",visParams:{min:0, max:9}},
  {bandName:"ndfi_median",visParams:{min:0, max:187}},
  // {bandName:"ndfi_median_dry",visParams:{min:0, max:180}},
  // {bandName:"ndfi_median_wet",visParams:{min:0, max:192}},
  // {bandName:"ndfi_max",visParams:{min:0, max:196}},
  // {bandName:"ndfi_min",visParams:{min:0, max:176}},
  // {bandName:"ndfi_amp",visParams:{min:0, max:139}},
  // {bandName:"ndfi_stdDev",visParams:{min:0, max:50}},
  // {bandName:"sefi_median",visParams:{min:0, max:198}},
  // {bandName:"sefi_stdDev",visParams:{min:0, max:36}},
  // {bandName:"sefi_median_dry",visParams:{min:0, max:196}},
  // {bandName:"wefi_median",visParams:{min:0, max:81}},
  // {bandName:"wefi_median_wet",visParams:{min:0, max:96}},
  // {bandName:"wefi_amp",visParams:{min:0, max:69}},
  // {bandName:"wefi_stdDev",visParams:{min:0, max:24}},
  // {bandName:"slope",visParams:{min:0, max:1263}},
];

function landsat_index_raster_stack (index){
  
  var recipe = ee.Image().select();
  [
    // 1983,
    1985,1986,1987,1988,1989,1990,1991,1992,1993,1994,
    1995,1996,1997,1998,1999,2000,2001,2002,2003,2004,
    2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,
    2015,2016,2017,2018,2019,2020,2021,2022
  ].forEach(function(y){
    recipe = recipe.addBands(
      ee.ImageCollection('projects/nexgenmap/MapBiomas2/LANDSAT/BRAZIL/mosaics-2')
        .filter('year == ' + y)
        .mosaic()
        .select([index],[index + '_' + y])
      );
  });
  return recipe;
}

var index_covarietes = bandnames_landsat.map(function(obj){
  return {
      'type':'IMAGE',
      'supergroup':'MapBiomas Public Data',
      'group':'Índices',
      // 'id':'projects/mapbiomas-workspace/FOGO_COL2/SUBPRODUTOS/mapbiomas-fire-collection2-monthly-burned-coverage-v1',
      require:function(){return landsat_index_raster_stack(obj.bandName)},
      'name':obj.bandName,
      'bandName':obj.bandName,
      'visParams':{palette:['000000','404040','808080','ffffff'],min:obj.visParams.min,max:obj.visParams.max},
      years:[ /*1983,*/1985,1986,1987,1988,1989,1990,1991,1992,1993,1994,1995,1996,1997,1998,1999,2000,2001,2002,2003,2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022],
    };
  
});


// -----------------
// tamanho de borda

function returnLayer(img,index,name,group){
  
  return   {
      'type':'IMAGE',
      'name': name + ' ' + index.split('_')[1] ,

      'supergroup':'GT Degradação',
      'group':group,
      
      'bandName':index.split('_v')[0],
      
      'visParams':{
        palette:  require('users/mapbiomas/modules:Palettes.js').get('classification8'),
        min:0,
        max:62
      },
      years:[1985,1986,1987,1988,1989,1990,1991,1992,1993,1994,1995,1996,1997,1998,1999,2000,2001,2002,2003,2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022],

      require:function(){return img;},
      legend:[
      // {value:1, label:"Floresta"},
      {value:3, label:"Formação Florestal"}, 
      {value:4, label:"Formação Savânica"}, 
      {value:5, label:"Mangue"}, 
      {value:6, label:"Floresta Alagável"}, 
      // {value:49, label:"Restinga Arborizada"}, 
      // {value:10, label:"Formação Natural não Florestal"},
      {value:11, label:"Campo Alagado e Área Pantanosa"}, 
      {value:12, label:"Formação Campestre"}, 
      // {value:32, label:"Apicum"}, 
      // {value:29, label:"Afloramento Rochoso"}, 
      // {value:50, label:"Restinga Herbácea"}, 
      // {value:13, label:"Outras Formações não Florestais"}, 
      // {value:14, label:"Agropecuária"}, 
      // {value:15, label:"Pastagem"}, 
      // {value:18, label:"Agricultura"}, 
      // {value:19, label:"Lavoura Temporária"}, 
      // {value:39, label:"Soja"}, 
      // {value:20, label:"Cana"}, 
      // {value:40, label:"Arroz (beta)"}, 
      // {value:62, label:"Algodão (beta)"}, 
      // {value:41, label:"Outras Lavouras Temporárias"},
      // {value:36, label:"Lavoura Perene"}, 
      // {value:46, label:"Café"},
      // {value:47, label:"Citrus"}, 
      // {value:48, label:"Outras Lavouras Perenes"}, 
      // {value:9, label:"Silvicultura"},
      // {value:21, label:"Mosaico de Usos"}, 
      // {value:22, label:"Área não Vegetada"}, 
      // {value:23, label:"Praia, Duna e Areal"}, 
      // {value:24, label:"Área Urbanizada"}, 
      // {value:30, label:"Mineração"}, 
      // {value:25, label:"Outras Áreas não Vegetadas"}, 
      // {value:26, label:"Corpo D'água"}, 
      {value:33, label:"Rio, Lago e Oceano"}, 
      // {value:31, label:"Aquicultura"}, 
      // {value:27, label:"Não observado"}, 
  
      ],

  };

}

var edges = [
  'edge_30m_v1',
  'edge_60m_v1',
  'edge_90m_v1',
  'edge_120m_v1',
  'edge_150m_v1',
  'edge_300m_v1',
  'edge_600m_v1',
  'edge_1000m_v1',
];


edges = edges.map(function(index){
  var img = ee.Image('projects/mapbiomas-workspace/DEGRADACAO/COLECAO/BETA/PROCESS/edge_area/' + index);
  return returnLayer(img,index, 'Borda', 'FRAGMENTAÇÃO: ÁREA DE BORDA');
});

var patchs = [
  'size_1ha_v1',
  'size_2ha_v1',
  'size_3ha_v1',
  'size_4ha_v1',
  'size_5ha_v1', 
  'size_10ha_v1'
];


patchs = patchs.map(function(index){
  var img = ee.Image('projects/mapbiomas-workspace/DEGRADACAO/COLECAO/BETA/PROCESS/patch_size/' + index);
  return returnLayer(img,index, 'Tamanho <' , 'FRAGMENTAÇÃO: TAMANHO');
});




var covariates =  personal_covariates
  .concat(index_covarietes)
  .concat(edges)
  .concat(patchs);


var kyoshy_object = {
  covariates:covariates,

  // Ano de starting
  year:2022,
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
