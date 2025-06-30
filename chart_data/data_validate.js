// ============================================================================
// chart_data/data_validate.js - 데이터 분석, 검증, 가능성 판단
// ============================================================================

// ============================================================================
// 데이터 분석 함수들 (chart_gen/data_processor.js에서 이동)
// ============================================================================

/**
 * 필드 타입 분석 (string/double 구분)
 */
export function analyzeFieldTypes(data) {
    if (!data || data.length === 0) {
        console.warn('[DATA_VALIDATE] 분석할 데이터가 없습니다');
        return {};
    }
    
    const sample = data[0];
    const fieldTypes = {};
    
    for (const [field, value] of Object.entries(sample)) {
        if (typeof value === 'number') {
            fieldTypes[field] = 'double';
        } else if (typeof value === 'string') {
            fieldTypes[field] = 'string';
        } else {
            console.warn(`[DATA_VALIDATE] 알 수 없는 값 타입: ${typeof value} (${field})`);
            fieldTypes[field] = 'double'; // 기본값
        }
    }
    
    console.log('[DATA_VALIDATE] 필드 타입 분석:', fieldTypes);
    return fieldTypes;
}

/**
 * 차원수에 따른 사용 가능한 차트 타입 반환
 */
export function getAvailableChartTypes(dimension) {
    const chartTypes = {
        1: [
            { value: 'line1d', label: '1D Line Chart', description: '선형 차트' },
            { value: 'category', label: 'Category Chart', description: '카테고리 차트' }
        ],
        2: [
            { value: 'scatter', label: 'Scatter Plot', description: 'X-Y 산점도' },
            { value: 'size', label: 'Size Chart', description: 'X축 + 크기 인코딩' },
            { value: 'color', label: 'Color Chart', description: 'X축 + 색상 인코딩' },
            { value: 'bar', label: 'Bar Chart', description: '카테고리별 막대 차트' },
            { value: 'bar_size', label: 'Bar Size Chart', description: '카테고리별 버블 크기' },
            { value: 'bar_color', label: 'Bar Color Chart', description: '카테고리별 색상 차트' }
        ],
        3: [
            { value: 'scatter_size', label: 'Scatter + Size', description: 'X-Y 산점도 + 크기 인코딩' },
            { value: 'scatter_color', label: 'Scatter + Color', description: 'X-Y 산점도 + 색상 인코딩' },
            { value: 'size_color', label: 'Size + Color', description: 'X축 + 크기 + 색상 인코딩' },
            { value: 'grouped_bar', label: 'Grouped Bar Chart', description: '그룹별 막대 차트' },
            { value: 'grouped_bar_size', label: 'Grouped Bar + Size', description: '그룹별 크기 차트' },
            { value: 'grouped_bar_color', label: 'Grouped Bar + Color', description: '그룹별 색상 차트' }
        ],
        4: [
            { value: 'scatter_size_color', label: 'Scatter + Size + Color', description: 'X-Y 산점도 + 크기 + 색상 인코딩' },
            { value: 'grouped_scatter_size_color', label: 'Grouped Scatter + Size + Color', description: '그룹별 4차원 산점도' }
        ]
    };

    console.log(`[DATA_VALIDATE] ${dimension}차원 차트 타입 조회:`, chartTypes[dimension] || []);
    return chartTypes[dimension] || [];
}

/**
 * 데이터로부터 사용 가능한 최대 차원수 계산
 */
export function calculateAvailableDimensions(data) {
    if (!data || data.length === 0) {
        console.warn('[DATA_VALIDATE] 차원 계산: 데이터가 없습니다');
        return 0;
    }
    
    const fieldCount = Object.keys(data[0] || {}).length;
    const maxDimensions = Math.min(fieldCount, 4); // 최대 4차원
    
    console.log(`[DATA_VALIDATE] 사용 가능한 차원: ${maxDimensions} (필드 수: ${fieldCount})`);
    return maxDimensions;
}

// ============================================================================
// 필드 제약 및 검증 함수들 (graph_complete.js에서 추출)
// ============================================================================

/**
 * 선택된 필드들의 타입 제약 조건 검증
 */
export function validateFieldConstraints(selectedFields, fieldTypes, dimension) {
    const errors = [];
    
    console.log(`[DATA_VALIDATE] 필드 제약 검증:`, { selectedFields, fieldTypes, dimension });
    
    // X축: 모든 타입 허용
    if (!selectedFields[0]) {
        errors.push('X축은 필수입니다');
    }
    
    // Y,Z,W축: 숫자만 허용
    for (let i = 1; i < dimension; i++) {
        const field = selectedFields[i];
        if (field && fieldTypes[field] === 'string') {
            const axisName = ['X', 'Y', 'Z', 'W'][i];
            errors.push(`${axisName}축에는 숫자 필드만 사용할 수 있습니다 (현재: ${field}은 문자열)`);
        }
    }
    
    const result = { isValid: errors.length === 0, errors };
    console.log(`[DATA_VALIDATE] 필드 제약 검증 결과:`, result);
    
    return result;
}

