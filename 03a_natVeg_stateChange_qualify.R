## qualify state change among enchroachment or thinning
## dhemerson.costa@ipam.org.br
## gt degradação mapbiomas

## read libraries
library(rgee)

## authenticate
ee_Initialize(drive= TRUE,
              gcs= TRUE)

## read entry layer (state change in the level-0)
state_change <- ee$Image('projects/mapbiomas-workspace/DEGRADACAO/TRAJECTORIES/COL71/NV_CHANGE_V3')$
  remap(from= c(1, 2, 3, 4, 5),
        to=   c(2, 3, 4, 5, 1))

Map$addLayer(state_change, list(palette=c('#2D7E1D', '#75F70A', '#606060', '#FFF700', '#F41BE7'),
                                min=1, max=5), 'NV state change')
