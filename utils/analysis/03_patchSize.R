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
data <- read.table('./table/patch_size.csv', header= TRUE, sep= ',')

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
                            size= data$size), FUN='sum')

## get legengs
legs <- subset(data2, year == 1985 | year == 2022)

## plot
p <- ggplot(data= data2, mapping= aes(x= year, y= area/1e6, col= as.factor(size), fill= as.factor(size), linetype= as.factor(size))) +
  geom_line(size= 1) +
  facet_wrap(~biome, scales= 'free_y') +
  scale_colour_manual('Size (<x ha)', 
                      values=c('#35D4E4', '#48D468', '#0B6716', '#E8DB38', '#B29725', '#F3940B', '#FA0F04', '#FC02A1')) +
  scale_fill_manual('Size (<x ha)', 
                    values=c('#35D4E4', '#48D468', '#0B6716', '#E8DB38', '#B29725', '#F3940B', '#FA0F04', '#FC02A1')) +
  geom_label(data= legs, mapping=aes(x= year, label= paste0(round(area/1e6, digits=1))), alpha= .3, size= 4,
             vjust="inward",hjust="inward", col= 'black') + 
  theme_bw() +
  theme(text = element_text(size = 15)) +
  ylab('Área (Mha)') +
  xlab(NULL)

p
pdf("size_free.pdf",width=16,height=9)
p
dev.off()

### use normalized areas
## get only native classes
ref <- subset(reference, class == 3 | class == 4 | class == 5 | class == 6 | class == 11 | class == 12)

## aggregate
ref <- aggregate(x=list(area= ref$area),
                 by= list(biome= ref$ecoregion,
                          year= ref$variable), FUN='sum')

## translate biome
ref$biome_str <- 
  gsub(1, 'Amazônia',
       gsub(2, 'Mata Atlântica',
            gsub(3, 'Pantanal',
                 gsub(4, 'Cerrado',
                      gsub(5, 'Caatinga',
                           gsub(6, 'Pampa',
                                ref$biome))))))

## now, compute percent per year, per biome
recipe <- as.data.frame(NULL)
for(i in 1:length(unique(ref$biome_str))) {
  ## get ref
  ref_i <- subset(ref, biome_str == unique(ref$biome_str)[i])
  ## get data
  data_i <- subset(data2, biome == unique(ref$biome_str)[i])
  
  ## for each year
  for (j in 1:length(unique(ref$year))) {
    ## get ref
    ref_ij <- subset(ref_i, year == unique(ref$year)[j])
    ## get data
    data_ij <- subset(data_i, year == unique(ref$year)[j])
    
    ## compute percent
    data_ij$perc <- round(data_ij$area / ref_ij$area * 100, digits= 3)
    data_ij$area_ref <- ref_ij$area
    
    ## bind
    recipe <- rbind(recipe, data_ij)
  }
}

## get legengs
legs <- subset(recipe, year == 1985 | year == 2022)

## plot
p <- ggplot(data= recipe, mapping= aes(x= year, y= perc, col= as.factor(size), fill= as.factor(size), linetype= as.factor(size))) +
  geom_line(size= 1) +
  facet_wrap(~biome, scales= 'free_y') +
  scale_colour_manual('Size (<x ha)', 
                      values=c('#35D4E4', '#48D468', '#0B6716', '#E8DB38', '#B29725', '#F3940B', '#FA0F04', '#FC02A1')) +
  scale_fill_manual('Size (<x ha)', 
                    values=c('#35D4E4', '#48D468', '#0B6716', '#E8DB38', '#B29725', '#F3940B', '#FA0F04', '#FC02A1')) +
  geom_label(data= legs, mapping=aes(x= year, label= paste0(round(perc, digits=1))), alpha= .3, size= 4,
             vjust="inward",hjust="inward", col= 'black') + 
  theme_bw() +
  theme(text = element_text(size = 15)) +
  ylab('Área (Mha)') +
  xlab(NULL)

p
pdf("size_relative.pdf",width=16,height=9)
p
dev.off()
