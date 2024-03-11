// export dashboard landing page assets
// dhemerson.costa@ipam.org.br

// list years to be processed
var years = [1985, 1986, 1987, 1988, 1989, 1990, 1991, 1992, 1993, 1993, 1995, 1996, 1997,
             1998, 1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010,
             2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022];

// set classes to be processed
var classList = [3, 4, 5, 6, 11, 12, 49, 50];

////////////// edge size ************
var edge_asset = 'projects/mapbiomas-workspace/DEGRADACAO/COLECAO/BETA/PROCESS/edge_area/';
var edge_version = '2';
var edge_sizes = [1000, 600, 300, 150, 120, 90, 60, 30];

// build recipe
var recipe_edges = ee.Image([]);

// for each year 
years.forEach(function(year_i) {
  // for each edge size 
  edge_sizes.forEach(function(size_i) {
    // read file 
    var edge = ee.Image(edge_asset + 'edge_' + size_i + 'm_v' + edge_version);
    // perform remap 
    edge = edge.remap({
      'from': classList,
      'to': ee.List.repeat({'value': size_i, 'count': classList.length})
    }).rename('edge_');
    
  });
});



////////////// patch ************
var edge_asset = 'projects/mapbiomas-workspace/DEGRADACAO/COLECAO/BETA/PROCESS/patch_size/';
var edge_version = '3';
var edge_sizes = [3, 5, 10, 25, 50, 75];

//var edge = ee.Image(edge_asset + 'size_' + size_i + 'ha_v' + edge_version);


////////////// isolation ************
