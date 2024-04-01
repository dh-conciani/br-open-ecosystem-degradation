## combine layers to export mixed effects under a specific scenario 
## dhemerson.costa@ipam.org.br

## read libraries
library(rgee)

## imitialize GEE API
ee_Initialize()

## list layers in which first position are the asset and 2nd position is the band pattern 
assets <- list(
  'edge' = c('projects/mapbiomas-workspace/DEGRADACAO/COLECAO/BETA/PROCESS/summary/edge_v2', ''),
  'patch' = 'projects/mapbiomas-workspace/DEGRADACAO/COLECAO/BETA/PROCESS/summary/patch_v3',
  'isolation' = 'projects/mapbiomas-workspace/DEGRADACAO/COLECAO/BETA/PROCESS/summary/isolation_v6',
  'fire' = 'projects/mapbiomas-workspace/DEGRADACAO/COLECAO/BETA/PROCESS/fire/age_v1',
  'secondary' = 'projects/mapbiomas-workspace/DEGRADACAO/COLECAO/BETA/PROCESS/secondary_vegetation/secondary_vegetation_age_v1'
)

## years to be processed
yearList <- seq(1985, 2022)


## get layer combinations
combinations <- expand.grid(
  edge= c(NA, 30, 60, 90, 120, 150, 300, 600, 1000),
  size= c(NA, 3, 5, 10, 25, 50, 75),
  isolation= c(NA, '05', '10', '20'),
  fire= c(NA, 1),
  secondary= c(NA,1)
)

# Remove rows where all values are NA
combinations <- combinations[!apply(is.na(combinations), 1, all), ]

## place pixel id
combinations$pixel_id <- 1:nrow(combinations)

## build pér year image



