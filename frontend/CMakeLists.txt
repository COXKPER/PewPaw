cmake_minimum_required(VERSION 3.22)
project(PewPaw VERSION 0.1.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_AUTOMOC ON)
set(CMAKE_AUTORCC ON)

find_package(Qt6 REQUIRED COMPONENTS Core Gui Widgets WebEngineWidgets WebChannel DBus)

add_executable(pewpaw
    main.cpp
    bridge/ipc_bridge.cpp
    bridge/notification_bridge.cpp
    resources/resources.qrc
)

target_link_libraries(pewpaw PRIVATE
    Qt6::Core
    Qt6::Gui
    Qt6::Widgets
    Qt6::WebEngineWidgets
    Qt6::WebChannel
    Qt6::DBus
)

target_include_directories(pewpaw PRIVATE ${CMAKE_CURRENT_SOURCE_DIR})
