## compute state changes
## degradation

## import libraries
library(rgee)
library(stringr)
ee_Initialize()

## Set classes to be considered as native vegetation in the last year (native classes + ignored)
native_classes <- c(3, 4, 11, 12, 33, 27)

## Set classes to be used in the state change analisys
assess_classes <- c(3, 4, 11, 12)

## set persistence rule threshold (in years)
persistence <- 2

## set years
years_list <- seq(1985, 2021)

## get collection
collection <- ee$Image('projects/mapbiomas-workspace/public/collection7/mapbiomas_collection70_integration_v2')

## get last year classification
collection_last <- collection$select('classification_2021')$
  ## and remmap to retain only native vegetation
  remap(
    from= native_classes,
    to= rep(1, length(native_classes)),
    defaultValue= 0)$
  selfMask()

## clip the entire collection for the native vegetation of the last year
collection <- collection$updateMask(collection_last)

## To simplify the local API processing, remove the 100% stable native vegetation
## For this, compute the number of classes in the time-series 
nClasses <- collection$reduce(ee$Reducer$countDistinctNonNull())

## And mask the collection to get only native vegetation that occurs in 2021 and is unstable over the time-series
collection <- collection$updateMask(nClasses$neq(1))

## Inspect
Map$addLayer(nClasses$randomVisualizer(), {}, 'Number of classes') +
  Map$addLayer(collection2$randomVisualizer(), {}, 'Unstable native vegetation')

## Trajectory assessment is too complex. For this, we used a regular tile of 25 x 25 km approach 
grid <- ee$FeatureCollection('users/dh-conciani/basemaps/br_grid_25_x_25_km')

## Get tile label
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

  ## For each pixel in the map
  for (j in 1:length(unique(collection_i_arr$id))) {
    print(paste0('processing pixel ', j, ' of ', length(unique(collection_i_arr$id))))
    ## Get pixel [i]
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
    
    ## Discard temporal segments with less than 2 years in the trajectory
    traj_res <- subset(traj_res, length > persistence)
    
    ## Get only assessment classes (discard anthropogenic and ignored)
    traj_res <- subset(traj_res, value %in% assess_classes)
    
    
    ################# HERE IS PLACED THE RULES #################
    
    ## @@ RULE 1: TEMPORARY VS. PERSISTENT CHANGES  @@
    ## INCONCLUSIVE: NO-ONE TRAJECTORY OF NV CLASSES SATISFIES THE PERSISTANCE CRITERIA
    if (nrow(traj_res) == 0) {
      condition <- 'Inconclusive'
    } else {
      ## IF START CLASS IS EQUALS TO END CLASS (FILTERED BY 2 YEAR STABILITY) 
      if (traj_res$value[1] == traj_res$value[nrow(traj_res)])  {
        ## AND THE NUMBER OF NATIVE CLASSES IN THE SERIE WAS DIFFERENT OF ONE
        ## THIS WAS A "TEMPORARY CHANGE"
        if (length(unique(traj_res$value)) != 1) {
          condition <- 'Temporary'
        } 
        ## IF THE NUMBER OF NATIVE CLASSES IS EQUAL TO ONE OVER THE ENTIRE TIME-SERIES, IT WAS NO CHANGE
        if (length(unique(traj_res$value)) == 1) {
          condition <- 'No change'
        }
      }
        
    ## PERSISTENT: IF END CLASS IS DIFFERENT OF THE START CLASS (FILTERED BY 2 YEARS STABILITY) THE CHANGE WAS PERSISTENT CHANGE
    if (traj_res$value[1] != traj_res$value[nrow(traj_res)]) {
      condition <- 'Persistent'
      }
    }
    
    ######################## HERE ENDS THE RULES ###################################
    
    

    
    ## Build pixel result
    pixel_ij$condition <- condition
    pixel_ij <- pixel_ij['condition']
    
    ## Store into grid data.frame
    if (exists('grid_df') == FALSE) {
      grid_df <- pixel_ij
    } else {
      grid_df <- rbind(grid_df, pixel_ij)
    }
    
    ## remove temproary files
    rm(list_ij, condition, pixel_ij)
  }
  
  ## Re-build the image from the array
  
  
  
  rm(grid_df)
}

