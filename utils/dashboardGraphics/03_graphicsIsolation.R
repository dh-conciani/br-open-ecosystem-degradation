## build graphics for the 'degradação' dashboard 
## dhemerson.costa@ipam.org.br

## read libraries
library(ggplot2)
library(reshape2)

## avoid sci notations 
options(scipen= 1e3)

## read isolation size data 
isolation <- read.csv('./table/brazil-country-isolation-8.0.1a.csv',
                 fileEncoding = 'UTF-8',
                 dec= ',')

## replace NA by zero
isolation[is.na(isolation)] <- 0

## rotate graphic
isolation <- melt(data= isolation, id.vars=c("FEATURE_ID", "NAME", "LEVEL_1", "GEOCODE", "index", "class_id", "level_0", "level_1",
                                             "level_2", "level_3", "level_4", "color", "feature_id", "medium_size", "distance", "big_size",
                                             "key"))

## replace X by '' and covert to numeric
isolation$variable <- as.numeric(gsub('X', '', isolation$variable))

## ########################### landing page
ggplot(data= subset(isolation, level_2 == 'Forest Formation' & key == 'value' & big_size == 500 & medium_size == 25),
       mapping= aes(x= variable, y= value/1e6, colour= as.factor(distance), linetype= as.factor(distance))) +
  geom_line(linewidth= 1) + 
  scale_colour_manual('Distance', values=c('#FEAC2F', '#FE2F52', '#FF08D6')) +
  theme_minimal() +
  theme(text = element_text(size = 16)) +
  xlab(NULL) +
  ylab('Área (Mha)')

## plot landing page graphic 
ggplot(data= subset(isolation, level_2 == 'Forest Formation' & key == 'relative' & big_size == 500 & medium_size == 25),
       mapping= aes(x= variable, y= value, colour= as.factor(distance), linetype= as.factor(distance))) +
  geom_line(linewidth= 1) + 
  scale_colour_manual('Distância', values=c('#FEAC2F', '#FE2F52', '#FF08D6')) +
  theme_minimal() +
  theme(text = element_text(size = 16)) +
  xlab(NULL) +
  ylab('Área relativa (%)')

############################### per class

ggplot(data= subset(isolation, key == 'value' & big_size == 500 & medium_size == 25 & distance == 5),
       mapping= aes(x= variable, y= value/1e6, colour= as.factor(level_2))) +
  geom_line(linewidth= 1) + 
  scale_colour_manual(' Class', values=c('#026975', '#1f8d49', '#d6bc74', '#04381d', '#ad5100', '#7dc975', '#519799', '#02d659')) + 
  theme_minimal() +
  theme(text = element_text(size = 16)) +
  xlab(NULL) +
  ylab('Área (Mha)')

## relativo 
ggplot(data= subset(isolation, key == 'relative' & big_size == 500 & medium_size == 25 & distance == 5),
       mapping= aes(x= variable, y= value, colour= as.factor(level_2))) +
  geom_line(linewidth= 1) + 
  scale_colour_manual(' Class', values=c('#026975', '#1f8d49', '#d6bc74', '#04381d', '#ad5100', '#7dc975', '#519799', '#02d659')) + 
  theme_minimal() +
  theme(text = element_text(size = 16)) +
  xlab(NULL) +
  ylab('Área relativa (%)')
