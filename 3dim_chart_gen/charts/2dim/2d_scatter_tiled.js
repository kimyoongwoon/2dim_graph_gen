// ============================================================================
// charts/2dim/2d_scatter_tiled.js - Tiled Chart Implementation
// ============================================================================

import { createTooltipData } from '../../unified/data_processor.js';
import { createPlotlyLayout, createPlotlyConfig } from '../../utils/plotly_helpers.js';
import { generateTileLevels, aggregateTileData } from '../../utils/tiling/tile_aggregator.js';
import { detectZoomLevel, getVisibleTiles } from '../../utils/tiling/zoom_manager.js';

/**
 * 2D Scatter Tiled chart with automatic data size threshold
 */
export function create2DScatterTiled(data, dataset, options = {}) {
    console.log('[2D_SCATTER_TILED] Creating tiled scatter chart');
    console.log('[2D_SCATTER_TILED] Data points:', data.length);
    console.log('[2D_SCATTER_TILED] Dataset axes:', dataset.axes);

    const xAxis = dataset.axes[0].name;
    const yAxis = dataset.axes[1].name;

    // Data size threshold check - auto fallback to regular scatter for small datasets
    const TILING_THRESHOLD = 1000; // Auto-activate tiling for datasets > 1000 points
    if (data.length < TILING_THRESHOLD) {
        console.log(`[2D_SCATTER_TILED] Dataset too small (${data.length} < ${TILING_THRESHOLD}), using regular scatter`);
        // Import and use regular scatter
        import('./2d_scatter.js').then(({ create2DScatter }) => {
            return create2DScatter(data, dataset, options);
        });
        // For now, continue with tiled version for demo
    }

    if (!data || data.length === 0) {
        console.warn('[2D_SCATTER_TILED] Empty data, creating default chart');
        return createEmptyTiledChart(xAxis, yAxis);
    }

    // Generate tile levels
    console.log('[2D_SCATTER_TILED] Generating tile levels...');
    const tileLevels = generateTileLevels(data, xAxis, yAxis, 10);

    // Initial zoom level (most aggregated)
    const initialLevel = 1;

    // Create all level traces
    const allTraces = createAllLevelTraces(tileLevels, xAxis, yAxis, options);

    // Only show first level initially
    allTraces.forEach((trace, index) => {
        trace.visible = index === 0;
    });

    const layout = createPlotlyLayout(
        `${xAxis} × ${yAxis} (Tiled - ${data.length.toLocaleString()} points)`,
        xAxis,
        yAxis
    );

    // Tiled-specific layout adjustments
    layout.xaxis = {
        title: xAxis,
        showgrid: true,
        zeroline: false
    };
    layout.yaxis = {
        title: yAxis,
        showgrid: true,
        zeroline: false
    };

    layout.showlegend = true;
    layout.legend = {
        x: 1.02,
        y: 1,
        bgcolor: 'rgba(255,255,255,0.8)',
        bordercolor: 'rgba(0,0,0,0.2)',
        borderwidth: 1
    };

    const config = createPlotlyConfig();

    const chartConfig = {
        data: allTraces,
        layout: layout,
        config: config,
        // Tiling metadata
        tileLevels,
        currentLevel: initialLevel,
        aggregationType: options.aggregationType || 'mean'
    };

    console.log('[2D_SCATTER_TILED] Tiled chart configuration complete');
    console.log('[2D_SCATTER_TILED] Generated levels:', tileLevels.levels.length);

    return chartConfig;
}

/**
 * Create traces for all zoom levels
 */
function createAllLevelTraces(tileLevels, xAxis, yAxis, options) {
    const traces = [];

    tileLevels.levels.forEach((levelData, index) => {
        const level = index + 1;
        const isIndividualLevel = level === 10;

        let trace;

        if (isIndividualLevel) {
            // Level 10: Show individual points (subset for performance)
            trace = createIndividualPointsTrace(tileLevels, xAxis, yAxis, level);
        } else {
            // Levels 1-9: Show aggregated tiles
            trace = createTileTrace(levelData, xAxis, yAxis, level, options);
        }

        traces.push(trace);
    });

    return traces;
}

/**
 * Create aggregated tile trace
 */
function createTileTrace(levelData, xAxis, yAxis, level, options) {
    const { tiles } = levelData;

    const xPositions = tiles.map(tile => tile.centroid.x);
    const yPositions = tiles.map(tile => tile.centroid.y);

    // Logarithmic size scaling based on point count
    const sizes = tiles.map(tile => {
        const baseSize = 5;
        const scaleFactor = Math.log10(tile.count + 1) * 8;
        return Math.min(25, baseSize + scaleFactor);
    });

    const colors = tiles.map(tile => tile.count);

    // Simplified tooltip
    const hoverTexts = tiles.map(tile => {
        const aggregationType = options.aggregationType || 'mean';
        let tooltip = `<b>Tile (Level ${level})</b><br>`;
        tooltip += `Points: ${tile.count}<br>`;
        tooltip += `Centroid: (${tile.centroid.x.toFixed(2)}, ${tile.centroid.y.toFixed(2)})`;
        return tooltip;
    });

    return {
        type: 'scatter',
        mode: 'markers',
        x: xPositions,
        y: yPositions,
        marker: {
            size: sizes,
            color: colors,
            colorscale: 'Viridis',
            showscale: level === 1,
            colorbar: {
                title: 'Point Count',
                titleside: 'right'
            },
            line: {
                width: 1,
                color: 'rgba(255,255,255,0.6)'
            }
        },
        name: `Level ${level} (${levelData.gridSize}x${levelData.gridSize})`,
        text: hoverTexts,
        hovertemplate: '%{text}<extra></extra>',
        visible: false
    };
}

