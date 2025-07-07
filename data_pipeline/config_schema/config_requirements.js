// ============================================================================
// data_pipeline/config_schema/config_requirements.js
// ============================================================================

/**
 * 8개 차트 타입별 config 요구사항 정의 (가이드라인 기준)
 */

// 지원하는 8개 차트 타입
export const SUPPORTED_CHART_TYPES = [
    // 2D 차트 (3개)
    '2d_scatter',
    '2d_size',
    '2d_color',
    // 3D 차트 (4개)
    '3d_surface_scatter',
    '3d_scatter_color',
    '3d_scatter_size',
    '3d_size_color',
    // 4D 차트 (1개)
    '4d_scatter_size_color'
];

// 차트 타입별 필수 dataMapping 필드
export const CHART_TYPE_REQUIREMENTS = {
    // 2D 차트
    '2d_scatter': {
        required: ['x', 'y'],
        forbidden: ['z', 'size', 'color'],
        description: 'X-Y 산점도'
    },
    '2d_size': {
        required: ['x', 'size'],
        forbidden: ['y', 'z', 'color'],
        description: 'X축 + 크기 인코딩'
    },
    '2d_color': {
        required: ['x', 'color'],
        forbidden: ['y', 'z', 'size'],
        description: 'X축 + 색상 인코딩'
    },

    // 3D 차트
    '3d_surface_scatter': {
        required: ['x', 'y', 'z'],
        forbidden: ['size', 'color'],
        description: '실제 3D (X,Y,Z 좌표)'
    },
    '3d_scatter_color': {
        required: ['x', 'y', 'color'],
        forbidden: ['z', 'size'],
        description: '2D 산점도 + 색상'
    },
    '3d_scatter_size': {
        required: ['x', 'y', 'size'],
        forbidden: ['z', 'color'],
        description: '2D 산점도 + 크기'
    },
    '3d_size_color': {
        required: ['x', 'size', 'color'],
        forbidden: ['y', 'z'],
        description: '1D 위치 + 크기 + 색상'
    },

    // 4D 차트
    '4d_scatter_size_color': {
        required: ['x', 'y', 'size', 'color'],
        forbidden: ['z'],
        description: '2D 산점도 + 크기 + 색상'
    }
};

// scalingConfig 요구사항
export const SCALING_CONFIG_SCHEMA = {
    type: {
        required: true,
        allowedValues: ['default', 'linear', 'sigmoid'],
        default: 'default'
    },
    params: {
        required: false,
        validation: {
            linear: ['a', 'b'], // y = ax + b
            sigmoid: ['k']      // 급경사도
        }
    }
};

// colorConfig 요구사항  
export const COLOR_CONFIG_SCHEMA = {
    type: {
        required: true,
        allowedValues: ['blueRed', 'viridis', 'plasma'],
        default: 'blueRed'
    }
};

// config 전체 구조 스키마
export const CONFIG_SCHEMA = {
    type: {
        required: true,
        allowedValues: SUPPORTED_CHART_TYPES
    },
    dataMapping: {
        required: true,
        validation: 'dynamic' // 차트 타입에 따라 동적 검증
    },
    scalingConfig: {
        required: false,
        schema: SCALING_CONFIG_SCHEMA,
        default: { type: 'default' }
    },
    colorConfig: {
        required: false,
        schema: COLOR_CONFIG_SCHEMA,
        default: { type: 'blueRed' }
    }
};

/**
 * 차트 타입별 샘플 config 템플릿
 */
export const SAMPLE_CONFIGS = {
    '2d_scatter': {
        type: '2d_scatter',
        dataMapping: {
            x: 'field1',
            y: 'field2'
        },
        scalingConfig: { type: 'default' },
        colorConfig: { type: 'blueRed' }
    },

    '2d_size': {
        type: '2d_size',
        dataMapping: {
            x: 'field1',
            size: 'field2'
        },
        scalingConfig: { type: 'linear', params: { a: 1.5, b: 0 } },
        colorConfig: { type: 'blueRed' }
    },

    '2d_color': {
        type: '2d_color',
        dataMapping: {
            x: 'field1',
            color: 'field2'
        },
        scalingConfig: { type: 'default' },
        colorConfig: { type: 'viridis' }
    },

    '3d_surface_scatter': {
        type: '3d_surface_scatter',
        dataMapping: {
            x: 'field1',
            y: 'field2',
            z: 'field3'
        },
        scalingConfig: { type: 'default' },
        colorConfig: { type: 'blueRed' }
    },

    '3d_scatter_color': {
        type: '3d_scatter_color',
        dataMapping: {
            x: 'field1',
            y: 'field2',
            color: 'field3'
        },
        scalingConfig: { type: 'default' },
        colorConfig: { type: 'plasma' }
    },

    '3d_scatter_size': {
        type: '3d_scatter_size',
        dataMapping: {
            x: 'field1',
            y: 'field2',
            size: 'field3'
        },
        scalingConfig: { type: 'sigmoid', params: { k: 2 } },
        colorConfig: { type: 'blueRed' }
    },

    '3d_size_color': {
        type: '3d_size_color',
        dataMapping: {
            x: 'field1',
            size: 'field2',
            color: 'field3'
        },
        scalingConfig: { type: 'linear', params: { a: 2, b: 5 } },
        colorConfig: { type: 'viridis' }
    },

    '4d_scatter_size_color': {
        type: '4d_scatter_size_color',
        dataMapping: {
            x: 'field1',
            y: 'field2',
            size: 'field3',
            color: 'field4'
        },
        scalingConfig: { type: 'sigmoid', params: { k: 1.5 } },
        colorConfig: { type: 'blueRed' }
    }
};

/**
 * 차트 타입이 유효한지 확인
 * @param {string} chartType - 확인할 차트 타입
 * @returns {boolean}
 */
export function isValidChartType(chartType) {
    return SUPPORTED_CHART_TYPES.includes(chartType);
}

/**
 * 차트 타입별 요구사항 조회
 * @param {string} chartType - 차트 타입
 * @returns {Object|null} 요구사항 객체 또는 null
 */
export function getChartTypeRequirements(chartType) {
    return CHART_TYPE_REQUIREMENTS[chartType] || null;
}

/**
 * 샘플 config 조회
 * @param {string} chartType - 차트 타입
 * @returns {Object|null} 샘플 config 또는 null
 */
export function getSampleConfig(chartType) {
    return SAMPLE_CONFIGS[chartType] || null;
}

/**
 * 모든 지원 차트 타입 목록 조회
 * @returns {Array<string>}
 */
export function getAllSupportedTypes() {
    return [...SUPPORTED_CHART_TYPES];
}