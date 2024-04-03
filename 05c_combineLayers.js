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
}


