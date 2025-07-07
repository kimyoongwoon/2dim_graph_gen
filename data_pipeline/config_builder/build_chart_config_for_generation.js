// ============================================================================
// data_pipeline/config_builder/build_chart_config_for_generation.js
// ============================================================================

/**
 * 🔄 수정된 메인 config 생성 함수 (2D/3D 분기 처리)
 * @param {string} chartType - 선택된 차트 타입
 * @param {Array<string>} selectedFields - 선택된 필드들
 * @param {number} dimension - 차원수 (1-4)
 * @param {Object} extraOptions - 추가 옵션 (스케일링, 색상 등)
 * @param {boolean} is3D - 3D 차트 여부 (기본값: false, 기존 호환성 유지)
 * @returns {Object} config - { type: string, dataMapping: Object, options: Object }
 * @throws {Error} 잘못된 매핑이나 호환성 문제시
 */
export default function buildChartConfigForGeneration(chartType, selectedFields, dimension, extraOptions = {}, is3D = false) {
    console.log('[CONFIG_BUILDER] 메인 config 생성 시작 (2D/3D 분기)');
    console.log('[CONFIG_BUILDER] 입력:', { chartType, selectedFields, dimension, extraOptions, is3D });

    try {
        // 🆕 3D/2D 분기 처리
        if (is3D) {
            console.log('[CONFIG_BUILDER] 3D 모드로 분기');
            return buildChartConfigForGeneration_3d(chartType, selectedFields, dimension, extraOptions);
        } else {
            console.log('[CONFIG_BUILDER] 2D 모드로 분기 (기존 로직)');
            return buildChartConfigForGeneration_2d(chartType, selectedFields, dimension, extraOptions);
        }

    } catch (error) {
        console.error('[CONFIG_BUILDER] 메인 config 생성 중 오류:', error);
        throw new Error(`차트 config 생성 실패: ${error.message}`);
    }
}

/**
 * 🆕 3D 차트 전용 config 생성 함수
 * @param {string} chartType - 선택된 차트 타입
 * @param {Array<string>} selectedFields - 선택된 필드들
 * @param {number} dimension - 차원수 (1-4)
 * @param {Object} extraOptions - 추가 옵션 (스케일링, 색상 등)
 * @returns {Object} config - 3D 차트용 설정
 * @throws {Error} 잘못된 매핑이나 호환성 문제시
 */
export function buildChartConfigForGeneration_3d(chartType, selectedFields, dimension, extraOptions = {}) {
    console.log('[CONFIG_BUILDER] 3D 차트 config 생성 시작');
    console.log('[CONFIG_BUILDER] 입력:', { chartType, selectedFields, dimension, extraOptions });

    // 입력 검증
    if (!chartType || typeof chartType !== 'string' || chartType.trim() === '') {
        throw new Error('유효한 chartType이 필요합니다');
    }

    if (!Array.isArray(selectedFields)) {
        throw new Error('selectedFields는 배열이어야 합니다');
    }

    if (!dimension || typeof dimension !== 'number' || dimension < 1 || dimension > 4) {
        throw new Error('dimension은 1-4 사이의 숫자여야 합니다');
    }

    if (selectedFields.length !== dimension) {
        throw new Error(`selectedFields 개수(${selectedFields.length})가 dimension(${dimension})과 일치하지 않습니다`);
    }

    if (extraOptions && typeof extraOptions !== 'object') {
        throw new Error('extraOptions는 객체여야 합니다');
    }

    try {
        // 1. 필드 유효성 검사
        const validatedFields = validate3DFields(selectedFields);

        // 2. 3D 데이터 매핑 생성
        const dataMapping = create3DDataMapping(validatedFields, dimension);

        // 3. 3D 차트 타입과 매핑 호환성 검증
        validate3DChartTypeCompatibility(chartType, dataMapping, dimension);

        // 4. 3D 기본 옵션 설정
        const baseOptions = create3DBaseOptions(chartType, dimension);

        // 5. 3D 추가 옵션 병합
        const mergedOptions = merge3DExtraOptions(baseOptions, extraOptions);

        // 6. 최종 3D config 객체 생성
        const config = {
            type: chartType,
            dataMapping: dataMapping,
            options: mergedOptions,
            is3D: true
        };

        console.log('[CONFIG_BUILDER] 3D config 생성 완료:', config);
        return config;

    } catch (error) {
        console.error('[CONFIG_BUILDER] 3D config 생성 중 오류:', error);
        throw new Error(`3D 차트 config 생성 실패: ${error.message}`);
    }
}

