// ============================================================================
// chart_gen/unified/chart_generator.js - 메인 차트 생성 함수
// ============================================================================

import { processDataForChart } from './data_processor_unified.js';
import { ChartWrapper } from './chart_wrapper.js';
import { createVisualization } from '../chart_factory.js';
import { prepareDataForChart } from '../data_processor.js';
import { showError_chart } from './error_handler.js';

/**
 * 통합 차트 생성 함수
 * @param {Array} rawData - 원시 데이터
 * @param {Object} config - 차트 설정 {type, dataMapping, options}
 * @param {HTMLElement} containerElement - 컨테이너 엘리먼트
 * @returns {ChartWrapper} 차트 래퍼 객체
 */
export function generateChart(rawData, config, containerElement) {
    console.log('[CHART_GENERATOR] 차트 생성 시작');
    console.log('[CHART_GENERATOR] 설정:', config);

    try {
        // 입력 검증
        if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
            throw new Error('유효한 데이터가 없습니다');
        }

        if (!config || !config.type || !config.dataMapping) {
            throw new Error('차트 설정이 올바르지 않습니다');
        }

        if (!containerElement) {
            throw new Error('컨테이너 엘리먼트가 필요합니다');
        }

        // 1단계: 데이터 처리 (독립적)
        const processedResult = processDataForChart(rawData, config.dataMapping);
        const { data: chartData, metadata } = processedResult;

        // 2단계: 기존 시스템용 데이터 준비
        const dataset = {
            name: `${config.type} Chart`,
            dimension: metadata.dim,
            axes: metadata.axes,
            dataType: `${metadata.dim}D`
        };

        const vizType = {
            name: config.type,
            type: config.type
        };

        // 기존 prepareDataForChart 함수 사용
        const preparedData = prepareDataForChart(
            chartData.map(point => [
                metadata.axes.map(axis => point[axis.name] || 0),
                point[metadata.axes[0]?.name] || 0
            ]),
            metadata.axes
        );

        // 3단계: 캔버스 생성 및 설정
        const canvas = document.createElement('canvas');
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';

        // 컨테이너 스타일 설정
        containerElement.style.position = 'relative';
        containerElement.style.overflow = 'hidden';
        containerElement.appendChild(canvas);

        // 4단계: Chart.js 설정 준비
        const chartConfig = createVisualization(
            dataset,
            vizType,
            preparedData,
            {}, // scalingConfig
            {}, // colorScalingConfig
            {}  // vizOptions
        );

        // 공통 Chart.js 옵션 적용
        chartConfig.options = {
            ...chartConfig.options,
            responsive: false,
            maintainAspectRatio: false,
            resizeDelay: 0,
            animation: { duration: 300 },
            ...config.options // 사용자 옵션 병합
        };

        // 5단계: Chart.js 인스턴스 생성
        const chartInstance = new Chart(canvas, chartConfig);

        // 6단계: 래퍼 객체 생성
        const chartWrapper = new ChartWrapper(chartInstance, containerElement, config);

        console.log('[CHART_GENERATOR] 차트 생성 완료');
        return chartWrapper;

    } catch (error) {
        console.error('[CHART_GENERATOR] 차트 생성 오류:', error);

        // 에러 차트 표시
        return showError_chart(containerElement, error.message);
    }
}
