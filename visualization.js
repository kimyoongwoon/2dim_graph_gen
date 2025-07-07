// ============================================================================
// visualization.js - 차트 시각화 페이지 로직
// ============================================================================

import { sessionStorageManager } from './shared/session_storage_manager/index.js';
import { showError } from './shared/error_handler.js';

// 3dim_chart_gen 통합 시스템 import
import { generateChart } from './3dim_chart_gen/index.js';

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

        // 3dim_chart_gen용 config 변환
        const unifiedConfig = convertToUnifiedConfig(chartConfig);
        console.log('[VISUALIZATION] 변환된 config:', unifiedConfig);

        // 차트 생성 (3dim_chart_gen 사용)
        currentChartWrapper = generateChart(raw_data, unifiedConfig, canvasWrapper);
        
        // 이벤트 리스너 등록
        currentChartWrapper.on('error', (error) => {
            console.error('[VISUALIZATION] 차트 에러:', error);
            showError('차트 오류: ' + error.message);
        });

        currentChartWrapper.on('dataUpdated', (data) => {
            console.log('[VISUALIZATION] 데이터 업데이트:', data.length, '개');
        });

        currentChartWrapper.on('dataLimited', (info) => {
            console.warn('[VISUALIZATION] 데이터 제한:', info);
            updateChartInfo(`⚠️ 성능상 ${info.total}개 데이터 중 ${info.displayed}개만 표시됩니다`, 'info');
        });

        updateChartInfo(`✅ 차트 생성 완료: ${chartConfig.chartType} (${chartConfig.selectedFields.join(' → ')})`, 'success');

    } catch (error) {
        console.error('[VISUALIZATION] 차트 생성 오류:', error);
        updateChartInfo('차트 생성 실패', 'error');
        showError('차트 생성 실패: ' + error.message);
    }
}

// 3dim_chart_gen용 config 변환
function convertToUnifiedConfig(chartConfig) {
    const { chartType, selectedFields, dimension, is3D, scalingConfig } = chartConfig;
    
    // 차트 타입 매핑
    const unifiedType = mapChartType(chartType, is3D, dimension);
    
    // 데이터 매핑 생성
    const dataMapping = createDataMapping(selectedFields, unifiedType, is3D);
    
    return {
        type: unifiedType,
        dataMapping,
        scalingConfig: scalingConfig || { type: 'default' },
        colorConfig: { type: 'blueRed' }
    };
}

function mapChartType(chartType, is3D, dimension) {
    if (is3D) {
        return '3d_surface_scatter';
    }
    
    // 2D 차트 타입 매핑
    const mapping = {
        // 1차원
        'line1d': '2d_scatter',
        'category': '2d_scatter',
        
        // 2차원
        'scatter': '2d_scatter',
        'size': '2d_size',
        'color': '2d_color',
        
        // 3차원
        'scatter_size': '3d_scatter_size',
        'scatter_color': '3d_scatter_color', 
        'size_color': '3d_size_color',
        
        // 4차원
        'scatter_size_color': '4d_scatter_size_color'
    };
    
    return mapping[chartType] || '2d_scatter';
}

function createDataMapping(fields, chartType, is3D) {
    const mapping = {};
    
    if (is3D) {
        // 3D Surface 차트: x, y, z
        mapping.x = fields[0];
        mapping.y = fields[1];
        mapping.z = fields[2];
        return mapping;
    }
    
    // 2D/3D/4D 차트별 매핑
    switch (chartType) {
        case '2d_scatter':
            mapping.x = fields[0];
            if (fields[1]) mapping.y = fields[1];
            break;
            
        case '2d_size':
            mapping.x = fields[0];
            mapping.size = fields[1];
            break;
            
        case '2d_color':
            mapping.x = fields[0];
            mapping.color = fields[1];
            break;
            
        case '3d_scatter_size':
            mapping.x = fields[0];
            mapping.y = fields[1];
            mapping.size = fields[2];
            break;
            
        case '3d_scatter_color':
            mapping.x = fields[0];
            mapping.y = fields[1];
            mapping.color = fields[2];
            break;
            
        case '3d_size_color':
            mapping.x = fields[0];
            mapping.size = fields[1];
            mapping.color = fields[2];
            break;
            
        case '4d_scatter_size_color':
            mapping.x = fields[0];
            mapping.y = fields[1];
            mapping.size = fields[2];
            mapping.color = fields[3];
            break;
            
        default:
            // 기본: x축만 또는 x,y축
            mapping.x = fields[0];
            if (fields[1]) mapping.y = fields[1];
            break;
    }
    
    console.log('[VISUALIZATION] 데이터 매핑:', { chartType, fields, mapping });
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