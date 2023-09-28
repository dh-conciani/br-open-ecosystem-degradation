// get woody enchorachment and thinning in brazilian native vegetation 
// gt degradação - mapbiomas- dhemerson.costa@ipam.org.br

// runs by yhe following steps
// a. temporal filter of 3, 4 and 5 years (remove teporal patches <3 yr)
// b. gapfill filter (replace zero by last native class)
// c. compute enchroachment/thinning [-2 to +2]
// d. compute time since the last structural change
// e. mask anthropogenic years and build final product 

// set output version
var version = 1;

// set output folder
var output = 'projects/mapbiomas-workspace/DEGRADACAO/COLECAO/BETA/PROCESS/structure_change';

// read collection 8
var collection = ee.Image('projects/mapbiomas-workspace/public/collection8/mapbiomas_collection80_integration_v1');
Map.addLayer(collection, {}, 'mapbiomas c8', false);

// set native classes
var native_classes =          [3, 4, 5, 6, 11, 12];
var native_classes_adjusted = [3, 4, 3, 3, 12, 12];

// set ignored classes
var ignore_classes = [27, 33];

// set assessment classes
var assess_classes = [3, 4, 12];

// set persistence rule to validate a temporal patch 
var persistence = 3;

// set years to be processed
var years_list = [1985, 1986, 1987, 1988, 1989, 1990, 1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999,
                  2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014,
                  2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022];

// remap collection to structural levels
// build an empty recipe
var collection_x = ee.Image([]);
// for each year
years_list.forEach(function(year_i) {
  // get collection for the year [i]
  var x = collection.select('classification_' + year_i)
    // remap native classes to structural levels
    .remap({'from': native_classes.concat(ignore_classes),
            'to': native_classes_adjusted.concat(ignore_classes),
            'defaultValue': 0
    }) // mask anthropogenic areas
    //.selfMask()
    // rename
    .rename('classification_' + year_i);
  
  // store the result at recipe
  collection_x = collection_x.addBands(x);
});

Map.addLayer(collection_x, {}, 'NV collection', false);

