// ============================================================================
// visualization.js - 차트 시각화 페이지 로직
// ============================================================================

import { sessionStorageManager } from './shared/session_storage_manager/index.js';
import { showError } from './shared/error_handler.js';

// 통합 시스템 import (3dim_chart_gen이 있다고 가정)
// import { generateChart } from './3dim_chart_gen/index.js';

// 전역 변수들
let raw_data = null;
let chartConfig = null;
let currentChartWrapper = null;

// ============================================================================
// 데이터 및 설정 로드
// ============================================================================

function loadDataAndConfig() {
    updateChartInfo('데이터 및 설정 로딩 중...', 'info');

    try {
        // sessionStorage에서 데이터 로드
        const { data, meta } = sessionStorageManager.loadRawDataFromSessionStorage();
        raw_data = data;

        // sessionStorage에서 차트 설정 로드
        const configString = sessionStorage.getItem('chartConfig');
        if (!configString) {
            throw new Error('차트 설정이 없습니다. 설정 페이지로 돌아가주세요.');
        }

        chartConfig = JSON.parse(configString);
        console.log('[VISUALIZATION] 설정 로드 완료:', chartConfig);

        const fieldNames = meta.fieldNames.join(', ');
        updateChartInfo(`✅ 데이터: ${data.length}개 | 필드: ${fieldNames} | 차트: ${chartConfig.chartType}`, 'success');

        // 차트 생성
        createVisualization();

    } catch (error) {
        console.error('[VISUALIZATION] 로드 오류:', error);
        updateChartInfo(`로드 실패: ${error.message}`, 'error');
        showError(error.message);
    }
}

// ============================================================================
// 차트 생성
// ============================================================================

function createVisualization() {
    if (!raw_data || !chartConfig) {
        showError('데이터 또는 설정이 없습니다');
        return;
    }

    try {
        updateChartInfo('차트 생성 중...', 'info');

        // 기존 차트 정리
        if (currentChartWrapper) {
            currentChartWrapper.destroy();
            currentChartWrapper = null;
        }

        const canvasWrapper = document.getElementById('chartCanvasWrapper');
        if (!canvasWrapper) {
            throw new Error('차트 컨테이너를 찾을 수 없습니다');
        }

        // 컨테이너 초기화
        canvasWrapper.innerHTML = '';
        canvasWrapper.style.width = '100%';
        canvasWrapper.style.height = '600px';

        // 차트 생성 (통합 시스템 사용)
        // TODO: 3dim_chart_gen 모듈이 구현되면 활성화
        /*
        const unifiedConfig = convertToUnifiedConfig(chartConfig);
        currentChartWrapper = generateChart(raw_data, unifiedConfig, canvasWrapper);
        
        // 이벤트 리스너 등록
        currentChartWrapper.on('error', (error) => {
            console.error('[VISUALIZATION] 차트 에러:', error);
            showError('차트 오류: ' + error.message);
        });
        */

        // 임시: Plotly로 간단한 차트 생성
        createTemporaryPlotlyChart(canvasWrapper);

        updateChartInfo(`차트 생성 완료: ${chartConfig.chartType} (${chartConfig.selectedFields.join(' → ')})`, 'success');

    } catch (error) {
        console.error('[VISUALIZATION] 차트 생성 오류:', error);
        updateChartInfo('차트 생성 실패', 'error');
        showError('차트 생성 실패: ' + error.message);
    }
}

