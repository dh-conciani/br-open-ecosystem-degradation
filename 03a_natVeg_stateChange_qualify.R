## qualify state change among enchroachment or thinning
## dhemerson.costa@ipam.org.br
## gt degradação mapbiomas

## read libraries
library(rgee)
library(stringr)
library(sf)
library(dplyr)
library(googleCloudStorageR)
library(raster)

## Start APIs
ee_Initialize(drive= TRUE, gcs= TRUE)

## set output directory
out_dir <- 'projects/mapbiomas-workspace/DEGRADACAO/TRAJECTORIES/COL71/QUALIFY_CHANGES_V1'

## Set classes to be considered in the trajectory analisys
native_classes <- c(3, 4, 11, 12)
native_classes_adjusted <- c(3, 4, 12, 12)

## Set classes to be used in the state change analisys
assess_classes <- c(3, 4, 12) ## 11 (wetland will be remmaped to grassland)

## read entry layer (state change in the level-0)
state_change <- ee$Image('projects/mapbiomas-workspace/DEGRADACAO/TRAJECTORIES/COL71/NV_CHANGE_V3')$
  remap(from= c(1, 2, 3, 4, 5),
        to=   c(2, 3, 4, 5, 1))

## set years
years_list <- seq(1985, 2021)

## get biomes featureCollection 
biomes <- ee$FeatureCollection('projects/mapbiomas-workspace/AUXILIAR/biomas-2019')

## get collection
collection <- ee$Image('projects/mapbiomas-workspace/public/collection7/mapbiomas_collection70_integration_v2')

## remap to consider grassland and wetland as a unique class (id 12)
years_to_remap <- sub(".*_", "", collection$bandNames()$getInfo())
collection_x <- ee$Image() ## build an empty recipe 
for (i in 1:length(years_to_remap)) {
  ## get collection for the year i
  x <- collection$select(paste0('classification_', years_to_remap[i]))
  ## remap
  x <- x$remap(
    from= native_classes,
    to= native_classes_adjusted,
    defaultValue= c(0)
  )$rename(paste0('classification_', years_to_remap[i]))$selfMask()
  
  ## bind
  collection_x <- collection_x$addBands(x)
} 

## remove 'null' band
collection <- collection_x$select(collection_x$bandNames()$slice(1)); rm(collection_x, x)

## Mask collections to get only pixels that have temporary or permanent change
collection <- collection$updateMask(state_change$gte(4)) ## consider values 4 (temporary) and 5 (permanent)

## Trajectory assessment is too complex. For this, we used a regular tile of 50 x 50 km approach 
grid <- ee$FeatureCollection('users/dh-conciani/basemaps/br_grid_50_x_50_km')

## Get tile label
grid_ids <- unique(grid$aggregate_array('id')$getInfo())

## Get tiles already processed
processed <- ee$ImageCollection(out_dir)$aggregate_array('system:index')$getInfo()

## Get tiles with letters that have been entirely sub-processed
processed_with_letters <- row.names(
  subset(as.data.frame(cbind(table(
    gsub("[[:alpha:]]", "", grep("\\d+[a-zA-Z]", processed, value = TRUE, perl= TRUE)
    )))), V1 == 4))

## Remove already processed
if(length(processed) > 0) {
  grid_ids <- grid_ids[-which(grid_ids %in% processed)]
}

if(length(processed_with_letters) > 0) {
  grid_ids <- grid_ids[-which(grid_ids %in% processed_with_letters)]
}




Map$addLayer(state_change, list(palette=c('#2D7E1D', '#75F70A', '#606060', '#FFF700', '#F41BE7'),
                                min=1, max=5), 'NV state change') +
  Map$addLayer(collection$select('classification_2021'))



