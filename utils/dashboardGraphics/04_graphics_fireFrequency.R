## build graphics for the 'degradação' dashboard 
## dhemerson.costa@ipam.org.br

## read libraries
library(ggplot2)
library(reshape2)

## avoid sci notations 
options(scipen= 1e3)

## read fire size data 
fire <- read.csv('./table/brazil-country-fire-8.0.1a.csv',
                 fileEncoding = 'UTF-8',
                 dec= ',')

## replace NA by zero
fire[is.na(fire)] <- 0

## discard value == 0
fire <- subset(fire, value != 0)

## rotate graphic
fire <- melt(data= fire, id.vars=c("FEATURE_ID", "NAME", "LEVEL_1", "GEOCODE", "index", "class_id", "level_0", "level_1", 
                                   "level_2", "level_3", "level_4", "color", "feature_id", "theme", "raw", "value", "key"))

## replace X by '' and covert to numeric
fire$variable <- as.numeric(gsub('X', '', fire$variable))

## get only frequency 
fire <- subset(fire, theme == 'frequency')

## ########################### landing page
ggplot(data= subset(fire, level_2 == 'Savanna Formation' & key == 'value'),
       mapping= aes(x= variable, y= value.1/1e6, fill = as.factor(value))) +
  scale_fill_manual('Frequência', values=c('#fffecf', '#fdf8ca', '#fbf2c5', '#f9ebc0', '#f7e4ba', '#f4ddb5', '#f2d7af',
                                          '#f0d0aa', '#eec9a5', '#ecc39f', '#eabc9a', '#e7b594', '#e5af8f', '#e3a98a',
                                          '#e1a285', '#df9b7f', '#dd957a', '#db8e75', '#d9876f', '#d6816a', '#d47a64',
                                          '#d2735f', '#d06d5a', '#ce6654', '#cc5f4f', '#ca594a', '#c85345', '#c54c3f',
                                          '#c3453a', '#c13f34', '#bf382f', '#bd312a', '#bb2b24', '#b8241f', '#b61d19',
                                          '#b41614', '#b2100f', '#b00a0a')) +
  geom_bar(stat= 'identity') + 
  theme_minimal() +
  theme(text = element_text(size = 16)) +
  xlab(NULL) +
  ylab('Área (Mha)')

## plot landing page graphic 
ggplot(data= subset(fire, level_2 == 'Savanna Formation' & key == 'relative'),
       mapping= aes(x= variable, y= value.1, fill = as.factor(value))) +
  scale_fill_manual('Frequência', values=c('#fffecf', '#fdf8ca', '#fbf2c5', '#f9ebc0', '#f7e4ba', '#f4ddb5', '#f2d7af',
                                           '#f0d0aa', '#eec9a5', '#ecc39f', '#eabc9a', '#e7b594', '#e5af8f', '#e3a98a',
                                           '#e1a285', '#df9b7f', '#dd957a', '#db8e75', '#d9876f', '#d6816a', '#d47a64',
                                           '#d2735f', '#d06d5a', '#ce6654', '#cc5f4f', '#ca594a', '#c85345', '#c54c3f',
                                           '#c3453a', '#c13f34', '#bf382f', '#bd312a', '#bb2b24', '#b8241f', '#b61d19',
                                           '#b41614', '#b2100f', '#b00a0a')) +
  geom_bar(stat= 'identity') + 
  theme_minimal() +
  theme(text = element_text(size = 16)) +
  xlab(NULL) +
  ylab('Área relativa (%)') +
  guides(colour=guide_legend(title="Freq. fogo"))