/**
 * 🆕 2D 차트 전용 config 생성 함수 (기존 로직 그대로 유지)
 * @param {string} chartType - 선택된 차트 타입
 * @param {Array<string>} selectedFields - 선택된 필드들
 * @param {number} dimension - 차원수 (1-4)
 * @param {Object} extraOptions - 추가 옵션
 * @returns {Object} config - 2D 차트용 설정
 */
function buildChartConfigForGeneration_2d(chartType, selectedFields, dimension, extraOptions = {}) {
    console.log('[CONFIG_BUILDER] 2D config 생성');

    // 입력 검증 (기존과 동일)
    if (!chartType || typeof chartType !== 'string' || chartType.trim() === '') {
        throw new Error('유효한 chartType이 필요합니다');
    }

    if (!Array.isArray(selectedFields)) {
        throw new Error('selectedFields는 배열이어야 합니다');
    }

    if (!dimension || typeof dimension !== 'number' || dimension < 1 || dimension > 4) {
        throw new Error('dimension은 1-4 사이의 숫자여야 합니다');
    }

    if (selectedFields.length !== dimension) {
        throw new Error(`selectedFields 개수(${selectedFields.length})가 dimension(${dimension})과 일치하지 않습니다`);
    }

    if (extraOptions && typeof extraOptions !== 'object') {
        throw new Error('extraOptions는 객체여야 합니다');
    }

    try {
        // 기존 2D 로직 그대로 유지
        // 1. 필드 유효성 검사
        const validatedFields = validateAndCleanFields(selectedFields);

        // 2. 데이터 매핑 생성 (2D 방식)
        const dataMapping = create2DDataMapping(validatedFields, dimension);

        // 3. 차트 타입과 매핑 호환성 검증 (2D 방식)
        validate2DChartTypeCompatibility(chartType, dataMapping, dimension);

        // 4. 기본 옵션 설정 (2D 방식)
        const baseOptions = create2DBaseOptions(chartType, dimension);

        // 5. 추가 옵션 병합 (2D 방식)
        const mergedOptions = merge2DExtraOptions(baseOptions, extraOptions);

        // 6. 최종 2D config 객체 생성
        const config = {
            type: chartType,
            dataMapping: dataMapping,
            options: mergedOptions,
            is3D: false
        };

        console.log('[CONFIG_BUILDER] 2D config 생성 완료:', config);
        return config;

    } catch (error) {
        console.error('[CONFIG_BUILDER] 2D config 생성 중 오류:', error);
        throw new Error(`2D 차트 config 생성 실패: ${error.message}`);
    }
}

// ============================================================================
// 🆕 3D 전용 헬퍼 함수들
// ============================================================================

/**
 * 3D 필드 유효성 검사 및 정리
 * @param {Array<string>} selectedFields - 선택된 필드들
 * @returns {Array<string>} 검증되고 정리된 필드들
 */
function validate3DFields(selectedFields) {
    const validatedFields = [];

    selectedFields.forEach((field, index) => {
        if (!field) {
            throw new Error(`3D 필드 ${index + 1}이 null 또는 undefined입니다`);
        }

        if (typeof field !== 'string') {
            throw new Error(`3D 필드 ${index + 1}이 문자열이 아닙니다: ${typeof field}`);
        }

        const trimmedField = field.trim();
        if (trimmedField === '') {
            throw new Error(`3D 필드 ${index + 1}이 빈 문자열입니다`);
        }

        validatedFields.push(trimmedField);
    });

    // 중복 필드 검사
    const uniqueFields = [...new Set(validatedFields)];
    if (uniqueFields.length !== validatedFields.length) {
        throw new Error('3D에서 중복된 필드가 선택되었습니다');
    }

    return validatedFields;
}

/**
 * 3D 데이터 매핑 생성
 * @param {Array<string>} validatedFields - 검증된 필드들
 * @param {number} dimension - 차원수
 * @returns {Object} dataMapping - 3D용 매핑 { x: string, y: string, z: string, color?: string }
 */
