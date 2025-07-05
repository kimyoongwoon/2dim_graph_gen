// ============================================================================
// 3dim_chart_gen/utils/scaling/color_scaling.js - 색상 스케일링 시스템
// ============================================================================

/**
 * 4단계 블루-레드 그라디언트 생성
 * @param {string} gradientType - 그라디언트 타입 ('blueRed' 기본)
 * @returns {Object} Plotly 호환 색상 스케일 객체
 */
export function createColorGradient(gradientType = 'blueRed') {
    console.log('[COLOR_SCALING] 색상 그라디언트 생성:', gradientType);
    
    let colorScale;
    
    switch (gradientType) {
        case 'blueRed':
        default:
            // 4단계 블루-레드 그라디언트 (2D Chart Generator 사양)
            colorScale = [
                [0,    '#00008B'],  // 진한 파랑 (Dark Blue)
                [0.33, '#ADD8E6'],  // 연한 파랑 (Light Blue)  
                [0.67, '#FFB6C1'],  // 연한 빨강 (Light Pink)
                [1,    '#DC143C']   // 강한 빨강 (Crimson)
            ];
            break;
            
        case 'viridis':
            // Plotly 기본 Viridis 스케일
            colorScale = 'Viridis';
            break;
            
        case 'plasma':
            // Plotly Plasma 스케일
            colorScale = 'Plasma';
            break;
    }
    
    return {
        colorscale: colorScale,
        showscale: true,
        colorbar: {
            title: '색상 값',
            titleside: 'right',
            thickness: 15,
            len: 0.7
        }
    };
}

/**
 * 배열 데이터에 색상 스케일링 적용
 * @param {Array} dataArray - 데이터 배열
 * @param {string} fieldName - 색상으로 사용할 필드명
 * @param {Object} config - 색상 스케일링 설정 {type: 'blueRed'|'viridis'|'plasma'}
 * @returns {Object} { normalizedColors: Array, colorConfig: Object }
 */
export function applyColorScaling(dataArray, fieldName, config = {}) {
    console.log('[COLOR_SCALING] 색상 스케일링 적용:', {
        dataCount: dataArray.length,
        field: fieldName,
        gradientType: config.type || 'blueRed'
    });
    
    if (!dataArray || dataArray.length === 0) {
        console.warn('[COLOR_SCALING] 빈 데이터 배열');
        return {
            normalizedColors: [],
            colorConfig: createColorGradient(config.type)
        };
    }
    
    // 필드값들 추출 및 유효성 검사
    const values = dataArray
        .map(d => d[fieldName])
        .filter(v => v !== null && v !== undefined && !isNaN(Number(v)))
        .map(v => Number(v));
    
    if (values.length === 0) {
        console.warn('[COLOR_SCALING] 유효한 색상 값이 없음');
        const defaultColors = dataArray.map(() => 0.5);
        return {
            normalizedColors: defaultColors,
            colorConfig: createColorGradient(config.type)
        };
    }
    
    // 최소/최대값 계산
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    
    console.log('[COLOR_SCALING] 값 범위:', { min: minValue, max: maxValue });
    
    // 색상 정규화 (0-1 범위)
    const normalizedColors = dataArray.map(dataPoint => {
        const rawValue = dataPoint[fieldName];
        
        // 유효하지 않은 값은 중간값
        if (rawValue === null || rawValue === undefined || isNaN(Number(rawValue))) {
            return 0.5;
        }
        
        const numValue = Number(rawValue);
        
        // 0-1 범위로 정규화
        if (minValue === maxValue) {
            return 0.5; // 모든 값이 같으면 중간 색상
        }
        
        const normalizedValue = (numValue - minValue) / (maxValue - minValue);
        return Math.max(0, Math.min(1, normalizedValue));
    });
    
    // 색상 설정 생성
    const colorConfig = createColorGradient(config.type);
    
    // 실제 값 범위를 색상바에 반영
    colorConfig.cmin = minValue;
    colorConfig.cmax = maxValue;
    colorConfig.colorbar.title = `${fieldName}<br>${minValue.toFixed(2)} ~ ${maxValue.toFixed(2)}`;
    
    console.log('[COLOR_SCALING] 색상 스케일링 완료:', {
        originalRange: `${minValue} ~ ${maxValue}`,
        normalizedRange: `${Math.min(...normalizedColors)} ~ ${Math.max(...normalizedColors)}`,
        gradientType: config.type || 'blueRed',
        colorPoints: normalizedColors.length
    });
    
    return {
        normalizedColors,
        colorConfig
    };
}

/**
 * Plotly trace용 색상 설정 생성
 * @param {Array} normalizedColors - 정규화된 색상 값들
 * @param {Object} colorConfig - 색상 설정
 * @returns {Object} Plotly marker.color 설정
 */
export function createPlotlyColorConfig(normalizedColors, colorConfig) {
    return {
        color: normalizedColors,
        colorscale: colorConfig.colorscale,
        showscale: colorConfig.showscale,
        colorbar: colorConfig.colorbar,
        cmin: colorConfig.cmin,
        cmax: colorConfig.cmax
    };
}

/**
 * 색상 값 검증 및 대체
 * @param {*} value - 검증할 값
 * @param {number} defaultValue - 기본값 (0-1 사이)
 * @returns {number} 유효한 색상 값
 */
export function validateColorValue(value, defaultValue = 0.5) {
    if (value === null || value === undefined || isNaN(Number(value))) {
        return defaultValue;
    }
    
    const numValue = Number(value);
    return Math.max(0, Math.min(1, numValue));
}

/**
 * 지원되는 색상 그라디언트 타입 목록
 * @returns {Array} 색상 그라디언트 타입들
 */
export function getSupportedColorGradients() {
    return [
        {
            type: 'blueRed',
            name: 'Blue-Red Gradient',
            description: '파랑에서 빨강으로 4단계 그라디언트',
            colors: ['#00008B', '#ADD8E6', '#FFB6C1', '#DC143C'],
            default: true
        },
        {
            type: 'viridis',
            name: 'Viridis',
            description: 'Plotly 기본 Viridis 색상 스케일',
            colors: ['보라', '파랑', '녹색', '노랑'],
            default: false
        },
        {
            type: 'plasma',
            name: 'Plasma',
            description: 'Plotly Plasma 색상 스케일',
            colors: ['보라', '분홍', '주황', '노랑'],
            default: false
        }
    ];
}