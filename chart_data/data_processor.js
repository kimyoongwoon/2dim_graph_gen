// ============================================================================
// chart_data/data_processor.js - UI용 데이터 처리 및 매핑 생성
// ============================================================================

// ============================================================================
// 데이터 매핑 생성 (graph_complete.js에서 추출)
// ============================================================================

/**
 * 선택된 필드들을 축 매핑으로 변환
 */
export function createDataMapping(selectedFields, dimension) {
    console.log('[DATA_PROCESSOR] === 데이터 매핑 생성 시작 ===');
    console.log('[DATA_PROCESSOR] 입력 selectedFields:', selectedFields);
    console.log('[DATA_PROCESSOR] selectedFields 타입:', typeof selectedFields);
    console.log('[DATA_PROCESSOR] selectedFields.length:', selectedFields?.length);
    console.log('[DATA_PROCESSOR] 입력 dimension:', dimension);

    // 각 필드 개별 검사
    selectedFields.forEach((field, index) => {
        console.log(`[DATA_PROCESSOR] 필드 ${index}:`, {
            value: field,
            type: typeof field,
            length: field?.length,
            trimmed: field?.trim(),
            isEmpty: !field || field.trim() === ''
        });
    });

    const mapping = {};

    // 1차원: x만
    if (dimension >= 1 && selectedFields[0]) {
        const field = selectedFields[0].trim();
        if (field) {
            mapping.x = field;
            console.log('[DATA_PROCESSOR] X축 설정:', field);
        } else {
            console.error('[DATA_PROCESSOR] X축 필드가 빈 값입니다!');
        }
    }

    // 2차원: x, y
    if (dimension >= 2 && selectedFields[1]) {
        const field = selectedFields[1].trim();
        if (field) {
            mapping.y = field;
            console.log('[DATA_PROCESSOR] Y축 설정:', field);
        } else {
            console.error('[DATA_PROCESSOR] Y축 필드가 빈 값입니다!');
        }
    }

    // 3차원: x, y, size
    if (dimension >= 3 && selectedFields[2]) {
        const field = selectedFields[2].trim();
        if (field) {
            mapping.size = field;
            console.log('[DATA_PROCESSOR] Size축 설정:', field);
        } else {
            console.error('[DATA_PROCESSOR] Size축 필드가 빈 값입니다!');
        }
    }

    // 4차원: x, y, size, color
    if (dimension >= 4 && selectedFields[3]) {
        const field = selectedFields[3].trim();
        if (field) {
            mapping.color = field;
            console.log('[DATA_PROCESSOR] Color축 설정:', field);
        } else {
            console.error('[DATA_PROCESSOR] Color축 필드가 빈 값입니다!');
        }
    }

    console.log('[DATA_PROCESSOR] 생성된 매핑:', mapping);

    // Object.values 검사
    const mappingValues = Object.values(mapping);
    console.log('[DATA_PROCESSOR] Object.values(mapping):', mappingValues);

    mappingValues.forEach((value, index) => {
        console.log(`[DATA_PROCESSOR] 매핑값 ${index}:`, {
            value: value,
            type: typeof value,
            length: value?.length,
            isEmpty: !value || value.trim() === ''
        });
    });

    // 빈 값 제거
    const cleanMapping = {};
    Object.entries(mapping).forEach(([key, value]) => {
        if (value && value.trim && value.trim() !== '') {
            cleanMapping[key] = value.trim();
        } else {
            console.warn(`[DATA_PROCESSOR] 빈 값 제거: ${key} = "${value}"`);
        }
    });

    console.log('[DATA_PROCESSOR] 정리된 매핑:', cleanMapping);
    console.log('[DATA_PROCESSOR] === 데이터 매핑 생성 완료 ===');

    return cleanMapping;
}

/**
 * 차트 설정 객체 생성
 */
export function createChartConfig(chartType, dataMapping, options = {}) {
    console.log('[DATA_PROCESSOR] 차트 설정 생성:', { chartType, dataMapping });
    
    const config = {
        type: chartType,
        dataMapping: dataMapping,
        options: {
            plugins: {
                title: {
                    display: true,
                    text: `${chartType} Chart (${Object.keys(dataMapping).length}D)`
                }
            },
            ...options
        }
    };
    
    console.log('[DATA_PROCESSOR] 생성된 차트 설정:', config);
    return config;
}

/**
 * generateChart() 함수용 파라미터 준비
 */