function create3DDataMapping(validatedFields, dimension) {
    console.log('[CONFIG_BUILDER] 3D 데이터 매핑 생성:', { validatedFields, dimension });

    const mapping = {};
    const axisNames = ['x', 'y', 'z', 'color']; // 3D용 매핑

    for (let i = 0; i < dimension; i++) {
        const axisName = axisNames[i];
        const fieldName = validatedFields[i];

        if (axisName && fieldName) {
            mapping[axisName] = fieldName;
        }
    }

    console.log('[CONFIG_BUILDER] 3D 매핑 생성 완료:', mapping);
    return mapping;
}

/**
 * 3D 차트 타입과 데이터 매핑 호환성 검증
 * @param {string} chartType - 차트 타입
 * @param {Object} dataMapping - 데이터 매핑
 * @param {number} dimension - 차원수
 */
function validate3DChartTypeCompatibility(chartType, dataMapping, dimension) {
    const mappingKeys = Object.keys(dataMapping);

    // 차원수와 매핑 키 개수 일치 검사
    if (mappingKeys.length !== dimension) {
        throw new Error(`3D 데이터 매핑 키 개수(${mappingKeys.length})가 차원수(${dimension})와 일치하지 않습니다`);
    }

    // 3D 차트 타입별 필수 축 검증
    const chart3DTypeRequirements = {
        // 3D 차트 타입들
        '3d_surface_scatter': { required: ['x', 'y', 'z'], forbidden: ['color'] },
        '3d_surface_only': { required: ['x', 'y', 'z'], forbidden: ['color'] },
        '3d_scatter_only': { required: ['x', 'y', 'z'], forbidden: ['color'] },
        '3d_surface_scatter_color': { required: ['x', 'y', 'z', 'color'], forbidden: [] }
    };

    const requirements = chart3DTypeRequirements[chartType];
    if (!requirements) {
        console.warn(`[CONFIG_BUILDER] 알 수 없는 3D 차트 타입: ${chartType} (기본 처리)`);
        return; // 기본 처리로 넘어감
    }

    // 필수 축 검사
    const missingRequired = requirements.required.filter(axis => !dataMapping[axis]);
    if (missingRequired.length > 0) {
        throw new Error(`3D ${chartType}에 필요한 축이 누락되었습니다: ${missingRequired.join(', ')}`);
    }

    // 금지된 축 검사
    const forbiddenPresent = requirements.forbidden.filter(axis => dataMapping[axis]);
    if (forbiddenPresent.length > 0) {
        throw new Error(`3D ${chartType}에서 사용할 수 없는 축이 포함되었습니다: ${forbiddenPresent.join(', ')}`);
    }
}

/**
 * 3D 기본 옵션 생성
 * @param {string} chartType - 차트 타입
 * @param {number} dimension - 차원수
 * @returns {Object} 3D 기본 옵션들
 */
function create3DBaseOptions(chartType, dimension) {
    const baseOptions = {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 300 },
        plugins: {
            title: {
                display: true,
                text: `${chartType} Chart (${dimension}D)`
            },
            legend: {
                display: dimension > 3 // 4차원에서만 범례 표시
            }
        },
        // 3D Plotly 전용 옵션들
        plotly3D: {
            showAxes: true,
            showGrid: true,
            cameraPosition: {
                eye: { x: 1.5, y: 1.5, z: 1.5 }
            }
        }
    };

    // 3D 차트 타입별 특별 옵션
    if (chartType.includes('surface')) {
        baseOptions.plotly3D.surfaceOpacity = 0.7;
    }

    if (chartType.includes('scatter')) {
        baseOptions.plotly3D.scatterOpacity = 0.8;
        baseOptions.plotly3D.markerSize = 4;
    }

    return baseOptions;
}

/**
 * 3D 추가 옵션 병합
 * @param {Object} baseOptions - 기본 옵션
 * @param {Object} extraOptions - 추가 옵션
 * @returns {Object} 병합된 옵션
 */
