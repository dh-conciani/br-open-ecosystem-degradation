#!/usr/bin/env bash
set -euo pipefail

# Number of parallel jobs. Change this if needed.
JOBS="$(nproc)"

process_year() {
    local year="$1"
    local vrt="ENN_${year}.vrt"
    local out="ENN_${year}.tif"

    echo "[$(date '+%F %T')] Processing year ${year}"

    # Build virtual mosaic
    gdalbuildvrt "$vrt" ENN_*_"${year}".tif

    # Convert to compressed GeoTIFF
    gdal_translate \
        -co COMPRESS=LZW \
        -co BIGTIFF=YES \
        "$vrt" "$out"

    # Only delete tiles if output exists and is readable
    if [ -f "$out" ] && gdalinfo "$out" >/dev/null 2>&1; then
        echo "[$(date '+%F %T')] Success for ${year}, deleting source tiles"
        rm -f ENN_*_"${year}".tif
        rm -f "$vrt"
    else
        echo "[$(date '+%F %T')] ERROR for ${year}, tiles not deleted" >&2
        return 1
    fi
}

export -f process_year

# Find unique years and process in parallel
ls ENN_*_*.tif \
  | sed -E 's/.*_([0-9]{4})\.tif/\1/' \
  | sort -u \
  | parallel -j "$JOBS" process_year {}