export function prepareGenerateChartParams(rawData, userSelections) {
    console.log('[DATA_PROCESSOR] generateChart 파라미터 준비:', userSelections);
    
    const { dimension, chartType, selectedFields, extraOptions = {} } = userSelections;
    
    // 데이터 매핑 생성
    const dataMapping = createDataMapping(selectedFields, dimension);
    
    // 차트 설정 생성
    const chartConfig = createChartConfig(chartType, dataMapping, extraOptions);
    
    // 검증
    if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
        throw new Error('유효한 원시 데이터가 필요합니다');
    }
    
    if (Object.keys(dataMapping).length === 0) {
        throw new Error('유효한 데이터 매핑이 필요합니다');
    }
    
    const result = {
        rawData: rawData,
        chartConfig: chartConfig,
        metadata: {
            dimension: dimension,
            chartType: chartType,
            selectedFields: selectedFields,
            dataMapping: dataMapping,
            dataCount: rawData.length
        }
    };
    
    console.log('[DATA_PROCESSOR] 준비된 파라미터:', {
        dataCount: rawData.length,
        chartType: chartConfig.type,
        mappingKeys: Object.keys(dataMapping)
    });
    
    return result;
}

// ============================================================================
// 유틸리티 함수들
// ============================================================================

/**
 * 중복값 존재 여부 계산
 */
export function calculateAllowDuplicates(data, fieldName) {
    if (!data || data.length === 0) {
        console.warn('[DATA_PROCESSOR] calculateAllowDuplicates: 데이터가 없습니다');
        return false;
    }
    
    const values = data.map(item => item[fieldName]);
    const uniqueValues = [...new Set(values)];
    const hasDuplicates = uniqueValues.length < values.length;
    
    console.log(`[DATA_PROCESSOR] ${fieldName} 중복 분석: ${values.length}개 중 ${uniqueValues.length}개 고유값 → allow_dup: ${hasDuplicates}`);
    return hasDuplicates;
}

/**
 * 필드별 기본 통계 정보 계산
 */
export function calculateFieldStatistics(data, fieldName) {
    if (!data || data.length === 0) {
        return null;
    }
    
    const values = data.map(item => item[fieldName]).filter(v => v !== undefined && v !== null);
    
    if (values.length === 0) {
        return null;
    }
    
    // 숫자 필드인 경우
    if (typeof values[0] === 'number') {
        const numericValues = values.filter(v => !isNaN(v));
        if (numericValues.length === 0) return null;
        
        return {
            type: 'numeric',
            count: numericValues.length,
            min: Math.min(...numericValues),
            max: Math.max(...numericValues),
            mean: numericValues.reduce((a, b) => a + b, 0) / numericValues.length,
            uniqueCount: new Set(numericValues).size,
            allowDuplicates: numericValues.length > new Set(numericValues).size
        };
    }
    
    // 문자열 필드인 경우
    else if (typeof values[0] === 'string') {
        const uniqueValues = [...new Set(values)];
        
        return {
            type: 'categorical',
            count: values.length,
            uniqueCount: uniqueValues.size,
            categories: uniqueValues.slice(0, 10), // 최대 10개만 미리보기
            allowDuplicates: values.length > uniqueValues.length
        };
    }
    
    return null;
}

/**
 * 전체 데이터셋 요약 정보 생성
 */
export function generateDatasetSummary(data) {
    if (!data || data.length === 0) {
        return null;
    }
    
    const fields = Object.keys(data[0]);
    const summary = {
        recordCount: data.length,
        fieldCount: fields.length,
        fields: {}
    };
    
    fields.forEach(field => {
        summary.fields[field] = calculateFieldStatistics(data, field);
    });
    
    console.log('[DATA_PROCESSOR] 데이터셋 요약 생성:', summary);
    return summary;
}

/**
 * 필드 타입별 분류
 */
export function classifyFieldsByType(data) {
    if (!data || data.length === 0) {
        return { numeric: [], categorical: [] };
    }
    
    const fields = Object.keys(data[0]);
    const classification = { numeric: [], categorical: [] };
    
    fields.forEach(field => {
        const sampleValue = data[0][field];
        if (typeof sampleValue === 'number') {
            classification.numeric.push(field);
        } else if (typeof sampleValue === 'string') {
            classification.categorical.push(field);
        }
    });
    
    console.log('[DATA_PROCESSOR] 필드 분류:', classification);
    return classification;
}

/**
 * 유효한 축 조합 검증
 */
