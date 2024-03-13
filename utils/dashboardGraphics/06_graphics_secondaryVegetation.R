## build graphics for the 'degradação' dashboard 
## dhemerson.costa@ipam.org.br

## read libraries
library(ggplot2)
library(reshape2)

## avoid sci notations 
options(scipen= 1e3)

## read vegSec size data 
vegSec <- read.csv('./table/brazil-country-vegSec-8.0.1a.csv',
                 fileEncoding = 'UTF-8',
                 dec= ',')

## replace NA by zero
vegSec[is.na(vegSec)] <- 0

## discard value == 0
vegSec <- subset(vegSec, value != 0)

## rotate graphic
vegSec <- melt(data= vegSec, id.vars=c("FEATURE_ID", "NAME", "LEVEL_1", "GEOCODE", "index", "class_id", "level_0", "level_1", 
                                   "level_2", "level_3", "level_4", "color", "feature_id", "theme", "raw", "value", "key"))

## replace X by '' and covert to numeric
vegSec$variable <- as.numeric(gsub('X', '', vegSec$variable))

## get only frequency 
vegSec <- subset(vegSec, theme == 'age')

## ########################### landing page
ggplot(data= subset(vegSec, level_2 == 'Forest Formation' & key == 'value'),
       mapping= aes(x= variable, y= value.1/1e6, fill = as.factor(value))) +
  scale_fill_manual('Idade', values=c('#f2ffd6','#effcd1','#ebf9cb','#e6f6c5','#e2f3bf','#def0b9','#daedb4','#d6e9ae','#d2e6a8','#cee3a2',
                                      '#cae09c','#c6dd96','#c2da90','#bfd78b','#bbd485','#b7d180','#b3cd7a','#afca74','#abc76e','#a6c468',
                                      '#a2c162','#9ebe5c','#9aba56','#96b751','#92b44b','#8fb146','#8bae40','#87ab3a','#83a834','#7fa52e',
                                      '#7ba228','#779e22','#739b1d','#6f9817','#6b9511','#66920b','#628f05','#5f8c00'
  )) +
  geom_bar(stat= 'identity') + 
  theme_minimal() +
  theme(text = element_text(size = 16)) +
  xlab(NULL) +
  ylab('Área (Mha)')

## plot landing page graphic 
ggplot(data= subset(vegSec, level_2 == 'Forest Formation' & key == 'relative'),
       mapping= aes(x= variable, y= value.1, fill = as.factor(value))) +
  scale_fill_manual('Idade', values=c('#f2ffd6','#effcd1','#ebf9cb','#e6f6c5','#e2f3bf','#def0b9','#daedb4','#d6e9ae','#d2e6a8','#cee3a2',
                                      '#cae09c','#c6dd96','#c2da90','#bfd78b','#bbd485','#b7d180','#b3cd7a','#afca74','#abc76e','#a6c468',
                                      '#a2c162','#9ebe5c','#9aba56','#96b751','#92b44b','#8fb146','#8bae40','#87ab3a','#83a834','#7fa52e',
                                      '#7ba228','#779e22','#739b1d','#6f9817','#6b9511','#66920b','#628f05','#5f8c00'
  )) +
  geom_bar(stat= 'identity') + 
  theme_minimal() +
  theme(text = element_text(size = 16)) +
  xlab(NULL) +
  ylab('Área relativa (%)') +
  guides(colour=guide_legend(title="Freq. fogo"))