/**
 * 차원과 인덱스에 따른 필드 설명 반환
 */
export function getFieldDescription(index, dimension) {
    const descriptions = {
        1: ['데이터 값'],
        2: ['X축 (모든 타입)', 'Y축 (숫자만)'],
        3: ['X축 (모든 타입)', 'Y축 (숫자만)', '크기/색상 (숫자만)'],
        4: ['X축 (모든 타입)', 'Y축 (숫자만)', '크기 (숫자만)', '색상 (숫자만)']
    };
    
    const dimDescriptions = descriptions[dimension] || [];
    return dimDescriptions[index] || '알 수 없음';
}

/**
 * 폼 완성도 검사
 */
export function checkFormCompleteness(dimension, chartType, selectedFields) {
    console.log(`[DATA_VALIDATE] 폼 완성도 검사:`, { dimension, chartType, selectedFields });
    
    if (!dimension || !chartType) {
        console.log('[DATA_VALIDATE] 차원수 또는 차트 타입이 선택되지 않음');
        return false;
    }
    
    for (let i = 0; i < dimension; i++) {
        if (!selectedFields[i] || selectedFields[i].trim() === '') {
            console.log(`[DATA_VALIDATE] 필드 ${i + 1}이 선택되지 않음`);
            return false;
        }
    }
    
    console.log('[DATA_VALIDATE] 폼 완성도: 통과');
    return true;
}

// ============================================================================
// 기존 검증 함수들 (chart_gen/data_validate.js에서 이동)
// ============================================================================

/**
 * 기본 입력값 유효성 검사
 */
export function validateBasicInputs(chartType, xAxisName) {
    if (!chartType) {
        return { isValid: false, error: 'Please enter a chart type' };
    }
    
    if (!xAxisName) {
        return { isValid: false, error: 'Please enter X axis name' };
    }
    
    return { isValid: true };
}

/**
 * Y축 필요 여부 및 입력값 검사
 */
export function validateYAxisRequirement(chartType, dimension, yAxisName) {
    const needsYAxis = chartType === 'scatter' || 
                       chartType.includes('scatter') || 
                       chartType === 'bar' || 
                       chartType.includes('bar');
    
    // For charts that need Y axis, require it for 2D+
    if (parseInt(dimension) >= 2 && needsYAxis && !yAxisName) {
        return { 
            isValid: false, 
            error: `Please enter Y axis name for ${chartType} charts`,
            needsYAxis 
        };
    }
    
    return { isValid: true, needsYAxis };
}

/**
 * 사이즈 스케일링 설정 검증
 */
export function validateSizeScaling(sizeScalingType, sizeScalingK) {
    let scalingConfig = { type: 'default', params: {} };
    
    if (sizeScalingType) {
        // Validate scaling type (case sensitive)
        if (sizeScalingType !== 'default' && sizeScalingType !== 'sigmoid') {
            return { 
                isValid: false, 
                error: 'Size Scaling Type must be exactly "default" or "sigmoid"' 
            };
        }
        
        if (sizeScalingType === 'sigmoid') {
            // Require K value for sigmoid
            if (!sizeScalingK) {
                return { 
                    isValid: false, 
                    error: 'K Value is required when using sigmoid scaling' 
                };
            }
            
            // Validate K value is a number between 0.1 and 10.0
            const kValue = parseFloat(sizeScalingK);
            if (isNaN(kValue) || kValue < 0.1 || kValue > 10.0) {
                return { 
                    isValid: false, 
                    error: 'K Value must be a number between 0.1 and 10.0' 
                };
            }
            
            scalingConfig = {
                type: 'sigmoid',
                params: { k: kValue }
            };
        } else {
            // For default scaling, ignore K value completely
            scalingConfig = {
                type: 'default',
                params: {}
            };
        }
    }
    
    return { isValid: true, scalingConfig };
}

/**
 * 윈도우 범위 검증
 */
export function validateWindowRanges(xAxisName, yAxisName, xRangeMin, xRangeMax, yRangeMin, yRangeMax, needsYAxis) {
    const windowRanges = {};
    
    // Validate X axis range if provided
    if (xRangeMin || xRangeMax) {
        if (!xRangeMin || !xRangeMax) {
            return { 
                isValid: false, 
                error: 'Both X Axis Range Min and Max must be provided if using X axis windowing' 
            };
        }
        const xMin = parseFloat(xRangeMin);
        const xMax = parseFloat(xRangeMax);
        if (isNaN(xMin) || isNaN(xMax) || xMin >= xMax) {
            return { 
                isValid: false, 
                error: 'X Axis Range Min must be less than Max and both must be valid numbers' 
            };
        }
        windowRanges[xAxisName] = { min: xMin, max: xMax };
    }
    
    // Validate Y axis range if provided and Y axis is used
    if (yRangeMin || yRangeMax) {
        if (!needsYAxis) {
            // Ignore Y range for charts that don't use Y axis
            console.log('Ignoring Y axis range for chart type that does not use Y axis');
        } else {
            if (!yRangeMin || !yRangeMax) {
                return { 
                    isValid: false, 
                    error: 'Both Y Axis Range Min and Max must be provided if using Y axis windowing' 
                };
            }
            const yMin = parseFloat(yRangeMin);
            const yMax = parseFloat(yRangeMax);
            if (isNaN(yMin) || isNaN(yMax) || yMin >= yMax) {
                return { 
                    isValid: false, 
                    error: 'Y Axis Range Min must be less than Max and both must be valid numbers' 
                };
            }
            windowRanges[yAxisName] = { min: yMin, max: yMax };
        }
    }
    
    return { isValid: true, windowRanges };
}

