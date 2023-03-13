## assess disturbance frequency agreement per biome 
## dhemerson.costa@ipam.org.br

## read libraries
library(ggplot2)
library(ggrepel)
library(treemapify)

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

## translate ecosystem
data$ecosystem_str <- gsub(3, 'Forest ecosystem',
                         gsub(4, 'Non-forest ecosystem',
                              gsub(5, 'Forest ecosystem',
                                   gsub(11, 'Non-forest ecosystem',
                                        gsub(12, 'Non-forest ecosystem',
                                             gsub(13, 'Non-forest ecosystem',
                                                  gsub(32, 'Coastal ecosystem',
                                                       gsub(49, 'Coastal ecosystem',
                                                            gsub(50, 'Coastal ecosystem',
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

## plot general
ggplot(data= data_l0i, mapping= aes(x= reorder(biome, no_disturbance), y= perc, fill= disturbance_str)) +
  geom_bar(stat='identity', position='stack', alpha= 0.8) +
  scale_fill_manual('Disturbance', values=c('red', '#00F318', '#EF9A2C', '#529CA8', '#FFEC33', '#20F0E2', '#606060', '#C0C0C0')) +
  geom_text_repel(mapping=aes(label=paste0(perc, '%')), position=position_stack(0.5), size= 4) +
  facet_wrap(~reorder(biome, no_disturbance), scales= 'free_x', ncol= 7) +
  theme_classic() +
  xlab(NULL) +
  ylab('Native vegetation area (%)') +
  theme(text = element_text(size = 16))

## aggregate for brazil
data_x <- aggregate(x=list(area= data_l0i$area), by=list(disturbance= data_l0i$disturbance_str), FUN='sum')
data_x$perc <- round(data_x$area/sum(data_x$area)*100, digits=1)

## reorder factors
data_x$disturbance <- factor(data_x$disturbance, 
                                   levels = c("Fire + Veg. loss + Anthropogenic use",
                                              "Veg. loss + Anthropogenic use",
                                              "Fire + Anthropogenic use",
                                              "Fire + Veg. loss",
                                              "Anthropogenic use",
                                              "Veg. loss",
                                              "Fire",
                                              "No disturbance"
                                   ))

## treeplot
ggplot(data=data_x, mapping=aes(area = area, fill = disturbance, 
                                label = paste0(perc, '%', '\n', round(area/1e6), ' Mha'))) +
  geom_treemap() +
  geom_treemap_text() +
  scale_fill_manual('Disturbance', values=c('red', '#00F318', '#EF9A2C', '#529CA8', '#FFEC33', '#20F0E2', '#606060', '#C0C0C0'))


## aggregate per ecosystem type
data_x <- aggregate(x=list(area= data$area), by=list(disturbance= data$disturbance_str,
                                                     ecosystem= data$ecosystem_str), FUN='sum')

## reorder factors
data_x$disturbance <- factor(data_x$disturbance, 
                             levels = c("Fire + Veg. loss + Anthropogenic use",
                                        "Veg. loss + Anthropogenic use",
                                        "Fire + Anthropogenic use",
                                        "Fire + Veg. loss",
                                        "Anthropogenic use",
                                        "Veg. loss",
                                        "Fire",
                                        "No disturbance"
                             ))

## reorder ecosystem
data_x$ecosystem <- factor(data_x$ecosystem, 
                             levels = c("Forest ecosystem",
                                        "Non-forest ecosystem",
                                        "Coastal ecosystem"
                             ))


## build legends
for (i in 1:length(unique(data_x$ecosystem))) {
  x <- subset(data_x, ecosystem == unique(data_x$ecosystem)[i])
  x$perc <- round(x$area/sum(x$area)*100, digits=2)
  if(exists('legend_x') == FALSE) {
    legend_x <- x
  } else {
    legend_x <- rbind(legend_x, x)
  }
}; rm(x)


##
ggplot(data= legend_x, mapping=aes(x= ecosystem, y= area/1e6, fill= disturbance)) +
  geom_bar(stat = "identity", position= position_fill(0.5), width= 99) +
  geom_text_repel(mapping=aes(x= ecosystem, y= area/1e6,
                        label= paste0(round(perc, digits=0), '%')), 
            position=position_fill(0.5), size=4) +
  coord_polar(theta='y') +
  theme_minimal() +
  scale_fill_manual('Disturbance', values=c('red', '#00F318', '#EF9A2C', '#529CA8', '#FFEC33', '#20F0E2', '#606060', '#C0C0C0')) +
  facet_wrap(~ecosystem, ncol=3) +
  theme_void() +
  theme(text = element_text(size = 20))  +
  theme(legend.position = "none")

## export for data studio
#write.csv(data_l0i, './exports/disturbance/disturbance_per_biome.csv')

## compute percents for each class and biome
for (i in 1:length(unique(data$biome_str))) {
  # get biome i
  x <- subset(data, biome_str == unique(data$biome_str)[i])
  ## for each class j
  for (j in 1:length(unique(x$class_str))) {
    ## get class j
    y <- subset(x, class_str == unique(x$class_str)[j])
    ## compute percents
    y$per_class_biome_perc <- round(y$area/sum(y$area)*100, digits=1)
    ## store
    if (exists('data_l1i') == FALSE) {
      data_l1i <- y
    } else {
      data_l1i <- rbind(data_l1i, y)
    }
  }
};rm(x, y)

## reorder factors
data_l1i$disturbance_str <- factor(data_l1i$disturbance_str, 
                                   levels = c("Fire + Veg. loss + Anthropogenic use",
                                              "Veg. loss + Anthropogenic use",
                                              "Fire + Anthropogenic use",
                                              "Fire + Veg. loss",
                                              "Anthropogenic use",
                                              "Veg. loss",
                                              "Fire",
                                              "No disturbance"
                                   ))


## aggregate for brazil
x1 <- aggregate(x=list(area= data_l1i$area), 
          by= list(disturbance= data_l1i$disturbance_str,
                   class= data_l1i$class_str,
                   ecosystem= data_l1i$ecosystem_str), FUN= 'sum')

## get relatives
for (i in 1:length(unique(x1$class))) {
  x <- subset(x1, class== unique(x1$class)[i])
  x$perc <- round(x$area/sum(x$area)*100, digits=1)
  x$perc_non <- subset(x, disturbance == 'No disturbance')$perc
  if(exists('x2') == FALSE) {
    x2 <- x
  } else {
    x2 <- rbind(x2, x)
  }
}; rm(x)

## reorder ecosystem
x2$ecosystem <- factor(x2$ecosystem, 
                           levels = c("Forest ecosystem",
                                      "Non-forest ecosystem",
                                      "Coastal ecosystem"
                           ))

## plot classes
ggplot(data=x2, mapping=aes(x= reorder(class, perc_non), y= perc, fill= disturbance)) +
  geom_bar(stat='identity', position='stack') +
  scale_fill_manual('Disturbance', values=c('red', '#00F318', '#EF9A2C', '#529CA8', '#FFEC33', '#20F0E2', '#606060', '#C0C0C0')) +
  facet_wrap(~ecosystem, 'free', nrow=3, ncol=3) +
  theme_minimal() +
  geom_text_repel(mapping=aes(label=perc), position=position_stack(0.5)) +
  theme(text = element_text(size = 14)) +
  theme(legend.position = "none")


## reodrder
data$disturbance_str <- factor(data$disturbance_str, 
                                   levels = c("Fire + Veg. loss + Anthropogenic use",
                                              "Veg. loss + Anthropogenic use",
                                              "Fire + Anthropogenic use",
                                              "Fire + Veg. loss",
                                              "Anthropogenic use",
                                              "Veg. loss",
                                              "Fire",
                                              "No disturbance"
                                   ))


## compute percents
for (i in 1:length(unique(data$ecosystem_str))) {
  x <- subset(data, ecosystem_str == unique(ecosystem_str)[i])
  x <- aggregate(x=list(area= x$area), by= list(biome= x$biome_str,
                                                disturbance= x$disturbance_str,
                                                ecosystem= x$ecosystem_str),
                 FUN= 'sum')
  
  for (j in 1:length(unique(x$biome))) {
    y <- subset(x, biome == unique(x$biome)[j])
    y$perc <- round(y$area/sum(y$area)*100, digits=1)
    if(exists('x3') == FALSE) {
      x3 <- y
    } else {
      x3 <- rbind(x3, y)
    }
  }
}rm(y)

## reorder ecosystem
x3$ecosystem <- factor(x3$ecosystem, 
                       levels = c("Forest ecosystem",
                                  "Non-forest ecosystem",
                                  "Coastal ecosystem"
                       ))

## comparar biomas
ggplot(data= x3, mapping= aes(x= biome, y= perc, fill= disturbance)) +
  geom_bar(stat='identity') +
  facet_wrap(~ecosystem, scales= 'fixed') +
  scale_fill_manual('Disturbance', values=c('red', '#00F318', '#EF9A2C', '#529CA8', '#FFEC33', '#20F0E2', '#606060', '#C0C0C0')) +
  coord_flip() +
  theme_minimal() +
  theme(text = element_text(size = 20)) +
  theme(legend.position = "none") +
  geom_text_repel(mapping=aes(label=perc), position=position_stack(0.5))
  


## plot specific
#ggplot(data= data_l1i, mapping= aes(x= class_str, y= per_class_biome_perc, fill= disturbance_str)) +
#  geom_bar(stat='identity', position= 'stack', alpha= 0.8) +
#  scale_fill_manual('Disturbance', values=c('red', '#00F318', '#EF9A2C', '#529CA8', '#FFEC33', '#20F0E2', '#606060', '#C0C0C0')) +
#  facet_grid(class_str~biome_str, scales= 'free_x') +
#  geom_text_repel(mapping=aes(label=paste0(per_class_biome_perc, '%')), position=position_stack(0.5), size= 2.5) +
#  theme_bw() +
#  theme(strip.text.y = element_text(size = 7))

## export to data-studio
#write.csv(data_l1i, './exports/disturbance/disturbance_per_class_biome.csv')

## cores de legenda
hex <- 
  as.data.frame(
    cbind(
      Disturbance= 
        c("Fire + Veg. loss + Anthropogenic use",
        "Veg. loss + Anthropogenic use",
        "Fire + Anthropogenic use",
        "Fire + Veg. loss",
        "Anthropogenic use",
        "Veg. loss",
        "Fire",
        "No disturbance"),
      Hex= 
      c('#FF0000', 
        '#00F318',
        '#EF9A2C', 
        '#529CA8', 
        '#FFEC33', 
        '#20F0E2', 
        '#606060', 
        '#C0C0C0')
      )
  )


write.csv(data, './exports/disturbance/data_disturbance_v1.csv', row.names=FALSE)
