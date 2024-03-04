## perform statsitics API benchmark
## dhemerson.costa@ipam.org.br

## load libraries
library(httr)
library(utils)

## avoids scientific notation
options(scipen=9e3)

## set statistics base url
url <- 'http://35.192.198.88:8085/api/v1/statistics/'

## get territories list
territories <- content(GET('http://35.192.198.88:8085/api/v1/territories', accept_json()))

# Using lapply to iterate over the list of lists and create data frames
dfs <- lapply(territories$territorios, function(territory) {
  data.frame(
    tipo = territory$tipo,
    codigo = territory$codigo,
    nome = territory$nome
  )
})

# Combining data frames into a single data frame
territories <- do.call(rbind, dfs); rm(dfs)

# Create a data frame with all párameters combinations
#combinations <- expand.grid(
#  areaBorda = c(NA, 30, 300),
#  tamanhoFragmento = c(NA, 3, 25),
#  isolamento = c(NA, 'med: 25, dist: 05, gde: 100', 'med: 100, dist: 20, gde: 1000'),
#  fogoIdade = c(NA, 15),
#  vegetacaoSecundariaIdade = c(NA, 15),
#  vegetacaoNativaClasse = c(NA, 3, 4, 12)
#)
combinations <- expand.grid(
  metodo= c('gridMap'),
  numeroDeGrids = c(1, 3, 5, 7, 11, 15),
  areaBorda = c(NA, 30, 90),
  tamanhoFragmento = c(NA, 5),
  isolamento = c(NA),
  fogoIdade = c(NA, 24),
  vegetacaoSecundariaIdade = c(NA, 14),
  vegetacaoNativaClasse = c(NA)
)

# Filter rows based on at least one non-NA value in the row
combinations <- combinations[apply(!is.na(combinations), 1, any), ]

## deal with factors in 'isolamento' variable 
combinations$isolamento <- as.character(combinations$isolamento)

# Replace NA values with ''
combinations[] <- lapply(combinations, function(x) replace(x, is.na(x), ''))

## set the territoy type to test
toTest <- subset(territories, tipo == 'bioma')
## set the number of random estimates 
#nEstimates <- 50

## define empty recipe
recipe <- as.data.frame(NULL)

## for each random estimate
#for (i in 1:nEstimates) {
 for(i in 1:length(unique(toTest$nome))) {
  ## sort a random territory 
  #x <- toTest[ sample(x= 1:nrow(toTest), size= 1) ,]
  x <- subset(toTest, nome == unique(toTest$nome)[i])
  ## for each parameter combination 
  for (k in 1:nrow(combinations)) {
    #print(paste0(i, ' of ', nEstimates, ' - ', unique(toTest$tipo), ' - combination ', k, ' of ', nrow(combinations)))
    print(paste0(i, ' of ', length(unique(toTest$nome)), ' - ', unique(toTest$tipo), ' - combination ', k, ' of ', nrow(combinations), ' - ', unique(x$nome)))
    
    ## get combination
    params_ik <- combinations[k,]
    
    ## build url
    urlReq <- URLencode(enc2utf8(paste0(url, x$tipo, '/', x$nome, '/', '2022/',params_ik$metodo)))
    
    ## build params
    params <- list(
      escala = 30,
      numeroDeGrids = params_ik$numeroDeGrids,
      areaBorda = params_ik$areaBorda,
      tamanhoFragmento = params_ik$tamanhoFragmento,
      isolamento = params_ik$isolamento,
      fogoIdade = params_ik$fogoIdade,
      vegetacaoSecundariaIdade = params_ik$vegetacaoSecundariaIdade,
      vegetacaoNativaClasse = params_ik$vegetacaoNativaClasse
    )
    
    ## send request and store execution time 
    response <- try(as.data.frame(rbind(GET(urlReq, query = params, accept_json())$times)), silent= TRUE)
    # ## c
    # if (inherits(response, 'try-error') == TRUE) {
    #   
    # }

    ## bind results
    temp <- cbind(x, params_ik, response)
    
    ## store into recipe
    recipe <- rbind(recipe, temp)
    
    print(paste0('Total time: ', temp$total, ' seconds'))
    
  }
}

## export
write.csv(x= recipe, file= paste0('./output/', unique(temp$tipo), '_', 'v5', '.csv'))

