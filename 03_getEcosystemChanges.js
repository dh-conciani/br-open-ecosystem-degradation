// compute native vegetation state change (mapbiomas) and tree cover change

// read disturbance combination
var combination = ee.Image('projects/mapbiomas-workspace/DEGRADACAO/DISTURBIOS/disturbance_frequency/brazil_disturbance_frequency_agreement_2');

// list years to be processed with gfcc
var years_gfcc = [2000, 2005, 2010, 2015];

// transpose gfcc into imagecollection to multi-band per-year data
var gfcc = ee.Image(years_gfcc.map(function(year_i) {
  // get year i
  return  ee.ImageCollection('NASA/MEASURES/GFCC/TC/v3')
            .filter(ee.Filter.date(year_i + '-01-01', year_i + '-12-30'))
            .select('tree_canopy_cover')
            .mean()
            .rename('tc_' + year_i)
            .updateMask(combination);
            }
          )
        );

print(ee.Image(gfcc))



                  ;
var treeCanopyCover = dataset.select('tree_canopy_cover');
var treeCanopyCoverVis = {
  min: 0.0,
  max: 100.0,
  palette: ['ffffff', 'afce56', '5f9c00', '0e6a00', '003800'],
};

Map.addLayer(treeCanopyCover.mean(), treeCanopyCoverVis, 'Tree Canopy Cover');






Map.addLayer(combination, {
  palette: ['#C0C0C0', '#606060', '#20F0E2', '#FFEC33', '#EF9A2C', '#529CA8', '#00F318', 'red'], 
  min: 1, max: 8
  }, 'Disturbance');
