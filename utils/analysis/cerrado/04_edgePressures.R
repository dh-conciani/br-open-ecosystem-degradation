## assess cerrado structural changes 
## gt degradação
## dhemerson.costa@ipam.org.br

## read libraries
library(ggplot2)

## avoid sci notes
options(scipen= 9e3)

## read data
data <- read.table('./table/edge_per_class_anthropogenic_pressure_cerrado.csv', 
                   header= TRUE,
                   sep= ',')

## Remove the columns by name
data <- data[, !(names(data) %in% c('system.index', '.geo'))]

## translate class
data$native_class_str <- gsub(3, 'Formação Florestal',
                       gsub(4, 'Formação Savânica',
                            gsub(11, 'Áreas Úmidas',
                                 gsub(12, 'Formação Campestre',
                                      data$native_class))))
## translate ecoregion
data$ecoregion_str <- 
  gsub(100, "Alto Parnaíba",
       gsub(200, 'Alto São Francisco',
            gsub(300, 'Araguaia Tocantins',
                 gsub(400, 'Bananal',
                      gsub(500, 'Basaltos do Paraná',
                           gsub(600, 'Bico do Papagaio',
                                gsub(700, 'Centro-norte Piauiense',
                                     gsub(800, 'Chapada dos Parecis',
                                          gsub(900, 'Chapadão do São Francisco',
                                               gsub(1000, 'Complexo Bodoquena',
                                                    gsub(1100, 'Costeiro',
                                                         gsub(1200, 'Depressão Cárstica do São Francisco',
                                                              gsub(1300, 'Depressão Cuiabana',
                                                                   gsub(1400, 'Floresta de Cocais',
                                                                        gsub(1500, 'Jequitinhonha',
                                                                             gsub(1600, 'Paracatu',
                                                                                  gsub(1700, 'Paraná Guimarães',
                                                                                       gsub(1800, 'Parnaguá',
                                                                                            gsub(1900, 'Planalto Central',
                                                                                                 gsub(2000, 'Vão do Paranã',
                                                                                                      data$ecoregion))))))))))))))))))))

## translate pressure classes
data$pressure_class_str <- gsub(1, 'Estrada/Rodovia',
                             gsub(9, 'Silvicultura',
                                  gsub(15, 'Pastagem',
                                       gsub(20, 'Agricultura',
                                            gsub(21, 'Mosaico de Usos',
                                                 gsub(24, 'Não Vegetado',
                                                      gsub(25, 'Não Vegetado',
                                                           gsub(30, 'Não Vegetado',
                                                                gsub(39, 'Soja',
                                                                     gsub(41, 'Agricultura',
                                                                          gsub(46, 'Agricultura',
                                                                               gsub(47, 'Agricultura',
                                                                                    gsub(48, 'Agricultura',
                                                                                         gsub(23, 'Não Vegetado',
                                                                                              gsub(40, 'Agricultura',
                                                                                                   gsub(62, 'Agricultura',
                                                                                                        gsub(32, 'Não Vegetado',
                                                                                                             data$pressure_class)))))))))))))))))

## agregate biome data
data_sum <- subset(aggregate(x=list(area= data$area), by= 
                        list(native_class_str= data$native_class_str, pressure_class_str= data$pressure_class_str),
                      FUN= 'sum'), pressure_class_str != '0')

## aggregate for all classes
x <- aggregate(x=list(area= data_sum$area), by= list(pressure_class_str= data_sum$pressure_class_str), FUN= 'sum')

## compute percents
x$prop <- round(x$area/sum(x$area) * 100, digits= 0)


## plot
ggplot(data= x, mapping= aes(x= reorder(pressure_class_str, area), y= area/1e6, fill= pressure_class_str)) +
  geom_bar(stat= 'identity', col= 'gray70', alpha= 0.9) +
  scale_fill_manual(values=c('#e974ed', 'gray30', '#fff3bf', '#af2a2a', '#ffd966', '#935132', '#c59ff4')) + 
  coord_flip() +
  theme_minimal() +
  xlab(NULL) +
  ylab('Área (Mha)') +
  theme(text = element_text(size = 16)) +
  geom_text(mapping=aes(label=paste0(prop, '%')),
            position = position_stack(vjust = 0.5),
            size=5, col= 'black')


## split into classes
recipe <- as.data.frame(NULL)
for(i in 1:length(unique(data_sum$native_class_str))) {
  y <- subset(data_sum, native_class_str == unique(data_sum$native_class_str)[i])
  y$prop <- round(y$area/sum(y$area)*100, digits=0)
  recipe <- rbind(recipe, y)
}

## plot
ggplot(data= recipe, mapping=aes(x= reorder(pressure_class_str, -area), y= area/1e6, fill= pressure_class_str)) +
  geom_bar(stat='identity', col= 'gray90') +
  scale_fill_manual(values=c('#e974ed', 'gray30', '#fff3bf', '#af2a2a', '#ffd966', '#935132', '#c59ff4')) + 
  facet_wrap(~native_class_str, scales= 'free_y') +
  theme(axis.text.x = element_text(angle = 90, vjust = 0.5, hjust=1)) +
  theme_bw() +
  xlab('Área (Mha)') +
  ylab(NULL) +
  geom_text(mapping=aes(label= paste0(prop, '%')),
            position = position_stack(vjust = 0.5),
            size= 4,
            col= 'black') +
  scale_x_discrete(guide = guide_axis(n.dodge = 2)) +
  theme(text = element_text(size = 11))
  


