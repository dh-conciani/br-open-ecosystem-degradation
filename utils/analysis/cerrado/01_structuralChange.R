## assess cerrado structural changes 
## gt degradação
## dhemerson.costa@ipam.org.br

## read libraries
library(ggplot2)

## avoid sci notes
options(scipen= 9e3)

## read data
data <- read.table('./table/structural_change_cerrado.csv', 
                   header= TRUE,
                   sep= ',')

## Remove the columns by name
data <- data[, !(names(data) %in% c('system.index', '.geo'))]

## translate class
data$class_str <- gsub(3, 'Formação Florestal',
                     gsub(4, 'Formação Savânica',
                          gsub(11, 'Áreas Úmidas',
                               gsub(12, 'Formação Campestre',
                                    data$class))))

## translate type of change
data$type_str <- gsub(4, 'Temporária',
                   gsub(5, 'Persistente',
                        data$type))

## translate direction
data$direction_str <- gsub(3, 'Raleamento',
                         gsub(4, 'Adensamento',
                              data$direction))

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

## agregate biome data
data_sum_change <- aggregate(x=list(area= data$area), by= 
                      list(class_str= data$class_str, type_str= data$type_str, direction_str= data$direction_str),
                      FUN= 'sum')

## get type of change per class
data_type <- aggregate(x=list(area= data_sum_change$area), by= list(type_str= data_sum_change$type_str,
                                                           class_str= data_sum_change$class_str), FUN= 'sum')


## aggregate (to discount from reference)
to_disc <- aggregate(x=list(area= data_sum_change$area), by= list(class_str= data_sum_change$class_str), FUN= 'sum')
data_sum_ref$area <- data_sum_ref$area - to_disc$area

## insert reference
data_sum_ref$type_str <- 'Sem Mudança'
data_sum_ref$group_str <- 'stable'

## create group
data_type$group_str <- 'change'

## bind
data_type <- rbind(data_sum_ref, data_type)

## compute relative percents
recipe <- as.data.frame(NULL)
for(i in 1:length(unique(data_type$class_str))) {
  x <- subset(data_type, class_str == unique(data_type$class_str)[i])
  x$prop <- round(x$area / sum(x$area) * 100, digits=1)
  recipe <- rbind(recipe, x)
}

## plot
ggplot(data= subset(recipe, group_str != 'stable'), mapping=aes(x= reorder(class_str, -area), y= area/1000000, fill= type_str)) +
  geom_bar(stat='identity', position= 'dodge', col= 'gray80', alpha= 0.7) +
  theme_minimal() +
  xlab(NULL) +
  ylab('Área (Mha)') +
  geom_text(mapping=aes(label= paste0(prop, '%')),
            position= position_dodge(1), vjust= -0.5,
            size= 4, col= 'black') +
  scale_fill_manual('Mudança', values=c('#FF00E0', '#FFFF00')) +
  theme(text = element_text(size = 14)) +
  scale_x_discrete(guide = guide_axis(n.dodge = 2)) 

## get general stats
gen <- aggregate(x=list(area= recipe$area), by= list(type_str= recipe$type_str), FUN= 'sum')
gen$prop <- round(gen$area/sum(gen$area)*100, digits=0)
gen$lab <- 'a'

## reorder
gen$type_str <- factor(gen$type_str, levels = c('Sem Mudança', 'Temporária', 'Persistente'))

ggplot(data= gen, mapping=aes(x= lab, y= area, fill= type_str)) +
  geom_bar(stat='identity', position='stack', alpha=0.8) +
  scale_fill_manual(values=c('gray70', '#FFFF00', '#FF00E0')) +
  theme_minimal() +
  coord_flip() +
  ggrepel::geom_text_repel(mapping=aes(label= paste0(prop, '% \n', round(area/1e6, digits=1), ' Mha')), position= position_stack(0.5),
                           size=5)

## merge
colnames(data_sum_ref)[4] <- 'direction_str'
x <- rbind(data_sum_ref, data_sum_change)

## compute relative percents
recipe2 <- as.data.frame(NULL)
for(i in 1:length(unique(x$class_str))) {
  y <- subset(x, class_str == unique(x$class_str)[i])
  y$prop <- round(y$area / sum(y$area) * 100, digits=1)
  recipe2 <- rbind(recipe2, y)
}

## plot
## plot
ggplot(data= subset(recipe2, type_str != 'Sem Mudança'), mapping=aes(x= reorder(class_str, -area), y= area/1000000, 
                                                                     fill= type_str, pattern= direction_str)) +
  #geom_bar(stat='identity', position= 'dodge', col= 'gray80', alpha= 0.7) +
  geom_bar_pattern(position = 'dodge', stat= 'identity',
                   pattern_fill = "tomato4",
                   pattern_color = 'tomato4',
                   pattern_angle = 45,
                   pattern_density = 0.3,
                   pattern_spacing = 0.02,
                   pattern_key_scale_factor = 0.2,
                   col= NA,
                   alpha=0.6) + 
  scale_pattern_manual(values = c(Adensamento = "none", Raleamento = "stripe")) +
  theme_minimal() +
  xlab(NULL) +
  ylab('Área (Mha)') +
  geom_text(mapping=aes(label= paste0(prop, '%'), col=direction_str),
            position= position_dodge(1), vjust= -0.9,
            size= 4, col= 'black') +
  scale_fill_manual('Mudança', values=c('#FF00E0', '#FFFF00')) +
  theme(text = element_text(size = 14)) +
  scale_x_discrete(guide = guide_axis(n.dodge = 2)) 
