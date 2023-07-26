## qualify state change among enchroachment or thinning
## dhemerson.costa@ipam.org.br
## gt degradação mapbiomas

########## next work - labels of temproary changes

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

## Set persistance rule (greater than)
persistence <- 2

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

## for each carta 
for (i in 1:length(grid_ids)) {
  print(paste0('processing tile ', i, ' of ', length(grid_ids)))
  ## Get carta [i]
  grid_i <- grid$filterMetadata('id', 'equals', grid_ids[i])
  
  ## check if the grid is already processed and, if true, skip iteration
  if (grid_ids[i] %in% ee$ImageCollection(out_dir)$aggregate_array('system:index')$getInfo() == TRUE) {
    next
  }
  
  ## Get pixel values
  collection_i <- collection$sample(region= grid_i$geometry(), 
                                    scale = 30,
                                    geometries= TRUE,
                                    tileScale= 16)
  
  # Call a function that might throw an error
  print('Downloading sampled results')
  result <- try({
    collection_i_arr <- ee_as_sf(collection_i, via = "drive", quiet= TRUE)
  }, silent = TRUE)

  # Check if there was an error
  if (inherits(result, "try-error")) {
    # Extract the error message from the result object
    result <- as.character(result)
  }
  print('Download OK!')
  
  ## HERE STARTS THE RULES TO DEAL WITH THE ERRORS
  ## RULE 1: And it is empty (full NA), export a full-NA grid
  if(grepl("The source could be corrupt or not supported", result) == TRUE) {
    # Do something if the text is found
    print('Downloading tile to export as NA')
    
    # Define the raster extent and resolution as the same of the grid
    r <- raster(extent(ee_as_sf(grid_i, via = 'drive')), resolution = 0.0002694946 )
    ## Set all pixels to NA
    r <- setValues(r, NA)
    
    # Set the projection to EPSG 4326
    r@crs <- CRS("+init=EPSG:4326")
    proj4string(r) <- CRS("+proj=longlat +datum=WGS84")
    
    ## Export to GEE
    raster_as_ee(
      x = r,
      overwrite = TRUE,
      assetId = paste0(out_dir, '/', grid_ids[i]),
      bucket = "degrad-traj1"
    )
    
    rm(r, result)
    gc()
    next
  } 
  
  print('Getting trajectories')
  # Convert the data.frame to a list where each row is an independent sublist
  lst <- apply(collection_i_arr, 1, as.list)
  # Remove the first (id) and last (geometry) entries of each sublist
  lst_x <- lapply(lst, function(x) x[2:(length(x)-1)])
  ## Get trajectories as lists
  trajs <- lapply(lst_x, function(pixel) c(
    pixel$classification_1985, pixel$classification_1986, pixel$classification_1987, 
    pixel$classification_1988, pixel$classification_1989, pixel$classification_1990, 
    pixel$classification_1991, pixel$classification_1992, pixel$classification_1993,
    pixel$classification_1994, pixel$classification_1995, pixel$classification_1996, 
    pixel$classification_1997, pixel$classification_1998, pixel$classification_1999,
    pixel$classification_2000, pixel$classification_2001, pixel$classification_2002,
    pixel$classification_2003, pixel$classification_2004, pixel$classification_2005,
    pixel$classification_2006, pixel$classification_2007, pixel$classification_2008,
    pixel$classification_2009, pixel$classification_2010, pixel$classification_2011,
    pixel$classification_2012, pixel$classification_2013, pixel$classification_2014,
    pixel$classification_2015, pixel$classification_2016, pixel$classification_2017,
    pixel$classification_2018, pixel$classification_2019, pixel$classification_2020,
    pixel$classification_2021))
  
  ## Compute Run Length Encoding
  traj_rle <- lapply(trajs, function(pixel) as.data.frame(cbind(
    value= rle(pixel)$values,
    length= rle(pixel)$lengths))) 
  
  ## Remove temporal segments with less than persistence threshold
  traj_rle <- lapply(traj_rle, function(pixel) subset(pixel, length > persistence))
  
  ## Remove stable pixels 
  
  ################ HERE IS PLACED THE RULES #################
  ## QUALIFY TRAJECTORIES
  traj_res <- lapply(traj_rle, function(pixel) 
    ######################## DEAL WITH PERMANENT CHANGE
    ## SEGMENT 1: WOODY ENCHROACHMENT
    ## RULE A: IF START CLASS IS 4 (SAVANNA) AND FINAL CLASS IS 3 (FOREST) IT WAS A WOODY ENCHORACHMENT
    if (pixel$value[1] == 4 & pixel$value[length(pixel$value)] == 3) {
      return(paste0('Savanna -> Forest;Persistent Enchroachment;', pixel$length[length(pixel$length)]))
    } else {
      ## RULE B: IF START CLASS IS 12 (GRASSLAND) AND FINAL CLASS IS 3 (FOREST) IT WAS A WOODY ENCHORACHMENT
      if (pixel$value[1] == 12 & pixel$value[length(pixel$value)] == 3) {
        return(paste0('Grassland -> Forest;Persistent Enchroachment;', pixel$length[length(pixel$length)]))
      }
      ## RULE C: IF START CLASS IS 12 (GRASSLAND) AND FINAL CLASS IS 4 (SAVANNA) IT WAS A WOODY ENCHORACHMENT
      if (pixel$value[1] == 12 & pixel$value[length(pixel$value)] == 4) {
        return(paste0('Grassland -> Savanna;Persistent Enchroachment;', pixel$length[length(pixel$length)]))
      }
      
      # SEGMENT 2: WOODY THINNING
      ## RULE D: IF START CLASS IS 3 (FOREST) AND FINAL CLASS IS 4 (SAVANNA) IT WAS A WOODY THINNING
      if (pixel$value[1] == 3 & pixel$value[length(pixel$value)] == 4) {
        return(paste0('Forest -> Savanna;Persistent Thinning;', pixel$length[length(pixel$length)]))
      }
      ## RULE E: IF START CLASS IS 3 (FOREST) AND FINAL CLASS IS 12 (GRASSLAND) IT WAS A WOODY THINNING
      if (pixel$value[1] == 3 & pixel$value[length(pixel$value)] == 12) {
        return(paste0('Forest -> Grassland;Persistent Thinning;',  pixel$length[length(pixel$length)]))
      }
      ## RULE F: IF START CLASS IS 4 (SAVANNA) AND FINAL CLASS IS 12 (GRASSLAND) IT WAS A WOODY THINNING
      if (pixel$value[1] == 4 & pixel$value[length(pixel$value)] == 12) {
        return(paste0('Savanna -> Grassland;Persistent Thinning;',  pixel$length[length(pixel$length)]))
      }
      
      ## PLACE RULES FOR TEMPORARY CHANGES
      if (pixel$value[1] == pixel$value[length(pixel$value)]) {
        ## IF START/FINAL CLASS IS 3 (FOREST) 
        if(pixel$value[length(pixel$value)] == 3) {
          ## If stable pixel exits, insert label
          if(nrow(pixel) == 1) {
            return('Stable')
          }
          ## REMOVE INITIAL/FINAL CLASS FROM THE ARRAY
          x <- pixel[pixel$value != 3,]
          if(nrow(x) == 0) {
            return('Inconclusive')
          }
          ## RULE G: AND INTERMEDIARY CLASS IS 4 (SAVANNA), IT WAS A TEMPORARY THINNING
          if (x$value[length(x$value)] == 4) {
            return('Forest -> Savanna -> Forest (Temporary Thinning)')
          }
          ## RULE H: AND INTERMEDIARY CLASS IS 12 (GRASSLAND), IT WAS A TEMPORARY WOODY THINNING
          if (x$value[length(x$value)] == 12) {
            return('Forest -> Grassland -> Forest (Temporary Thinning)')
          }
        }
        
        ## IF START/FINAL CLASS IS 4 (SAVANNA) 
        if(pixel$value[length(pixel$value)] == 4) {
          ## If stable pixel exits, insert label
          if(nrow(pixel) == 1) {
            return('Stable')
          }
          ## REMOVE INITIAL/FINAL CLASS FROM THE ARRAY
          x <- pixel[pixel$value != 4,]
          if(nrow(x) == 0) {
            return('Inconclusive')
          }
          ## RULE I: AND INTERMEDIARY CLASS IS 3 (FOREST), IT WAS A TEMPORARY ENCHROACHMENT
          if (x$value[length(x$value)] == 3) {
            return('Savanna -> Forest -> Savanna (Temporary Enchroachment)')
          }
          ## RULE J: AND INTERMEDIARY CLASS IS 12 (GRASSLAND), IT WAS A TEMPORARY WOODY THINNING
          if (x$value[length(x$value)] == 12) {
            return('Savanna -> Grassland -> Savanna (Temporary Thinning)')
          }
        }
        
        ## IF START/FINAL CLASS IS 12 (GRASSLAND) 
        if(pixel$value[length(pixel$value)] == 12) {
          ## If stable pixel exits, insert label
          if(nrow(pixel) == 1) {
            return('Stable')
          }
          ## REMOVE INITIAL/FINAL CLASS FROM THE ARRAY
          x <- pixel[pixel$value != 12,]
          if(nrow(x) == 0) {
            return('Inconclusive')
          }
          ## RULE K: AND INTERMEDIARY CLASS IS 3 (FOREST), IT WAS A TEMPORARY ENCHROACHMENT
          if (x$value[length(x$value)] == 3) {
            return('Grassland -> Forest -> Grassland')
          }
          ## RULE L: AND INTERMEDIARY CLASS IS 4 (SAVANNA), IT WAS A TEMPORARY WOODY ENCHRACHMENT
          if (x$value[length(x$value)] == 4) {
            return('Grassland -> Savanna -> Grassland')
          }
        }
      }
    })
  
  # Combine lists and maintain sublist index
  combined_list <- Map(function(lst, traj_res) c(lst, traj_res), lst, traj_res)
  
  
  
  }




Map$addLayer(state_change, list(palette=c('#2D7E1D', '#75F70A', '#606060', '#FFF700', '#F41BE7'),
                                min=1, max=5), 'NV state change') +
  Map$addLayer(collection$select('classification_2021'))



