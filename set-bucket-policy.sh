#!/bin/sh
mc alias set myminio http://localhost:9000 minioadmin minioadmin
mc policy set download myminio/restaurant-menu-images 