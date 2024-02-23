## perform statsitics API benchmark
## dhemerson.costa@ipam.org.br

## load libraries
library(ggplot2)

## avoids scientific notation
options(scipen=9e3)

## read data
data <- read.csv('./output/municipio_v1.csv')

ggplot(data= data, mapping=aes(x= nome, y= total)) +
  geom_boxplot(outlier.shape= 3) +
  theme_minimal() +
  xlab(NULL) +
  ylab('API request total time (seconds)')

?geom_boxplot
