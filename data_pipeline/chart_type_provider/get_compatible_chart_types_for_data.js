// ============================================================================
// data_pipeline/chart_type_provider/get_compatible_chart_types_for_data.js
// ============================================================================

/**
 * rawData와 차원수로 호환 가능한 차트 타입 반환
 * @param {Array<Object>} rawData - 원시 데이터
 * @param {number} dimension - 선택된 차원수 (1-4)
 * @returns {Array<Object>} chartTypes - [{ value: string, label: string, description: string }]
 * @throws {Error} 지원하지 않는 차원수이거나 데이터가 유효하지 않을 때
 */
export default function getCompatibleChartTypesForData(rawData, dimension) {
    console.log(`[CHART_TYPE_PROVIDER] ${dimension}차원 호환 차트 타입 조회 시작`);
    
    // 입력 검증
    if (!rawData || !Array.isArray(rawData)) {
        throw new Error('차트 타입 조회를 위한 rawData 배열이 필요합니다');
    }
    
    if (rawData.length === 0) {
        throw new Error('차트 타입 조회를 위한 데이터가 비어있습니다');
    }
    
    if (!dimension || typeof dimension !== 'number' || dimension < 1 || dimension > 4) {
        throw new Error(`지원하지 않는 차원수입니다: ${dimension} (1-4 사이여야 함)`);
    }

    try {
        // 데이터 타입 분석
        const dataTypeAnalysis = analyzeDataTypes(rawData);
        console.log('[CHART_TYPE_PROVIDER] 데이터 타입 분석:', dataTypeAnalysis);

        // 차원별 기본 차트 타입 정의
        const baseChartTypes = getBaseChartTypesByDimension(dimension);
        
        // 데이터 특성에 따른 차트 타입 필터링 및 추천
        const compatibleChartTypes = filterChartTypesByDataCharacteristics(
            baseChartTypes, 
            dataTypeAnalysis, 
            dimension, 
            rawData.length
        );

        console.log(`[CHART_TYPE_PROVIDER] ${dimension}차원 호환 차트 타입 ${compatibleChartTypes.length}개 반환`);
        
        return compatibleChartTypes;

    } catch (error) {
        console.error('[CHART_TYPE_PROVIDER] 차트 타입 조회 중 오류:', error);
        throw new Error(`호환 가능한 차트 타입 조회 실패: ${error.message}`);
    }
}

/**
 * 데이터 타입과 특성을 분석하는 내부 함수
 * @param {Array<Object>} rawData - 원시 데이터
 * @returns {Object} 데이터 타입 분석 결과
 */
function analyzeDataTypes(rawData) {
    const firstRecord = rawData[0];
    const fieldNames = Object.keys(firstRecord);
    
    const fieldTypes = {};
    const fieldCharacteristics = {};
    
    // 각 필드별 타입 및 특성 분석
    fieldNames.forEach(fieldName => {
        const sampleValues = rawData.slice(0, 100).map(record => record[fieldName]);
        const nonNullValues = sampleValues.filter(val => val !== null && val !== undefined && val !== '');
        
        if (nonNullValues.length === 0) {
            fieldTypes[fieldName] = 'double'; // 기본값
            fieldCharacteristics[fieldName] = { uniqueCount: 0, hasNumerics: false, hasStrings: false };
            return;
        }
        
        const typeCount = {};
        nonNullValues.forEach(val => {
            const type = typeof val;
            typeCount[type] = (typeCount[type] || 0) + 1;
        });
        
        // 주요 타입 결정
        const stringCount = typeCount.string || 0;
        const numberCount = typeCount.number || 0;
        
        if (numberCount > stringCount) {
            fieldTypes[fieldName] = 'double';
        } else {
            fieldTypes[fieldName] = 'string';
        }
        
        // 필드 특성 분석
        const uniqueValues = [...new Set(nonNullValues)];
        fieldCharacteristics[fieldName] = {
            uniqueCount: uniqueValues.length,
            hasNumerics: numberCount > 0,
            hasStrings: stringCount > 0,
            categoryCount: fieldTypes[fieldName] === 'string' ? uniqueValues.length : null,
            valueRange: fieldTypes[fieldName] === 'double' ? {
                min: Math.min(...nonNullValues.filter(v => typeof v === 'number')),
                max: Math.max(...nonNullValues.filter(v => typeof v === 'number'))
            } : null
        };
    });
    
    return {
        fieldTypes,
        fieldCharacteristics,
        fieldNames,
        totalFields: fieldNames.length,
        recordCount: rawData.length
    };
}

