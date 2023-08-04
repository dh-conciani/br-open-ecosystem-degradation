## read libraries
library(rgee)
library(stringr)
library(sf)
library(dplyr)
library(googleCloudStorageR)
library(raster)
library(stars)

## Start APIs
ee_Initialize(drive= TRUE, gcs= TRUE)

## list files
out_dir <- 'projects/mapbiomas-workspace/DEGRADACAO/TRAJECTORIES/COL71/QUALIFY_CHANGES_V1'

## get biomes featureCollection 
biomes <- ee$FeatureCollection('projects/mapbiomas-workspace/AUXILIAR/biomas-2019')$
  filterMetadata('Bioma', 'equals', 'Pantanal') ## select Pantanal 

## Trajectory assessment is too complex. For this, we used a regular tile of 25 x 25 km approach 
grid <- ee$FeatureCollection('users/dh-conciani/basemaps/br_grid_50_x_50_km')$
  filterBounds(biomes)

## Get tile label
grid_ids <- unique(grid$aggregate_array('id')$getInfo())

## exclude pantanal files from root
for (i in 1:length(grid_ids)) {
  print(paste0('deleting ', grid_ids[i]))
  try(ee_manage_delete(paste0(out_dir, '/', grid_ids[i])), silent= TRUE)
}

length(grid_ids)
