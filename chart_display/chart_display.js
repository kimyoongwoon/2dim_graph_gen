// ============================================================================
// chart_display.js - 차트 표시 페이지 로직 (Step 3 전용) - 수정된 버전
// ============================================================================

import { sessionStorageManager } from '../shared/session_storage_manager/index.js';

// ✅ 통합 시스템 import (2D/3D/4D 모두 지원)
import {
    generateChart,
    createControlPanel,
    createSliderContainer,
    processDataFilter,
    ChartWrapper
} from '../../3dim_chart_gen/index.js';

// 전역 변수들
let currentChartWrapper = null;
let raw_data = null;
let chartConfig = null;

// 성능 최적화: 디버깅 모드 설정
const DEBUG_MODE = false;

function debugLog(...args) {
    if (DEBUG_MODE) {
        console.log(...args);
    }
}

// ============================================================================
// 데이터 및 설정 로드 함수
// ============================================================================

function loadDataAndConfig() {
    updateStatus('저장된 데이터 및 설정 로드 중...', 'info');

    try {
        // sessionStorage에서 데이터 로드
        const { data, meta } = sessionStorageManager.loadRawDataFromSessionStorage();
        raw_data = data;

        // sessionStorage에서 config 로드
        chartConfig = sessionStorageManager.loadChartConfig();

        const fieldNames = meta.fieldNames.join(', ');
        updateStatus(`✅ ${data.length}개 데이터 및 설정 로드 완료`, 'success');

        console.log('[CHART_DISPLAY] 로드된 데이터:', data.length, '개');
        console.log('[CHART_DISPLAY] 로드된 config:', chartConfig);

        // 바로 차트 생성
        createChart();

    } catch (error) {
        console.error('[CHART_DISPLAY] 데이터/설정 로드 오류:', error);
        updateStatus(`로드 실패: ${error.message}. 설정 페이지로 돌아가주세요.`, 'error');
        
        // 에러 시 뒤로가기 버튼 활성화
        showErrorFallback();
    }
}

function showErrorFallback() {
    const chartContainer = document.getElementById('chartContainer');
    if (chartContainer) {
        chartContainer.innerHTML = `
            <h3>차트 로드 실패</h3>
            <div class="error">
                데이터나 설정을 불러올 수 없습니다.<br>
                설정 페이지로 돌아가서 다시 시도해주세요.
            </div>
        `;
    }
}

// ============================================================================
// 유틸리티 함수들
// ============================================================================

function updateStatus(message, type = 'info') {
    const dataInfo = document.getElementById('data-info');
    if (dataInfo) {
        dataInfo.innerHTML = `<strong>${message}</strong>`;
        dataInfo.className = `data-info ${type}`;
    }
}

function updateStepIndicator(activeStep) {
    for (let i = 1; i <= 3; i++) {
        const step = document.getElementById(`step${i}`);
        if (step) {
            step.className = 'step';
            if (i < activeStep) step.className += ' completed';
            else if (i === activeStep) step.className += ' active';
        }
    }
}

// ============================================================================
// ✅ 통합 시스템 차트 생성 함수
// ============================================================================

function createChart() {
    console.log('[CHART_DISPLAY] 차트 생성 시작');
    console.time('차트생성');

    if (!raw_data || raw_data.length === 0) {
        showError('데이터가 없습니다');
        return;
    }

    if (!chartConfig) {
        showError('차트 설정이 없습니다');
        return;
    }

    try {
        updateStatus('통합 시각화 생성 중...', 'info');

        // ✅ 통합 시스템용 config 변환
        const unifiedConfig = convertToUnifiedConfig(chartConfig);

        console.log('[CHART_DISPLAY] 통합 config:', unifiedConfig);

        // 기존 차트 정리
        if (currentChartWrapper) {
            currentChartWrapper.destroy();
            currentChartWrapper = null;
        }

        // DOM 조작 최적화
        requestAnimationFrame(() => {
            const chartContainer = document.getElementById('chartContainer');
            if (!chartContainer) {
                showError('chartContainer 엘리먼트를 찾을 수 없습니다');
                return;
            }

            chartContainer.style.display = 'flex';
            chartContainer.style.flexDirection = 'column';
            chartContainer.style.height = '600px';
            chartContainer.innerHTML = `
                <h3>통합 시각화 결과</h3>
                <div id="chartInfo" class="chart-info">차트 정보가 여기에 표시됩니다</div>
                <div class="chart-canvas-wrapper" style="flex: 1; position: relative; min-height: 400px; height: 400px;">
                </div>
            `;

            const canvasWrapper = chartContainer.querySelector('.chart-canvas-wrapper');
            if (!canvasWrapper) {
                showError('chart-canvas-wrapper를 찾을 수 없습니다');
                return;
            }

            setTimeout(() => {
                try {
                    console.time('실제차트생성');

                    // ✅ 통합 시스템으로 차트 생성 (자동 컨테이너 생성)
                    currentChartWrapper = generateChart(raw_data, unifiedConfig, canvasWrapper);

                    console.log('[CHART_DISPLAY] 통합 시스템 차트 생성 완료');
                    console.timeEnd('실제차트생성');

                    // ✅ 이벤트 리스너 등록
                    currentChartWrapper.on('error', (error) => {
                        console.error('[CHART_DISPLAY] 차트 에러:', error);
                        showError('차트 오류: ' + error.message);
                    });

                    currentChartWrapper.on('dataLimited', (limitInfo) => {
                        console.warn('[CHART_DISPLAY] 데이터 제한:', limitInfo);
                        updateStatus(`⚠️ 성능 최적화로 ${limitInfo.displayed}/${limitInfo.total}개 데이터 표시`, 'info');
                    });

                    // ✅ 수정: selectedFields를 dataMapping에서 추출
                    const selectedFields = Object.values(chartConfig.dataMapping || {});
                    displayChartInfo(unifiedConfig.type, selectedFields, raw_data.length);

                    updateStatus('통합 시각화 생성 완료!', 'success');
                    updateStepIndicator(3);

                    console.timeEnd('차트생성');

                } catch (error) {
                    console.error('[CHART_DISPLAY] 통합 시스템 차트 생성 오류:', error);
                    showError('차트 생성 실패: ' + error.message);
                    updateStatus('차트 생성 실패', 'error');
                }
            }, 10);
        });

    } catch (error) {
        console.error('[CHART_DISPLAY] 차트 생성 오류:', error);
        showError('차트 생성 실패: ' + error.message);
        updateStatus('차트 생성 실패', 'error');
    }
}