function merge3DExtraOptions(baseOptions, extraOptions) {
    // 깊은 복사로 기본 옵션 복제
    const mergedOptions = JSON.parse(JSON.stringify(baseOptions));

    // 추가 옵션이 있으면 병합
    if (extraOptions && Object.keys(extraOptions).length > 0) {
        console.log('[CONFIG_BUILDER] 3D 추가 옵션 병합:', extraOptions);

        // 3D 특화 옵션들
        if (extraOptions.cameraPosition) {
            mergedOptions.plotly3D.cameraPosition = extraOptions.cameraPosition;
        }

        if (extraOptions.opacity) {
            if (extraOptions.opacity.surface) {
                mergedOptions.plotly3D.surfaceOpacity = extraOptions.opacity.surface;
            }
            if (extraOptions.opacity.scatter) {
                mergedOptions.plotly3D.scatterOpacity = extraOptions.opacity.scatter;
            }
        }

        if (extraOptions.markerSize) {
            mergedOptions.plotly3D.markerSize = extraOptions.markerSize;
        }

        // 색상 스케일
        if (extraOptions.colorScale) {
            mergedOptions.plotly3D.colorScale = extraOptions.colorScale;
        }

        // Plotly 설정 옵션
        if (extraOptions.plotlyConfig) {
            mergedOptions.plotlyConfig = extraOptions.plotlyConfig;
        }

        // 일반 옵션들
        if (extraOptions.scaling) {
            mergedOptions.scaling = extraOptions.scaling;
        }

        if (extraOptions.plugins) {
            mergedOptions.plugins = {
                ...mergedOptions.plugins,
                ...extraOptions.plugins
            };
        }
    }

    return mergedOptions;
}

// ============================================================================
// 🔄 기존 2D 전용 헬퍼 함수들 (기존 함수명 유지)
// ============================================================================

/**
 * 필드 유효성 검사 및 정리 (2D용, 기존 함수명 유지)
 * @param {Array<string>} selectedFields - 선택된 필드들
 * @returns {Array<string>} 검증되고 정리된 필드들
 */
function validateAndCleanFields(selectedFields) {
    const validatedFields = [];

    selectedFields.forEach((field, index) => {
        if (!field) {
            throw new Error(`필드 ${index + 1}이 null 또는 undefined입니다`);
        }

        if (typeof field !== 'string') {
            throw new Error(`필드 ${index + 1}이 문자열이 아닙니다: ${typeof field}`);
        }

        const trimmedField = field.trim();
        if (trimmedField === '') {
            throw new Error(`필드 ${index + 1}이 빈 문자열입니다`);
        }

        validatedFields.push(trimmedField);
    });

    // 중복 필드 검사
    const uniqueFields = [...new Set(validatedFields)];
    if (uniqueFields.length !== validatedFields.length) {
        throw new Error('중복된 필드가 선택되었습니다');
    }

    return validatedFields;
}

/**
 * 2D 데이터 매핑 생성
 * @param {Array<string>} validatedFields - 검증된 필드들
 * @param {number} dimension - 차원수
 * @returns {Object} dataMapping - 2D용 매핑
 */
function create2DDataMapping(validatedFields, dimension) {
    console.log('[CONFIG_BUILDER] 2D 데이터 매핑 생성:', { validatedFields, dimension });

    const mapping = {};

    // 2D 매핑 규칙 (Chart.js 기반)
    if (dimension >= 1) {
        mapping.x = validatedFields[0];
    }
    if (dimension >= 2) {
        mapping.y = validatedFields[1];
    }
    if (dimension >= 3) {
        mapping.size = validatedFields[2];
    }
    if (dimension >= 4) {
        mapping.color = validatedFields[3];
    }

    console.log('[CONFIG_BUILDER] 2D 매핑 생성 완료:', mapping);
    return mapping;
}

/**
 * 2D 차트 타입과 데이터 매핑 호환성 검증
 * @param {string} chartType - 차트 타입
 * @param {Object} dataMapping - 데이터 매핑
 * @param {number} dimension - 차원수
 */
