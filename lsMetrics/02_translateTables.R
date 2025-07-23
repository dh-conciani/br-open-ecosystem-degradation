## translate fire-edge tables 
## dhemerson.costa@ipam.org.br

## read libraries
library(dplyr)

## avoid sci notations
options(scipen= 9e3)

## read reference
dict <- read.csv('./dict/territories-dict.csv')

## list patterns to read
file_patterns <- c(
  'protected-areas',
  'indigenous-areas'
)

## build recipe 
recipe <- as.data.frame(NULL)

## for each pattern
for(i in 1:length(file_patterns)) {
  
  ## list files
  files <- list.files('./table', 
                      pattern= file_patterns[i],
                      full.names= TRUE)
  
  ## for each file
  for(j in 1:length(files)) {
    
    print(paste0('ingesting file -> ', files[j]))
    
    ## read file
    file_ij <- read.csv(files[j]) %>%
      select(-system.index, -.geo)
    
    ## translate ids
    file_ij$biome <- file_ij$class_id %% 100
    file_ij$class <- round((file_ij$class_id %% 1000)/100, digits=0)
    file_ij$distance <- round(file_ij$class_id / 10000, digits=0)

    
    ## check file pattern
    if(file_patterns[i] == 'protected-areas') {
      
      ## read dictionary
      dict_i <- subset(dict, CATEGORY == 'PROTECTED_AREA')
      
    }
    
    ## check file pattern
    if(file_patterns[i] == 'indigenous-areas') {
      
      ## read dictionary
      dict_i <- subset(dict, CATEGORY == 'INDIGENOUS_TERRITORIES')
      
    }
    
    ## translate 
    recipe_ij <- left_join(file_ij, dict_i, by= c('territory' = 'FEATURE_ID'))
    
    ## check file pattern
    if(file_patterns[i] == 'indigenous-areas') {
      
      ## rect table
      recipe_ij$LEVEL_4 <- recipe_ij$LEVEL_2
      recipe_ij$LEVEL_2 <- 'indigenous_land'
      recipe_ij$LEVEL_3 <- 'TI'
      
    }
    
    ## translate biomes
    recipe_ij <- recipe_ij %>%
      mutate(biome = gsub(1, 'Amazônia', biome),
             biome = gsub(2, 'Mata Atlântica', biome),
             biome = gsub(3, 'Pantanal', biome),
             biome = gsub(4, 'Cerrado', biome),
             biome = gsub(5, 'Caatinga', biome),
             biome = gsub(6, 'Pampa', biome),)
    
    
    
    ## store
    recipe <- rbind(recipe, recipe_ij)
    
    
  }
  
  print ('===============================================================')
  
}

## store
write.csv(recipe, './table_fireEdge_protected-areas-indigenous.csv', 
          dec= '.',
          sep=',',
          fileEncoding = 'latin2')
