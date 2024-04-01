## combine layers to export mixed effects under a specific scenario 
## dhemerson.costa@ipam.org.br

## read libraries
library(rgee)

## imitialize GEE API
ee_Initialize()

## list layers in which first position are the asset and 2nd position is the band pattern 
assets <- list(
  'edge' = c('projects/mapbiomas-workspace/DEGRADACAO/COLECAO/BETA/PROCESS/summary/edge_v2', 'edge_'),
  'patch' = c('projects/mapbiomas-workspace/DEGRADACAO/COLECAO/BETA/PROCESS/summary/patch_v3', 'patch_'),
  'isolation' = c('projects/mapbiomas-workspace/DEGRADACAO/COLECAO/BETA/PROCESS/summary/isolation_v6', 'isolation_'),
  'fire' = c('projects/mapbiomas-workspace/DEGRADACAO/COLECAO/BETA/PROCESS/fire/age_v1', 'age_'),
  'secondary' = c('projects/mapbiomas-workspace/DEGRADACAO/COLECAO/BETA/PROCESS/secondary_vegetation/secondary_vegetation_age_v1', 'age_'),
  'classification' = c('projects/mapbiomas-workspace/public/collection8/mapbiomas_collection80_integration_v1', 'classification_')
)

## years to be processed
yearsList <- seq(1985, 2022)

# get layer combinations
combinations <- expand.grid(
  edge= c(NA, 30, 60, 90, 120, 150, 300, 600, 1000),
  patch= c(NA, 3, 5, 10, 25, 50, 75),
  isolation= c(NA, '05', '10', '20'),
  fire= c(NA, 1),
  secondary= c(NA,1)
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
  secondary <- ee$Image(assets$secondary[1])$select(paste0(assets$secondary[2], yearsList[i]))
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
    
  }
  
  
  
}



## precisa filtrar fire age com class