// step a) remove spatial patches smaller than the persistence threshold
var step_a = ee.Image([]);
// for each class 
years_list.forEach(function(year_i) {
  // define recipe
  var recipe = ee.Image(0);
  
  // for each year
  assess_classes.forEach(function(class_j) {
    // get  current year classification 
    var current = collection_x.select('classification_' + year_i);
    
    /////////////////////// use 3yr filter for first and last
    // if is the first year
    if (year_i === years_list[0]) {
      // previous reference does'nt exists, use next two years to validate
      var next1 = collection_x.select('classification_' + String(year_i + 1));
      var next2 = collection_x.select('classification_' + String(year_i + 2));
      // compute persitence mask 
      var x = ee.Image(0).where(current.eq(class_j).and(next1.eq(class_j).and(next2.eq(class_j))), 1);
      // apply and store filtered 
      recipe = recipe.blend(current.updateMask(x.eq(1))).selfMask();
      return;
     }
    
    // if is the last year
    if (year_i === years_list[years_list.length - 1]) {
      // next reference does not exists, use twoprevious years to validate
      var prev1 = collection_x.select('classification_' + String(year_i - 1));
      var prev2 = collection_x.select('classification_' + String(year_i - 2));
      
      // compute persitence mask 
      var x = ee.Image(0).where(current.eq(class_j).and(prev1.eq(class_j).and(prev2.eq(class_j))), 1);
      // apply and store filtered 
      recipe = recipe.blend(current.updateMask(x.eq(1))).selfMask();
      return;
    }
    
    /////////////////////////////////////////////////////////// end of 3-yr filter (1985 & 2022)
    
    /////////// use 4 year filter for first+1 and last-1 years
    // if year == first +1  
    if (year_i === years_list[0] + 1) {
      // get previous
      var prev1 = collection_x.select('classification_' + String(year_i - 1));
      // get next years
      var next1 = collection_x.select('classification_' + String(year_i + 1));
      var next2 = collection_x.select('classification_' + String(year_i + 2));
      
      // compute persitence mask 
      var x = ee.Image(0).where(prev1.eq(class_j).and(current.eq(class_j).and(next1.eq(class_j))), 1)
                         .where(current.eq(class_j).and(next1.eq(class_j).and(next2.eq(class_j))), 1);

      // apply and store filtered 
      recipe = recipe.blend(current.updateMask(x.eq(1))).selfMask();
      return;
    }
    
    // if year == last + 1  
    if (year_i === years_list[years_list.length - 2]) {
      // get previous
      var prev1 = collection_x.select('classification_' + String(year_i - 1));
      var prev2 = collection_x.select('classification_' + String(year_i - 2));
      // get next years
      var next1 = collection_x.select('classification_' + String(year_i + 1));

      // compute persitence mask 
      var x = ee.Image(0).where(prev1.eq(class_j).and(current.eq(class_j).and(next1.eq(class_j))), 1)
                         .where(prev2.eq(class_j).and(prev1.eq(class_j).and(current.eq(class_j))), 1);

      // apply and store filtered 
      recipe = recipe.blend(current.updateMask(x.eq(1))).selfMask();
      return;
    }
    
    ///////////////////////////////////////////////// end of  4 year filter (1986 & 2021)
    
    ////////////////// start of the 5yr filter (mid years)
    if (year_i > years_list[0] + 1 & year_i < years_list[years_list.length - 2]) {
      // get previous years
      var prev1 = collection_x.select('classification_' + String(year_i - 1));
      var prev2 = collection_x.select('classification_' + String(year_i - 2));
      // get next years
      var next1 = collection_x.select('classification_' + String(year_i + 1));
      var next2 = collection_x.select('classification_' + String(year_i + 2));
      
      // compute persitence mask 
      var x = ee.Image(0).where(prev2.eq(class_j).and(prev1.eq(class_j).and(current.eq(class_j))), 1)
                         .where(prev1.eq(class_j).and(current.eq(class_j).and(next1.eq(class_j))), 1)
                         .where(current.eq(class_j).and(next1.eq(class_j).and(next2.eq(class_j))), 1);
      
       // apply and store filtered 
      recipe = recipe.blend(current.updateMask(x.eq(1))).selfMask();
      return;
    }
    
    ///////////////////////////////////////// end of 5 year filter (mid years)
     
   });
   
   // store
   step_a = step_a.addBands(recipe.rename('classification_' + year_i));
});
 

Map.addLayer(step_a, {}, 'step a', false);

////////////// STEP B
///////////////////////// GAPFILL

// discard zero pixels in the image
var image = step_a.mask(step_a.neq(0));
// set the list of years to be filtered
var years = years_list;

// user defined functions
var applyGapFill = function (image) {

    // apply the gap fill form t0 until tn
    var imageFilledt0tn = bandNames.slice(1)
        .iterate(
            function (bandName, previousImage) {

                var currentImage = image.select(ee.String(bandName));

                previousImage = ee.Image(previousImage);

                currentImage = currentImage.unmask(
                    previousImage.select([0]));

                return currentImage.addBands(previousImage);

            }, ee.Image(imageAllBands.select([bandNames.get(0)]))
        );

    imageFilledt0tn = ee.Image(imageFilledt0tn);

    // apply the gap fill form tn until t0
    var bandNamesReversed = bandNames.reverse();

    var imageFilledtnt0 = bandNamesReversed.slice(1)
        .iterate(
            function (bandName, previousImage) {

                var currentImage = imageFilledt0tn.select(ee.String(bandName));

                previousImage = ee.Image(previousImage);

                currentImage = currentImage.unmask(
                    previousImage.select(previousImage.bandNames().length().subtract(1)));

                return previousImage.addBands(currentImage);

            }, ee.Image(imageFilledt0tn.select([bandNamesReversed.get(0)]))
        );

    imageFilledtnt0 = ee.Image(imageFilledtnt0).select(bandNames);

    return imageFilledtnt0;
};

// get band names list 
var bandNames = ee.List(
    years.map(
        function (year) {
            return 'classification_' + String(year);
        }
    )
);

