## compute state changes
## degradation

## import libraries
library(rgee)
library(stringr)
ee_Initialize()

## set native classes
native_classes <- c(3, 4, 11, 12, 33, 27)

## set persistence rule threshold (in years)
persistence <- 2

## set ignored classes
##ignore_classes <- c(33, 27)

## set years
years_list <- seq(1985, 2021)

## get collection
collection <- ee$Image('projects/mapbiomas-workspace/public/collection7/mapbiomas_collection70_integration_v2')

## remmap native vegetation to 1
for(i in 1:length(years_list)) {
  ## read year i
  collection_y <- collection$select(paste0('classification_', years_list[i]))
  ## remap
  collection_y <- collection_y$remap(
    from= native_classes,
    to= rep(1, length(native_classes)),
    defaultValue= 0
  )
  
  ## store
  if (exists('remmaped_nv') == FALSE) {
    remmaped_nv <- collection_y$rename(paste0('classification_', years_list[i]))
  } else {
    remmaped_nv <- remmaped_nv$addBands(collection_y$rename(paste0('classification_', years_list[i])))
  }
  
}

## get the number of classes
nClasses <- remmaped_nv$reduce(ee$Reducer$countDistinctNonNull())

## get only stable as NV 
stable <- remmaped_nv$select(0)$multiply(nClasses$eq(1))

## filter the entire collection only for stable NV
collection <- collection$updateMask(stable$eq(1))

## check stability in the level-3 and retain only patches of NV that changed of class
nClasses3 <- collection$reduce(ee$Reducer$countDistinctNonNull())

## updateCollection only with NV that have changed
collection <- collection$updateMask(nClasses3$neq(1))

Map$addLayer(collection$select(0)$randomVisualizer(), {}, 'Stable NV that changed class')

## get grid list
grid <- ee$FeatureCollection('users/dh-conciani/basemaps/br_grid_25_x_25_km')

## get cartas name
grid_ids <- unique(grid$aggregate_array('id')$getInfo())

## for each carta
for (i in 1:length(grid_ids)) {
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
  

  ## for each pixel
  for (j in 1:length(unique(collection_i_arr$id))) {
    print(paste0('processing pixel ', j, ' of ', length(unique(collection_i_arr$id))))
    ## get pixel [i]
    pixel_ij <- subset(collection_i_arr, id == unique(collection_i_arr$id)[j])
    
    ## transform cells to a list
    for (k in 1:length(years_list)) {
      # open list with first year value
      if (exists('list_ij') == FALSE) {
        list_ij <- as.data.frame(pixel_ij[paste0('classification_', years_list[k])])[,1]
        ## insert next year classes
      } else {
        list_ij <- c(list_ij, 
                     as.data.frame(pixel_ij[paste0('classification_', years_list[k])])[,1])
      }
    }
    
    ## Now, pixel_ij contains the 'barcode' of trajectory
    
    ## Extract trajectory classes, preserve ordering and get their respective frequency
    traj_res <- as.data.frame(cbind(
                  value= rle(list_ij)$values,
                  length= rle(list_ij)$lengths))
    
    ## Discard segments with less than 2 years in the trajectory
    traj_res <- subset(traj_res, length > persistence)
    
    ## If start and final classes are the same, compute as a temporary change
    if (traj_res$value[1] == traj_res$value[nrow(traj_res)]) {
      
    }

    
    
  }
  
}


