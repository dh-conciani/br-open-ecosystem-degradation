## assess ecosystem changes in function of disturbance history in the brazilian biomes
## dhemerson.costa@ipam.org.br

## read libraries
library(ggplot2)
library(ggrepel)
library(treemapify)
library(dplyr)
library(ggh4x)

## avoid scientific notations
options(scipen= 999)

## read data
data <- read.csv('./table/ecosystem_changes_2.csv')
data <- data[, !names(data) %in% c('system.index', '.geo')]    ## drop undesired columns from LCLUC
colnames(data)[4] <- 'value'

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
                                                                data$disturbance_id))))))))


# reorder factors
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

data$ecosystem_str <- factor(data$ecosystem_str, 
                       levels = c("Forest ecosystem",
                                  "Non-forest ecosystem",
                                  "Coastal ecosystem"
                       ))

## aggregate in brazil's level 
data_br <- as.data.frame(
  data %>%
  group_by(value, disturbance_str, variable, ecosystem_str, biome_str) %>%
  summarize(area = sum(area))
)


ggplot(data=subset(data_br, variable == 'number_of_classes'), mapping= aes(x=value, y= area, col= disturbance_str)) +
  geom_line(stat='identity', size=1) +
  scale_colour_manual('Disturbance', values=c('red', '#00F318', '#EF9A2C', '#529CA8', '#FFEC33', '#20F0E2', '#606060', '#C0C0C0')) +
  scale_y_log10() +
  geom_vline(xintercept=1, col= 'blue', linetype='dashed') +
  facet_grid(biome_str~ecosystem_str, scales='free') +
  theme_bw() +
  xlab('Number of native veg. states') +
  ylab('Area (hectares)')


ggplot(data=subset(data_br, variable == 'tree_cover_change'), mapping= aes(x=value, y= area, col= disturbance_str)) +
  geom_line(stat='identity', size=1) +
  scale_colour_manual('Disturbance', values=c('red', '#00F318', '#EF9A2C', '#529CA8', '#FFEC33', '#20F0E2', '#606060', '#C0C0C0')) +
  scale_y_log10() +
  geom_vline(xintercept=1, col= 'blue', linetype='dashed') +
  facet_grid(biome_str~ecosystem_str, scales='free') +
  theme_bw() +
  xlab('Tree Cover Change (%)') +
  ylab('Area (hectares)')


## 
ggplot(data=subset(data, variable == 'number_of_classes'), mapping= aes(x=value, y= area, col= disturbance_str)) +
  geom_line(stat='identity', size=1) +
  scale_colour_manual('Disturbance', values=c('red', '#00F318', '#EF9A2C', '#529CA8', '#FFEC33', '#20F0E2', '#606060', '#C0C0C0')) +
  scale_y_log10() +
  geom_vline(xintercept=1, col= 'blue', linetype='dashed') +
  facet_grid(biome_str~class_str, scales='free') +
  theme_bw() +
  xlab('Number of native veg. states') +
  ylab('Area (hectares)')


ggplot(data=subset(data, variable == 'tree_cover_change'), mapping= aes(x=value, y= area, col= disturbance_str)) +
  geom_line(stat='identity', size=1) +
  scale_colour_manual('Disturbance', values=c('red', '#00F318', '#EF9A2C', '#529CA8', '#FFEC33', '#20F0E2', '#606060', '#C0C0C0')) +
  scale_y_log10() +
  geom_vline(xintercept=0, col= 'blue', linetype='dashed') +
  facet_grid(biome_str~class_str, scales='free') +
  theme_bw() +
  xlab('Tree cover change (%)') +
  ylab('Area (hectares)')

## convert to percents
for(i in 1:length(unique(data$biome))) {
  for(j in 1:length(unique(data$class_id))) {
    for(k in 1:length(unique(data$variable))) {
      for(l in 1:length(unique(data$disturbance_str))) {
        x <- subset(data, biome == unique(data$biome)[i] &
                      class_id == unique(data$class_id)[j] &
                      variable == unique(data$variable)[k] &
                      disturbance_str == unique(data$disturbance_str)[l])
        
        ## compute relative percent
        x$perc <- round(x$area/sum(x$area) *100, digits=1)
        
        if(exists('data_percs') == FALSE) {
          data_percs <- x
        } else {
          data_percs <- rbind(data_percs, x)
        }
      } 
    }
  }
}
rm(x, i, j, k ,l)