function validate2DChartTypeCompatibility(chartType, dataMapping, dimension) {
    const mappingKeys = Object.keys(dataMapping);

    // 차원수와 매핑 키 개수 일치 검사
    if (mappingKeys.length !== dimension) {
        throw new Error(`2D 데이터 매핑 키 개수(${mappingKeys.length})가 차원수(${dimension})와 일치하지 않습니다`);
    }

    // 2D 차트 타입별 필수 축 검증 (예시)
    const chart2DTypeRequirements = {
        // 1차원
        'line': { required: ['x'], forbidden: ['y', 'size', 'color'] },
        'bar': { required: ['x'], forbidden: ['y', 'size', 'color'] },

        // 2차원
        'scatter': { required: ['x', 'y'], forbidden: ['size', 'color'] },
        'line2d': { required: ['x', 'y'], forbidden: ['size', 'color'] },
        'bar2d': { required: ['x', 'y'], forbidden: ['size', 'color'] },

        // 3차원 (2D에서도 가능)
        'bubble': { required: ['x', 'y', 'size'], forbidden: ['color'] },
        'scatter_size': { required: ['x', 'y', 'size'], forbidden: ['color'] },

        // 4차원 (2D에서도 가능)
        'bubble_color': { required: ['x', 'y', 'size', 'color'], forbidden: [] }
    };

    const requirements = chart2DTypeRequirements[chartType];
    if (!requirements) {
        console.warn(`[CONFIG_BUILDER] 알 수 없는 2D 차트 타입: ${chartType} (기본 처리)`);
        return; // 기본 처리로 넘어감
    }

    // 필수 축 검사
    const missingRequired = requirements.required.filter(axis => !dataMapping[axis]);
    if (missingRequired.length > 0) {
        throw new Error(`2D ${chartType}에 필요한 축이 누락되었습니다: ${missingRequired.join(', ')}`);
    }

    // 금지된 축 검사
    const forbiddenPresent = requirements.forbidden.filter(axis => dataMapping[axis]);
    if (forbiddenPresent.length > 0) {
        throw new Error(`2D ${chartType}에서 사용할 수 없는 축이 포함되었습니다: ${forbiddenPresent.join(', ')}`);
    }
}

/**
 * 2D 기본 옵션 생성
 * @param {string} chartType - 차트 타입
 * @param {number} dimension - 차원수
 * @returns {Object} 2D 기본 옵션들
 */
function create2DBaseOptions(chartType, dimension) {
    const baseOptions = {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 300 },
        plugins: {
            title: {
                display: true,
                text: `${chartType} Chart (${dimension}D)`
            },
            legend: {
                display: dimension > 1
            }
        },
        // Chart.js 전용 옵션들
        scales: {
            x: {
                display: true,
                title: {
                    display: true,
                    text: 'X Axis'
                }
            }
        }
    };

    // Y축 추가 (2차원 이상)
    if (dimension >= 2) {
        baseOptions.scales.y = {
            display: true,
            title: {
                display: true,
                text: 'Y Axis'
            }
        };
    }

    // 차트 타입별 특별 옵션
    if (chartType.includes('scatter') || chartType.includes('bubble')) {
        baseOptions.plugins.tooltip = {
            mode: 'point',
            intersect: false
        };
    } else if (chartType.includes('bar') || chartType.includes('line')) {
        baseOptions.plugins.tooltip = {
            mode: 'index',
            intersect: false
        };
    }

    return baseOptions;
}

/**
 * 2D 추가 옵션 병합
 * @param {Object} baseOptions - 기본 옵션
 * @param {Object} extraOptions - 추가 옵션
 * @returns {Object} 병합된 옵션
 */
function merge2DExtraOptions(baseOptions, extraOptions) {
    // 깊은 복사로 기본 옵션 복제
    const mergedOptions = JSON.parse(JSON.stringify(baseOptions));

    // 추가 옵션이 있으면 병합
    if (extraOptions && Object.keys(extraOptions).length > 0) {
        console.log('[CONFIG_BUILDER] 2D 추가 옵션 병합:', extraOptions);

        // 스케일링 옵션
        if (extraOptions.scaling) {
            mergedOptions.scaling = extraOptions.scaling;
        }

        // 색상 옵션
        if (extraOptions.colorScheme) {
            mergedOptions.colorScheme = extraOptions.colorScheme;
        }

        // Chart.js 옵션 덮어쓰기
        if (extraOptions.chartjsOptions) {
            Object.assign(mergedOptions, extraOptions.chartjsOptions);
        }

        // 커스텀 플러그인 옵션
        if (extraOptions.plugins) {
            mergedOptions.plugins = {
                ...mergedOptions.plugins,
                ...extraOptions.plugins
            };
        }

        // 스케일 옵션
        if (extraOptions.scales) {
            mergedOptions.scales = {
                ...mergedOptions.scales,
                ...extraOptions.scales
            };
        }
    }

    return mergedOptions;
}