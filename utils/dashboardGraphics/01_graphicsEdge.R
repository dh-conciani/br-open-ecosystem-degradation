## build graphics for the 'degradação' dashboard 
## dhemerson.costa@ipam.org.br

## read libraries
library(ggplot2)
library(reshape2)

## avoid sci notations 
options(scipen= 1e3)

## read edge area data 
edge <- read.csv('./table/brazil-country-edges-8.0.1a.csv',
                 fileEncoding = 'UTF-8',
                 dec= ',')

## replace NA by zero
edge[is.na(edge)] <- 0

## rotate graphic
edge <- melt(data= edge, id.vars=c("FEATURE_ID", "NAME", "LEVEL_1", "GEOCODE", "index", "class_id", "level_0", "level_1",
                                   "level_2" , "level_3", "level_4", "color", "feature_id", "edge_size", "key"))

## replace X by '' and covert to numeric
edge$variable <- as.numeric(gsub('X', '', edge$variable))

## ########################### landing page
ggplot(data= subset(edge, level_2 == 'Forest Formation' & key == 'value'),
       mapping= aes(x= variable, y= value/1e6, colour= as.factor(edge_size), linetype= as.factor(edge_size))) +
  geom_line(linewidth= 1) + 
  theme_minimal() +
  theme(text = element_text(size = 16)) +
  xlab(NULL) +
  ylab('Área (Mha)')

## plot landing page graphic 
ggplot(data= subset(edge, level_2 == 'Forest Formation' & key == 'relative'),
       mapping= aes(x= variable, y= value, colour= as.factor(edge_size), linetype= as.factor(edge_size))) +
  geom_line(linewidth= 1) + 
  theme_minimal() +
  theme(text = element_text(size = 16)) +
  xlab(NULL) +
  ylab('Área relativa (%)') +
  guides(colour=guide_legend(title="Área de borda (m)"))

############################### per class

ggplot(data= subset(edge, key == 'value' & edge_size == 90),
       mapping= aes(x= variable, y= value/1e6, colour= as.factor(level_2))) +
  geom_line(linewidth= 1) + 
  scale_colour_manual(' Class', values=c('#026975', '#1f8d49', '#d6bc74', '#04381d', '#ad5100', '#7dc975', '#519799', '#02d659')) + 
  theme_minimal() +
  theme(text = element_text(size = 16)) +
  xlab(NULL) +
  ylab('Área (Mha)')

## relativo 
ggplot(data= subset(edge, key == 'relative' & edge_size == 90),
       mapping= aes(x= variable, y= value, colour= as.factor(level_2))) +
  geom_line(linewidth= 1) + 
  scale_colour_manual(' Class', values=c('#026975', '#1f8d49', '#d6bc74', '#04381d', '#ad5100', '#7dc975', '#519799', '#02d659')) + 
  theme_minimal() +
  theme(text = element_text(size = 16)) +
  xlab(NULL) +
  ylab('Área relativa (%)')
