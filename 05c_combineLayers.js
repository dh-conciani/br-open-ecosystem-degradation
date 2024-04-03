// combine degradation layers
// dhemerson.costa@ipam.org.br

// define params
var config = {
  'params' : {
    'edge': 90,
    'patch': 25,
    'isolation': 10,
    'fire': 1,
    'secondary': null,
  },
  'bands': {
    'edge' : 'edge_',
    'patch': 'patch_',
    'isolation': 'isolation_',
    'fire': 'age_',
    'secondary': 'age_',
    'classification': 'classification_'
  },
  'assets': {
    'edge' : 'projects/mapbiomas-workspace/DEGRADACAO/COLECAO/BETA/PROCESS/summary/edge_v3',
    'patch': 'projects/mapbiomas-workspace/DEGRADACAO/COLECAO/BETA/PROCESS/summary/patch_v4',
    'isolation': 'projects/mapbiomas-workspace/DEGRADACAO/COLECAO/BETA/PROCESS/summary/isolation_v6',
    'fire': 'projects/mapbiomas-workspace/DEGRADACAO/COLECAO/BETA/PROCESS/fire/age_v1',
    'secondary': 'projects/mapbiomas-workspace/DEGRADACAO/COLECAO/BETA/PROCESS/secondary_vegetation/secondary_vegetation_age_v1',
    'classification': 'projects/mapbiomas-workspace/public/collection8/mapbiomas_collection80_integration_v1'
  }
};

// set years
var yearsList = [
  //1985, 1986, 1987, 1988, 1989, 1990, 1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999, 2000,
  //2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016,
  //2017, 2018, 2019, 2020, 2021, 2022
  2022
  ];

// perform combination 
yearsList.forEach(function(year_i) {
  // get edge
  var edge = ee.Image(config.assets.edge).select(config.bands.edge + year_i).lte(config.params.edge).selfMask()
  print(edge)
  Map.addLayer(edge.randomVisualizer())
});

