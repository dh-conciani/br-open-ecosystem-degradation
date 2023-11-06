## export table to be ingest in data-studio and end users
## gt degradação
## dhemerson.costa@ipam.org.br

## read libraries
library(ggplot2)
library(ggpattern)

## avoid sci notes
options(scipen= 9e3)

#######
## read edge area data
data <- read.table('../table/edge_area.csv', header= TRUE, sep= ',')

## get mapbiomas lcluc 
reference <- read.csv('../table/lulc_reference.csv')

## drop unused columns (from GEE)
data <- data[, !names(data) %in%  c("system.index",".geo")]

## build aggregation for the entire brazil
br_data <- aggregate(x=list(area= data$area), by= list(
  class = data$class,
  distance= data$distance,
  variable= data$variable), FUN= 'sum')

## merge with 
br_data$ecoregion = 'Brasil'
data <- rbind(data, br_data);rm(br_data)

## build native vegetation class
x <- aggregate(x=list(area= data$area), by= list(distance= data$distance, ecoregion= data$ecoregion, variable= data$variable), FUN='sum')
x$class <- 'Vegetação Nativa'

## merge
data <- rbind(data, x); rm(x)

## add descriptor 
data$stat = 'Área absoluta'

## drop unused columns (from GEE)
reference <- reference[, !names(reference) %in%  c("system.index",".geo")]

## subset reference only to native vegetation
reference <- subset(reference, eval(
  parse(text = paste("class ==", paste(unique(data$class)[- length(unique(data$class))], collapse = " | class ==")))))

## build aggregation for the entire brazil
br_reference <- aggregate(x=list(area= reference$area), by= list(
  class = reference$class,
  variable= reference$variable), FUN= 'sum')

## merge with 
br_reference$ecoregion = 'Brasil'
reference <- rbind(reference, br_reference);rm(br_reference)

## build native vegetation class
x <- aggregate(x=list(area= reference$area), 
               by= list(ecoregion= reference$ecoregion,
                        variable= reference$variable), FUN= 'sum')

x$class <- 'Vegetação Nativa'

## merge with
reference <- rbind(reference, x); rm(x)

## now, compute relative values by matching tables
recipe <- as.data.frame(NULL) ## empty recipe

## for each biome 
for (i in 1:length(unique(data$ecoregion))) {
  ## get reference for the biome i
  ref_i <- subset(reference, ecoregion == unique(reference$ecoregion)[i])
  ## get data for the biome i
  data_i <- subset(data, ecoregion == unique(data$ecoregion)[i])
  
  ## for each year 
  for (j in 1:length(unique(data_i$variable))) {
    ## get reference for the biome i and year j
    ref_ij <- subset(ref_i, variable == unique(data$variable)[j])
    ## get data for the biome i and year j
    data_ij <- subset(data_i, variable == unique(data$variable)[j])
    
    ## for each class present in data
    for(k in 1:length(unique(data_ij$class))) {
      ## get reference for the biome biome i, year j and class k
      ref_ijk <- subset(ref_ij, class == unique(data_ij$class)[k])
      ## get data for the biome i, year j and class k
      data_ijk <- subset(data_ij, class == unique(data_ij$class)[k])
      
      ## retain absolute value
      data_ijk$ref_area <- ref_ijk$area
      ## compute relative value
      data_ijk$relative_area <- round(data_ijk$area/data_ijk$ref_area * 100, digits=1)
      
      ## store in a recipe
      recipe <- rbind(data_ijk, recipe)
    }
  }
}

## remove bin
rm(ref_i, data_i, ref_ij, data_ij, ref_ijk, data_ijk)

## translate class
recipe$class_str <- gsub(3, 'Formação Florestal',
                       gsub(4, 'Formação Savânica',
                            gsub(11, 'Áreas Úmidas',
                                 gsub(12, 'Formação Campestre',
                                      gsub(5, 'Mangue',
                                           gsub(6, 'Floresta Alagada',
                                                gsub(49, 'Restinga Arbórea',
                                                     gsub(50, 'Restinga Herbácea',
                                                          recipe$class))))))))
## translate biome
recipe$biome_str <- 
  gsub(1, 'Amazônia',
       gsub(2, 'Mata Atlântica',
            gsub(3, 'Pantanal',
                 gsub(4, 'Cerrado',
                      gsub(5, 'Caatinga',
                           gsub(6, 'Pampa',
                                recipe$ecoregion))))))



## export table 
write.table(x= recipe,
            file= '../data_studio/edgeArea_v2.csv', 
            fileEncoding='UTF-8',
            row.names= FALSE,
            sep='\t',
            dec=',',
            col.names= TRUE)