ggplot(data=subset(data_percs, variable == 'tree_cover_change'), mapping= aes(x=value, y= perc, col= disturbance_str)) +
  geom_line(stat='identity', size=1) +
  scale_colour_manual('Disturbance', values=c('red', '#00F318', '#EF9A2C', '#529CA8', '#FFEC33', '#20F0E2', '#606060', '#C0C0C0')) +
  #scale_y_log10() +
  geom_vline(xintercept=0, col= 'blue', linetype='dashed') +
  ggh4x::facet_grid2(biome_str~class_str, scales='free', independent='y') +
  theme_bw() +
  xlab('Tree Cover Change (%)') +
  ylab('Percent (%)') +
  xlim(-25,30)

ggplot(data=subset(data_percs, variable == 'number_of_classes'), mapping= aes(x=value, y= perc, col= disturbance_str)) +
  geom_line(stat='identity', size=1) +
  scale_colour_manual('Disturbance', values=c('red', '#00F318', '#EF9A2C', '#529CA8', '#FFEC33', '#20F0E2', '#606060', '#C0C0C0')) +
  #scale_y_log10() +
  geom_vline(xintercept=1, col= 'blue', linetype='dashed') +
  ggh4x::facet_grid2(biome_str~class_str, scales='free', independent='y') +
  theme_bw() +
  xlab('Number of native veg. states') +
  ylab('Percent (%)') +
  xlim(1,5)


## convert to percents
for(i in 1:length(unique(data_br$biome_str))) {
  for(j in 1:length(unique(data_br$ecosystem_str))) {
    for(k in 1:length(unique(data_br$variable))) {
      for(l in 1:length(unique(data_br$disturbance_str))) {
        x <- subset(data_br, biome_str == unique(data_br$biome_str)[i] &
                      ecosystem_str == unique(data_br$ecosystem_str)[j] &
                      variable == unique(data_br$variable)[k] &
                      disturbance_str == unique(data_br$disturbance_str)[l])
        
        ## compute relative percent
        x$perc <- round(x$area/sum(x$area) *100, digits=1)
        
        if(exists('data_percs2') == FALSE) {
          data_percs2 <- x
        } else {
          data_percs2 <- rbind(data_percs2, x)
        }
      } 
    }
  }
}
rm(x, i, j, k ,l)

ggplot(data=subset(data_percs2, variable == 'tree_cover_change'), mapping= aes(x=value, y= perc, col= disturbance_str)) +
  geom_line(stat='identity', size=1) +
  scale_colour_manual('Disturbance', values=c('red', '#00F318', '#EF9A2C', '#529CA8', '#FFEC33', '#20F0E2', '#606060', '#C0C0C0')) +
  #scale_y_log10() +
  geom_vline(xintercept=0, col= 'blue', linetype='dashed') +
  ggh4x::facet_grid2(biome_str~ecosystem_str, scales='free', independent='y') +
  theme_bw() +
  xlab('Tree Cover Change (%)') +
  ylab('Percent (%)') +
  xlim(-25,30)

ggplot(data=subset(data_percs2, variable == 'number_of_classes'), mapping= aes(x=value, y= perc, col= disturbance_str)) +
  geom_point(mapping=aes(shape=disturbance_str)) +
  geom_line(stat='identity', size=1) +
  scale_colour_manual('Disturbance', values=c('red', '#00F318', '#EF9A2C', '#529CA8', '#FFEC33', '#20F0E2', '#606060', '#C0C0C0')) +
  #scale_y_log10() +
  #geom_vline(xintercept=1, col= 'blue', linetype='dashed') +
  ggh4x::facet_grid2(biome_str~ecosystem_str, scales='free', independent='y') +
  theme_bw() +
  xlab('Number of native veg. states') +
  ylab('Percent (%)') +
  xlim(1,5)

write.csv(data, './exports/disturbance/ecosystem_changes_v1.csv', row.names=FALSE)
