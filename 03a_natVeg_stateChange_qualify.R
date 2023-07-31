## qualify state change among enchroachment or thinning
## dhemerson.costa@ipam.org.br
## gt degradação mapbiomas

########## next work - trajectory labels

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
  if(unique(grepl("The source could be corrupt or not supported", result)) == TRUE ||
     nrow(result) == 0) {
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
      bucket = "degrad-structure-change"
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
            return('Stable;Stable;37')
          }
          ## REMOVE INITIAL/FINAL CLASS FROM THE ARRAY
          x <- pixel[pixel$value != 3,]
          ## if does not exist intermediary class, flag as inconclusive
          if(nrow(x) == 0) {
            return('Inconclusive;Inconclusive;37')
          }
          ## RULE G: AND INTERMEDIARY CLASS IS 4 (SAVANNA), IT WAS A TEMPORARY THINNING
          if (x$value[length(x$value)] == 4) {
            return(paste0('Savanna -> Forest;Temporary Thinning;', pixel$length[length(pixel$length)]))
          }
          ## RULE H: AND INTERMEDIARY CLASS IS 12 (GRASSLAND), IT WAS A TEMPORARY WOODY THINNING
          if (x$value[length(x$value)] == 12) {
            return(paste0('Grassland -> Forest;Temporary Thinning;',  pixel$length[length(pixel$length)]))
          }
        }
        
        ## IF START/FINAL CLASS IS 4 (SAVANNA) 
        if(pixel$value[length(pixel$value)] == 4) {
          ## If stable pixel exits, insert label
          if(nrow(pixel) == 1) {
            return('Stable;Stable;37')
          }
          ## REMOVE INITIAL/FINAL CLASS FROM THE ARRAY
          x <- pixel[pixel$value != 4,]
          if(nrow(x) == 0) {
            return('Inconclusive;Inconclusive;37')
          }
          ## RULE I: AND INTERMEDIARY CLASS IS 3 (FOREST), IT WAS A TEMPORARY ENCHROACHMENT
          if (x$value[length(x$value)] == 3) {
            return(paste0('Forest -> Savanna;Temporary Enchroachment;', pixel$length[length(pixel$length)]))
          }
          ## RULE J: AND INTERMEDIARY CLASS IS 12 (GRASSLAND), IT WAS A TEMPORARY WOODY THINNING
          if (x$value[length(x$value)] == 12) {
            return(paste0('Grassland -> Savanna;Temporary Thinning;', pixel$length[length(pixel$length)]))
          }
        }
        
        ## IF START/FINAL CLASS IS 12 (GRASSLAND) 
        if(pixel$value[length(pixel$value)] == 12) {
          ## If stable pixel exits, insert label
          if(nrow(pixel) == 1) {
            return('Stable;Stable;37')
          }
          ## REMOVE INITIAL/FINAL CLASS FROM THE ARRAY
          x <- pixel[pixel$value != 12,]
          if(nrow(x) == 0) {
            return('Inconclusive;Inconclusive;37')
          }
          ## RULE K: AND INTERMEDIARY CLASS IS 3 (FOREST), IT WAS A TEMPORARY ENCHROACHMENT
          if (x$value[length(x$value)] == 3) {
            return(paste0('Forest -> Grassland;Temporary Enchroachment;', pixel$length[length(pixel$length)]))
          }
          ## RULE L: AND INTERMEDIARY CLASS IS 4 (SAVANNA), IT WAS A TEMPORARY WOODY ENCHRACHMENT
          if (x$value[length(x$value)] == 4) {
            return(paste0('Savanna -> Grassland;Temporary Enchroachment;', pixel$length[length(pixel$length)]))
          }
        }
      }
    })
  
  # Combine lists and maintain sublist index
  combined_list <- Map(function(lst, traj_res) c(lst, traj_res), lst, traj_res)
  # Convert the list to a data.frame
  df <- as.data.frame(do.call(rbind, combined_list))
  # Rename last column (result)
  colnames(df)[length(df)] <- 'Result'
  # Parse results into independent entries using ";" as delimiter
  results_list <- lapply(df$Result, function(string) 
    return(strsplit(string, ';')))
  # Use sapply to put parsed results into de data.frame
  df$trajectory <- sapply(results_list, function(result) return(unlist(result)[1]))
  df$ecological_flag <- sapply(results_list, function(result) return(unlist(result)[2]))
  df$age <- sapply(results_list, function(result) return(unlist(result)[3]))
  # Split the geometry column into longitude and latitude columns
  df$longitude <- as.numeric(sub(".*\\(([^,]+),.*", "\\1", df$geometry))
  df$latitude <- as.numeric(sub(".*,\\s*([^\\)]+)\\)", "\\1", df$geometry))
  # Remove the geometry column
  df <- df[, !(names(df) %in% c("geometry"))]
  # Convert to sf object with point geometry
  df_sf <- st_as_sf(df, coords = c("longitude", "latitude"), crs = 4326)
  
  # Translate legend
  ## Use ecological flags to store the time-flag (Temporary or Persistent) and the process (Thinning and Enchroachment)
  ## To get time-flag, divide by 100 and apply a round (4= Temporary; 5= Persistent)
  ## To get the ecological process, apply the modulo (%% 100) (30= Thinning; 40= Enchroachment)
  df_sf$ecological_id <- gsub("Inconclusive", 100,
                          gsub("Stable", 200,
                               gsub("Temporary Thinning", 430,
                                    gsub("Temporary Enchroachment", 440,
                                         gsub("Persistent Thinning", 530,
                                              gsub('Persistent Enchroachment', 540,
                                                   df_sf$ecological_flag))))))
  
  ## Store trajectories
  ## to get from class, divide by 100 and apply a round; to get the to class, apply a modulo %% 100
  df_sf$trajectory_id <- gsub('Grassland -> Forest', 1203,
                              gsub('Forest -> Grassland', 312,
                                   gsub('Grassland -> Savanna', 1204,
                                        gsub('Stable', 0,
                                             gsub('Inconclusive', 0,
                                                  gsub('Savanna -> Grassland', 412,
                                                       gsub('Savanna -> Forest', 403,
                                                            gsub('Forest -> Savanna', 304,
                                                                 df_sf$trajectory))))))))
  
  ## select only relevant columns
  df_sf <- df_sf %>% dplyr::select(id, age, ecological_id, trajectory_id)
  
  # Define the raster extent and resolution
  resultRaster <- try({
    r <- raster(extent(df_sf), resolution = 0.0002694946)
  }, silent = TRUE)
  
  # Check if there was an error
  if (inherits(resultRaster, "try-error")) {
    # Extract the error message from the result object
    resultRaster <- as.character(resultRaster)
    print('raster error')
  }
  
  ## If the rasterize function have same min and max extent (occurs in tiles with rare pixels)
  if(grepl("min and max y are the same", resultRaster) == TRUE) {
    ## add a simbolic value do diferentiate y axis
    e <- extent(df_sf)
    e[3] <- e[3] - 0.00001
    ## rasterize
    r <- raster(e, resolution = 0.0002694946)
  }
  
  ## If the rasterize function have same min and max extent (occurs in tiles with rare pixels)
  if(grepl("min and max x are the same", resultRaster) == TRUE) {
    ## add a simbolic value do diferentiate y axis
    e <- extent(df_sf)
    e[1] <- e[1] - 0.00001
    ## rasterize
    r <- raster(e, resolution = 0.0002694946)
    
  }
  
  ## rasterize
  ## a. structure change id
  r_ecological <- rasterize(df_sf, 
                            r,
                            field = as.numeric(df_sf$ecological_id))
  
  ## b. trajectory id
  r_trajectory <- rasterize(df_sf, 
                            r,
                            field = as.numeric(df_sf$trajectory_id))
  
  ## c. age
  r_age <- rasterize(df_sf, 
                          r,
                          field = as.numeric(df_sf$age))
  
  ## stack rasters
  r_stack <- stack(r_ecological, r_trajectory, r_age)
  
  ## rename rasters
  names(r_stack) <- c('structure_change', 'trajectory', 'age')
  
  # Set the projection to EPSG 4326
  r_stack@crs <- CRS("+init=EPSG:4326")
  proj4string(r_stack) <- CRS("+proj=longlat +datum=WGS84")
  
  ## convert to stars object
  s_stack <- st_as_stars(r_stack)

  ## Export to GEE
  raster_as_ee(
    x = s_stack,
    overwrite = TRUE,
    assetId = paste0(out_dir, '/', grid_ids[i]),
    bucket = "degrad-structure-change"
  )
  
  print('done! next --->')
  rm(grid_i, collection_i, collection_i_arr, f, x, lst, lst_x, trajs, traj_rle, traj_res, combined_list, df, df_sf, r,
     r_ecological, r_trajectory, r_age, r_stack)
  gc()
  
  }
