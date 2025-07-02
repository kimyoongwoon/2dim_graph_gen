// visualizations/chart_factory.js
// 차트 생성 팩토리 함수 - 강화된 버전

// Import chart functions
import { create1DLineChart, createCategoryChart } from './charts/1dim/line_chart.js';
import { createSizeChart, createColorChart, createScatterChart } from './charts/2dim/2dimchart_double.js';
import { createBarSizeChart, createBarColorChart, createBarChart } from './charts/2dim/2dimchart_string.js';
import { createSizeColorChart, createScatterSizeChart, createScatterColorChart } from './charts/3dim/3dimchart_double.js';
import { createGroupedBarSizeChart, createGroupedBarChart, createGroupedBarColorChart } from './charts/3dim/3dimchart_string.js';
import { createScatterSizeColorChart } from './charts/4dim/4dimchart_double.js';
import { createGroupedScatterSizeColorChart } from './charts/4dim/4dimchart_string.js';

export function createVisualization(dataset, vizType, data, scalingConfig = {}, colorScalingConfig = {}, vizOptions = {}) {


    // Validate inputs
    if (!dataset) {
        throw new Error('Dataset is required');
    }

    if (!vizType || !vizType.type) {
        throw new Error('Visualization type is required');
    }

    if (!Array.isArray(data)) {
        throw new Error('Data must be an array');
    }

    try {
        let chartConfig;

        switch (vizType.type) {
            // 1D visualizations
            case 'line1d':
                console.log(`📈 Creating 1D line chart`);
                chartConfig = create1DLineChart(data, dataset);
                break;
            case 'category':
                console.log(`📊 Creating category chart`);
                chartConfig = createCategoryChart(data, dataset);
                break;

            // 2D visualizations
            case 'size':
                console.log(`📏 Creating size chart`);
                chartConfig = createSizeChart(data, dataset, scalingConfig);
                break;
            case 'color':
                console.log(`🎨 Creating color chart`);
                chartConfig = createColorChart(data, dataset, colorScalingConfig);
                break;
            case 'scatter':
                console.log(`🔸 Creating scatter chart`);
                chartConfig = createScatterChart(data, dataset);
                break;

            // 2D String visualizations
            case 'bar_size':
                console.log(`📊 Creating bar size chart`);
                chartConfig = createBarSizeChart(data, dataset, scalingConfig);
                break;
            case 'bar_color':
                console.log(`📊 Creating bar color chart`);
                chartConfig = createBarColorChart(data, dataset, colorScalingConfig);
                break;
            case 'bar':
                console.log(`📊 Creating bar chart`);
                chartConfig = createBarChart(data, dataset);
                break;

            // 3D visualizations
            case 'size_color':
                console.log(`📏🎨 Creating size+color chart`);
                chartConfig = createSizeColorChart(data, dataset, scalingConfig, colorScalingConfig);
                break;
            case 'scatter_size':
                console.log(`🔸📏 Creating scatter+size chart`);
                chartConfig = createScatterSizeChart(data, dataset, scalingConfig);
                break;
            case 'scatter_color':
                console.log(`🔸🎨 Creating scatter+color chart`);
                chartConfig = createScatterColorChart(data, dataset, colorScalingConfig);
                break;

            // 3D String visualizations
            case 'grouped_bar_size':
                console.log(`📊📏 Creating grouped bar size chart`);
                chartConfig = createGroupedBarSizeChart(data, dataset, scalingConfig);
                break;
            case 'grouped_bar':
                console.log(`📊 Creating grouped bar chart`);
                chartConfig = createGroupedBarChart(data, dataset);
                break;
            case 'grouped_bar_color':
                console.log(`📊🎨 Creating grouped bar color chart`);
                chartConfig = createGroupedBarColorChart(data, dataset, colorScalingConfig);
                break;

            // 4D visualizations
            case 'scatter_size_color':
                console.log(`🔸📏🎨 Creating scatter+size+color chart`);
                chartConfig = createScatterSizeColorChart(data, dataset, scalingConfig, colorScalingConfig);
                break;

            // 4D String visualizations
            case 'grouped_scatter_size_color':
                console.log(`🔸📏🎨 Creating grouped scatter+size+color chart`);
                chartConfig = createGroupedScatterSizeColorChart(data, dataset, scalingConfig, colorScalingConfig);
                break;

            default:
                throw new Error(`Unknown visualization type: ${vizType.type}`);
        }

        if (!chartConfig) {
            throw new Error(`Chart function returned null/undefined for type: ${vizType.type}`);
        }

        console.log(`✅ Chart config created successfully:`, chartConfig);

        // Apply visualization options if provided
        if (vizOptions && Object.keys(vizOptions).length > 0) {
            console.log(`🔧 Applying visualization options:`, vizOptions);
            applyVisualizationOptions(chartConfig, vizOptions);
        }

        return chartConfig;

    } catch (error) {
        console.error(`❌ Chart factory error for type ${vizType.type}:`, error);
        console.error(`Error stack:`, error.stack);
        throw error;
    }
}

// Apply visualization options to chart config
function applyVisualizationOptions(chartConfig, vizOptions) {
    try {
        // Apply point style for scatter plots
        if (vizOptions.pointStyle && chartConfig.data.datasets) {
            chartConfig.data.datasets.forEach(dataset => {
                dataset.pointStyle = vizOptions.pointStyle;
            });
            console.log(`🔧 Applied point style: ${vizOptions.pointStyle}`);
        }

        // Apply bar width for bar charts
        if (vizOptions.barPercentage && chartConfig.type === 'bar') {
            if (!chartConfig.options.datasets) {
                chartConfig.options.datasets = {};
            }
            if (!chartConfig.options.datasets.bar) {
                chartConfig.options.datasets.bar = {};
            }
            chartConfig.options.datasets.bar.barPercentage = vizOptions.barPercentage;
            console.log(`🔧 Applied bar percentage: ${vizOptions.barPercentage}`);
        }

        // Add more option applications as needed

    } catch (error) {
        console.warn(`⚠️ Failed to apply visualization options:`, error);
    }
}