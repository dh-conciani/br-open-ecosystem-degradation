## compute state changes
## degradation

## import libraries
library(rgee)
library(stringr)
ee_Initialize()

## set native classes
native_classes = c(3, 4, 11, 12)

## set ignored classes
ignore_classes = c(33, 27)

## get collection
collection <- ee$Image('projects/mapbiomas-workspace/public/collection7/mapbiomas_collection70_integration_v2')

## get grid list
grid <- ee$FeatureCollection('users/dh-conciani/basemaps/br_grid_25_x_25_km')

## get cartas name
grid_ids <- unique(grid$aggregate_array('id')$getInfo())

## for each carta
for (i in 1:length(grid_list)) {
  print(paste0('processing tile ', i, ' of ', length(grid_ids)))
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
  trajs_nv_ly <- subset(collection_i_arr, classification_2021 == 3 |
                                          classification_2021 == 4 |
                                          classification_2021 == 11 |
                                          classification_2021 == 12 |
                                          classification_2021 == 33 |
                                          classification_2021 == 27)
  
  
 ## for each pixel
  for (j in 1:length(unique(trajs_nv_ly$id))) {
    print(paste0('processing pixel ', j, ' of ', length(unique(trajs_nv_ly$id))))
    ## get pixel i
    pixel_ij <- subset(trajs_nv_ly, id == unique(trajs_nv_ly$id)[j])
          
  }
  
  
  
  
  
  
  
}

