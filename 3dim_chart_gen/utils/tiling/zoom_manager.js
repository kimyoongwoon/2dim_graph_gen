export function detectZoomLevel(plotlyDiv, tileLevels) {
    if (!plotlyDiv || !plotlyDiv.layout || !tileLevels.levels) {
        return 1;
    }

    try {
        const xRange = plotlyDiv.layout.xaxis?.range;
        const yRange = plotlyDiv.layout.yaxis?.range;

        if (!xRange || !yRange) {
            return 1;
        }

        // Calculate zoom area
        const zoomWidth = Math.abs(xRange[1] - xRange[0]);
        const zoomHeight = Math.abs(yRange[1] - yRange[0]);
        const zoomArea = zoomWidth * zoomHeight;

        // Calculate total data area
        const { bounds } = tileLevels;
        const totalWidth = bounds.xMax - bounds.xMin;
        const totalHeight = bounds.yMax - bounds.yMin;
        const totalArea = totalWidth * totalHeight;

        // Calculate zoom ratio
        const zoomRatio = Math.min(1, zoomArea / totalArea);

        // Map zoom ratio to level (1 = most aggregated, 10 = individual points)
        const level = Math.max(1, Math.min(10, Math.ceil((1 - zoomRatio) * 10)));

        console.log('[ZOOM_MANAGER] Zoom detection:', {
            zoomRatio: zoomRatio.toFixed(3),
            detectedLevel: level
        });

        return level;

    } catch (error) {
        console.warn('[ZOOM_MANAGER] Zoom detection failed:', error);
        return 1;
    }
}

/**
 * Get tiles visible in current zoom area
 */
export function getVisibleTiles(plotlyDiv, tileLevel) {
    if (!plotlyDiv.layout?.xaxis?.range || !plotlyDiv.layout?.yaxis?.range) {
        return tileLevel.tiles;
    }

    const xRange = plotlyDiv.layout.xaxis.range;
    const yRange = plotlyDiv.layout.yaxis.range;

    const visibleTiles = tileLevel.tiles.filter(tile => {
        // FIX: Don't destructure - bounds IS the bounds object
        const bounds = tile.tileBounds || tile.bounds;  // ✅ CORRECT

        if (!bounds) {
            console.warn('[ZOOM_MANAGER] Tile missing bounds:', tile);
            return false;
        }

        return !(
            bounds.xMax < xRange[0] || bounds.xMin > xRange[1] ||
            bounds.yMax < yRange[0] || bounds.yMin > yRange[1]
        );
    });

    return visibleTiles;
}