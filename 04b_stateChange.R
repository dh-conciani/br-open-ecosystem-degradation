## compute state changes
## degradation

## import libraries
library(rgee)
ee_Initialize()

## get collection
collection <- ee$Image('projects/mapbiomas-workspace/public/collection7/mapbiomas_collection70_integration_v2')

## get grid list
grid <- ee$FeatureCollection('users/dh-conciani/basemaps/br_grid_25_x_25_km')

## get cartas name
grid_ids <- unique(grid$aggregate_array('id')$getInfo())

## for each carta
for (i in 1:length(grid_list)) {
  ## get carta [i]
  grid_i <- grid$filterMetadata('id', 'equals', grid_ids[i])
  
  ## get pixel values
  collection_i <- collection$sample(region= grid_i$geometry(), 
                                    scale = 30,
                                    geometries= TRUE,
                                    tileScale= 16)
  
  ## get locally
  collection_i_arr <- ee_as_sf(collection_i, via= 'drive')
  
  ## get only pixels that was native vegetation in the last year (2021)
  trajs <- subset(collection_i_arr, classification_2021 == 3 |
                                    classification_2021 == 4 |
                                    classification_2021 == 11 |
                                    classification_2021 == 12 |
                                    classification_2021 == 33)
  
  ## for each pixel [id]
  
  ### get trajectory
  traj_i <- collection_i_arr[1,]
  
  
  
  
  
  
}

print()
