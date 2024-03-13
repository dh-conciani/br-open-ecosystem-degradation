## build graphics for the 'degradação' dashboard 
## dhemerson.costa@ipam.org.br

## read libraries
library(ggplot2)
library(reshape2)

## avoid sci notations 
options(scipen= 1e3)

## read patch size data 
patch <- read.csv('./table/brazil-country-patch-8.0.1a.csv',
                 fileEncoding = 'UTF-8',
                 dec= ',')

## replace NA by zero
patch[is.na(patch)] <- 0

## rotate graphic
patch <- melt(data= patch, id.vars=c("FEATURE_ID", "NAME", "LEVEL_1", "GEOCODE", "index", "class_id", "level_0", "level_1",
                                   "level_2" , "level_3", "level_4", "color", "feature_id", "patch_size", "key"))

## replace X by '' and covert to numeric
patch$variable <- as.numeric(gsub('X', '', patch$variable))

## ########################### landing page
ggplot(data= subset(patch, level_2 == 'Forest Formation' & key == 'value'),
       mapping= aes(x= variable, y= value/1e6, colour= as.factor(patch_size), linetype= as.factor(patch_size))) +
  geom_line(linewidth= 1) + 
  theme_minimal() +
  theme(text = element_text(size = 16)) +
  xlab(NULL) +
  ylab('Área (Mha)')

## plot landing page graphic 
ggplot(data= subset(patch, level_2 == 'Forest Formation' & key == 'relative'),
       mapping= aes(x= variable, y= value, colour= as.factor(patch_size), linetype= as.factor(patch_size))) +
  geom_line(linewidth= 1) + 
  theme_minimal() +
  theme(text = element_text(size = 16)) +
  xlab(NULL) +
  ylab('Área relativa (%)') +
  guides(colour=guide_legend(title="Tamanho do fragmento (ha)"))

############################### per class

ggplot(data= subset(patch, key == 'value' & patch_size == 5),
       mapping= aes(x= variable, y= value/1e6, colour= as.factor(level_2))) +
  geom_line(linewidth= 1) + 
  scale_colour_manual(' Class', values=c('#026975', '#1f8d49', '#d6bc74', '#04381d', '#ad5100', '#7dc975', '#519799', '#02d659')) + 
  theme_minimal() +
  theme(text = element_text(size = 16)) +
  xlab(NULL) +
  ylab('Área (Mha)')

## relativo 
ggplot(data= subset(patch, key == 'relative' & patch_size == 5),
       mapping= aes(x= variable, y= value, colour= as.factor(level_2))) +
  geom_line(linewidth= 1) + 
  scale_colour_manual(' Class', values=c('#026975', '#1f8d49', '#d6bc74', '#04381d', '#ad5100', '#7dc975', '#519799', '#02d659')) + 
  theme_minimal() +
  theme(text = element_text(size = 16)) +
  xlab(NULL) +
  ylab('Área relativa (%)')
