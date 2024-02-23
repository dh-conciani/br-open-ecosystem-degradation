## perform statsitics API benchmark
## dhemerson.costa@ipam.org.br

## load libraries
library(ggplot2)

## avoids scientific notation
options(scipen=9e3)

## read data
data <- read.csv('./output/municipio_v1.csv')

## replace "" by NA in isolamento
data$isolamento <- gsub('^$', NA, data$isolamento)

## get parameters used
data$layerCount <- rowSums(!is.na(data[5:10]))

## plot
ggplot(data= data, mapping=aes(x= nome, y= total, fill= as.factor(layerCount))) +
  geom_boxplot(outlier.shape= 3) +
  theme_minimal() +
  xlab(NULL) +
  ylab('API request total time (seconds)') +
  labs(fill='n layers/masks')

