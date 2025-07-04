// ============================================================================
// 2dim_chart_gen/index.js - 경량화된 차트 라이브러리 진입점
// ============================================================================

import { createChart } from './unified/chart_generator.js';

/**
 * 경량화된 차트 생성 함수
 * @param {Object} data - 가공된 데이터 {chartData: [...], metadata: [...]}
 * @param {Object} config - 차트 설정 {type: '차트타입', style: {...}}
 * @param {HTMLElement} containerElement - 차트를 렌더링할 DOM 컨테이너
 * @returns {ChartWrapper|null} 차트 래퍼 객체 또는 null (에러 시)
 */
export function generateChart(data, config, containerElement) {
    console.log('[CHART_GEN] 차트 생성 요청:', {
        dataPoints: data?.chartData?.length || 0,
        chartType: config?.type,
        hasContainer: !!containerElement
    });

    return createChart(data, config, containerElement);
}