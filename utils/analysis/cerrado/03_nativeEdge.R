## assess cerrado structural changes 
## gt degradação
## dhemerson.costa@ipam.org.br

## read libraries
library(ggplot2)
library(reshape2)
library(ggpattern)
library(dplyr)

## avoid sci notes
options(scipen= 9e3)

## read data
data <- read.table('./table/native_edge_distance_per_class_cerrado.csv', 
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
data_sum_edge <- aggregate(x=list(area= data$area), by= 
                        list(class_str= data$class_str),
                      FUN= 'sum')

## merge edge with reference
data_sum_edge$area_ref <- data_sum_ref$area

## remove edge from total
data_sum_edge$delta <- data_sum_edge$area_ref - data_sum_edge$area

## melt table
data_melt <- melt(data_sum_edge, id.vars=c('class_str', 'area_ref'))

## compute proportions
data_melt$prop <- round((data_melt$value/ data_melt$area_ref) * 100, digits=1)

## aggregate level 0
edge_l0 <- aggregate(x=list(area=data_melt$value), by= list(variable= data_melt$variable), FUN= 'sum')

## compute percs
edge_l0$prop <- round(edge_l0$area/sum(edge_l0$area) * 100, digits=1)

# Basic piechart
ggplot(data= edge_l0, aes(x="", y=prop, fill=variable)) +
  geom_bar(stat="identity", width=1, color="black", alpha= 0.7) +
  coord_polar("y", start=0) +
  theme_void() + 
  theme(legend.position="none") +
  scale_fill_manual(values=c('orange', '#129912'))
  
## 
ggplot(data= data_melt, mapping= aes(x= reorder(class_str, -value), y= value /1e6, fill= class_str, pattern= variable)) +
  geom_bar_pattern(position = 'stack', stat= 'identity',
                   pattern_fill = "orange",
                   pattern_color = 'black',
                   pattern_angle = 45,
                   pattern_density = 0.4,
                   pattern_spacing = 0.05,
                   pattern_key_scale_factor = 0.2,
                   col= NA,
                   alpha=0.8) + 
  #geom_text(mapping=aes(label=prop)) +
  scale_pattern_manual(values = c(delta = "none", area = "stripe")) +
  scale_fill_manual(values=c('#45c2a5', '#b8af4f', '#006400', '#00ff00')) +
  theme_minimal() +
  theme(axis.text.x = element_text(angle = 45, vjust = 1, hjust= 1)) +
  theme(text = element_text(size = 16)) +
  ylab('Área (Mha)') +
  xlab(NULL)

## explore distance
distance <- aggregate(x=list(area= data$area), by= list(class_str= data$class_str, distance= data$distance), FUN='sum')

# Add interval labels to the data
data$interval <- cut(data$distance, breaks = c(0, 30, 60, 90), labels = c("0-30", "31-60", "61-90"), include.lowest = TRUE)

# Using dplyr for aggregation
agg_result <- data %>%
  group_by(class_str, interval) %>%
  summarize(aggregated_area = sum(area))

## compute percents
recipe <- as.data.frame(NULL)
for(i in 1:length(unique(agg_result$class_str))) {
  x <- subset(agg_result, class_str == unique(agg_result$class_str)[i])
  x$prop <- round(x$aggregated_area/sum(x$aggregated_area) * 100, digits=0)
  recipe <- rbind(recipe, x)
}

x11()
ggplot(data= recipe, mapping= aes(x= interval, y= aggregated_area/ 1e6, colour= class_str, group= class_str)) +
  geom_point(aes(shape= class_str), size = 3.5) +
  geom_line(linewidth= 2, alpha= 0.5) +
  theme_classic() +
  theme(text = element_text(size = 16)) +
  xlab('Distancia da borda (metros)') +
  ylab('Log10 [Área (Mha)]') +
  scale_colour_manual(values=c('#45c2a5', '#b8af4f', '#006400', '#00ff00')) +
  scale_y_log10() +
  ggrepel::geom_text_repel(mapping=aes(label= paste0(prop,'%')), col= 'black', size=4.5)
