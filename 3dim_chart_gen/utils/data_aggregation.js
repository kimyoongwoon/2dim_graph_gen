// ============================================================================
// 3dim_chart_gen/utils/data_aggregation.js - 집계 함수들 (나중에 구현)
// ============================================================================

/**
 * 배열 값들을 집계 함수로 처리
 * @param {Array} values - 집계할 값들
 * @param {string} aggregationType - 집계 타입
 * @returns {number|null} 집계 결과
 */
export function aggregateValues(values, aggregationType) {
    console.log('[DATA_AGGREGATION] 값 집계 (구현 예정):', { count: values.length, type: aggregationType });
    
    if (!values || values.length === 0) {
        return null;
    }
    
    // TODO: 나중에 구현
    // 현재는 평균만 간단히 구현
    const validValues = values.filter(v => v !== null && v !== undefined && !isNaN(v));
    if (validValues.length === 0) return null;
    
    switch (aggregationType) {
        case 'mean':
            return validValues.reduce((a, b) => a + b, 0) / validValues.length;
        case 'min':
        case 'max':
        case 'median':
        case 'first':
        case 'last':
        case 'candlestick':
        default:
            // TODO: 나중에 구현
            return validValues[0];
    }
}

/**
 * 캔들스틱 집계 (OHLC)
 * @param {Array} values - 값들
 * @returns {Object} { open, high, low, close }
 */
export function aggregateCandlestick(values) {
    console.log('[DATA_AGGREGATION] 캔들스틱 집계 (구현 예정)');
    
    // TODO: 나중에 구현
    return {
        open: values[0] || 0,
        close: values[values.length - 1] || 0,
        high: Math.max(...values) || 0,
        low: Math.min(...values) || 0
    };
}

/**
 * 윈도우 단위로 데이터 집계
 * @param {Array} data - 원본 데이터
 * @param {Object} windowConfig - 윈도우 설정
 * @returns {Array} 집계된 데이터
 */
export function aggregateDataWindow(data, windowConfig) {
    console.log('[DATA_AGGREGATION] 윈도우 집계 (구현 예정):', windowConfig);
    
    // TODO: 나중에 구현
    // compress 옵션에 따른 그룹핑 및 집계
    
    return data; // 현재는 원본 반환
}