// generate a histogram dictionary of [bandNames, image.bandNames()]
var bandsOccurrence = ee.Dictionary(
    bandNames.cat(image.bandNames()).reduce(ee.Reducer.frequencyHistogram())
);

// insert a masked band 
var bandsDictionary = bandsOccurrence.map(
    function (key, value) {
        return ee.Image(
            ee.Algorithms.If(
                ee.Number(value).eq(2),
                image.select([key]).byte(),
                ee.Image().rename([key]).byte().updateMask(image.select(0))
            )
        );
    }
);

// convert dictionary to image
var imageAllBands = ee.Image(
    bandNames.iterate(
        function (band, image) {
            return ee.Image(image).addBands(bandsDictionary.get(ee.String(band)));
        },
        ee.Image().select()
    )
);

// generate image pixel years
var imagePixelYear = ee.Image.constant(years)
    .updateMask(imageAllBands)
    .rename(bandNames);

// apply the gap fill
var imageFilledtnt0 = applyGapFill(imageAllBands);
var imageFilledYear = applyGapFill(imagePixelYear);


// store
var step_b = imageFilledtnt0;
// check filtered image
Map.addLayer(step_b, {},  'step_b', false);

/////////////////////////////////////////////////////////// STEP C
//////////////////////////////////////////////////////////////////////// RUN ENCHORACHMENT/THINNING

// build and empty recipe with first year (no one changes in the first year)
var step_c = ee.Image(0).rename('classification_' +  years_list[0]);

// start from first + 1 
years_list.slice(1).forEach(function(year_i) {
  // get layers
  var current = step_b.select('classification_' + year_i);
  var prev1 = step_b.select('classification_' + String(year_i - 1));
  
  // set rules 
  var x = ee.Image(0)
    // where clas is the same, no change
    .where(current.eq(prev1), step_c.select('classification_' + String(year_i - 1)))
    // SET ENCHROACHMENT
    /// from savana to forest
    .where(prev1.eq(4).and(current.eq(3)), step_c.select('classification_' + String(year_i - 1)).add(1))
    /// from grassland to savana
    .where(prev1.eq(12).and(current.eq(4)), step_c.select('classification_' + String(year_i - 1)).add(1))
    /// from grassland to forest
    .where(prev1.eq(12).and(current.eq(3)), step_c.select('classification_' + String(year_i - 1)).add(2))
    // SET THINNING
    /// from forest to savana
    .where(prev1.eq(3).and(current.eq(4)), step_c.select('classification_' + String(year_i - 1)).subtract(1))
    /// from savana to grassland
    .where(prev1.eq(4).and(current.eq(12)), step_c.select('classification_' + String(year_i - 1)).subtract(1))
    /// from forest to grassland
    .where(prev1.eq(3).and(current.eq(12)), step_c.select('classification_' + String(year_i - 1)).subtract(2))
    // rename to store
    .rename('classification_' + year_i);
  
  // store
  step_c = step_c.addBands(x);
  
  
});

// plot results
Map.addLayer(step_c, {}, 'step_c', false);
//Map.addLayer(step_c.select('classification_2022'), {palette:['#AF00FB', '#FF0000', 'white', '#23FF00', '#0D5202'], min:-2, max:2}, 'enchroachment last year');

/////////////////////////////// end of step C

/////////////////////////////////////////// STEP D.
///////////////////  COMPUTE AGE OF LAST CHANGE

// first, get the number of native vegetation class changes, per year - to be used as input 
var n_changes = ee.Image([]);

// for each year
years_list.forEach(function(year_i) {
  // Use the filter method to create the subset list of years to be used
  var interval = years_list.filter(function(year) {
    return year <= year_i;
  });
  
  // Use the map() function to add 'classification_' before each value
  var band_names = interval.map(function(year) {
    return 'classification_' + year;
  });
  
  // filter collection for interval
  var x = step_c.select(band_names)
    //and compute the number of changes
    .reduce(ee.Reducer.countRuns()).subtract(1)
    // rename
    .rename('classification_' + year_i);
  
  // compute the number of changes
  n_changes = n_changes.addBands(x);
});

