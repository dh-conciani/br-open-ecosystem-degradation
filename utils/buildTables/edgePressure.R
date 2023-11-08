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
data <- read.table('../table/edge_pressure.csv', header= TRUE, sep= ',')

## drop unused columns (from GEE)
data <- data[, !names(data) %in%  c("system.index",".geo")]

## remove zero
data <- subset(data, pressure_class != 0)
data <- subset(data, pressure_class != 33)
data <- subset(data, pressure_class != 6)
data <- subset(data, pressure_class != 23)

## build aggregation for the entire brazil
br_data <- aggregate(x=list(area= data$area), by= list(
  native_class = data$native_class,
  pressure_class= data$pressure_class,
  variable= data$variable), FUN= 'sum')

## merge with 
br_data$ecoregion = 'Brasil'
data <- rbind(data, br_data);rm(br_data)

## build native vegetation class
x <- aggregate(x=list(area= data$area), by= list(pressure_class= data$pressure_class, ecoregion= data$ecoregion, variable= data$variable), FUN='sum')
x$native_class <- 'Vegetação Nativa'

## merge
data <- rbind(data, x); rm(x)

## add descriptor 
data$stat = 'Área absoluta'

## compute relative area
recipe <- as.data.frame(NULL)
for(i in 1:length(unique(data$ecoregion))) {
  ## get biome i
  data_i <- subset(data, ecoregion == unique(data$ecoregion)[i])
  
  for (j in 1:length(unique(data_i$variable))) {
    ## get year j
    data_ij <- subset(data_i, variable == unique(data_i$variable)[j])
    
    for (k in 1:length(unique(data_ij$native_class))) {
      ## get class k
      data_ijk <- subset(data_ij, native_class == unique(data_ij$native_class)[k])
      ## get percents
      data_ijk$area <- round(data_ijk$area / sum(data_ijk$area) * 100, digits=2)
      data_ijk$stat <- 'Área relativa'
      ## store
      recipe <- rbind(data_ijk, recipe)
    }
  }
}

## bindo into recipe
recipe <- rbind(data, recipe)

## translate class
recipe$class_str <- gsub(3, 'Formação Florestal',
                         gsub(4, 'Formação Savânica',
                              gsub(11, 'Áreas Úmidas',
                                   gsub(12, 'Formação Campestre',
                                        gsub(5, 'Mangue',
                                             gsub(6, 'Floresta Alagada',
                                                  gsub(49, 'Restinga Arbórea',
                                                       gsub(50, 'Restinga Herbácea',
                                                            recipe$native_class))))))))

## translate biome
recipe$biome_str <- 
  gsub(1, 'Amazônia',
       gsub(2, 'Mata Atlântica',
            gsub(3, 'Pantanal',
                 gsub(4, 'Cerrado',
                      gsub(5, 'Caatinga',
                           gsub(6, 'Pampa',
                                recipe$ecoregion))))))

## translate pressure classses
recipe$pressure_str <- 
gsub(9, 'Silvicultura',
     gsub(15, 'Pastagem',
          gsub(20, 'Lavoura Temporária',
               gsub(21, 'Mosaico de Usos',
                    gsub(24, 'Área Urbanizada',
                         gsub(25, 'Outras Áreas não Vegetadas',
                              gsub(30, 'Mineração',
                                   gsub(35, 'Lavoura Perene',
                                        gsub(39, 'Lavoura Temporária',
                                             gsub(41, 'Lavoura Temporária',
                                                  gsub(31, 'Aquicultura',
                                                       gsub(40, 'Lavoura Temporária',
                                                            gsub(46, 'Lavoura Perene',
                                                                 gsub(48, 'Lavoura Perene',
                                                                      gsub(47, 'Lavoura Perene',
                                                                           gsub(62, 'Lavoura Temporária',
                                                                                recipe$pressure_class))))))))))))))))

## aggregate
recipe2 <- aggregate(x=list(area= recipe$area),
          by= list(
            biome_str= recipe$biome_str,
            variable= recipe$variable,
            stat= recipe$stat,
            class_str= recipe$class_str,
            pressure_str= recipe$pressure_str
          ), FUN= 'sum')


## export table 
write.table(x= recipe2,
            file= '../data_studio/edgePressure_v3.csv', 
            fileEncoding='UTF-8',
            row.names= FALSE,
            sep='\t',
            dec=',',
            col.names= TRUE)