// ============================================================================
// Config 변환 함수들
// ============================================================================

/**
 * data_pipeline config를 통합 시스템 config로 변환
 */
function convertToUnifiedConfig(dataPhaseConfig) {
    return {
        type: mapChartType(dataPhaseConfig.type, dataPhaseConfig.is3D),
        dataMapping: dataPhaseConfig.dataMapping,
        scalingConfig: dataPhaseConfig.scalingConfig || { type: 'default' },
        colorConfig: dataPhaseConfig.colorConfig || { type: 'blueRed' }
    };
}

/**
 * 기존 차트 타입을 통합 시스템 타입으로 매핑
 */
function mapChartType(oldType, is3D) {
    if (is3D) {
        return '3d_surface_scatter'; // 모든 3D 타입은 통합
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

function displayChartInfo(chartType, selectedFields, dataCount) {
    const info = document.getElementById('chartInfo');
    if (!info) return;

    // ✅ 수정: selectedFields가 배열인지 확인
    const fieldsInfo = Array.isArray(selectedFields) ? selectedFields.join(' → ') : '필드 정보 없음';

    info.innerHTML = `
        <strong>차트 타입:</strong> ${chartType} | 
        <strong>선택된 필드:</strong> ${fieldsInfo} | 
        <strong>데이터 개수:</strong> ${dataCount}개
    `;
}

// ============================================================================
// ✅ 스토리지 정리 및 네비게이션 함수들 (새 기능)
// ============================================================================

window.clearStorageAndRestart = function() {
    if (confirm('⚠️ 모든 저장된 데이터와 설정이 삭제됩니다.\n정말로 정리하시겠습니까?')) {
        try {
            // 차트 정리
            if (currentChartWrapper) {
                currentChartWrapper.destroy();
                currentChartWrapper = null;
            }

            // 스토리지 정리
            sessionStorageManager.clearAllChartData();
            
            updateStatus('✅ 스토리지 정리 완료', 'success');
            
            // 3초 후 데이터 생성기로 이동
            setTimeout(() => {
                window.location.href = '../index.html';
            }, 1500);
            
            console.log('[CHART_DISPLAY] 스토리지 정리 및 재시작');
            
        } catch (error) {
            console.error('[CHART_DISPLAY] 스토리지 정리 오류:', error);
            showError('스토리지 정리 중 오류가 발생했습니다: ' + error.message);
        }
    }
};

window.goBackToConfig = function() {
    if (confirm('현재 차트를 종료하고 설정 페이지로 돌아가시겠습니까?')) {
        // 차트만 정리하고 데이터는 유지
        if (currentChartWrapper) {
            currentChartWrapper.destroy();
            currentChartWrapper = null;
        }
        
        window.location.href = '../chart_config/chart_config.html';
    }
};

window.goBackToGenerator = function () {
    if (confirm('모든 설정이 사라집니다. 데이터 생성기로 돌아가시겠습니까?')) {
        // 차트 정리
        if (currentChartWrapper) {
            currentChartWrapper.destroy();
            currentChartWrapper = null;
        }

        // 필요시 스토리지도 정리
        try {
            sessionStorageManager.clearAllChartData();
        } catch (error) {
            console.warn('[CHART_DISPLAY] 스토리지 정리 경고:', error);
        }

        window.location.href = '../index.html';
    }
};

function showError(message) {
    console.error('[CHART_DISPLAY] 오류:', message);

    const errorDiv = document.getElementById('errorDisplay') || createErrorDisplay();
    errorDiv.textContent = `오류: ${message}`;
    errorDiv.style.display = 'block';

    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

function createErrorDisplay() {
    const errorDiv = document.createElement('div');
    errorDiv.id = 'errorDisplay';
    errorDiv.className = 'error-display';
    errorDiv.style.cssText = `
        background: #f8d7da;
        color: #721c24;
        padding: 10px;
        margin: 10px 0;
        border: 1px solid #f5c6cb;
        font-weight: bold;
        display: none;
    `;
    document.body.appendChild(errorDiv);
    return errorDiv;
}

// ============================================================================
// 페이지 초기화
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('[CHART_DISPLAY] 페이지 초기화 시작');
    
    updateStepIndicator(3);
    loadDataAndConfig();
});

window.addEventListener('beforeunload', () => {
    // 차트 정리
    if (currentChartWrapper) {
        currentChartWrapper.destroy();
        currentChartWrapper = null;
    }
    
    console.log('[CHART_DISPLAY] 페이지 언로드');
});