## perform statsitics API benchmark
## dhemerson.costa@ipam.org.br

## load libraries
library(httr2)

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



## build url with type and territory 
urlReq <- paste0(url, 'municipio', '/', 'Salvador-BA', '/', '2022')

params <- list(escala = 30, areaBorda = 30, tamanhoFragmento= '')

# Making the GET request
response <- GET(urlReq, query = params, accept_json())


content(response)

