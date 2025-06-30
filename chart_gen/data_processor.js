// chart_gen/data_processor.js
// 데이터 가공, 매핑 및 변환 기능

// ============================================================================
// 필드 분석 및 타입 결정
// ============================================================================

/**
 * 필드 타입 분석 (string/double 구분)
 */
export function analyzeFieldTypes(data) {
    if (!data || data.length === 0) {
        console.warn('[DATA_PROCESSOR] 분석할 데이터가 없습니다');
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
            console.warn(`[DATA_PROCESSOR] 알 수 없는 값 타입: ${typeof value} (${field})`);
            fieldTypes[field] = 'double'; // 기본값
        }
    }
    
    console.log('[DATA_PROCESSOR] 필드 타입 분석:', fieldTypes);
    return fieldTypes;
}

/**
 * 중복값 존재 여부 계산
 */
export function calculateAllowDuplicates(data, fieldName) {
    if (!data || data.length === 0) return false;
    
    const values = data.map(item => item[fieldName]);
    const uniqueValues = [...new Set(values)];
    const hasDuplicates = uniqueValues.length < values.length;
    
    console.log(`[DATA_PROCESSOR] ${fieldName} 중복 분석: ${values.length}개 중 ${uniqueValues.length}개 고유값 → allow_dup: ${hasDuplicates}`);
    return hasDuplicates;
}

// ============================================================================
// 데이터 변환 및 매핑
// ============================================================================

/**
 * C++ 플랫 데이터를 GitHub 코드베이스 형태([[coords], value])로 변환
 */
export function convertToAxisFormat(rawData, axisMapping, valueField) {
    console.log('[DATA_PROCESSOR] 축 형태로 데이터 변환 시작');
    console.log('[DATA_PROCESSOR] 축 매핑:', axisMapping);
    console.log('[DATA_PROCESSOR] Value 필드:', valueField);

    if (!rawData || rawData.length === 0) {
        throw new Error('변환할 데이터가 없습니다');
    }

    // 필드 타입 분석
    const fieldTypes = analyzeFieldTypes(rawData);
    
    // 축 정보 구성
    const axes = [];
    const axisFields = [];

    // 순서대로 축 추가 (x, y, z, w)
    ['x', 'y', 'z', 'w'].forEach(axisName => {
        if (axisMapping[axisName]) {
            const fieldName = axisMapping[axisName];
            
            // 축 메타데이터 생성
            const axisInfo = {
                name: fieldName,
                type: fieldTypes[fieldName] || 'double',
                allow_dup: calculateAllowDuplicates(rawData, fieldName)
            };
            
            axes.push(axisInfo);
            axisFields.push(fieldName);
        }
    });

    if (axes.length === 0) {
        throw new Error('최소 하나의 축이 필요합니다');
    }

    // Value 필드 타입 확인
    const valueType = fieldTypes[valueField] || 'double';

    // 메타데이터 생성 (GitHub 코드베이스 호환)
    const basicData = {
        dim: axes.length,
        axes: axes,
        value_type: valueType
    };

    // 데이터 변환: [[coords], value] 형태로
    const dataValue = rawData.map((row, index) => {
        try {
            // 좌표 배열 생성
            const coords = axisFields.map(field => {
                const value = row[field];
                if (value === undefined || value === null) {
                    console.warn(`[DATA_PROCESSOR] 레코드 ${index}의 ${field} 값이 없습니다`);
                    return 0; // 기본값
                }
                return value;
            });

            // Value 추출
            const value = row[valueField];
            if (value === undefined || value === null) {
                console.warn(`[DATA_PROCESSOR] 레코드 ${index}의 value 필드 ${valueField} 값이 없습니다`);
                return [coords, 0]; // 기본값
            }

            return [coords, value];
            
        } catch (error) {
            console.error(`[DATA_PROCESSOR] 레코드 ${index} 변환 오류:`, error);
            // 에러가 발생한 경우 기본값으로 처리
            const coords = axisFields.map(() => 0);
            return [coords, 0];
        }
    });

    const result = {
        basic_data: basicData,
        data_value: dataValue
    };

    console.log('[DATA_PROCESSOR] 변환 완료');
    console.log('[DATA_PROCESSOR] 메타데이터:', basicData);
    console.log('[DATA_PROCESSOR] 데이터 포인트 수:', dataValue.length);
    
    // 샘플 데이터 출력
    if (dataValue.length > 0) {
        console.log('[DATA_PROCESSOR] 첫 번째 변환된 포인트:', dataValue[0]);
        if (dataValue.length > 1) {
            console.log('[DATA_PROCESSOR] 마지막 변환된 포인트:', dataValue[dataValue.length - 1]);
        }
    }

    return result;
}

