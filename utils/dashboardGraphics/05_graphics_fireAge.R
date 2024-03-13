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
fire <- subset(fire, theme == 'age')

## ########################### landing page
ggplot(data= subset(fire, level_2 == 'Savanna Formation' & key == 'value'),
       mapping= aes(x= variable, y= value.1/1e6, fill = as.factor(value))) +
  scale_fill_manual('Idade', values=c('#b00a0a','#b2100f','#b41614','#b61d19','#b8241f','#bb2b24','#bd312a','#bf382f','#c13f34','#c3453a','#c54c3f',
                                      '#c85345','#ca594a','#cc5f4f','#ce6654','#d06d5a','#d2735f','#d47a64','#d6816a','#d9876f','#db8e75','#dd957a',
                                      '#df9b7f','#e1a285','#e3a98a','#e5af8f','#e7b594','#eabc9a','#ecc39f','#eec9a5','#f0d0aa','#f2d7af','#f4ddb5',
                                      '#f7e4ba','#f9ebc0','#fbf2c5','#fdf8ca','#fffecf')) +
  geom_bar(stat= 'identity') + 
  theme_minimal() +
  theme(text = element_text(size = 16)) +
  xlab(NULL) +
  ylab('Área (Mha)')

## plot landing page graphic 
ggplot(data= subset(fire, level_2 == 'Savanna Formation' & key == 'relative'),
       mapping= aes(x= variable, y= value.1, fill = as.factor(value))) +
  scale_fill_manual('Idade', values=c('#b00a0a','#b2100f','#b41614','#b61d19','#b8241f','#bb2b24','#bd312a','#bf382f','#c13f34','#c3453a','#c54c3f',
                                      '#c85345','#ca594a','#cc5f4f','#ce6654','#d06d5a','#d2735f','#d47a64','#d6816a','#d9876f','#db8e75','#dd957a',
                                      '#df9b7f','#e1a285','#e3a98a','#e5af8f','#e7b594','#eabc9a','#ecc39f','#eec9a5','#f0d0aa','#f2d7af','#f4ddb5',
                                      '#f7e4ba','#f9ebc0','#fbf2c5','#fdf8ca','#fffecf')) +
  geom_bar(stat= 'identity') + 
  theme_minimal() +
  theme(text = element_text(size = 16)) +
  xlab(NULL) +
  ylab('Área relativa (%)') +
  guides(colour=guide_legend(title="Freq. fogo"))


