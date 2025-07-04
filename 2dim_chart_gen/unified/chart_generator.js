// ============================================================================
// 2dim_chart_gen/unified/chart_generator.js - 경량화된 차트 생성 핵심 로직
// ============================================================================

import { createVisualization } from './chart_factory.js';
import { ChartWrapper } from './chart_wrapper.js';

/**
 * 차트 생성 핵심 함수
 * @param {Object} data - 가공된 데이터
 * @param {Object} config - 차트 설정  
 * @param {HTMLElement} containerElement - 컨테이너
 * @returns {ChartWrapper|null} 차트 래퍼 또는 null
 */
export function createChart(data, config, containerElement) {
    try {
        console.log('[CHART_GENERATOR] 차트 생성 시작');
        
        // 입력 검증
        if (!validateInputs(data, config, containerElement)) {
            throw new Error('잘못된 입력 데이터');
        }

        // 이전 차트 자동 정리 (Option A)
        clearPreviousChart(containerElement);

        // Chart.js 설정 생성
        const chartConfig = createVisualization(data, config);
        if (!chartConfig) {
            throw new Error('차트 설정 생성 실패');
        }

        // 캔버스 생성 및 Chart.js 인스턴스 생성
        const canvas = createCanvas(containerElement);
        const chartInstance = new Chart(canvas, {
            ...chartConfig,
            options: {
                ...chartConfig.options,
                responsive: true,
                maintainAspectRatio: false,
                resizeDelay: 0,
                animation: { duration: 300 }
            }
        });

        // 래퍼 객체 생성 및 반환
        const wrapper = new ChartWrapper(chartInstance, containerElement);
        console.log('[CHART_GENERATOR] 차트 생성 완료');
        
        return wrapper;

    } catch (error) {
        console.error('[CHART_GENERATOR] 차트 생성 실패:', error);
        showEmptyChart(containerElement, error.message);
        return null;
    }
}

/**
 * 입력 데이터 검증
 */
function validateInputs(data, config, containerElement) {
    if (!data || !data.chartData || !Array.isArray(data.chartData)) {
        console.error('[CHART_GENERATOR] 잘못된 데이터 형식');
        return false;
    }

    if (!config || !config.type) {
        console.error('[CHART_GENERATOR] 차트 타입이 지정되지 않음');
        return false;
    }

    if (!containerElement || !containerElement.appendChild) {
        console.error('[CHART_GENERATOR] 유효하지 않은 컨테이너');
        return false;
    }

    return true;
}

/**
 * 이전 차트 자동 정리 (Option A 방식)
 */
function clearPreviousChart(container) {
    try {
        // 기존 캔버스와 차트 찾기
        const existingCanvas = container.querySelector('canvas');
        if (existingCanvas) {
            // Chart.js 인스턴스가 있으면 정리
            if (existingCanvas.chart) {
                existingCanvas.chart.destroy();
                console.log('[CHART_GENERATOR] 이전 차트 정리 완료');
            }
            existingCanvas.remove();
        }

        // 에러 메시지도 정리
        const errorDiv = container.querySelector('.chart-error');
        if (errorDiv) {
            errorDiv.remove();
        }

    } catch (error) {
        console.warn('[CHART_GENERATOR] 이전 차트 정리 중 오류:', error);
        // 강제 정리
        container.innerHTML = '';
    }
}

/**
 * 캔버스 생성 및 컨테이너에 추가
 */
function createCanvas(container) {
    const canvas = document.createElement('canvas');
    canvas.style.cssText = `
        width: 100%;
        height: 100%;
        display: block;
    `;
    
    container.appendChild(canvas);
    return canvas;
}

/**
 * 에러 시 빈 차트 표시
 */
function showEmptyChart(container, errorMessage) {
    try {
        clearPreviousChart(container);
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'chart-error';
        errorDiv.style.cssText = `
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #666;
            font-family: Arial, sans-serif;
            font-size: 14px;
            text-align: center;
            border: 1px dashed #ccc;
            background-color: #f9f9f9;
        `;
        
        errorDiv.innerHTML = `
            <div>
                <div>⚠️ 차트를 생성할 수 없습니다</div>
                <div style="font-size: 12px; margin-top: 8px; color: #999;">
                    ${errorMessage || '알 수 없는 오류'}
                </div>
            </div>
        `;
        
        container.appendChild(errorDiv);
        
    } catch (error) {
        console.error('[CHART_GENERATOR] 에러 차트 표시 실패:', error);
    }
}