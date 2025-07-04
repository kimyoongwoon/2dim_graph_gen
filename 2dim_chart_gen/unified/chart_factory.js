// ============================================================================
// 2dim_chart_gen/chart_factory.js - 경량화된 차트 팩토리
// ============================================================================

// Import chart functions (스케일링 관련 import 제거)
import { create1DLineChart, createCategoryChart } from '../charts/1dim/line_chart.js';
import { createSizeChart, createColorChart, createScatterChart } from '../charts/2dim/2dimchart_double.js';
import { createBarSizeChart, createBarColorChart, createBarChart } from '../charts/2dim/2dimchart_string.js';
import { createSizeColorChart, createScatterSizeChart, createScatterColorChart } from '../charts/3dim/3dimchart_double.js';
import { createGroupedBarSizeChart, createGroupedBarChart, createGroupedBarColorChart } from '../charts/3dim/3dimchart_string.js';
import { createScatterSizeColorChart } from '../charts/4dim/4dimchart_double.js';
import { createGroupedScatterSizeColorChart } from '../charts/4dim/4dimchart_string.js';

/**
 * 경량화된 차트 생성 팩토리
 * @param {Object} data - 가공된 데이터 {chartData: [...], metadata: [...]}
 * @param {Object} config - 차트 설정 {type: '차트타입', style: {...}}
 * @returns {Object} Chart.js 설정 객체
 */
export function createVisualization(data, config) {
    console.log(`[CHART_FACTORY] 차트 생성 요청: ${config.type}`);

    // 입력 검증
    if (!data || !data.chartData || !Array.isArray(data.chartData)) {
        throw new Error('유효하지 않은 데이터 형식');
    }

    if (!config || !config.type) {
        throw new Error('차트 타입이 지정되지 않음');
    }

    // 빈 데이터 처리
    if (data.chartData.length === 0) {
        console.warn('[CHART_FACTORY] 빈 데이터셋');
        return createEmptyChart(config.type);
    }

    try {
        let chartConfig;

        switch (config.type) {
            // 1D visualizations
            case 'line1d':
                console.log(`📈 Creating 1D line chart`);
                chartConfig = create1DLineChart(data, config);
                break;
            case 'category':
                console.log(`📊 Creating category chart`);
                chartConfig = createCategoryChart(data, config);
                break;

            // 2D visualizations
            case 'size':
                console.log(`📏 Creating size chart`);
                chartConfig = createSizeChart(data, config);
                break;
            case 'color':
                console.log(`🎨 Creating color chart`);
                chartConfig = createColorChart(data, config);
                break;
            case 'scatter':
                console.log(`🔸 Creating scatter chart`);
                chartConfig = createScatterChart(data, config);
                break;

            // 2D String visualizations
            case 'bar_size':
                console.log(`📊 Creating bar size chart`);
                chartConfig = createBarSizeChart(data, config);
                break;
            case 'bar_color':
                console.log(`📊 Creating bar color chart`);
                chartConfig = createBarColorChart(data, config);
                break;
            case 'bar':
                console.log(`📊 Creating bar chart`);
                chartConfig = createBarChart(data, config);
                break;

            // 3D visualizations
            case 'size_color':
                console.log(`📏🎨 Creating size+color chart`);
                chartConfig = createSizeColorChart(data, config);
                break;
            case 'scatter_size':
                console.log(`🔸📏 Creating scatter+size chart`);
                chartConfig = createScatterSizeChart(data, config);
                break;
            case 'scatter_color':
                console.log(`🔸🎨 Creating scatter+color chart`);
                chartConfig = createScatterColorChart(data, config);
                break;

            // 3D String visualizations
            case 'grouped_bar_size':
                console.log(`📊📏 Creating grouped bar size chart`);
                chartConfig = createGroupedBarSizeChart(data, config);
                break;
            case 'grouped_bar':
                console.log(`📊 Creating grouped bar chart`);
                chartConfig = createGroupedBarChart(data, config);
                break;
            case 'grouped_bar_color':
                console.log(`📊🎨 Creating grouped bar color chart`);
                chartConfig = createGroupedBarColorChart(data, config);
                break;

            // 4D visualizations
            case 'scatter_size_color':
                console.log(`🔸📏🎨 Creating scatter+size+color chart`);
                chartConfig = createScatterSizeColorChart(data, config);
                break;

            // 4D String visualizations
            case 'grouped_scatter_size_color':
                console.log(`🔸📏🎨 Creating grouped scatter+size+color chart`);
                chartConfig = createGroupedScatterSizeColorChart(data, config);
                break;

            default:
                throw new Error(`지원하지 않는 차트 타입: ${config.type}`);
        }

        if (!chartConfig) {
            throw new Error(`차트 생성 함수가 null을 반환: ${config.type}`);
        }

        // 사용자 스타일 설정 적용
        if (config.style) {
            applyUserStyles(chartConfig, config.style);
        }

        console.log(`✅ Chart config created successfully for: ${config.type}`);
        return chartConfig;

    } catch (error) {
        console.error(`❌ Chart factory error for type ${config.type}:`, error);
        throw error;
    }
}

/**
 * 빈 데이터용 차트 생성
 */
function createEmptyChart(chartType) {
    const baseChart = {
        type: 'scatter',
        data: {
            datasets: [{
                label: '데이터 없음',
                data: [],
                backgroundColor: 'rgba(200, 200, 200, 0.3)',
                borderColor: 'rgba(200, 200, 200, 0.6)',
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: `${chartType} - 데이터 없음`
                }
            }
        }
    };

    return baseChart;
}

/**
 * 사용자 스타일 적용
 */
function applyUserStyles(chartConfig, userStyles) {
    try {
        if (!chartConfig.data.datasets || chartConfig.data.datasets.length === 0) {
            return;
        }

        const dataset = chartConfig.data.datasets[0];

        // 색상 설정 적용
        if (userStyles.backgroundColor) {
            dataset.backgroundColor = userStyles.backgroundColor;
        }

        if (userStyles.borderColor) {
            dataset.borderColor = userStyles.borderColor;
        }

        if (userStyles.pointRadius !== undefined) {
            dataset.pointRadius = userStyles.pointRadius;
        }

        if (userStyles.borderWidth !== undefined) {
            dataset.borderWidth = userStyles.borderWidth;
        }

        // Chart.js 옵션 병합
        if (userStyles.options) {
            chartConfig.options = {
                ...chartConfig.options,
                ...userStyles.options
            };
        }

        console.log('[CHART_FACTORY] 사용자 스타일 적용 완료');

    } catch (error) {
        console.warn('[CHART_FACTORY] 사용자 스타일 적용 실패:', error);
    }
}