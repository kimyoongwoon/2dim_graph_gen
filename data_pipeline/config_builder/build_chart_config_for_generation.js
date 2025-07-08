// ============================================================================
// data_pipeline/config_builder/build_chart_config_for_generation.js (경량화)
// ============================================================================

/**
 * 경량화된 차트 config 생성 함수
 * @param {string} chartType - 선택된 차트 타입
 * @param {Array<string>} selectedFields - 선택된 필드들
 * @param {number} dimension - 차원수 (1-4)
 * @param {Object} extraOptions - 추가 옵션
 * @param {boolean} is3D - 3D 차트 여부 (기본값: false)
 * @returns {Object} config - { type: string, dataMapping: Object, options: Object }
 */
export default function buildChartConfigForGeneration(chartType, selectedFields, dimension, extraOptions = {}, is3D = false) {
    console.log('[CONFIG_BUILDER] 경량화된 config 생성:', { chartType, selectedFields, dimension, is3D });

    // 기본 입력 검증만
    if (!chartType || !Array.isArray(selectedFields) || selectedFields.length !== dimension) {
        throw new Error('Invalid config parameters');
    }

    // 데이터 매핑 생성
    const dataMapping = createDataMapping(selectedFields, dimension, is3D);

    // 기본 옵션 설정
    const options = {
        responsive: true,
        animation: { duration: 300 },
        plugins: {
            title: { display: true, text: `${chartType} Chart` }
        },
        is3D,
        ...extraOptions
    };

    return {
        type: chartType,
        dataMapping,
        options
    };
}

/**
 * 간단한 데이터 매핑 생성
 */
function createDataMapping(fields, dimension, is3D, chartType) {
    const mapping = {};

    if (is3D) {
        // 3D: x, y, z 고정 (unchanged)
        mapping.x = fields[0];
        mapping.y = fields[1];
        mapping.z = fields[2];
        if (fields[3]) mapping.color = fields[3];
    } else {
        // 2D mode mapping based on chart type
        switch (chartType) {
            case 'scatter':
                // 2D: x, y
                mapping.x = fields[0];
                mapping.y = fields[1];
                break;

            case 'size':
                // 2D: x, size
                mapping.x = fields[0];
                mapping.size = fields[1];
                break;

            case 'color':
                // 2D: x, color
                mapping.x = fields[0];
                mapping.color = fields[1];
                break;

            case 'scatter_size':
                // 3D: x, y, size
                mapping.x = fields[0];
                mapping.y = fields[1];
                mapping.size = fields[2];
                break;

            case 'scatter_color':
                // 3D: x, y, color
                mapping.x = fields[0];
                mapping.y = fields[1];
                mapping.color = fields[2];
                break;

            case 'size_color':
                // 3D: x, size, color
                mapping.x = fields[0];
                mapping.size = fields[1];
                mapping.color = fields[2];
                break;

            case 'scatter_size_color':
                // 4D: x, y, size, color
                mapping.x = fields[0];
                mapping.y = fields[1];
                mapping.size = fields[2];
                mapping.color = fields[3];
                break;

            default:
                // Fallback to dimension-based mapping
                const axisNames = ['x', 'y', 'size', 'color'];
                for (let i = 0; i < dimension; i++) {
                    mapping[axisNames[i]] = fields[i];
                }
                break;
        }
    }

    console.log('[DATA_MAPPING] Created mapping:', { chartType, is3D, dimension, mapping });
    return mapping;
}