/**
 * 차원별 기본 차트 타입을 반환하는 내부 함수
 * @param {number} dimension - 차원수
 * @returns {Array<Object>} 기본 차트 타입 배열
 */
function getBaseChartTypesByDimension(dimension) {
    const chartTypeDefinitions = {
        1: [
            { value: 'line1d', label: '1D Line Chart', description: '선형 차트 (숫자 데이터용)' },
            { value: 'category', label: 'Category Chart', description: '카테고리 차트 (문자열 데이터용)' }
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
    
    return chartTypeDefinitions[dimension] || [];
}

/**
 * 데이터 특성에 따라 차트 타입을 필터링하고 추천하는 내부 함수
 * @param {Array<Object>} baseChartTypes - 기본 차트 타입들
 * @param {Object} dataAnalysis - 데이터 분석 결과
 * @param {number} dimension - 차원수
 * @param {number} dataSize - 데이터 크기
 * @returns {Array<Object>} 필터링된 차트 타입들
 */
function filterChartTypesByDataCharacteristics(baseChartTypes, dataAnalysis, dimension, dataSize) {
    const { fieldTypes, fieldCharacteristics } = dataAnalysis;
    const fieldNames = Object.keys(fieldTypes);
    
    return baseChartTypes.map(chartType => {
        let priority = 1; // 기본 우선순위
        let warnings = [];
        let recommendations = [];
        
        // 데이터 크기 기반 추천
        if (dataSize < 10) {
            if (chartType.value.includes('scatter')) {
                warnings.push('데이터가 적어 산점도 효과가 제한적일 수 있습니다');
                priority *= 0.8;
            }
        } else if (dataSize > 10000) {
            if (chartType.value.includes('scatter')) {
                warnings.push('데이터가 많아 렌더링이 느릴 수 있습니다');
                priority *= 0.9;
            }
        }
        
        // 1차원 특별 처리
        if (dimension === 1) {
            const hasStringFields = fieldNames.some(field => fieldTypes[field] === 'string');
            const hasNumericFields = fieldNames.some(field => fieldTypes[field] === 'double');
            
            if (chartType.value === 'category' && hasStringFields) {
                recommendations.push('문자열 데이터에 적합합니다');
                priority *= 1.2;
            } else if (chartType.value === 'line1d' && hasNumericFields) {
                recommendations.push('숫자 데이터에 적합합니다');
                priority *= 1.2;
            }
        }
        
        // 2차원 이상에서 타입별 추천
        if (dimension >= 2) {
            const hasStringFields = fieldNames.some(field => fieldTypes[field] === 'string');
            const numericFieldCount = fieldNames.filter(field => fieldTypes[field] === 'double').length;
            
            if (chartType.value.includes('bar') || chartType.value.includes('grouped')) {
                if (hasStringFields) {
                    recommendations.push('문자열 그룹핑에 적합합니다');
                    priority *= 1.1;
                } else {
                    warnings.push('모든 필드가 숫자입니다. 산점도를 고려해보세요');
                    priority *= 0.9;
                }
            }
            
            if (chartType.value.includes('scatter')) {
                if (numericFieldCount >= 2) {
                    recommendations.push('숫자 데이터 관계 분석에 적합합니다');
                    priority *= 1.1;
                } else {
                    warnings.push('숫자 필드가 부족할 수 있습니다');
                    priority *= 0.8;
                }
            }
        }
        
        // 고차원에서 인코딩 필드 검증
        if (dimension >= 3) {
            if (chartType.value.includes('size') || chartType.value.includes('color')) {
                const numericFields = fieldNames.filter(field => fieldTypes[field] === 'double');
                if (numericFields.length >= dimension - 1) {
                    recommendations.push('충분한 숫자 필드로 다차원 시각화 가능');
                    priority *= 1.1;
                } else {
                    warnings.push('크기/색상 인코딩을 위한 숫자 필드가 부족할 수 있습니다');
                    priority *= 0.7;
                }
            }
        }
        
        return {
            ...chartType,
            priority: Math.round(priority * 100) / 100,
            warnings,
            recommendations,
            dataCompatibility: {
                dataSize: dataSize,
                numericFields: fieldNames.filter(field => fieldTypes[field] === 'double').length,
                stringFields: fieldNames.filter(field => fieldTypes[field] === 'string').length
            }
        };
    }).sort((a, b) => b.priority - a.priority); // 우선순위별 정렬
}