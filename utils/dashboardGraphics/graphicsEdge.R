## build graphics for the 'degradação' dashboard 
## dhemerson.costa@ipam.org.br

## read libraries
library(ggplot2)

## avoid sci notations 
options(scipen= 1e3)

## read edge area data 
edge <- read.csv('./table/brazil-refined-biome-edges-8.0.1a.csv',
                 fileEncoding = 'UTF-8',
                 dec= ',')
