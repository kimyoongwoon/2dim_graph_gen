// ============================================================================
// data_pipeline/config_schema/config_requirements.js
// ============================================================================

/**
 * 8�� ��Ʈ Ÿ�Ժ� config �䱸���� ���� (���̵���� ����)
 */

// �����ϴ� 8�� ��Ʈ Ÿ��
export const SUPPORTED_CHART_TYPES = [
    // 2D ��Ʈ (3��)
    '2d_scatter',
    '2d_size',
    '2d_color',
    // 3D ��Ʈ (4��)
    '3d_surface_scatter',
    '3d_scatter_color',
    '3d_scatter_size',
    '3d_size_color',
    // 4D ��Ʈ (1��)
    '4d_scatter_size_color'
];

// ��Ʈ Ÿ�Ժ� �ʼ� dataMapping �ʵ�
export const CHART_TYPE_REQUIREMENTS = {
    // 2D ��Ʈ
    '2d_scatter': {
        required: ['x', 'y'],
        forbidden: ['z', 'size', 'color'],
        description: 'X-Y ������'
    },
    '2d_size': {
        required: ['x', 'size'],
        forbidden: ['y', 'z', 'color'],
        description: 'X�� + ũ�� ���ڵ�'
    },
    '2d_color': {
        required: ['x', 'color'],
        forbidden: ['y', 'z', 'size'],
        description: 'X�� + ���� ���ڵ�'
    },

    // 3D ��Ʈ
    '3d_surface_scatter': {
        required: ['x', 'y', 'z'],
        forbidden: ['size', 'color'],
        description: '���� 3D (X,Y,Z ��ǥ)'
    },
    '3d_scatter_color': {
        required: ['x', 'y', 'color'],
        forbidden: ['z', 'size'],
        description: '2D ������ + ����'
    },
    '3d_scatter_size': {
        required: ['x', 'y', 'size'],
        forbidden: ['z', 'color'],
        description: '2D ������ + ũ��'
    },
    '3d_size_color': {
        required: ['x', 'size', 'color'],
        forbidden: ['y', 'z'],
        description: '1D ��ġ + ũ�� + ����'
    },

    // 4D ��Ʈ
    '4d_scatter_size_color': {
        required: ['x', 'y', 'size', 'color'],
        forbidden: ['z'],
        description: '2D ������ + ũ�� + ����'
    }
};

// scalingConfig �䱸����
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
            sigmoid: ['k']      // �ް�絵
        }
    }
};

// colorConfig �䱸����  
export const COLOR_CONFIG_SCHEMA = {
    type: {
        required: true,
        allowedValues: ['blueRed', 'viridis', 'plasma'],
        default: 'blueRed'
    }
};

// config ��ü ���� ��Ű��
export const CONFIG_SCHEMA = {
    type: {
        required: true,
        allowedValues: SUPPORTED_CHART_TYPES
    },
    dataMapping: {
        required: true,
        validation: 'dynamic' // ��Ʈ Ÿ�Կ� ���� ���� ����
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
 * ��Ʈ Ÿ�Ժ� ���� config ���ø�
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
 * ��Ʈ Ÿ���� ��ȿ���� Ȯ��
 * @param {string} chartType - Ȯ���� ��Ʈ Ÿ��
 * @returns {boolean}
 */
export function isValidChartType(chartType) {
    return SUPPORTED_CHART_TYPES.includes(chartType);
}

/**
 * ��Ʈ Ÿ�Ժ� �䱸���� ��ȸ
 * @param {string} chartType - ��Ʈ Ÿ��
 * @returns {Object|null} �䱸���� ��ü �Ǵ� null
 */
export function getChartTypeRequirements(chartType) {
    return CHART_TYPE_REQUIREMENTS[chartType] || null;
}

/**
 * ���� config ��ȸ
 * @param {string} chartType - ��Ʈ Ÿ��
 * @returns {Object|null} ���� config �Ǵ� null
 */
export function getSampleConfig(chartType) {
    return SAMPLE_CONFIGS[chartType] || null;
}

/**
 * ��� ���� ��Ʈ Ÿ�� ��� ��ȸ
 * @returns {Array<string>}
 */
export function getAllSupportedTypes() {
    return [...SUPPORTED_CHART_TYPES];
}