/**
 * 축 설정 검증 및 생성 (기존 GitHub 호환성을 위해 유지)
 */
export function validateAndCreateAxes(chartType, dimension, xAxisName, yAxisName, colorAxisName, sizeAxisName, generatedData, createAxisConfig) {
    const axes = [];
    
    // Always add X axis
    const xAxis = createAxisConfig(xAxisName, generatedData);
    if (!xAxis) {
        return { 
            isValid: false, 
            error: `X axis "${xAxisName}" not found in data` 
        };
    }
    axes.push(xAxis);
    
    // Check if this chart type needs Y axis
    const needsYAxis = chartType === 'scatter' || 
                       chartType.includes('scatter') || 
                       chartType === 'bar' || 
                       chartType.includes('bar');
    
    // Add Y axis only for charts that need it
    if (needsYAxis && yAxisName) {
        const yAxis = createAxisConfig(yAxisName, generatedData);
        if (!yAxis) {
            return { 
                isValid: false, 
                error: `Y axis "${yAxisName}" not found in data` 
            };
        }
        axes.push(yAxis);
    }
    
    // Add 3rd and 4th axes based on chart type
    if (parseInt(dimension) >= 2) {
        // Determine which axes are needed based on chart type
        const needsColor = chartType.includes('color') || chartType === 'size_color' || chartType === 'color';
        const needsSize = chartType.includes('size') || chartType === 'size_color' || chartType === 'size';
        
        // For charts that need color
        if (needsColor && colorAxisName) {
            const colorAxis = createAxisConfig(colorAxisName, generatedData);
            if (!colorAxis) {
                return { 
                    isValid: false, 
                    error: `Color axis "${colorAxisName}" not found in data` 
                };
            }
            axes.push(colorAxis);
        }
        
        // For charts that need size
        if (needsSize && sizeAxisName) {
            const sizeAxis = createAxisConfig(sizeAxisName, generatedData);
            if (!sizeAxis) {
                return { 
                    isValid: false, 
                    error: `Size axis "${sizeAxisName}" not found in data` 
                };
            }
            axes.push(sizeAxis);
        }
    }
    
    return { isValid: true, axes };
}

/**
 * 전체 입력값 검증 - 모든 검증을 한번에 수행
 */
export function validateAllInputs(formData, generatedData, createAxisConfig) {
    const {
        dimension, chartType, xAxisName, yAxisName, colorAxisName, sizeAxisName,
        sizeScalingType, sizeScalingK, xRangeMin, xRangeMax, yRangeMin, yRangeMax
    } = formData;
    
    console.log('[DATA_VALIDATE] 전체 입력값 검증 시작:', formData);
    
    // 1. 기본 입력값 검증
    const basicValidation = validateBasicInputs(chartType, xAxisName);
    if (!basicValidation.isValid) {
        return basicValidation;
    }
    
    // 2. Y축 필요 여부 검증
    const yAxisValidation = validateYAxisRequirement(chartType, dimension, yAxisName);
    if (!yAxisValidation.isValid) {
        return yAxisValidation;
    }
    
    // 3. 사이즈 스케일링 검증
    const sizeScalingValidation = validateSizeScaling(sizeScalingType, sizeScalingK);
    if (!sizeScalingValidation.isValid) {
        return sizeScalingValidation;
    }
    
    // 4. 윈도우 범위 검증
    const windowValidation = validateWindowRanges(
        xAxisName, yAxisName, xRangeMin, xRangeMax, 
        yRangeMin, yRangeMax, yAxisValidation.needsYAxis
    );
    if (!windowValidation.isValid) {
        return windowValidation;
    }
    
    // 5. 축 설정 검증
    const axesValidation = validateAndCreateAxes(
        chartType, dimension, xAxisName, yAxisName, 
        colorAxisName, sizeAxisName, generatedData, createAxisConfig
    );
    if (!axesValidation.isValid) {
        return axesValidation;
    }
    
    console.log('[DATA_VALIDATE] 전체 검증 통과');
    
    return {
        isValid: true,
        validatedData: {
            axes: axesValidation.axes,
            scalingConfig: sizeScalingValidation.scalingConfig,
            windowRanges: windowValidation.windowRanges,
            needsYAxis: yAxisValidation.needsYAxis
        }
    };
}