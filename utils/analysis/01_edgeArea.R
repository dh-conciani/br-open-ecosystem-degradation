## assess brazils structural changes
## gt degradação
## dhemerson.costa@ipam.org.br

## read libraries
library(ggplot2)
library(ggpattern)

## avoid sci notes
options(scipen= 9e3)

## get native vegetation reference values
reference <- read.csv('./table/lulc_reference.csv')

#######
## read edge area
data <- read.table('./table/edge_area.csv', header= TRUE, sep= ',')

## translate class
data$class_str <- gsub(3, 'Formação Florestal',
                       gsub(4, 'Formação Savânica',
                            gsub(11, 'Áreas Úmidas',
                                 gsub(12, 'Formação Campestre',
                                      gsub(5, 'Mangue',
                                           gsub(6, 'Floresta Alagada',
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


## aggregate by "native vegetation"
data2 <- aggregate(x=list(area= data$area),
                   by= list(biome= data$biome_str,
                            year= data$variable,
                            distance= data$distance), FUN='sum')

## get legengs
legs <- subset(data2, year == 1985 | year == 2022)

## plot
p <- ggplot(data= data2, mapping=aes(x= year, y= area/1e6, linetype=as.factor(distance), colour= as.factor(distance), fill= as.factor(distance))) +
  geom_line(size=1) +
  #geom_line(size=3, alpha= .2) +
  scale_colour_manual('Edge area', 
                      values=c('#35D4E4', '#48D468', '#0B6716', '#E8DB38', '#B29725', '#F3940B', '#FA0F04', '#FC02A1')) +
  scale_fill_manual('Edge area', 
                      values=c('#35D4E4', '#48D468', '#0B6716', '#E8DB38', '#B29725', '#F3940B', '#FA0F04', '#FC02A1')) +
   facet_wrap(~biome, scales= 'free_y') +
  geom_label(data= legs, mapping=aes(x= year, label= paste0(round(area/1e6, digits=1))), alpha= .3, size= 4,
            vjust="inward",hjust="inward", col= 'black') + 
  theme_bw() +
  theme(text = element_text(size = 15)) +
  ylab('Área (Mha)') +
  xlab(NULL)
  
p
pdf("edge_area.pdf",width=16,height=9)
p
dev.off()
