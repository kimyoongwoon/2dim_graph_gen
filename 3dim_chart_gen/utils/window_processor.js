// ============================================================================
// 3dim_chart_gen/utils/window_processor.js - 윈도우 슬라이싱 (나중에 구현)
// ============================================================================

/**
 * 윈도우 컨트롤에 따른 데이터 슬라이싱
 * @param {Array} data - 원본 데이터
 * @param {Object} windowControl - 윈도우 컨트롤 설정
 * @returns {Array} 슬라이싱된 데이터
 */
export function applyWindowSlicing(data, windowControl) {
    console.log('[WINDOW_PROCESSOR] 윈도우 슬라이싱 (구현 예정):', windowControl);
    
    // TODO: 나중에 구현
    // start_x, count_x, start_y, count_y를 이용한 데이터 슬라이싱
    
    return data; // 현재는 원본 반환
}

/**
 * 데이터 압축 처리
 * @param {Array} data - 원본 데이터
 * @param {number} compress - 압축 비율
 * @param {string} aggregation - 집계 함수
 * @returns {Array} 압축된 데이터
 */
export function compressData(data, compress, aggregation) {
    console.log('[WINDOW_PROCESSOR] 데이터 압축 (구현 예정):', { compress, aggregation });
    
    // TODO: 나중에 구현
    // compress 비율에 따른 데이터 그룹핑 및 집계
    
    return data; // 현재는 원본 반환
}

/**
 * X, Y 좌표 범위 추출
 * @param {Array} data - 데이터
 * @param {string} xField - X축 필드
 * @param {string} yField - Y축 필드
 * @returns {Object} { xRange, yRange }
 */
export function extractCoordinateRanges(data, xField, yField) {
    console.log('[WINDOW_PROCESSOR] 좌표 범위 추출:', { xField, yField });
    
    if (!data || data.length === 0) {
        return { xRange: [0, 0], yRange: [0, 0] };
    }
    
    const xValues = data.map(d => d[xField]).filter(v => v !== null && v !== undefined);
    const yValues = data.map(d => d[yField]).filter(v => v !== null && v !== undefined);
    
    return {
        xRange: [Math.min(...xValues), Math.max(...xValues)],
        yRange: [Math.min(...yValues), Math.max(...yValues)]
    };
}