// ============================================================================
// 차트 타입 관리
// ============================================================================

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
            { value: 'color', label: 'Color Chart', description: 'X축 + 색상 인코딩' }
        ],
        3: [
            { value: 'scatter_size', label: 'Scatter + Size', description: 'X-Y 산점도 + 크기 인코딩' },
            { value: 'scatter_color', label: 'Scatter + Color', description: 'X-Y 산점도 + 색상 인코딩' },
            { value: 'size_color', label: 'Size + Color', description: 'X축 + 크기 + 색상 인코딩' }
        ],
        4: [
            { value: 'scatter_size_color', label: 'Scatter + Size + Color', description: 'X-Y 산점도 + 크기 + 색상 인코딩' }
        ]
    };

    return chartTypes[dimension] || [];
}

// ============================================================================
// 유효성 검증
// ============================================================================

/**
 * 축 타입 제한 검증
 */
export function validateAxisAssignment(axisMapping, fieldTypes) {
    const errors = [];

    // X축 검증 (모든 타입 허용)
    if (!axisMapping.x) {
        errors.push('X축은 필수입니다');
    }

    // Y축, Z축, W축 검증 (숫자만 허용)
    ['y', 'z', 'w'].forEach(axis => {
        if (axisMapping[axis]) {
            const fieldName = axisMapping[axis];
            const fieldType = fieldTypes[fieldName];
            
            if (fieldType === 'string') {
                errors.push(`${axis.toUpperCase()}축에는 숫자 필드만 사용할 수 있습니다 (현재: ${fieldName}은 문자열)`);
            }
        }
    });

    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

/**
 * 데이터 무결성 검증
 */
export function validateDataIntegrity(rawData, axisMapping, valueField) {
    if (!rawData || rawData.length === 0) {
        return { isValid: false, error: '데이터가 없습니다' };
    }

    const sampleRow = rawData[0];
    const requiredFields = [...Object.values(axisMapping), valueField];
    
    // 필수 필드 존재 여부 확인
    const missingFields = requiredFields.filter(field => !(field in sampleRow));
    if (missingFields.length > 0) {
        return { 
            isValid: false, 
            error: `필수 필드가 없습니다: ${missingFields.join(', ')}` 
        };
    }

    // 데이터 타입 일관성 확인
    const fieldTypes = analyzeFieldTypes(rawData);
    for (const field of requiredFields) {
        const expectedType = fieldTypes[field];
        let inconsistentCount = 0;
        
        for (const row of rawData.slice(0, Math.min(100, rawData.length))) { // 최대 100개 샘플 확인
            const actualType = typeof row[field];
            const expectedJSType = expectedType === 'string' ? 'string' : 'number';
            
            if (actualType !== expectedJSType) {
                inconsistentCount++;
            }
        }
        
        if (inconsistentCount > 0) {
            console.warn(`[DATA_PROCESSOR] ${field} 필드의 타입이 일관되지 않습니다 (${inconsistentCount}개 불일치)`);
        }
    }

    return { isValid: true };
}

// ============================================================================
// 기존 GitHub 코드와의 호환성
// ============================================================================

/**
 * 윈도우 필터링 적용 (기존 GitHub 코드 호환)
 */
function applyWindowFiltering(data, windowRanges) {
    console.log(`🪟 윈도우 필터링 적용:`, windowRanges);
    
    const filteredData = data.filter(dataPoint => {
        for (const axisName in windowRanges) {
            const range = windowRanges[axisName];
            const value = dataPoint[axisName];

            if (value !== undefined && value !== null && !isNaN(value)) {
                if (value < range.min || value > range.max) {
                    return false; // 범위 밖 포인트 필터링
                }
            }
        }
        return true; // 모든 범위 내 포인트 유지
    });
    
    // 필터링 결과 로깅
    Object.entries(windowRanges).forEach(([axisName, range]) => {
        const originalValues = data.map(d => d[axisName]).filter(v => v !== undefined && v !== null && !isNaN(v));
        const filteredValues = filteredData.map(d => d[axisName]).filter(v => v !== undefined && v !== null && !isNaN(v));
        console.log(`🪟 윈도우 ${axisName}: [${range.min}, ${range.max}] → ${originalValues.length} → ${filteredValues.length} 포인트`);
    });
    
    return filteredData;
}

/**
 * 최종 데이터 생성 (윈도우 필터링 포함)
 */
export function makefinaldata(preparedData, windowRanges = {}, showError = null) {
    var finalData = preparedData;
    if (Object.keys(windowRanges).length > 0) {
        finalData = applyWindowFiltering(preparedData, windowRanges);
        console.log(`🪟 윈도우 적용: ${preparedData.length} → ${finalData.length} 포인트`);
        
        if (finalData.length === 0) {
            if (showError) {
                showError('윈도우 범위 적용 후 데이터 포인트가 남지 않습니다. 범위를 조정해주세요.');
            }
            return [];
        }
    }
    return finalData;
}

/**
 * 축 설정 생성 (기존 GitHub 코드 호환)
 */
export function createAxisConfig(axisName, generatedData) {
    if (axisName === 'value') {
        return {
            name: axisName,
            type: 'output',
            index: 0
        };
    } else {
        const axisIndex = findAxisIndex(axisName, generatedData);
        if (axisIndex === -1) {
            return null; // 유효하지 않은 축
        }
        return {
            name: axisName,
            type: 'input',
            index: axisIndex
        };
    }
}

/**
 * 축 인덱스 찾기 (기존 GitHub 코드 호환)
 */
function findAxisIndex(axisName, generatedData) {
    if (!generatedData || !generatedData.basic_data || !generatedData.basic_data.axes) {
        return -1;
    }
    
    const axis = generatedData.basic_data.axes.find(a => a.name === axisName);
    return axis ? generatedData.basic_data.axes.indexOf(axis) : -1;
}

/**
 * 차트용 데이터 준비 (기존 GitHub 코드 호환)
 */
export function prepareDataForChart(dataValue, axes) {
    const preparedData = [];
    
    dataValue.forEach((point, index) => {
        try {
            const coords = point[0];
            const value = point[1];
            
            const dataPoint = {
                _originalIndex: index,
                _coords: coords,
                _value: value,
                _fullData: `Point ${index}: coords=${JSON.stringify(coords)}, value=${value}`
            };
            
            // 각 축에 대한 데이터 추출
            let isValidPoint = true;
            
            axes.forEach((axis, axisIndex) => {
                let extractedValue = null;
                
                if (coords && Array.isArray(coords) && coords.length > axisIndex) {
                    extractedValue = coords[axisIndex];
                } else {
                    console.warn(`[DATA_PROCESSOR] 레코드 ${index}의 축 ${axis.name} 값이 없습니다`);
                    isValidPoint = false;
                }
                
                if (extractedValue !== null && extractedValue !== undefined) {
                    dataPoint[axis.name] = extractedValue;
                } else {
                    isValidPoint = false;
                }
            });
            
            if (isValidPoint) {
                preparedData.push(dataPoint);
            }
            
        } catch (error) {
            console.warn(`[DATA_PROCESSOR] 포인트 ${index} 처리 오류:`, error);
        }
    });
    
    console.log('[DATA_PROCESSOR] 차트용 데이터 준비 완료:', preparedData.length, '개 포인트');
    return preparedData;
}