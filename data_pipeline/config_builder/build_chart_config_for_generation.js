// ============================================================================
// data_pipeline/config_builder/build_chart_config_for_generation.js
// ============================================================================

/**
 * generateChart용 config 객체 생성
 * @param {string} chartType - 선택된 차트 타입
 * @param {Array<string>} selectedFields - 선택된 필드들
 * @param {number} dimension - 차원수 (1-4)
 * @param {Object} extraOptions - 추가 옵션 (스케일링, 색상 등)
 * @returns {Object} config - { type: string, dataMapping: Object, options: Object }
 * @throws {Error} 잘못된 매핑이나 호환성 문제시
 */
export default function buildChartConfigForGeneration(chartType, selectedFields, dimension, extraOptions = {}) {
    console.log('[CONFIG_BUILDER] generateChart용 config 생성 시작');
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
        const validatedFields = validateAndCleanFields(selectedFields);
        
        // 2. 데이터 매핑 생성
        const dataMapping = createDataMapping(validatedFields, dimension);
        
        // 3. 차트 타입과 매핑 호환성 검증
        validateChartTypeCompatibility(chartType, dataMapping, dimension);
        
        // 4. 기본 옵션 설정
        const baseOptions = createBaseOptions(chartType, dimension);
        
        // 5. 추가 옵션 병합
        const mergedOptions = mergeExtraOptions(baseOptions, extraOptions);
        
        // 6. 최종 config 객체 생성
        const config = {
            type: chartType,
            dataMapping: dataMapping,
            options: mergedOptions
        };
        
        console.log('[CONFIG_BUILDER] config 생성 완료:', config);
        
        return config;

    } catch (error) {
        console.error('[CONFIG_BUILDER] config 생성 중 오류:', error);
        throw new Error(`차트 config 생성 실패: ${error.message}`);
    }
}

/**
 * 필드 유효성 검사 및 정리
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
 * 데이터 매핑 생성
 * @param {Array<string>} validatedFields - 검증된 필드들
 * @param {number} dimension - 차원수
 * @returns {Object} dataMapping - { x: string, y?: string, size?: string, color?: string }
 */
function createDataMapping(validatedFields, dimension) {
    console.log('[CONFIG_BUILDER] 데이터 매핑 생성:', { validatedFields, dimension });
    
    const mapping = {};
    const axisNames = ['x', 'y', 'size', 'color'];
    
    for (let i = 0; i < dimension; i++) {
        const axisName = axisNames[i];
        const fieldName = validatedFields[i];
        
        if (axisName && fieldName) {
            mapping[axisName] = fieldName;
        }
    }
    
    console.log('[CONFIG_BUILDER] 생성된 매핑:', mapping);
    return mapping;
}

/**
 * 차트 타입과 데이터 매핑 호환성 검증
 * @param {string} chartType - 차트 타입
 * @param {Object} dataMapping - 데이터 매핑
 * @param {number} dimension - 차원수
 */
function validateChartTypeCompatibility(chartType, dataMapping, dimension) {
    const mappingKeys = Object.keys(dataMapping);
    
    // 차원수와 매핑 키 개수 일치 검사
    if (mappingKeys.length !== dimension) {
        throw new Error(`데이터 매핑 키 개수(${mappingKeys.length})가 차원수(${dimension})와 일치하지 않습니다`);
    }
    
    // 차트 타입별 필수 축 검증
    const chartTypeRequirements = {
        // 1차원
        'line1d': { required: ['x'], forbidden: ['y', 'size', 'color'] },
        'category': { required: ['x'], forbidden: ['y', 'size', 'color'] },
        
        // 2차원
        'scatter': { required: ['x', 'y'], forbidden: ['size', 'color'] },
        'size': { required: ['x'], forbidden: ['y', 'color'] },
        'color': { required: ['x'], forbidden: ['y', 'size'] },
        'bar': { required: ['x', 'y'], forbidden: ['size', 'color'] },
        'bar_size': { required: ['x'], forbidden: ['y', 'color'] },
        'bar_color': { required: ['x'], forbidden: ['y', 'size'] },
        
        // 3차원
        'scatter_size': { required: ['x', 'y', 'size'], forbidden: ['color'] },
        'scatter_color': { required: ['x', 'y', 'color'], forbidden: ['size'] },
        'size_color': { required: ['x', 'size', 'color'], forbidden: ['y'] },
        'grouped_bar': { required: ['x', 'y'], forbidden: ['size', 'color'] },
        'grouped_bar_size': { required: ['x'], forbidden: ['y', 'color'] },
        'grouped_bar_color': { required: ['x'], forbidden: ['y', 'size'] },
        
        // 4차원
        'scatter_size_color': { required: ['x', 'y', 'size', 'color'], forbidden: [] },
        'grouped_scatter_size_color': { required: ['x', 'y', 'size', 'color'], forbidden: [] }
    };
    
    const requirements = chartTypeRequirements[chartType];
    if (!requirements) {
        throw new Error(`알 수 없는 차트 타입: ${chartType}`);
    }
    
    // 필수 축 검사
    const missingRequired = requirements.required.filter(axis => !dataMapping[axis]);
    if (missingRequired.length > 0) {
        throw new Error(`${chartType}에 필요한 축이 누락되었습니다: ${missingRequired.join(', ')}`);
    }
    
    // 금지된 축 검사
    const forbiddenPresent = requirements.forbidden.filter(axis => dataMapping[axis]);
    if (forbiddenPresent.length > 0) {
        throw new Error(`${chartType}에서 사용할 수 없는 축이 포함되었습니다: ${forbiddenPresent.join(', ')}`);
    }
}

/**
 * 기본 옵션 생성
 * @param {string} chartType - 차트 타입
 * @param {number} dimension - 차원수
 * @returns {Object} 기본 옵션들
 */
function createBaseOptions(chartType, dimension) {
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
                display: dimension > 1 && (chartType.includes('grouped') || chartType.includes('bar'))
            }
        }
    };
    
    // 차트 타입별 특별 옵션
    if (chartType.includes('scatter')) {
        baseOptions.plugins.tooltip = {
            mode: 'point',
            intersect: false
        };
    } else if (chartType.includes('bar')) {
        baseOptions.plugins.tooltip = {
            mode: 'index',
            intersect: false
        };
    }
    
    return baseOptions;
}

/**
 * 추가 옵션 병합
 * @param {Object} baseOptions - 기본 옵션
 * @param {Object} extraOptions - 추가 옵션
 * @returns {Object} 병합된 옵션
 */
function mergeExtraOptions(baseOptions, extraOptions) {
    // 깊은 복사로 기본 옵션 복제
    const mergedOptions = JSON.parse(JSON.stringify(baseOptions));
    
    // 추가 옵션이 있으면 병합
    if (extraOptions && Object.keys(extraOptions).length > 0) {
        console.log('[CONFIG_BUILDER] 추가 옵션 병합:', extraOptions);
        
        // 스케일링 옵션
        if (extraOptions.scaling) {
            mergedOptions.scaling = extraOptions.scaling;
        }
        
        // 색상 옵션
        if (extraOptions.colorScheme) {
            mergedOptions.colorScheme = extraOptions.colorScheme;
        }
        
        // 윈도우 범위 옵션
        if (extraOptions.windowRanges) {
            mergedOptions.windowRanges = extraOptions.windowRanges;
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
    }
    
    return mergedOptions;
}