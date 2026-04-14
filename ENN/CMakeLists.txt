cmake_minimum_required(VERSION 3.16)
project(enn_cpp_parallel LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

find_package(GDAL REQUIRED)
find_package(OpenMP REQUIRED)

add_executable(enn_cpp_parallel main.cpp)

target_include_directories(enn_cpp_parallel PRIVATE
    ${GDAL_INCLUDE_DIRS}
    ${CMAKE_SOURCE_DIR}/include
)

target_link_libraries(enn_cpp_parallel PRIVATE
    ${GDAL_LIBRARIES}
    OpenMP::OpenMP_CXX
)