## perform statsitics API benchmark
## dhemerson.costa@ipam.org.br

## load libraries
library(httr2)
library(utils)

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
combinations <- expand.grid(
  areaBorda = c(NA, 30, 300),
  tamanhoFragmento = c(NA, 3, 25),
  isolamento = c(NA, 'med: 25, dist: 05, gde: 100', 'med: 100, dist: 20, gde: 1000'),
  fogoIdade = c(NA, 15),
  vegetacaoSecundariaIdade = c(NA, 15),
  vegetacaoNativaClasse = c(NA, 3, 4, 12)
)

# Filter rows based on at least one non-NA value in the row
combinations <- combinations[apply(!is.na(combinations), 1, any), ]

## deal with factors in 'isolamento' variable 
combinations$isolamento <- as.character(combinations$isolamento)

# Replace NA values with ''
combinations[] <- lapply(combinations, function(x) replace(x, is.na(x), ''))

## set the territoy type to test
toTest <- subset(territories, tipo == 'municipio')

## set the number of random estimates 
nEstimates <- 1

## define empty recipe
recipe <- as.data.frame(NULL)

## for each random estimate
for (i in 1:nEstimates) {
  
  ## sort a random territory 
  x <- toTest[ sample(x= 1:nrow(toTest), size= 1) ,]
  
  ## for each parameter combination 
  for (k in 1:nrow(combinations)) {
    print(paste0(i, ' of ', nEstimates, ' - ', unique(toTest$tipo), ' - combination ', k, ' of ', nrow(combinations)))
    
    ## get combination
    params_ik <- combinations[k,]
    
    ## build url
    urlReq <- URLencode(enc2utf8(paste0(url, x$tipo, '/', x$nome, '/', '2022')))
    
    ## build params
    params <- list(
      escala = 30,
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
    
  }
}