/**
 * Create individual points trace (Level 10)
 */
function createIndividualPointsTrace(tileLevels, xAxis, yAxis, level) {
    // Use subset of original data for performance
    const allTiles = tileLevels.levels[8].tiles; // Level 9 tiles
    const samplePoints = [];

    // Take sample points from each tile (max 3 points per tile)
    allTiles.forEach(tile => {
        const samples = tile.points?.slice(0, 3) || [];
        samplePoints.push(...samples);
    });

    const usedAxes = {
        [xAxis]: 'X축',
        [yAxis]: 'Y축'
    };

    return {
        type: 'scatter',
        mode: 'markers',
        x: samplePoints.map(d => d[xAxis]),
        y: samplePoints.map(d => d[yAxis]),
        marker: {
            size: 6,
            color: 'rgba(255, 0, 0, 0.8)', // Red for visibility
            line: {
                width: 1,
                color: 'rgba(255, 0, 0, 1)'
            }
        },
        name: `Level ${level} (Individual Points)`,
        text: samplePoints.map(d => createTooltipData(d, usedAxes)),
        hovertemplate: '%{text}<extra></extra>',
        visible: false
    };
}

function createEmptyTiledChart(xAxis, yAxis) {
    return {
        data: [{
            type: 'scatter',
            mode: 'markers',
            x: [],
            y: [],
            marker: {
                size: 8,
                color: 'rgba(255, 0, 0, 0.5)'
            },
            name: 'No Data (Tiled)'
        }],
        layout: createPlotlyLayout('No Data Available (Tiled)', xAxis, yAxis),
        config: createPlotlyConfig(),
        tileLevels: null,
        currentLevel: 1,
        aggregationType: 'mean'
    };
}

/**
 * Handle zoom level changes (call this from Plotly relayout events)
 */
export function handleZoomLevelChange(plotlyDiv, chartConfig) {
    if (!chartConfig.tileLevels) {
        return;
    }

    const newLevel = detectZoomLevel(plotlyDiv, chartConfig.tileLevels);

    if (newLevel !== chartConfig.currentLevel) {
        console.log(`[2D_SCATTER_TILED] 🎯 Switching from level ${chartConfig.currentLevel} to ${newLevel}`);

        // Special handling for Level 10 (Individual Points)
        if (newLevel === 10) {
            console.log('[2D_SCATTER_TILED] 🔍 Level 10 - Creating filtered individual points');

            // Get visible tiles for Level 9 (source for individual points)
            const level9Data = chartConfig.tileLevels.levels[8]; // Level 9 at index 8
            const visibleTiles = getVisibleTiles(plotlyDiv, level9Data);

            console.log('[2D_SCATTER_TILED] - Total Level 9 tiles:', level9Data.tiles.length);
            console.log('[2D_SCATTER_TILED] - Visible tiles:', visibleTiles.length);

            // Extract sample points from visible tiles only
            const visibleSamplePoints = [];
            visibleTiles.forEach(tile => {
                const samples = tile.points?.slice(0, 3) || [];
                visibleSamplePoints.push(...samples);
            });

            console.log('[2D_SCATTER_TILED] - Visible sample points:', visibleSamplePoints.length);

            if (visibleSamplePoints.length > 0) {
                // Get axis field names from tileLevels
                const xField = chartConfig.tileLevels.xField;
                const yField = chartConfig.tileLevels.yField;

                console.log('[2D_SCATTER_TILED] - Using fields:', { xField, yField });

                // Update Level 10 trace with filtered data
                const level10Index = 9; // Level 10 at index 9

                window.Plotly.restyle(plotlyDiv, {
                    x: [visibleSamplePoints.map(d => d[xField])],
                    y: [visibleSamplePoints.map(d => d[yField])],
                    'marker.color': 'rgba(255, 0, 0, 0.8)', // Red for visibility
                    'marker.size': 8,
                    visible: true
                }, [level10Index]);

                // Hide all other traces
                const visibility = chartConfig.data.map(() => false);
                visibility[level10Index] = true;
                window.Plotly.restyle(plotlyDiv, { visible: visibility });

                console.log('[2D_SCATTER_TILED] ✅ Level 10 updated with', visibleSamplePoints.length, 'points');

            } else {
                console.log('[2D_SCATTER_TILED] ⚠️ No visible points for Level 10 - hiding all traces');
                // Hide all traces if no visible points
                const visibility = chartConfig.data.map(() => false);
                window.Plotly.restyle(plotlyDiv, { visible: visibility });
            }

        } else {
            // Standard handling for levels 1-9 (no filtering needed)
            console.log('[2D_SCATTER_TILED] 📊 Standard level switch to', newLevel);
            const visibility = chartConfig.data.map(() => false);
            visibility[newLevel - 1] = true;

            if (window.Plotly) {
                window.Plotly.restyle(plotlyDiv, { visible: visibility });
            }
        }

        chartConfig.currentLevel = newLevel;
    }
}