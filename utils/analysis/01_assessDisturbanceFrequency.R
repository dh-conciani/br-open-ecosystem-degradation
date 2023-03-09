## assess disturbance frequency per biome 
## dhemerson.costa@ipam.org.br

## read libraries
library(ggplot2)

## avoid scientific notations
options(scipen= 999)

## read data
data <- read.csv('./table/disturbance_freq_per_biome_class.csv')
data <- data[, !names(data) %in% c('system.index', '.geo')]    ## drop undesired columns from LCLUC

## translate biomes
data$biome_str <- gsub(1, 'Amazônia', 
                      gsub(2, 'Mata Atlântica', 
                          gsub(3, 'Pantanal',
                               gsub(4, 'Cerrado',
                                    gsub(5, 'Caatinga',
                                         gsub(6, 'Pampa',
                                              data$biome))))))

## translate classes
data$class_str <- gsub(3, 'Forest Formation',
                       gsub(4, 'Savanna Formation',
                            gsub(5, 'Mangrove',
                                 gsub(11, 'Wetland',
                                      gsub(12, 'Grassland',
                                           gsub(13, 'Other non Forest Formations',
                                                gsub(32, 'Salt Flat',
                                                     gsub(49, 'Wooded Sandbank Vegetation',
                                                          gsub(50, 'Herbaceous Sandbank Vegetation',
                                                               data$class_id)))))))))

## compute native vegetation affected by disturbance ofr each biome
data_sum <- subset(data, variable == 'sum_of_disturbance')

## aggregate 
summary_sum_disturbances <- aggregate(x= list(area= data_sum$area), 
                                      by=list(biome= data_sum$biome_str,
                                      freq= data_sum$freq_id),
                                    FUN= 'sum')

## insert labels (no disturbance, single disturbance, multiple disturbances)
summary_sum_disturbances$label_str <- gsub(0, 'None disturbance',
                                         gsub(1, 'Single disturbance', 
                                              gsub('^([2-9]|[1-9]\\d{1,})$', 'Multiple disturbances',
                                                   summary_sum_disturbances$freq)))

## aggregate in the level 0 (no disturbance, single disturbance, multiple disturbance)
summary_sum_disturbances_l0 <- aggregate(x= list(area= summary_sum_disturbances$area), 
                                         by=list(biome= summary_sum_disturbances$biome,
                                                 label_str= summary_sum_disturbances$label_str),
                                         FUN= 'sum')

## 
