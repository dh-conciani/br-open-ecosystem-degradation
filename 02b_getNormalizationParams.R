## get noralization parameters (min-max) for each variable in function of class~biome
## dhemerson.costa@ipam.org.br

## read libraries
library(rgee)
ee_Initialize()

## read distubance database 
disturbance <- ee$Image('projects/mapbiomas-workspace/DEGRADACAO/DISTURBIOS/disturbance_frequency/brazil_disturbance_frequency_2');

## read mapbiomas collection 7 in the last year
mapbiomas <- ee$Image('projects/mapbiomas-workspace/public/collection7/mapbiomas_collection70_integration_v2')$
  select('classification_2021')

## set classes in which parameters will be estimated (only native vegetation)
classes = c(3, 4, 5, 11, 12, 13, 32, 49, 50)

## read normalization territory (biomes)
territory <- ee$FeatureCollection('projects/mapbiomas-workspace/AUXILIAR/biomas-2019')

## get territories ID
territory_list <- territory$aggregate_array('Bioma')$getInfo()

## for each territory
for (i in 1:length(unique(territory_list))) {
  ## get territory [i]
  territory_i <- territory$filterMetadata('Bioma', 'equals', territory_list[i])
  ## for each class [j]
  for (j in 1:length(unique(classes))) {
    ## get disturbance data [ij] 
    disturbance_ij = disturbance$
      clip(territory_i)$
      updateMask(mapbiomas$eq(classes[j]))
    
    
    
  }
}



## get territory [i]
territory_i <- territory$filterMetadata('Bioma', 'equals', territory_list[1])

## for each class [j]

## get disturbance data [ij] 
disturbance_ij = disturbance$
  clip(territory_i)$
  updateMask(mapbiomas$eq(classes[1]))

## get parameters 
## maximum values
max_values <- disturbance_ij$rename(c('anthropogenic_freq_max',
                                      'deforestation_freq_max',
                                      'fire_freq_max',
                                      'sum_of_disturbance_max'))$
                                          reduceRegion(
                                          reducer= ee$Reducer$max(),
                                          geometry= territory_i,
                                          scale= 30,
                                          maxPixels= 1e13
                                      )$getInfo()

## minimun values
min_values <- disturbance_ij$rename(c('anthropogenic_freq_max',
                                      'deforestation_freq_max',
                                      'fire_freq_max',
                                      'sum_of_disturbance_max'))$
                                          reduceRegion(
                                            reducer= ee$Reducer$min(),
                                            geometry= territory_i,
                                            scale= 30,
                                            maxPixels= 1e13
                                      )$getInfo()




 
  
