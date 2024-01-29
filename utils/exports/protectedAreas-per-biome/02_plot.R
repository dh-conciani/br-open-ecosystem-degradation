## get defgradation by edgeArea 
## dhemerson.costa@ipam.org.br

## load library
library(ggplot2)
library(dplyr)

## avoid scientific notations
options(scipen= 9e3)

## read table
data <- read.csv('./table/edge_area-protectedAreas-per-biome_last.csv')

## read reference data
ref <- read.csv('./table/protectedAreas-per-biome_last-reference.csv')
## retain only native vegetation
ref <- subset(ref, class == 3 | class == 6 | class == 11 | class == 12 | class == 4 |
                   class == 5 | class == 50 | class == 49)

## transalte
data$biome <- gsub('amazonia', 'Amazônia',
                 gsub('caatinga', 'Caatinga',
                      gsub('cerrado', 'Cerrado',
                           gsub('mata_atlantica', 'Mata Atlântica',
                                gsub('pampa', 'Pampa',
                                     gsub('pantanal', 'Pantanal',
                                          data$biome))))))

## transalte
ref$biome <- gsub('amazonia', 'Amazônia',
                   gsub('caatinga', 'Caatinga',
                        gsub('cerrado', 'Cerrado',
                             gsub('mata_atlantica', 'Mata Atlântica',
                                  gsub('pampa', 'Pampa',
                                       gsub('pantanal', 'Pantanal',
                                            ref$biome))))))

data$class_str <- gsub(3, 'F. Florestal',
                     gsub(6, 'F. Florestal',
                          gsub(11, 'Áreas Úmidas',
                               gsub(12, 'F. Campestre',
                                    gsub(4, 'F. Savânica',
                                         gsub(5, 'F. Florestal',
                                              gsub(50, 'F. Campestre',
                                                   gsub(49, 'F. Florestal',
                                                        data$class))))))))

## translate names
vec <- read.csv('./vec/APS.csv', encoding= 'UTF-8')
## include TIs
vec$categoria <- gsub('^$', 'TI', vec$categoria)
vec$TipoUso <- gsub('^$', 'TI', vec$TipoUso)
vec$TipoUso <- gsub('Proteção integral', 'Proteção Integral', vec$TipoUso)

## remove non SNUC or TI
vec <- subset(vec, TipoUso != 'Não enquadrada no SNUC' & TipoUso != 'Geral')


## translate table
x <- full_join(x= data, y= vec, by= 'featureid')
## translate ref
ref <- full_join(x=ref, y= vec, by= 'featureid')

## aggregate per biome
biome <- aggregate(x=list(area=x$area.x), by= list(biome= x$biome, distance= x$distance), FUN= 'sum')
biome_ref <- aggregate(x=list(area=ref$area.x), by= list(biome= ref$biome), FUN= 'sum')

## merge reference
biome <- full_join(x= biome, y= biome_ref, by= 'biome')

## calc percents
biome$perc <- round(biome$area.x/biome$area.y * 100, digits=1)

## plot
ggplot(data= biome, mapping= aes(x= as.factor(distance), y= perc, fill=perc)) +
  geom_bar(stat= 'identity') + 
  scale_fill_distiller(palette = "Reds", direction = 1) +
  geom_text(mapping=aes(label= paste0(perc, '%')), vjust= -3, size= 4) +
  ## place summaries
  geom_text(mapping=aes(label= paste0(round(area.x/1e6, digits=2), ' Mha')), vjust=-2, size=3, col='gray30') + 
  #geom_text(mapping=aes(label= paste0(round(area.y/1e6, digits=1), ' Mha'),
  #                      x= length(unique(distance)), y= area.y/1e6), vjust="inward",hjust="inward", col= 'forestgreen') +
  facet_wrap(~biome, scales= 'free_x') +
  #geom_hline(mapping= aes(yintercept= area.y/1e6), col= 'forestgreen', linetype= 'dashed') +
  xlab('Área de borda (metros)') +
  ylab('%') +
  theme_minimal() +
  theme(text = element_text(size = 15))

## agregar para o brasil
z <- subset(biome, biome != 'Amazônia')
z <- aggregate(x=list(area.x=z$area.x, area.y= z$area.y), by= list(distance= z$distance), FUN= 'sum')

## gety perc
z$perc <- round(z$area.x/z$area.y * 100, digits=1)

## plot
ggplot(data= z, mapping=aes(x= as.factor(distance), y= area.x/1e6, fill= perc)) +
  geom_bar(stat='identity') +
  scale_fill_distiller(palette = "Reds", direction = 1) +
  geom_text(mapping=aes(label= paste0(perc, '%')), hjust= -1, size= 5) +
  geom_text(mapping=aes(label= paste0(round(area.x/1e6, digits=2), ' Mha')), hjust= -0.6, vjust= 3, size=4, col='gray30') + 
  geom_hline(mapping= aes(yintercept= area.y/1e6), col= 'forestgreen', linetype= 'dashed', size=1) +
  coord_flip() +
  theme_minimal() +
  xlab('Área de borda (metros)') +
  ylab('Área (Mha)') +
  theme(text = element_text(size = 15))

## usar nivel de proteção 
biome <- aggregate(x=list(area=x$area.x), by= list(biome= x$biome, distance= x$distance, level= x$TipoUso), FUN= 'sum')
biome_ref <- aggregate(x=list(area=ref$area.x), by= list(biome= ref$biome, level= ref$TipoUso), FUN= 'sum')


## merge reference
biome <- full_join(x= biome, y= biome_ref, by= c('biome', 'level'))

## calc percents
biome$perc <- round(biome$area.x/biome$area.y * 100, digits=1)

## plot
ggplot(data= biome, mapping= aes(x= as.factor(distance), y= perc, fill= perc)) +
  geom_bar(stat= 'identity') +
  scale_fill_distiller(palette = "Reds", direction = 1) +
  facet_grid(biome~level, scales= 'free') +
  geom_text(mapping=aes(label= paste0(perc, '%')), vjust= -2, size= 3) +
  geom_text(mapping=aes(label= paste0(round(area.x/1e6, digits=2), ' Mha')), vjust=-1, size=2, col='gray30') + 
  theme_bw() +
  xlab('Área de borda (metros)') +
  ylab('%') 


## agregar para o brasil
z <- subset(biome, biome != 'Amazônia')
#z <- biome
z <- aggregate(x=list(area.x=z$area.x, area.y= z$area.y), by= list(distance= z$distance, level= z$level), FUN= 'sum')

## gety perc
z$perc <- round(z$area.x/z$area.y * 100, digits=1)

## plot
ggplot(data= z, mapping=aes(x= as.factor(distance), y= perc, fill= perc)) +
  geom_bar(stat='identity') +
  scale_fill_distiller(palette = "Reds", direction = 1) +
  geom_text(mapping=aes(label= paste0(perc, '%')), hjust= 1.5, vjust= -0.5, size= 5) +
  geom_text(mapping=aes(label= paste0(round(area.x/1e6, digits=2), ' Mha')), hjust= 1.3, vjust= 1, size=4, col='gray40') + 
  #geom_text(mapping=aes(label= paste0(round(area.x/1e6, digits=2), ' Mha')), hjust= -0.6, vjust= 3, size=4, col='gray30') + 
  #geom_hline(mapping= aes(yintercept= area.y/1e6), col= 'forestgreen', linetype= 'dashed', size=1) +
  facet_wrap(~level, scales= 'free') +
  coord_flip() +
  theme_minimal() +
  xlab('Área de borda (metros)') +
  ylab('%') +
  theme(text = element_text(size = 15))
