// ============================================================================
// 3dim_chart_gen/utils/scaling/size_scaling.js - 크기 스케일링 시스템
// ============================================================================

/**
 * 🔥 통합 스케일링 함수 (3가지 알고리즘)
 * @param {number} value - 원본 값
 * @param {number} min - 최소값
 * @param {number} max - 최대값
 * @param {Object} config - 스케일링 설정 {type: 'default'|'linear'|'sigmoid', params: {...}}
 * @returns {number} 0-1 사이의 정규화된 값
 */
export function scaleValue(value, min, max, config = {}) {
    const { type = 'default', params = {} } = config;
    
    // 동일값 처리
    if (min === max) {
        console.log('[SIZE_SCALING] min=max 상황, 기본값 0.5 반환');
        return 0.5;
    }
    
    // 값 범위 검증
    if (value < min) value = min;
    if (value > max) value = max;
    
    let normalizedValue;
    
    switch (type) {
        case 'linear':
            normalizedValue = linearScaling(value, min, max, params);
            break;
            
        case 'sigmoid':
            normalizedValue = sigmoidScaling(value, min, max, params);
            break;
            
        case 'default':
        default:
            normalizedValue = defaultScaling(value, min, max);
            break;
    }
    
    // 0-1 범위로 클램핑
    return Math.max(0, Math.min(1, normalizedValue));
}

/**
 * 기본 선형 정규화 (Default Scaling)
 * @param {number} value - 값
 * @param {number} min - 최소값
 * @param {number} max - 최대값
 * @returns {number} 정규화된 값
 */
function defaultScaling(value, min, max) {
    return (value - min) / (max - min);
}

/**
 * 선형 변환 스케일링 (Linear Scaling)
 * @param {number} value - 값
 * @param {number} min - 최소값
 * @param {number} max - 최대값
 * @param {Object} params - {a: 기울기, b: 오프셋}
 * @returns {number} 정규화된 값
 */
function linearScaling(value, min, max, params) {
    const { a = 1, b = 0 } = params;
    
    // 선형 변환 적용
    const transformedValue = a * value + b;
    const transformedMin = a * min + b;
    const transformedMax = a * max + b;
    
    // 변환된 범위에서 정규화
    if (transformedMin === transformedMax) {
        return 0.5;
    }
    
    return (transformedValue - transformedMin) / (transformedMax - transformedMin);
}

/**
 * 시그모이드 곡선 스케일링 (Sigmoid Scaling)
 * @param {number} value - 값
 * @param {number} min - 최소값
 * @param {number} max - 최대값
 * @param {Object} params - {k: 급경사도}
 * @returns {number} 정규화된 값
 */
function sigmoidScaling(value, min, max, params) {
    const { k = 1 } = params;
    
    // 중점 계산
    const midpoint = (min + max) / 2;
    
    // 입력값을 -3~3 범위로 정규화 (시그모이드 함수 특성상)
    const normalizedInput = (value - midpoint) / ((max - min) / 6);
    
    // 시그모이드 함수 적용: 1 / (1 + e^(-k*x))
    return 1 / (1 + Math.exp(-k * normalizedInput));
}

/**
 * 배열 데이터에 크기 스케일링 적용
 * @param {Array} dataArray - 데이터 배열
 * @param {string} fieldName - 크기로 사용할 필드명
 * @param {Object} config - 스케일링 설정
 * @returns {Array} 3~18px 범위의 크기 배열
 */
export function applySizeScaling(dataArray, fieldName, config = {}) {
    console.log('[SIZE_SCALING] 크기 스케일링 적용:', {
        dataCount: dataArray.length,
        field: fieldName,
        type: config.type || 'default'
    });
    
    if (!dataArray || dataArray.length === 0) {
        console.warn('[SIZE_SCALING] 빈 데이터 배열');
        return [];
    }
    
    // 필드값들 추출 및 유효성 검사
    const values = dataArray
        .map(d => d[fieldName])
        .filter(v => v !== null && v !== undefined && !isNaN(Number(v)))
        .map(v => Number(v));
    
    if (values.length === 0) {
        console.warn('[SIZE_SCALING] 유효한 크기 값이 없음');
        return dataArray.map(() => 8); // 기본 크기
    }
    
    // 최소/최대값 계산
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    
    console.log('[SIZE_SCALING] 값 범위:', { min: minValue, max: maxValue });
    
    // 각 데이터 포인트에 스케일링 적용
    const scaledSizes = dataArray.map(dataPoint => {
        const rawValue = dataPoint[fieldName];
        
        // 유효하지 않은 값은 기본 크기
        if (rawValue === null || rawValue === undefined || isNaN(Number(rawValue))) {
            return 8;
        }
        
        // 0-1 정규화
        const normalizedValue = scaleValue(Number(rawValue), minValue, maxValue, config);
        
        // 3~18px 범위로 변환
        const scaledSize = 3 + normalizedValue * 15;
        
        return Math.round(scaledSize * 10) / 10; // 소수점 1자리까지
    });
    
    console.log('[SIZE_SCALING] 크기 스케일링 완료:', {
        originalRange: `${minValue} ~ ${maxValue}`,
        scaledRange: `${Math.min(...scaledSizes)} ~ ${Math.max(...scaledSizes)}px`,
        algorithm: config.type || 'default'
    });
    
    return scaledSizes;
}