export function validateAxisCombination(dataMapping, fieldTypes) {
    const errors = [];
    
    // X축은 항상 필요
    if (!dataMapping.x) {
        errors.push('X축이 필요합니다');
    }
    
    // Y축이 있으면 숫자여야 함 (X축은 문자열도 가능)
    if (dataMapping.y && fieldTypes[dataMapping.y] === 'string') {
        errors.push('Y축은 숫자 필드만 사용할 수 있습니다');
    }
    
    // Size축이 있으면 숫자여야 함
    if (dataMapping.size && fieldTypes[dataMapping.size] === 'string') {
        errors.push('크기축은 숫자 필드만 사용할 수 있습니다');
    }
    
    // Color축이 있으면 숫자여야 함
    if (dataMapping.color && fieldTypes[dataMapping.color] === 'string') {
        errors.push('색상축은 숫자 필드만 사용할 수 있습니다');
    }
    
    // 중복 필드 사용 검사
    const usedFields = Object.values(dataMapping);
    const uniqueFields = [...new Set(usedFields)];
    if (usedFields.length !== uniqueFields.length) {
        errors.push('같은 필드를 여러 축에 사용할 수 없습니다');
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

/**
 * 차트 타입과 데이터 매핑 호환성 검사
 */
export function validateChartTypeCompatibility(chartType, dataMapping) {
    const errors = [];
    const axes = Object.keys(dataMapping);
    const dimension = axes.length;
    
    // 1차원 차트 검증
    if (['line1d', 'category'].includes(chartType)) {
        if (dimension !== 1) {
            errors.push(`${chartType}는 1차원 데이터만 지원합니다`);
        }
    }
    
    // 2차원 차트 검증
    else if (['scatter', 'size', 'color', 'bar', 'bar_size', 'bar_color'].includes(chartType)) {
        if (dimension !== 2) {
            errors.push(`${chartType}는 2차원 데이터만 지원합니다`);
        }
        
        // scatter 계열은 y축 필요
        if (chartType.includes('scatter') || chartType === 'scatter') {
            if (!dataMapping.y) {
                errors.push(`${chartType}는 Y축이 필요합니다`);
            }
        }
    }
    
    // 3차원 차트 검증
    else if (chartType.startsWith('scatter_') || chartType.startsWith('grouped_') || chartType === 'size_color') {
        if (dimension !== 3) {
            errors.push(`${chartType}는 3차원 데이터만 지원합니다`);
        }
    }
    
    // 4차원 차트 검증
    else if (chartType.includes('size_color')) {
        if (dimension !== 4) {
            errors.push(`${chartType}는 4차원 데이터만 지원합니다`);
        }
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

/**
 * 전체 설정 유효성 종합 검사
 */
export function validateCompleteConfiguration(rawData, userSelections, fieldTypes) {
    console.log('[DATA_PROCESSOR] 전체 설정 검증 시작');
    
    const { dimension, chartType, selectedFields } = userSelections;
    const errors = [];
    
    // 1. 기본 데이터 검증
    if (!rawData || rawData.length === 0) {
        errors.push('원시 데이터가 없습니다');
    }
    
    // 2. 필드 선택 검증
    if (!selectedFields || selectedFields.length !== dimension) {
        errors.push(`${dimension}차원에 맞는 필드가 선택되지 않았습니다`);
    }
    
    // 3. 데이터 매핑 생성 및 검증
    let dataMapping = {};
    try {
        dataMapping = createDataMapping(selectedFields, dimension);
        if (Object.keys(dataMapping).length === 0) {
            errors.push('유효한 데이터 매핑을 생성할 수 없습니다');
        }
    } catch (error) {
        errors.push(`데이터 매핑 생성 오류: ${error.message}`);
    }
    
    // 4. 축 조합 검증
    if (Object.keys(dataMapping).length > 0) {
        const axisValidation = validateAxisCombination(dataMapping, fieldTypes);
        if (!axisValidation.isValid) {
            errors.push(...axisValidation.errors);
        }
        
        // 5. 차트 타입 호환성 검증
        const typeValidation = validateChartTypeCompatibility(chartType, dataMapping);
        if (!typeValidation.isValid) {
            errors.push(...typeValidation.errors);
        }
    }
    
    const result = {
        isValid: errors.length === 0,
        errors: errors,
        dataMapping: dataMapping
    };
    
    console.log('[DATA_PROCESSOR] 전체 설정 검증 결과:', result);
    return result;
}