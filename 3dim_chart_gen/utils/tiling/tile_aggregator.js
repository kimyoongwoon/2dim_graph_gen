// ============================================================================
// utils/tiling/tile_aggregator.js - Core Tiling Engine (Minimal Implementation)
// ============================================================================

/**
 * Generate tile levels for Level-of-Detail visualization
 * @param {Array} data - Raw data points 
 * @param {string} xField - X field name
 * @param {string} yField - Y field name
 * @param {number} maxLevels - Number of zoom levels (default: 10)
 * @returns {Object} Tile data structure
 */
export function generateTileLevels(data, xField, yField, maxLevels = 10) {
    console.log('[TILE_AGGREGATOR] Generating tile levels:', {
        dataPoints: data.length,
        levels: maxLevels
    });

    if (!data || data.length === 0) {
        return { levels: [], bounds: null };
    }

    // Calculate data bounds
    const bounds = calculateDataBounds(data, xField, yField);

    // Generate tile levels with doubling progression
    const levels = [];
    for (let level = 1; level <= maxLevels; level++) {
        const gridSize = Math.pow(2, level + 1); // 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048
        const tileLevel = generateTileLevel(data, xField, yField, bounds, gridSize, level);
        levels.push(tileLevel);

        console.log(`[TILE_AGGREGATOR] Level ${level}: ${gridSize}x${gridSize} grid, ${tileLevel.tiles.length} non-empty tiles`);
    }

    return {
        levels,
        bounds,
        totalPoints: data.length,
        xField,
        yField
    };
}

/**
 * Generate tiles for a specific zoom level
 */
function generateTileLevel(data, xField, yField, bounds, gridSize, level) {
    const { xMin, xMax, yMin, yMax } = bounds;
    const tileWidth = (xMax - xMin) / gridSize;
    const tileHeight = (yMax - yMin) / gridSize;

    const tileGrid = new Map();

    // Assign points to tiles
    data.forEach(point => {
        const x = point[xField];
        const y = point[yField];

        if (x == null || y == null || isNaN(x) || isNaN(y)) {
            return;
        }

        const tileX = Math.min(Math.floor((x - xMin) / tileWidth), gridSize - 1);
        const tileY = Math.min(Math.floor((y - yMin) / tileHeight), gridSize - 1);
        const tileKey = `${tileX},${tileY}`;

        if (!tileGrid.has(tileKey)) {
            tileGrid.set(tileKey, {
                tileX,
                tileY,
                points: [],
                bounds: {
                    xMin: xMin + tileX * tileWidth,
                    xMax: xMin + (tileX + 1) * tileWidth,
                    yMin: yMin + tileY * tileHeight,
                    yMax: yMin + (tileY + 1) * tileHeight
                }
            });
        }

        tileGrid.get(tileKey).points.push(point);
    });

    // Process tiles and calculate aggregations
    const tiles = Array.from(tileGrid.values()).map(tile => {
        const aggregatedTile = aggregateTileData(tile.points, tile.bounds);
        return {
            ...tile,
            ...aggregatedTile,
            level,
            gridSize
        };
    });

    return {
        level,
        gridSize,
        tileWidth,
        tileHeight,
        tiles,
        bounds
    };
}

/**
 * Aggregate data points within a tile
 */
export function aggregateTileData(points, tileBounds) {
    if (!points || points.length === 0) {
        return {
            count: 0,
            centroid: { x: 0, y: 0 },
            statistics: {}
        };
    }

    const count = points.length;

    // Calculate centroid - use first two numeric fields found
    const firstPoint = points[0];
    const fields = Object.keys(firstPoint);
    const numericFields = fields.filter(field =>
        typeof firstPoint[field] === 'number' && !isNaN(firstPoint[field])
    );

    let sumX = 0, sumY = 0;
    const xField = numericFields[0];
    const yField = numericFields[1];

    points.forEach(p => {
        sumX += (parseFloat(p[xField]) || 0);
        sumY += (parseFloat(p[yField]) || 0);
    });

    const centroid = {
        x: sumX / count,
        y: sumY / count
    };

    // Calculate statistics for all numeric fields
    const statistics = {};
    numericFields.forEach(field => {
        const values = points
            .map(p => parseFloat(p[field]))
            .filter(v => !isNaN(v));

        if (values.length > 0) {
            statistics[field] = {
                min: Math.min(...values),
                max: Math.max(...values),
                mean: values.reduce((sum, v) => sum + v, 0) / values.length,
                median: calculateMedian(values)
            };
        }
    });

    return {
        count,
        centroid,
        statistics,
        tileBounds
    };
}

function calculateDataBounds(data, xField, yField) {
    const validPoints = data.filter(d =>
        d[xField] != null && d[yField] != null &&
        !isNaN(d[xField]) && !isNaN(d[yField])
    );

    if (validPoints.length === 0) {
        return { xMin: 0, xMax: 1, yMin: 0, yMax: 1 };
    }

    const xValues = validPoints.map(d => parseFloat(d[xField]));
    const yValues = validPoints.map(d => parseFloat(d[yField]));

    return {
        xMin: Math.min(...xValues),
        xMax: Math.max(...xValues),
        yMin: Math.min(...yValues),
        yMax: Math.max(...yValues)
    };
}

function calculateMedian(values) {
    if (values.length === 0) return 0;

    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);

    return sorted.length % 2 === 0
        ? (sorted[mid - 1] + sorted[mid]) / 2
        : sorted[mid];
}
