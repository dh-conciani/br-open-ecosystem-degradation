// get patch sizes

// -- * definitions
// set native vegetation classes
var native_classes = {
  'amazonia':       [3, 4, 5, 11, 12],
  'caatinga':       [3, 4, 5, 11, 12],
  'cerrado':        [3, 4, 5, 11, 12],
  'mata_atlantica': [3, 4, 5, 11, 12],
  'pampa':          [3, 4, 5, 11, 12],
  'pantanal':       [3, 4, 5, 11, 12]
};

// set patch size rules (in hectares)
var patch_sizes = [1, 2, 3, 4, 5, 10];

// Set years to be processed 
var years_list = [1985, 1986, 1987, 1988, 1989, 1990, 1991, 1992, 1993, 1994, 1995,
                  1996, 1997, 1998, 1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006,
                  2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017,
                  2018, 2019, 2020, 2021, 2022];


// -- * get patche size 
// dissolve all native veg. classes into each one
var native_l0 = collection_i.remap({
  from: native_classes[biome_i],
  to: ee.List.repeat(1, ee.List(native_classes[biome_i]).length())
});

// get patch sizes
// convert ha to number of pixels
var size_criteria = parseInt((patch_size_rules[biome_i] * 10000) / 900);
// compute patche sizes
var patch_size = native_l0.connectedPixelCount(size_criteria + 5, true);

// get only patches smaller than the criteria
var size_degradation = patch_size.lte(size_criteria).selfMask();