// plot
Map.addLayer(n_changes, {}, 'collection n_changes', false);

// now, use the layer n_changes to get the time since last NV structural change
var step_d = ee.Image([]);

years_list.forEach(function(year_i) {
  
  // get the number of changes
  var current = n_changes.select('classification_' + year_i);
  
  // if is the first year, all the age is equal to 0
  if (year_i === years_list[0]) {
    // insert a blank image, t=0
    step_d = step_d.addBands(ee.Image(0).rename('classification_' + year_i));
  }
  
  // if year is not the first, get ages
  if (year_i != years_list[0]) {
    // get n changes in the previous year
    var prev1 = n_changes.select('classification_' + String(year_i - 1));
    
    // apply rules to get age
    var x = ee.Image(0)
      // keep age == 0 when NV class doesn't change
      .where(current.eq(0), 0)
      // map first year of each change
      .where(current.neq(0).and(current.neq(prev1)), 1)
      // map age (time since the change)
      .where(current.neq(0).and(current.eq(prev1)), step_d.select('classification_' + String(year_i - 1)).add(1))
      // rename
      .rename('classification_' + year_i);
    
    // store
    step_d = step_d.addBands(x);
  }
  
});

Map.addLayer(step_d, {}, 'step_d', false);

//////////////////////////// end of step d
///////////////////////////////////////////// STEP E. MASK ANTHROPOGENIC YEARS /set water as NA

// build final recipe
var step_e_structure = ee.Image([]);
var step_e_age = ee.Image([]);

// for each year
years_list.forEach(function(year_i) {
  // get results
  var x = step_c.select('classification_' + year_i);
  var y = step_d.select('classification_' + year_i);
  
  // get reference for anthropogenic
  var ref = collection_x.select('classification_' + year_i);
  // get reference for water
  var water = collection.select('classification_' + year_i);
  
  // apply rules
  /// remove anthopogenic years
  x = x.updateMask(ref.neq(0)).rename('classification_' + year_i);
  /// mask water 
  x = x.updateMask(water.neq(33));
  // do the same for age 
  y = y.updateMask(ref.neq(0)).rename('classification_' + year_i);
  y = y.updateMask(water.neq(33));
  
  // bind
  step_e_structure = step_e_structure.addBands(x);
  step_e_age = step_e_age.addBands(y).selfMask();
  
});

// plot 
Map.addLayer(step_e_structure, {}, 'step e-structure', false);
Map.addLayer(step_e_structure.select('classification_2022'), {palette:['#AF00FB', '#FF0000', 'white', '#23FF00', '#0D5202'], min:-2, max:2}, 'enchroachment last year');
/////
Map.addLayer(step_e_age, {}, 'step e-age', false);
Map.addLayer(step_e_age.select('classification_2022'), {palette:['green', 'yellow', 'red'], min:1, max:10}, 'time since last change', false);


//////////////////////////////// end of step e


// data vis
Map.addLayer(n_changes.select('classification_2022'), {'min': 0, 'max': 5, 'palette': ["#C8C8C8", "#FED266", "#FBA713", "#cb701b",
                                                        "#a95512", "#662000", "#cb181d"],'format': 'png'}, 'sum of n changes', false);

//////////////////////////////
////// set properties
// structure change 
step_e_structure = step_e_structure.set({'version': version})
                                   .set({'product': 'change'});

// time since the last change                                   
step_e_structure = step_e_structure.set({'version': version})
                                   .set({'product': 'age'});

// export
Export.image.toAsset({
		image: step_e_structure,
    description: 'structure_change_v' + version,
    assetId: output + '/' + 'structure_change_v' + version,
    region: collection.geometry(),
    scale: 30,
    maxPixels: 1e13
    });

Export.image.toAsset({
		image: step_e_age,
    description: 'age_v' + version,
    assetId: output + '/' + 'age_v' + version,
    region: collection.geometry(),
    scale: 30,
    maxPixels: 1e13
    });
