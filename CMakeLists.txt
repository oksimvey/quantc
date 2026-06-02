cmake_minimum_required(VERSION 3.20)  # 3.20+ tem melhor suporte C++23
project(QuantC LANGUAGES CXX)


set(CMAKE_CXX_STANDARD 23)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)


file(GLOB_RECURSE SRC_FILES CONFIGURE_DEPENDS
    src/quantc/*.cpp
)


add_executable(QuantC ${SRC_FILES})


target_include_directories(QuantC PRIVATE
    ${CMAKE_SOURCE_DIR}/src/quantc
)


target_compile_options(QuantC PRIVATE
    -O3



    -Wall
    -Wextra
    -Wpedantic



    -Wshadow
    -Wconversion
    -Wsign-conversion



    -Wcast-qual
    -Wdiscarded-qualifiers
    -Wignored-qualifiers
    -Wwrite-strings



    -Wnon-virtual-dtor
    -Woverloaded-virtual
    -Wold-style-cast



    -Wswitch-enum
    -Wswitch-default
    -Wunused-parameter
)

target_link_options(QuantC PRIVATE
    -static-libgcc
    -static-libstdc++
)