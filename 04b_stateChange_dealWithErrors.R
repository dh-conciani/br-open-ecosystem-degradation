## compute state changes
## degradation

## import libraries
library(rgee)
library(stringr)
library(sf)
library(dplyr)
library(googleCloudStorageR)
library(raster)
options(scipen=999)

## Set API key

## start APIs
ee_Initialize(gcs= TRUE)

## Set output dir
out_dir <- 'projects/mapbiomas-workspace/DEGRADACAO/TRAJECTORIES/COL71/V1'

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

## Trajectory assessment is too complex. For this, we used a regular tile of 25 x 25 km approach 
grid <- ee$FeatureCollection('users/dh-conciani/basemaps/br_grid_50_x_50_km')

## Get tile label
grid_ids <- unique(grid$aggregate_array('id')$getInfo())

## Get tiles already processed
processed <- ee$ImageCollection(out_dir)$aggregate_array('system:index')$getInfo()

## Remove already processed
grid_ids <- grid_ids[-which(grid_ids %in% processed)]

## subset
grid_ids <- grid_ids[1:200]

## Compute coordiante images to be used in the case of subsample of the tiles
## Select the longitude and latitude bands, multiply to truncate into integers (meter)
lonLat <- ee$Image$pixelLonLat()
lonGrid <- lonLat$select('longitude')$multiply(10000000)$toInt()
latGrid <- lonLat$select('latitude')$multiply(10000000)$toInt()
lat_lonm <- lonGrid$multiply(latGrid)

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
  print('sampling call ok')
  
  #try(ee_as_sf(collection_i, via= 'drive'), silent= TRUE)
  
  # Call a function that might throw an error
  result <- tryCatch({
    collection_i_arr <- ee_as_sf(collection_i, via = "drive")
  }, error = function(e) {
    # Store the error message in a variable
    error_message <- conditionMessage(e)
    return(error_message)
  })
  print('logical test to error ok')
  
  #result
  ## Get locally
  #try(collection_i_arr <- ee_as_sf(collection_i, via= 'drive'), silent= TRUE)
  
  
  ## HERE STARTS THE RULES TO DEAL WITH THE ERRORS
  ## If sampled object does not exits 
  if(exists('collection_i_arr') == FALSE) {
    
    ## RULE 1: And it is empty (full NA), export a full-NA grid
    if(grepl("The source could be corrupt or not supported", result)) {
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
    
    ## If the value is too large, memory error, re-grid them
    if(grepl("ee_monitoring was forced to stop before getting results", result)) {
      print('Value is too large! Spliting tile to avoid error')

      ## divide into small parts (25 x 25 km)
      newGrid <- lat_lonm$reduceToVectors(
        geometry = grid_i$geometry(),
        scale = 25000,
        geometryType = 'polygon')
      
      ## For each new grid
      for (j in 1:newGrid$size()$getInfo()) {
        print(paste0('Getting trajectories for the splitted grid >>>', letters[j], '<<<'))
        
        ## check if the file already exits
        if (paste0(grid_ids[i], letters[j]) %in% ee$ImageCollection(out_dir)$aggregate_array('system:index')$getInfo() == TRUE) {
          ## skip to next
          next
        }
        
        ## select sub grid[j] and subtract -1 (jscript index starts in zero zzzzzz)
        newGrid_j <- ee$Feature(newGrid$toList(newGrid$size())$get(j-1))
        
        ## Get pixel values
        collection_i <- collection$sample(region= newGrid_j$geometry(), 
                                          scale = 30,
                                          geometries= TRUE,
                                          tileScale= 16)
        
        ## read as local file
        collection_i_arr <- ee_as_sf(collection_i, via = "drive")
        
        
        # Convert the data.frame to a list where each row is an independent sublist
        lst <- apply(collection_i_arr, 1, as.list)
        
        # Remove the first and last entries of each sublist
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
        
        ## Get only assessment classes (discard anthropogenic and ignored)
        traj_rle <- lapply(traj_rle, function(pixel) subset(pixel, value %in% assess_classes))
        
        
        ################# HERE IS PLACED THE RULES #################
        
        ## @@ RULE 1: TEMPORARY VS. PERSISTENT CHANGES  @@
        ## INCONCLUSIVE: NO-ONE TRAJECTORY OF NV CLASSES SATISFIES THE PERSISTANCE CRITERIA
        traj_res <- lapply(traj_rle, function(pixel) 
          if (nrow(pixel) == 0) {
            return('Inconclusive')
          } else {
            ## IF START CLASS IS EQUALS TO END CLASS (FILTERED BY 2 YEAR STABILITY)
            if (pixel$value[1] == pixel$value[nrow(pixel)])  {
              ## AND THE NUMBER OF NATIVE CLASSES IN THE SERIE WAS DIFFERENT OF ONE
              ## THIS WAS A "TEMPORARY CHANGE"
              if (length(unique(pixel$value)) != 1) {
                return('Temporary change')
              }
              ## IF THE NUMBER OF NATIVE CLASSES IS EQUAL TO ONE OVER THE ENTIRE TIME-SERIES, IT WAS NO CHANGE
              if (length(unique(pixel$value)) == 1) {
                return('No change')
              }
            }
            
            ## PERSISTENT: IF END CLASS IS DIFFERENT OF THE START CLASS (FILTERED BY 2 YEARS STABILITY) THE CHANGE WAS PERSISTENT CHANGE
            if (pixel$value[1] != pixel$value[nrow(pixel)]) {
              return('Persistent change')
            }
          })
        
        # Combine lists and maintain sublist index
        combined_list <- Map(function(lst, traj_res) c(lst, traj_res), lst, traj_res)
        
        # Convert the list to a data.frame
        df <- as.data.frame(do.call(rbind, combined_list))
        
        # Rename last column (result)
        colnames(df)[length(df)] <- 'Change'
        
        # Split the geometry column into longitude and latitude columns
        df$longitude <- as.numeric(sub(".*\\(([^,]+),.*", "\\1", df$geometry))
        df$latitude <- as.numeric(sub(".*,\\s*([^\\)]+)\\)", "\\1", df$geometry))
        
        # Remove the geometry column
        df <- df[, !(names(df) %in% c("geometry"))]
        
        # Convert to sf object with point geometry
        df_sf <- st_as_sf(df, coords = c("longitude", "latitude"), crs = 4326)
        
        #plot(df_sf$geometry, axes=T)
        
        ## Create legend
        df_sf$change_id <- gsub("No change", 1,
                                gsub("Inconclusive", 2,
                                     gsub("Temporary change", 3,
                                          gsub("Persistent change", 4,
                                               df_sf$Change))))
        
        ## select only relevant columns
        df_sf <- df_sf %>% dplyr::select(id, Change, change_id)
        
        # Define the raster extent and resolution
        r <- raster(extent(df_sf), resolution = 0.0002694946 )
        
        ## rasterize
        r <- rasterize(df_sf, 
                       r,
                       field = as.numeric(df_sf$change_id))
        
        # Set the projection to EPSG 4326
        r@crs <- CRS("+init=EPSG:4326")
        proj4string(r) <- CRS("+proj=longlat +datum=WGS84")
        
        ## Export to GEE
        raster_as_ee(
          x = r,
          overwrite = TRUE,
          assetId = paste0(out_dir, '/', grid_ids[i], letters[j]),
          bucket = "degrad-traj1"
        )
        
        print('done, next === sub tile ===')
        
      } ## end of sub tiles processing
      print ('tile done!! next')
      rm(newGrid, newGrid_j, collection_i, collection_i_arr, f, x, lst, lst_x, trajs, traj_rle, traj_res, combined_list, df, df_sf, r)
      gc()
      next
    } ## end of complete tile processing
  }
  
  
  print('Getting trajectories')
  
  # Convert the data.frame to a list where each row is an independent sublist
  lst <- apply(collection_i_arr, 1, as.list)
  
  # Remove the first and last entries of each sublist
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
  
  ## Get only assessment classes (discard anthropogenic and ignored)
  traj_rle <- lapply(traj_rle, function(pixel) subset(pixel, value %in% assess_classes))
  
  
  ################# HERE IS PLACED THE RULES #################
  
  ## @@ RULE 1: TEMPORARY VS. PERSISTENT CHANGES  @@
  ## INCONCLUSIVE: NO-ONE TRAJECTORY OF NV CLASSES SATISFIES THE PERSISTANCE CRITERIA
  traj_res <- lapply(traj_rle, function(pixel) 
    if (nrow(pixel) == 0) {
      return('Inconclusive')
    } else {
      ## IF START CLASS IS EQUALS TO END CLASS (FILTERED BY 2 YEAR STABILITY)
      if (pixel$value[1] == pixel$value[nrow(pixel)])  {
        ## AND THE NUMBER OF NATIVE CLASSES IN THE SERIE WAS DIFFERENT OF ONE
        ## THIS WAS A "TEMPORARY CHANGE"
        if (length(unique(pixel$value)) != 1) {
          return('Temporary change')
        }
        ## IF THE NUMBER OF NATIVE CLASSES IS EQUAL TO ONE OVER THE ENTIRE TIME-SERIES, IT WAS NO CHANGE
        if (length(unique(pixel$value)) == 1) {
          return('No change')
        }
      }
      
      ## PERSISTENT: IF END CLASS IS DIFFERENT OF THE START CLASS (FILTERED BY 2 YEARS STABILITY) THE CHANGE WAS PERSISTENT CHANGE
      if (pixel$value[1] != pixel$value[nrow(pixel)]) {
        return('Persistent change')
      }
    })
  
  # Combine lists and maintain sublist index
  combined_list <- Map(function(lst, traj_res) c(lst, traj_res), lst, traj_res)
  
  # Convert the list to a data.frame
  df <- as.data.frame(do.call(rbind, combined_list))
  
  # Rename last column (result)
  colnames(df)[length(df)] <- 'Change'
  
  # Split the geometry column into longitude and latitude columns
  df$longitude <- as.numeric(sub(".*\\(([^,]+),.*", "\\1", df$geometry))
  df$latitude <- as.numeric(sub(".*,\\s*([^\\)]+)\\)", "\\1", df$geometry))
  
  # Remove the geometry column
  df <- df[, !(names(df) %in% c("geometry"))]
  
  # Convert to sf object with point geometry
  df_sf <- st_as_sf(df, coords = c("longitude", "latitude"), crs = 4326)
  
  #plot(df_sf$geometry, axes=T)
  
  ## Create legend
  df_sf$change_id <- gsub("No change", 1,
                          gsub("Inconclusive", 2,
                               gsub("Temporary change", 3,
                                    gsub("Persistent change", 4,
                                         df_sf$Change))))
  
  ## select only relevant columns
  df_sf <- df_sf %>% dplyr::select(id, Change, change_id)
  
  # Define the raster extent and resolution
  r <- raster(extent(df_sf), resolution = 0.0002694946 )
  
  ## rasterize
  r <- rasterize(df_sf, 
                 r,
                 field = as.numeric(df_sf$change_id))
  
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
  
  
  print('done! next --->')
  rm(grid_i, collection_i, collection_i_arr, f, x, lst, lst_x, trajs, traj_rle, traj_res, combined_list, df, df_sf, r)
  gc()
}


