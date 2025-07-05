// ============================================================================
// 3dim_chart_gen/utils/scaling/index.js - 스케일링 시스템 통합 export
// ============================================================================

// 크기 스케일링 시스템
export { 
    scaleValue, 
    applySizeScaling 
} from './size_scaling.js';

// 색상 스케일링 시스템
export { 
    createColorGradient, 
    applyColorScaling,
    createPlotlyColorConfig,
    validateColorValue,
    getSupportedColorGradients
} from './color_scaling.js';

/**
 * 통합 스케일링 적용 함수 (크기 + 색상 동시 적용)
 * @param {Array} dataArray - 데이터 배열
 * @param {Object} scalingConfig - 스케일링 설정
 * @returns {Object} { sizeScaling: Array, colorScaling: Object }
 */
export function applyUnifiedScaling(dataArray, scalingConfig = {}) {
    console.log('[SCALING] 통합 스케일링 적용:', scalingConfig);
    
    const result = {};
    
    // 크기 스케일링 적용
    if (scalingConfig.size && scalingConfig.size.field) {
        console.log('[SCALING] 크기 스케일링 처리');
        result.sizeScaling = applySizeScaling(
            dataArray, 
            scalingConfig.size.field, 
            scalingConfig.size.config || {}
        );
    }
    
    // 색상 스케일링 적용  
    if (scalingConfig.color && scalingConfig.color.field) {
        console.log('[SCALING] 색상 스케일링 처리');
        result.colorScaling = applyColorScaling(
            dataArray, 
            scalingConfig.color.field, 
            scalingConfig.color.config || {}
        );
    }
    
    console.log('[SCALING] 통합 스케일링 완료');
    return result;
}

/**
 * 스케일링 설정 검증
 * @param {Object} scalingConfig - 스케일링 설정
 * @returns {Object} { isValid: boolean, errors: Array }
 */
export function validateScalingConfig(scalingConfig) {
    const errors = [];
    
    if (!scalingConfig || typeof scalingConfig !== 'object') {
        errors.push('스케일링 설정은 객체여야 합니다');
        return { isValid: false, errors };
    }
    
    // 크기 스케일링 검증
    if (scalingConfig.size) {
        if (!scalingConfig.size.field) {
            errors.push('크기 스케일링 필드명이 필요합니다');
        }
        
        if (scalingConfig.size.config) {
            const { type, params } = scalingConfig.size.config;
            
            if (type && !['default', 'linear', 'sigmoid'].includes(type)) {
                errors.push(`지원하지 않는 크기 스케일링 타입: ${type}`);
            }
            
            if (type === 'linear' && params) {
                if (params.a !== undefined && isNaN(Number(params.a))) {
                    errors.push('Linear 스케일링 기울기(a)는 숫자여야 합니다');
                }
                if (params.b !== undefined && isNaN(Number(params.b))) {
                    errors.push('Linear 스케일링 오프셋(b)는 숫자여야 합니다');
                }
            }
            
            if (type === 'sigmoid' && params) {
                if (params.k !== undefined && isNaN(Number(params.k))) {
                    errors.push('Sigmoid 스케일링 급경사도(k)는 숫자여야 합니다');
                }
            }
        }
    }
    
    // 색상 스케일링 검증
    if (scalingConfig.color) {
        if (!scalingConfig.color.field) {
            errors.push('색상 스케일링 필드명이 필요합니다');
        }
        
        if (scalingConfig.color.config) {
            const { type } = scalingConfig.color.config;
            
            if (type && !['blueRed', 'viridis', 'plasma'].includes(type)) {
                errors.push(`지원하지 않는 색상 그라디언트 타입: ${type}`);
            }
        }
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * 기본 스케일링 설정 생성
 * @param {string} sizeField - 크기 필드명
 * @param {string} colorField - 색상 필드명
 * @returns {Object} 기본 스케일링 설정
 */
export function createDefaultScalingConfig(sizeField = null, colorField = null) {
    const config = {};
    
    if (sizeField) {
        config.size = {
            field: sizeField,
            config: {
                type: 'default',
                params: {}
            }
        };
    }
    
    if (colorField) {
        config.color = {
            field: colorField,
            config: {
                type: 'blueRed',
                params: {}
            }
        };
    }
    
    return config;
}