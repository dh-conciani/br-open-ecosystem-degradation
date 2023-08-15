## assess cerrado structural changes 
## gt degradação
## dhemerson.costa@ipam.org.br

## read libraries
library(ggplot2)

## avoid sci notes
options(scipen= 9e3)

## read data
data <- read.table('./table/fire_regime_changes_cerrado.csv', 
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


# # Create categories based on fire_change_index (decrease and increase)
# data$category <- gsub('^0$', 'No Change', data$fire_change_index)
# data$category <- ifelse(data$fire_change_index < 0, "<0", ">0")
# 
# 
# ## aggregate percents
# props <- aggregate(x=list(area=data$area), by=list(class_str= data$class_str, category= data$category), FUN= 'sum')
# 
# 
# 
# ## compute props
# for(i in 1:length(unique(props$class_str))) {
#   x <- subset(props, class_str == unique(props$class_str)[i])
# } 


## aggregate
data_agr <- aggregate(x=list(area= data$area), by= list(class_str= data$class_str, fire_change_index= data$fire_change_index),
                      FUN= 'sum')

## group values
# Function to label values
label_values <- function(x) {
  if (x < 0) {
    return("< 0")
  } else if (x == 0) {
    return("== 0")
  } else {
    return("> 0")
  }
}

# Apply the function to create the new column
data_agr$category <- sapply(data_agr$fire_change_index, label_values)

## compute proportions and labels
stats_agr <- aggregate(x= list(area= data_agr$area), by= list(class_str= data_agr$class_str, category= data_agr$category), FUN= 'sum')

## compute props
recipe <- as.data.frame(NULL)
for(i in 1:length(unique(stats_agr$class_str))) {
  x <- subset(stats_agr, class_str == unique(stats_agr$class_str)[i])
  x$prop <- round(x$area/sum(x$area) * 100, digits=0)
  recipe <- rbind(recipe, x)
}


## plot fire regime changes 
ggplot(data= data_agr, mapping= aes(x= fire_change_index, y= area/1e6, fill= class_str, col= class_str)) + 
  #geom_density(alpha= 0.4) +
  geom_point(alpha= 0.2) +
  geom_vline(xintercept= 0, col= 'gray50', linetype= 'dashed', size= 1) + 
  geom_smooth(method= 'loess', col= 'tomato2') + 
  theme_minimal() +
  facet_wrap(~class_str, scales= 'free_y') +
  scale_fill_manual(values=c('#45c2a5', '#b8af4f', '#006400', '#00ff00')) +
  scale_colour_manual(values=c('#45c2a5', '#b8af4f', '#006400', '#00ff00')) +
  theme(text = element_text(size = 16)) +
  xlab('Índice de mudança no regime de fogo') +
  scale_y_log10() +
  ylab('log10 ~ Área (Mha)')
  
## aggregate general
x <- aggregate(x= list(area= stats_agr$area), by= list(category= stats_agr$category), FUN= 'sum')
x$prop <- round(x$area/sum(x$area) * 100, digits=0)
  
