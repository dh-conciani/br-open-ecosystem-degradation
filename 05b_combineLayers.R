## combine layers to export mixed effects under a specific scenario 
## dhemerson.costa@ipam.org.br

## read libraries
library(rgee)

## imitialize GEE API
ee_Initialize()

## list layers in which first position are the asset and 2nd position is the band pattern 
assets <- list(
  'edge' = c('projects/mapbiomas-workspace/DEGRADACAO/COLECAO/BETA/PROCESS/summary/edge_v2', 'edge_'),
  'patch' = c('projects/mapbiomas-workspace/DEGRADACAO/COLECAO/BETA/PROCESS/summary/patch_v4', 'patch_'),
  'isolation' = c('projects/mapbiomas-workspace/DEGRADACAO/COLECAO/BETA/PROCESS/summary/isolation_v6', 'isolation_'),
  'fire' = c('projects/mapbiomas-workspace/DEGRADACAO/COLECAO/BETA/PROCESS/fire/age_v1', 'age_'),
  'secondary' = c('projects/mapbiomas-workspace/DEGRADACAO/COLECAO/BETA/PROCESS/secondary_vegetation/secondary_vegetation_age_v1', 'age_'),
  'classification' = c('projects/mapbiomas-workspace/public/collection8/mapbiomas_collection80_integration_v1', 'classification_')
)

## years to be processed
yearsList <- seq(1985, 2022)

# # get layer combinations
 combinations <- expand.grid(
   edge= c(NA, 30, 60, 90, 120),
   patch= c(NA, 3, 5, 10, 25),
   isolation= c(NA, 5, 10, 20),
   fire= c(NA, 1)
   #secondary= c(NA,1)
)

# Remove rows where all values are NA
combinations <- combinations[!apply(is.na(combinations), 1, all), ]

## place pixel id
combinations$pixel_id <- 1:nrow(combinations)

## set function to apply a vector/indicator only to a specific class
filterIndicator <- function(input, compare, class_id) {
  return(
    input$updateMask(compare$eq(class_id))
  )
} 

## create an empty recipe 
recipe <- ee$Image(0)

## for each year
for(i in 1:length(yearsList)) {
  ## get data for the year [i]
  edge <- ee$Image(assets$edge[1])$select(paste0(assets$edge[2], yearsList[i]))
  patch <- ee$Image(assets$patch[1])$select(paste0(assets$patch[2], yearsList[i]))
  isolation <- ee$Image(assets$isolation[1])$select(paste0(assets$isolation[2], yearsList[i]))
  fire <- ee$Image(assets$fire[1])$select(paste0(assets$fire[2], yearsList[i]))
  #secondary <- ee$Image(assets$secondary[1])$select(paste0(assets$secondary[2], yearsList[i]))
  classification <- ee$Image(assets$classification[1])$select(paste0(assets$classification[2], yearsList[i]))
  
  ## apply mask to get fire only in forest 
  fire <- filterIndicator(
    input= fire,
    compare= classification,
    class_id= 3
  )
  
  ## create an temporary image to receive processing
  tempImage <- ee$Image(0)
  
  ## for each combination 
  for(k in 1:nrow(combinations)) {
    print(paste0('procecessing combination ', k, ' of ', nrow(combinations), ' -----> ', yearsList[i]))
    ## get combinations 
    ## edge
    if(is.na(combinations[k,]$edge) == TRUE) {
      edge_k = ee$Image(1)
    } else {
      edge_k <- edge$updateMask(edge$eq(combinations[k,]$edge))
    }
    
    ## patch
    if(is.na(combinations[k,]$patch) == TRUE) {
      patch_k = ee$Image(1)
    } else {
      patch_k <- patch$updateMask(patch$eq(combinations[k,]$patch))
    }
    
    ## isolation
    if(is.na(combinations[k,]$isolation) == TRUE) {
      isolation_k = ee$Image(1)
    } else {
      isolation_k <- isolation$updateMask(isolation$eq(combinations[k,]$isolation))
    }
    
    ## fire
    if(is.na(combinations[k,]$fire) == TRUE) {
      fire_k = ee$Image(1)
    } else {
      fire_k <- ee$Image(1)$updateMask(fire)
    }
    
    # ## secondary
    # if(is.na(combinations[k,]$secondary) == TRUE) {
    #   secondary_k = ee$Image(1)
    # } else {
    #   secondary_k <- ee$Image(1)$updateMask(secondary)
    # }
    
    ## get intersections
    result_k <- edge_k$
      updateMask(patch_k)$
      updateMask(isolation_k)$
      updateMask(fire_k)$
      #updateMask(secondary_k)$
      ## remap to reference id value
      remap(
        from= list(9999),
        to = list(9999),
        defaultValue= combinations[k,]$pixel_id
      )
    
    ## store into temporary image
    tempImage <- tempImage$blend(result_k)
    
 
    
  }
  
  ## rename
  tempImage <- tempImage$rename(paste0('degradation_', yearsList[i]))$selfMask()
  
  Map$addLayer(tempImage$randomVisualizer())
  
  # ## build task
  # task <- ee$batch$Export$image$toAsset(
  #   image= tempImage,
  #   description= 'foo',
  #   assetId= 'users/dh-conciani/foo',
  #   scale= 30,
  #   maxPixels= 1e13,
  #   pyramidingPolicy= list('.default' = 'mode'),
  #   region= ee$Image(assets$classification[1])$geometry()
  # )
  # 
  # ## export 
  # task$start()
  
}



## precisa filtrar fire age com class


