## compute landscape metrics for mapbiomas degradation working group 
## mauricio vancine // dhemerson conciani 
# prepare r ---------------------------------------------------------------

# install packages
#install.packages(c("remotes", "tidyverse", "terra"))
#remotes::install_github("mauriciovancine/lsmetrics", force = TRUE)

# packages
library(tidyverse)
library(terra)
library(lsmetrics)
library(parallel)

# list mapbiomas files
files <- list.files(path = "./tif", pattern = ".tif", full.names = TRUE)
years <- seq(1985, 2024)
prefix <- 'nativeMask_classification_'

## prepare grassdb ---------------------------------------------------------
# find grass
path_grass <- system("grass --config path", inter = TRUE) # windows users need to find the grass gis path installation, e.g. "C:/Program Files/GRASS GIS 8.3"

# import raster (only to initialize grassdb)
r <- terra::rast(files[1])
r

# create grassdb
rgrass::initGRASS(gisBase = path_grass,
                  SG = r,
                  gisDbase = "./grassdb",
                  location = "newLocation",
                  mapset = "PERMANENT",
                  override = TRUE)

## import mapbiomas files to grassdb
mclapply(
  files,
  function(x) rgrass::execGRASS(
    cmd = 'r.in.gdal',
    input = x,
    output = sub('.tif$', '', basename(x))
  ),
  mc.cores = detectCores() - 1  # Use all but one core
)

# metrics -----------------------------------------------------------------
## fragment area --
mclapply(
  years,
  function(x) lsmetrics::lsm_area_fragment(
    input = paste0(prefix, x),
    zero_as_null = FALSE,
    area_round_digit = 2,
    area_unit = 'ha',
    map_fragment_id = TRUE,
    map_fragment_ncell = TRUE,
    table_fragment_area = TRUE,
  ),
  mc.cores = detectCores() - 1  
)


## patch area --
mclapply(
  years, 
  function(x) lsmetrics::lsm_area_patch(
    input = paste0(prefix, x),
    zero_as_null = FALSE,
    area_round_digit = 2,
    area_unit = "ha",
    map_patch_id = TRUE,
    map_patch_ncell = TRUE,
    map_patch_area = TRUE,
    map_patch_area_original = TRUE,
    map_patch_number_original = TRUE,
    nprocs = 10,
    memory = 1e6
  ),
  mc.cores = detectCores() - 1 
)

# morphology ----
mclapply(
  years,
  function(x) lsmetrics::lsm_morphology(
    input = paste0(prefix, x),
    zero_as_null = FALSE,
    memory = 1e6,
  ),
  mc.cores = detectCores() - 1
)

# perimeter ----
mclapply(
  years,
  function(x) lsmetrics::lsm_perimeter(
    input = paste0(prefix, x),
    zero_as_null = FALSE,
    map_perimeter_area_ratio_index = TRUE,
    map_shape_index = TRUE,
    map_fractal_index = TRUE,
    memory = 1e6),
  mc.cores = detectCores() - 1
)

# structural connectivity ----
mclapply(
  years, 
  function(x) lsmetrics::lsm_connectivity_structural(
    input = paste0(prefix, x),
    zero_as_null = FALSE,
    area_round_digit = 2,
    area_unit = "ha",
    map_connec_struct = TRUE,
    map_connec_struct_area = TRUE,
    memory = 1e6),
  mc.cores = detectCores() - 1
)

## functional connectivity
mclapply(
  years,
  function(x) lsmetrics::lsm_connectivity_functional(
    input = paste0(prefix, x),
    zero_as_null = FALSE,
    area_round_digit = 2,
    area_unit = "ha",
    gap_crossing_value = 31,
    map_func_connec = TRUE,
    map_func_connec_id = TRUE,
    map_func_connec_area = TRUE,
    map_func_connec_ncell = TRUE,
    map_func_connec_dilation = TRUE,
    memory = 1e6),
  mc.cores = detectCores() - 1
)

## isolation (distance enn)
mclapply(
  years, 
  function(x)  lsmetrics::lsm_distance_enn(input = paste0(prefix, x),
                                           zero_as_null = FALSE,
                                           distance_round_digit = 0
  ),
  mc.cores = detectCores() - 1
)
