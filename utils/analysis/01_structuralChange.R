## assess brazils structural changes
## gt degradação
## dhemerson.costa@ipam.org.br

## read libraries
library(ggplot2)
library(ggpattern)

## avoid sci notes
options(scipen= 9e3)

## get native vegetation reference values
#reference <- read.csv('./table/lulc_reference_str.csv')

## read data
data <- read.table('./table/structural_change.csv', 
                   header= TRUE,
                   sep= ',')

## Remove the columns by name
data <- data[, !(names(data) %in% c('system.index', '.geo'))]

## translate class
data$class_str <- gsub(3, 'Formação Florestal',
                     gsub(4, 'Formação Savânica',
                          gsub(5, 'Mangue',
                               gsub(6, 'Floresta Alagada',
                                    gsub(11, 'Áreas Úmidas',
                                         gsub(12, 'Formação Campestre',
                                              data$class))))))

## translate biome
data$biome_str <- 
  gsub(1, 'Amazônia',
       gsub(2, 'Mata Atlântica',
            gsub(3, 'Pantanal',
                 gsub(4, 'Cerrado',
                      gsub(5, 'Caatinga',
                           gsub(6, 'Pampa',
                                data$ecoregion))))))


## aggregate change, independent of class
data_sum <- aggregate(x= list(area= data$area), by= list(biome_str= data$biome_str, 
                                             value= data$value,
                                             year= data$variable), FUN= 'sum')

## remove no_changes
data_sum <- subset(data_sum, value != 0)

## transform thinning in negative values
thinning <- subset(data_sum, value <0)
thinning$area <- thinning$area * -1
## merge
data_sum_flip <- rbind(thinning, 
                       subset(data_sum, value > 0))

## reorder factors
data_sum_flip$value <- factor(data_sum_flip$value, levels=c(-2, -1, 2, 1))

## plot changes
#pdf("structural_change_brazil_fixed.pdf",width=18,height=9)
ggplot(data= data_sum_flip, mapping= aes(x= year, y= area/1e6, fill= as.factor(value))) +
  geom_bar(stat='identity', alpha= 0.7, position= 'stack') +
  #geom_line(stat='identity', alpha= 0.8, size=0.5, position='stack', col= 'black') +
  scale_fill_manual('Value', values=c('#C77ECE', '#FA6161', '#358126', '#80ED6A')) +
  scale_colour_manual(values=c('#C77ECE', '#FA6161', '#358126', '#80ED6A')) +
  theme_minimal() +
  facet_wrap(~biome_str, scales= 'fixed') +
  theme(text = element_text(size = 20)) +
  xlab(NULL) +
  ylab('Área (Mha)') +
  geom_hline(yintercept= 0, col='black', linetype= 'dashed') +
  ggrepel::geom_label_repel(data= subset(data_sum_flip, year == 2022), 
            mapping= aes(label= paste0(round(abs(area)/1e6, digits=2))),
            size= 5, position= 'stack')
#dev.off()

## now, assesss using all the classes
## remove no_changes
data2<- subset(data, value != 0)

## transform thinning in negative values
thinning <- subset(data2, value <0)
thinning$area <- thinning$area * -1
## merge
data2_flip <- rbind(thinning, 
                    subset(data2, value > 0))

## reorder factors
data2_flip$value <- factor(data2_flip$value, levels=c(-2, -1, 2, 1))

## plot
ggplot(data= data2_flip, mapping= aes(x= variable, y= area/1e6, fill= as.factor(value))) +
  geom_bar(stat='identity', alpha= 1, position= 'stack') +
  #geom_line(stat='identity', alpha= 0.8, size=0.5, position='stack', col= 'black') +
  scale_fill_manual('Value', values=c('#C77ECE', '#FA6161', '#358126', '#80ED6A')) +
  scale_colour_manual(values=c('#C77ECE', '#FA6161', '#358126', '#80ED6A')) +
  theme_bw() +
  facet_grid(biome_str~class, scales= 'free_y') +
  theme(text = element_text(size = 16)) +
  xlab(NULL) +
  ylab('Área (Mha)') +
  geom_hline(yintercept= 0, col='black', linetype= 'dashed')
