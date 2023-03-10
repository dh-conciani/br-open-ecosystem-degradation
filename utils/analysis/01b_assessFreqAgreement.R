## assess disturbance frequency agreement per biome 
## dhemerson.costa@ipam.org.br

## read libraries
library(ggplot2)
library(ggrepel)

## avoid scientific notations
options(scipen= 999)

## read data
data <- read.csv('./table/disturbance_agreement_per_biome_class.csv')
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

## translate agreement
data$disturbance_str <- gsub(1, 'No disturbance',
                             gsub(2, 'Fire',
                                  gsub(3, 'Veg. loss',
                                       gsub(4, 'Anthropogenic use',
                                            gsub(5, 'Fire + Anthropogenic use',
                                                 gsub(6, 'Fire + Veg. loss',
                                                      gsub(7, 'Veg. loss + Anthropogenic use',
                                                           gsub(8, 'Fire + Veg. loss + Anthropogenic use',
                                                                data$disturbance_1985_2021))))))))

## aggregate, independent of class_id
data_l0 <- aggregate(x=list(area= data$area), 
                      by= list(biome= data$biome_str, 
                               disturbance_str= data$disturbance_str,
                               disturbance_id= data$disturbance_1985_2021),
                      FUN= 'sum')

## compute percents
for (i in 1:length(unique(data_l0$biome))) {
  ## get biome i
  x <- subset(data_l0, biome == unique(data_l0$biome)[i])
  ## compute percs
  x$perc <- round(x$area / sum(x$area) * 100, digits=1)
  ## get only no disturbance value to use as positional operator 
  x$no_disturbance <- subset(x, disturbance_str == 'No disturbance')$perc
  ## store
  if(exists('data_l0i') == FALSE) {
    data_l0i <- x
  } else {
    data_l0i <- rbind(data_l0i, x)
  }
}; rm(data_l0, x, i)

## reorder factors
data_l0i$disturbance_str <- factor(data_l0i$disturbance_str, 
                                   levels = c("Fire + Veg. loss + Anthropogenic use",
                                              "Veg. loss + Anthropogenic use",
                                              "Fire + Anthropogenic use",
                                              "Fire + Veg. loss",
                                              "Anthropogenic use",
                                              "Veg. loss",
                                              "Fire",
                                              "No disturbance"
                                              ))

## plot
ggplot(data= data_l0i, mapping= aes(x= reorder(biome, no_disturbance), y= perc, fill= disturbance_str)) +
  geom_bar(stat='identity', position='stack', alpha= 0.8) +
  scale_fill_manual('Disturbance', values=c('red', '#00F318', '#EF9A2C', '#529CA8', '#FFEC33', '#20F0E2', '#606060', '#C0C0C0')) +
  geom_text_repel(mapping=aes(label=paste0(perc, '%')), position=position_stack(0.5), size= 4) +
  facet_wrap(~reorder(biome, no_disturbance), scales= 'free_x', ncol= 7) +
  theme_classic() +
  xlab(NULL) +
  ylab('Native vegetation area (%)') +
  theme(text = element_text(size = 16))

