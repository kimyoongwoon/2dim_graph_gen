// ============================================================================
// data_pipeline/data_validator/analyze_data_field_types.js
// ============================================================================

/**
 * 데이터의 필드 타입 분석
 * @param {Array<Object>} rawData - 분석할 원시 데이터
 * @returns {Object} { [fieldName]: 'string' | 'double' }
 * @throws {Error} 데이터가 없거나 유효하지 않을 때
 */
export default function analyzeDataFieldTypes(rawData) {
    console.log('[DATA_VALIDATOR] 필드 타입 분석 시작');
    
    // 입력 검증
    if (!rawData || !Array.isArray(rawData)) {
        throw new Error('분석할 rawData 배열이 필요합니다');
    }
    
    if (rawData.length === 0) {
        throw new Error('분석할 데이터가 비어있습니다');
    }

    try {
        // 첫 번째 레코드 검사
        const firstRecord = rawData[0];
        if (!firstRecord || typeof firstRecord !== 'object') {
            throw new Error('첫 번째 데이터 레코드가 객체가 아닙니다');
        }

        const fieldTypes = {};
        const fieldNames = Object.keys(firstRecord);
        
        if (fieldNames.length === 0) {
            throw new Error('데이터 레코드에 필드가 없습니다');
        }

        console.log('[DATA_VALIDATOR] 분석 대상 필드:', fieldNames);

        // 각 필드별 타입 분석
        for (const fieldName of fieldNames) {
            const typeAnalysis = analyzeFieldType(rawData, fieldName);
            fieldTypes[fieldName] = typeAnalysis.finalType;
            
            console.log(`[DATA_VALIDATOR] 필드 '${fieldName}': ${typeAnalysis.finalType} (${typeAnalysis.confidence})`);
        }

        console.log('[DATA_VALIDATOR] 필드 타입 분석 완료:', fieldTypes);
        return fieldTypes;

    } catch (error) {
        console.error('[DATA_VALIDATOR] 필드 타입 분석 중 오류:', error);
        throw new Error(`필드 타입 분석 실패: ${error.message}`);
    }
}

/**
 * 개별 필드의 타입을 분석하는 내부 함수
 * @param {Array<Object>} data - 데이터 배열
 * @param {string} fieldName - 분석할 필드명
 * @returns {Object} { finalType: string, confidence: string, details: Object }
 */
function analyzeFieldType(data, fieldName) {
    const typeCounts = {
        'string': 0,
        'number': 0,
        'boolean': 0,
        'object': 0,
        'undefined': 0,
        'null': 0
    };
    
    let totalValues = 0;
    let nonNullValues = 0;
    
    // 샘플링 (최대 1000개까지만 분석)
    const sampleSize = Math.min(data.length, 1000);
    
    for (let i = 0; i < sampleSize; i++) {
        const record = data[i];
        totalValues++;
        
        if (record && typeof record === 'object' && fieldName in record) {
            const value = record[fieldName];
            
            if (value === null) {
                typeCounts.null++;
            } else if (value === undefined) {
                typeCounts.undefined++;
            } else {
                nonNullValues++;
                const valueType = typeof value;
                if (valueType in typeCounts) {
                    typeCounts[valueType]++;
                } else {
                    typeCounts.object++; // 기타 타입들
                }
            }
        } else {
            typeCounts.undefined++;
        }
    }
    
    // 타입 결정 로직
    let finalType;
    let confidence;
    
    const stringRatio = typeCounts.string / totalValues;
    const numberRatio = typeCounts.number / totalValues;
    const nullRatio = (typeCounts.null + typeCounts.undefined) / totalValues;
    
    if (nonNullValues === 0) {
        // 모든 값이 null/undefined
        finalType = 'double'; // 기본값
        confidence = '기본값 (모든 값이 null/undefined)';
    } else if (numberRatio > 0.8) {
        // 80% 이상이 숫자
        finalType = 'double';
        confidence = `높음 (${(numberRatio * 100).toFixed(1)}% 숫자)`;
    } else if (stringRatio > 0.8) {
        // 80% 이상이 문자열
        finalType = 'string';
        confidence = `높음 (${(stringRatio * 100).toFixed(1)}% 문자열)`;
    } else if (numberRatio > stringRatio) {
        // 숫자가 더 많음
        finalType = 'double';
        confidence = `중간 (${(numberRatio * 100).toFixed(1)}% 숫자 vs ${(stringRatio * 100).toFixed(1)}% 문자열)`;
    } else if (stringRatio > numberRatio) {
        // 문자열이 더 많음
        finalType = 'string';
        confidence = `중간 (${(stringRatio * 100).toFixed(1)}% 문자열 vs ${(numberRatio * 100).toFixed(1)}% 숫자)`;
    } else {
        // 비슷하거나 기타 경우
        finalType = 'double'; // 기본값
        confidence = `낮음 (혼재 타입, 기본값 사용)`;
    }
    
    // 경고 출력
    if (nullRatio > 0.3) {
        console.warn(`[DATA_VALIDATOR] 필드 '${fieldName}'의 ${(nullRatio * 100).toFixed(1)}%가 null/undefined입니다`);
    }
    
    if (typeCounts.object > 0 || typeCounts.boolean > 0) {
        console.warn(`[DATA_VALIDATOR] 필드 '${fieldName}'에 예상치 못한 타입이 포함되어 있습니다:`, {
            object: typeCounts.object,
            boolean: typeCounts.boolean
        });
    }
    
    return {
        finalType,
        confidence,
        details: {
            sampleSize,
            typeCounts,
            ratios: {
                string: stringRatio,
                number: numberRatio,
                null: nullRatio
            }
        }
    };
}