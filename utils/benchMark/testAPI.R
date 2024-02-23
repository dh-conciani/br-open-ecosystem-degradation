## perform statsitics API benchmark
## dhemerson.costa@ipam.org.br

## load libraries
library(httr2)

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

## build parameters grid
#escala <- 30
# areaBorda <- c(NA, 30, 60, 90, 120, 150, 300, 600, 1000)
# tamanhoFragmento <- c(NA, 3, 5, 10, 25, 50, 75)
# isolamento <- c(NA, 'med: 25, dist: 05, gde: 100', 'med: 25, dist: 05, gde: 500', 'med: 25, dist: 05, gde: 1000',
#                       'med: 25, dist: 10, gde: 100', 'med: 25, dist: 10, gde: 500', 'med: 25, dist: 10, gde: 1000',
#                       'med: 25, dist: 20, gde: 100', 'med: 25, dist: 20, gde: 500', 'med: 25, dist: 20, gde: 1000',
#                       'med: 50, dist: 05, gde: 100', 'med: 50, dist: 05, gde: 500', 'med: 50, dist: 05, gde: 1000',
#                       'med: 50, dist: 10, gde: 100', 'med: 50, dist: 10, gde: 500', 'med: 50, dist: 10, gde: 1000',
#                       'med: 50, dist: 20, gde: 100', 'med: 50, dist: 20, gde: 500', 'med: 50, dist: 20, gde: 1000',
#                       'med: 100, dist: 05, gde: 500', 'med: 100, dist: 05, gde: 1000', 'med: 100, dist: 10, gde: 500',
#                       'med: 100, dist: 10, gde: 1000', 'med: 100, dist: 20, gde: 500', 'med: 100, dist: 20, gde: 1000')
# fogoIdade <- c(NA, 1:38)
# vegetacaoSecundariaIdade <- c(NA, 1:38)
# vegetacaoNativaClasse <- c(NA, 3, 4, 5, 11, 12, 49, 50)

## to test
## perform statsitics API benchmark
## dhemerson.costa@ipam.org.br

## load libraries
library(httr2)

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

## build parameters grid
#escala <- 30
# areaBorda <- c(NA, 30, 60, 90, 120, 150, 300, 600, 1000)
# tamanhoFragmento <- c(NA, 3, 5, 10, 25, 50, 75)
# isolamento <- c(NA, 'med: 25, dist: 05, gde: 100', 'med: 25, dist: 05, gde: 500', 'med: 25, dist: 05, gde: 1000',
#                       'med: 25, dist: 10, gde: 100', 'med: 25, dist: 10, gde: 500', 'med: 25, dist: 10, gde: 1000',
#                       'med: 25, dist: 20, gde: 100', 'med: 25, dist: 20, gde: 500', 'med: 25, dist: 20, gde: 1000',
#                       'med: 50, dist: 05, gde: 100', 'med: 50, dist: 05, gde: 500', 'med: 50, dist: 05, gde: 1000',
#                       'med: 50, dist: 10, gde: 100', 'med: 50, dist: 10, gde: 500', 'med: 50, dist: 10, gde: 1000',
#                       'med: 50, dist: 20, gde: 100', 'med: 50, dist: 20, gde: 500', 'med: 50, dist: 20, gde: 1000',
#                       'med: 100, dist: 05, gde: 500', 'med: 100, dist: 05, gde: 1000', 'med: 100, dist: 10, gde: 500',
#                       'med: 100, dist: 10, gde: 1000', 'med: 100, dist: 20, gde: 500', 'med: 100, dist: 20, gde: 1000')
# fogoIdade <- c(NA, 1:38)
# vegetacaoSecundariaIdade <- c(NA, 1:38)
# vegetacaoNativaClasse <- c(NA, 3, 4, 5, 11, 12, 49, 50)

## to test
areaBorda <- c(NA, 30, 300)
tamanhoFragmento <- c(NA, 3, 25)
isolamento <- c(NA, 'med: 25, dist: 05, gde: 100', 'med: 100, dist: 20, gde: 1000')
fogoIdade <- c(NA, 15)
vegetacaoSecundariaIdade <- c(NA, 15)
vegetacaoNativaClasse <- c(NA, 3, 4, 12)

# Create a data frame with all combinations
combinations <- expand.grid(
  areaBorda = areaBorda,
  tamanhoFragmento = tamanhoFragmento,
  isolamento = isolamento,
  fogoIdade = fogoIdade,
  vegetacaoSecundariaIdade = vegetacaoSecundariaIdade,
  vegetacaoNativaClasse = vegetacaoNativaClasse
)

# Filter rows based on at least one non-NA value in the row
combinations <- combinations[apply(!is.na(combinations), 1, any), ]







# URL and parameters
url <- 'http://35.192.198.88:8085/api/v1/statistics/municipio/Salvador-BA/2022'

params <- list(escala = 30, areaBorda = 30, vegetacaoNativaClasse = 3)

# Making the GET request
response <- GET(url, query = params, accept_json())

# Print response content
content(response)





# Create a data frame with all combinations
combinations <- expand.grid(
  areaBorda = areaBorda,
  tamanhoFragmento = tamanhoFragmento,
  isolamento = isolamento,
  fogoIdade = fogoIdade,
  vegetacaoSecundariaIdade = vegetacaoSecundariaIdade,
  vegetacaoNativaClasse = vegetacaoNativaClasse
)

# Filter rows based on at least one non-NA value in the row
combinations <- combinations[apply(!is.na(combinations), 1, any), ]





nrow(combinations) * nrow(territories)





# URL and parameters
url <- 'http://35.192.198.88:8085/api/v1/statistics/municipio/Salvador-BA/2022'

params <- list(escala = 30, areaBorda = 30, vegetacaoNativaClasse = 3)

# Making the GET request
response <- GET(url, query = params, accept_json())

# Print response content
content(response)


