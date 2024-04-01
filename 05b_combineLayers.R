## combine layers to export mixed effects under a specific scenario 
## dhemerson.costa@ipam.org.br

## read libraries
library(rgee)

## imitialize GEE API
ee_Initialize()

## read layers
## collection 8
collection <- ee$Image('projects/mapbiomas-workspace/public/collection8/mapbiomas_collection80_integration_v1')

## edge area
edge = ee$Image('projects/mapbiomas-workspace/DEGRADACAO/COLECAO/BETA/PROCESS/edge_area/edge_90m_v3')

## patch size
patch = ee$Image('projects/mapbiomas-workspace/DEGRADACAO/COLECAO/BETA/PROCESS/patch_size/size_25ha_v4')

## isolation
isolation = ee$Image('projects/mapbiomas-workspace/DEGRADACAO/ISOLATION/nat_uso_frag50__dist10k__500_v6_85_22')

## fire
fire_freq = ee$Image('projects/mapbiomas-workspace/DEGRADACAO/COLECAO/BETA/PROCESS/fire/frequency_v1')