// 임시 Plotly 차트 생성 함수 (3dim_chart_gen 구현 전까지 사용)
function createTemporaryPlotlyChart(container) {
    const { chartType, selectedFields, is3D } = chartConfig;
    
    if (is3D) {
        // 3D 차트
        const xField = selectedFields[0];
        const yField = selectedFields[1];
        const zField = selectedFields[2];

        const trace = {
            x: raw_data.map(d => d[xField]),
            y: raw_data.map(d => d[yField]),
            z: raw_data.map(d => d[zField]),
            mode: 'markers',
            type: 'scatter3d',
            marker: {
                size: 5,
                color: raw_data.map(d => d[zField]),
                colorscale: 'Viridis',
                showscale: true
            }
        };

        const layout = {
            title: `3D Scatter Plot: ${xField} × ${yField} × ${zField}`,
            scene: {
                xaxis: { title: xField },
                yaxis: { title: yField },
                zaxis: { title: zField }
            },
            margin: { l: 0, r: 0, b: 0, t: 50 }
        };

        Plotly.newPlot(container, [trace], layout, { responsive: true });

    } else {
        // 2D 차트
        const xField = selectedFields[0];
        const yField = selectedFields[1];

        if (chartConfig.dimension === 1) {
            // 1차원 차트
            const values = raw_data.map(d => d[xField]);
            const isNumeric = typeof values[0] === 'number';

            if (isNumeric) {
                // 선형 차트
                const trace = {
                    y: values,
                    type: 'scatter',
                    mode: 'lines+markers',
                    name: xField
                };

                const layout = {
                    title: `Line Chart: ${xField}`,
                    xaxis: { title: 'Index' },
                    yaxis: { title: xField },
                    margin: { l: 50, r: 50, b: 50, t: 50 }
                };

                Plotly.newPlot(container, [trace], layout, { responsive: true });
            } else {
                // 카테고리 차트
                const categories = [...new Set(values)];
                const counts = categories.map(cat => values.filter(v => v === cat).length);

                const trace = {
                    x: categories,
                    y: counts,
                    type: 'bar',
                    name: xField
                };

                const layout = {
                    title: `Category Chart: ${xField}`,
                    xaxis: { title: xField },
                    yaxis: { title: 'Count' },
                    margin: { l: 50, r: 50, b: 50, t: 50 }
                };

                Plotly.newPlot(container, [trace], layout, { responsive: true });
            }

        } else {
            // 2차원 이상 차트
            const trace = {
                x: raw_data.map(d => d[xField]),
                y: raw_data.map(d => d[yField]),
                mode: 'markers',
                type: 'scatter',
                marker: { size: 8 }
            };

            // 크기 인코딩
            if (chartConfig.dimension >= 3 && selectedFields[2]) {
                const sizeField = selectedFields[2];
                trace.marker.size = raw_data.map(d => Math.max(5, (d[sizeField] || 0) / 10));
            }

            // 색상 인코딩
            if (chartConfig.dimension >= 3 && selectedFields[2] && (chartConfig.chartType.includes('color') || chartConfig.dimension === 4)) {
                const colorField = chartConfig.dimension === 4 ? selectedFields[3] : selectedFields[2];
                trace.marker.color = raw_data.map(d => d[colorField]);
                trace.marker.colorscale = 'Viridis';
                trace.marker.showscale = true;
            }

            const layout = {
                title: `Scatter Plot: ${xField} × ${yField}`,
                xaxis: { title: xField },
                yaxis: { title: yField },
                margin: { l: 50, r: 50, b: 50, t: 50 }
            };

            Plotly.newPlot(container, [trace], layout, { responsive: true });
        }
    }
}

// 통합 시스템용 config 변환 (3dim_chart_gen 구현 시 사용)
function convertToUnifiedConfig(chartConfig) {
    return {
        type: mapChartType(chartConfig.chartType, chartConfig.is3D),
        dataMapping: createDataMapping(chartConfig.selectedFields, chartConfig.dimension, chartConfig.is3D),
        scalingConfig: chartConfig.scalingConfig || { type: 'default' },
        colorConfig: { type: 'blueRed' }
    };
}

function mapChartType(oldType, is3D) {
    if (is3D) {
        return '3d_surface_scatter';
    }

    const mapping = {
        'scatter': '2d_scatter',
        'size': '2d_size',
        'color': '2d_color',
        'scatter_size': '3d_scatter_size',
        'scatter_color': '3d_scatter_color',
        'size_color': '3d_size_color',
        'scatter_size_color': '4d_scatter_size_color'
    };

    return mapping[oldType] || oldType;
}

function createDataMapping(fields, dimension, is3D) {
    const mapping = {};

    if (is3D) {
        mapping.x = fields[0];
        mapping.y = fields[1];
        mapping.z = fields[2];
        if (fields[3]) mapping.color = fields[3];
    } else {
        const axisNames = ['x', 'y', 'size', 'color'];
        for (let i = 0; i < dimension; i++) {
            mapping[axisNames[i]] = fields[i];
        }
    }

    return mapping;
}

// ============================================================================
// UI 업데이트 함수들
// ============================================================================

function updateChartInfo(message, type = 'info') {
    const chartInfo = document.getElementById('chartInfo');
    if (chartInfo) {
        chartInfo.innerHTML = `<strong>${message}</strong>`;
        chartInfo.className = `chart-info ${type}`;
    }
}

// ============================================================================
// 네비게이션 함수들
// ============================================================================

window.regenerateChart = function() {
    console.log('[VISUALIZATION] 차트 재생성');
    createVisualization();
};

window.goBackToConfig = function() {
    window.location.href = 'config.html';
};

window.goBackToGenerator = function() {
    // 모든 저장된 설정 정리
    sessionStorage.removeItem('chartConfig');
    window.location.href = 'index.html';
};

// ============================================================================
// 페이지 초기화
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('[VISUALIZATION] 시각화 페이지 초기화');
    loadDataAndConfig();
});

// 페이지 언로드 시 정리
window.addEventListener('beforeunload', () => {
    if (currentChartWrapper) {
        currentChartWrapper.destroy();
    }
});