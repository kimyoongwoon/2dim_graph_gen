// ============================================================================
// 3dim_chart_gen/unified/data_processor.js - 통합 데이터 변환 (2D/3D/4D 지원)
// ============================================================================

/**
 * 원시 데이터를 차트용으로 변환하는 통합 함수 (2D/3D/4D 지원)
 * @param {Array} rawData - 원시 데이터 배열
 * @param {Object} dataMapping - 데이터 매핑 {x: 'field1', y: 'field2', ...}
 * @param {string} chartType - 차트 타입 (16개 제한 판단용)
 * @returns {Object} 변환된 데이터와 메타정보
 */
export function processDataForChart(rawData, dataMapping, chartType) {
    console.log('[DATA_PROCESSOR] 통합 데이터 변환 시작');
    console.log('[DATA_PROCESSOR] 원시 데이터:', rawData?.length, '개');
    console.log('[DATA_PROCESSOR] 매핑:', dataMapping);
    console.log('[DATA_PROCESSOR] 차트 타입:', chartType);

    // 입력 검증
    if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
        throw new Error('유효한 데이터가 없습니다');
    }

    if (!dataMapping || typeof dataMapping !== 'object') {
        throw new Error('데이터 매핑이 필요합니다');
    }

    // 차원 자동 감지
    const mappedFields = Object.keys(dataMapping);
    const dimensions = mappedFields.length;
    console.log('[DATA_PROCESSOR] 감지된 차원:', dimensions, '(필드:', mappedFields.join(', '), ')');

    // 차원별 최소 요구사항 검증
    if (dimensions < 2) {
        throw new Error('최소 2개 이상의 필드가 매핑되어야 합니다');
    }

    // 필드 타입 분석 (내장 함수 사용)
    const fieldTypes = analyzeDataFieldTypes(rawData);
    console.log('[DATA_PROCESSOR] 필드 타입:', fieldTypes);

    // 매핑 필드명 존재 여부 확인
    const availableFields = Object.keys(fieldTypes);
    console.log('[DATA_PROCESSOR] === 매핑 검증 시작 ===');
    console.log('[DATA_PROCESSOR] dataMapping 객체:', dataMapping);

    const requiredFields = Object.values(dataMapping);
    const missingFields = requiredFields.filter(field => {
        const exists = availableFields.includes(field);
        console.log(`[DATA_PROCESSOR] 필드 존재 확인: "${field}" → ${exists}`);
        return !exists;
    });

    if (missingFields.length > 0) {
        throw new Error(`매핑된 필드가 데이터에 없습니다: ${missingFields.join(', ')}`);
    }

    console.log('[DATA_PROCESSOR] === 매핑 검증 완료 ===');

    // 🔥 조건부 데이터 제한: 3d_surface_scatter만 16개 제한
    let processedRawData = rawData;
    let isLimited = false;
    
    if (chartType === '3d_surface_scatter') {
        processedRawData = rawData.slice(0, 16);
        isLimited = rawData.length > 16;
        console.log(`[DATA_PROCESSOR] ⚠️ 3D Surface 최적화: ${rawData.length}개 → ${processedRawData.length}개로 제한`);
    } else {
        console.log(`[DATA_PROCESSOR] ✅ 데이터 제한 없음 (${chartType}): ${rawData.length}개 유지`);
    }

    // 축 정보 생성 (필드 순서대로)
    const axes = [];
    Object.entries(dataMapping).forEach(([axisType, fieldName]) => {
        if (fieldName) {
            axes.push({
                name: fieldName,
                type: fieldTypes[fieldName] || 'double',
                role: axisType, // x, y, size, color 등
                allow_dup: calculateAllowDuplicates(processedRawData, fieldName)
            });
        }
    });

    // 메타데이터 생성
    const metadata = {
        dim: dimensions,
        axes: axes,
        dataMapping: dataMapping,
        fieldTypes: fieldTypes,
        recordCount: processedRawData.length,
        originalCount: rawData.length,
        isLimited: isLimited,
        chartType: chartType
    };

    // ✅ 차트용 데이터 변환 (모든 차원 지원)
    console.log('[DATA_PROCESSOR] === 데이터 변환 시작 ===');

    const chartData = processedRawData.map((row, index) => {
        const dataPoint = {
            _originalIndex: index,
            _fullData: row  // 🔥 원본 객체 직접 참조 (툴팁용)
        };

        // 매핑된 필드들을 축 이름으로 복사
        Object.entries(dataMapping).forEach(([axisType, fieldName]) => {
            if (fieldName && row[fieldName] !== undefined) {
                dataPoint[fieldName] = row[fieldName];
                // 추가로 역할별 별칭도 생성 (차트에서 쉽게 접근)
                dataPoint[axisType] = row[fieldName];
            }
        });

        return dataPoint;
    });

    console.log('[DATA_PROCESSOR] === 데이터 변환 완료 ===');

    const result = {
        data: chartData,
        metadata: metadata,
        originalData: processedRawData
    };

    console.log('[DATA_PROCESSOR] 변환 완료:', chartData.length, '개 포인트');
    console.log('[DATA_PROCESSOR] 첫 번째 변환된 포인트 샘플:', chartData[0]);
    
    // 제한 경고 출력
    if (metadata.isLimited) {
        console.warn(`[DATA_PROCESSOR] ⚠️ 성능상 처음 16개 데이터만 사용됨 (전체 ${metadata.originalCount}개)`);
    }

    return result;
}

/**
 * 🔥 통합 툴팁 데이터 생성 (모든 차트 공통)
 * rawData 전체를 구조화된 형태로 표시
 * @param {Object} dataPoint - 데이터 포인트 (변환된 데이터)
 * @param {Object} usedAxes - 사용된 축 정보 (선택적)
 * @returns {string} 구조화된 툴팁 HTML
 */
export function createTooltipData(dataPoint, usedAxes = {}) {
    console.log('[DATA_PROCESSOR] 툴팁 데이터 생성');
    
    // 원본 데이터 접근
    const original = dataPoint._fullData;
    if (!original || typeof original !== 'object') {
        return '데이터 없음';
    }
    
    const entries = Object.entries(original);
    const usedFields = [];
    const otherFields = [];
    
    // 사용된 축과 기타 필드 분리
    entries.forEach(([key, value]) => {
        if (usedAxes[key]) {
            usedFields.push(`${key}: ${value} ⭐ (${usedAxes[key]})`);
        } else {
            otherFields.push(`${key}: ${value}`);
        }
    });
    
    // HTML 형태로 구조화
    const tooltipParts = ['📊 원본 데이터:'];
    
    // 사용된 필드들 먼저 표시
    if (usedFields.length > 0) {
        tooltipParts.push(...usedFields);
    }
    
    // 기타 필드들 표시
    if (otherFields.length > 0) {
        tooltipParts.push('--- 기타 필드 ---');
        tooltipParts.push(...otherFields);
    }
    
    const result = tooltipParts.join('<br>');
    console.log('[DATA_PROCESSOR] 툴팁 생성 완료');
    
    return result;
}

// ============================================================================
// 내장 유틸리티 함수들 (외부 의존성 제거)
// ============================================================================

/**
 * 데이터의 필드 타입 분석 (3dim_chart_gen 내장)
 * @param {Array<Object>} rawData - 분석할 원시 데이터
 * @returns {Object} { [fieldName]: 'string' | 'double' }
 */
function analyzeDataFieldTypes(rawData) {
    console.log('[DATA_PROCESSOR] 필드 타입 분석 시작');
    
    // 입력 검증
    if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
        throw new Error('분석할 rawData 배열이 필요합니다');
    }

    const firstRecord = rawData[0];
    if (!firstRecord || typeof firstRecord !== 'object') {
        throw new Error('첫 번째 데이터 레코드가 객체가 아닙니다');
    }

    const fieldTypes = {};
    const fieldNames = Object.keys(firstRecord);
    
    if (fieldNames.length === 0) {
        throw new Error('데이터 레코드에 필드가 없습니다');
    }

    console.log('[DATA_PROCESSOR] 분석 대상 필드:', fieldNames);

    // 각 필드별 타입 분석
    for (const fieldName of fieldNames) {
        const typeAnalysis = analyzeFieldType(rawData, fieldName);
        fieldTypes[fieldName] = typeAnalysis.finalType;
        
        console.log(`[DATA_PROCESSOR] 필드 '${fieldName}': ${typeAnalysis.finalType} (${typeAnalysis.confidence})`);
    }

    console.log('[DATA_PROCESSOR] 필드 타입 분석 완료:', fieldTypes);
    return fieldTypes;
}

/**
 * 개별 필드의 타입을 분석하는 내부 함수
 * @param {Array<Object>} data - 데이터 배열
 * @param {string} fieldName - 분석할 필드명
 * @returns {Object} { finalType: string, confidence: string }
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
        console.warn(`[DATA_PROCESSOR] 필드 '${fieldName}'의 ${(nullRatio * 100).toFixed(1)}%가 null/undefined입니다`);
    }
    
    if (typeCounts.object > 0 || typeCounts.boolean > 0) {
        console.warn(`[DATA_PROCESSOR] 필드 '${fieldName}'에 예상치 못한 타입이 포함되어 있습니다:`, {
            object: typeCounts.object,
            boolean: typeCounts.boolean
        });
    }
    
    return {
        finalType,
        confidence
    };
}

/**
 * 중복값 존재 여부 계산
 * @param {Array} data - 데이터 배열
 * @param {string} fieldName - 필드명
 * @returns {boolean} 중복값 존재 여부
 */
function calculateAllowDuplicates(data, fieldName) {
    if (!data || data.length === 0) return false;

    const values = data.map(item => item[fieldName]);
    const uniqueValues = [...new Set(values)];
    return uniqueValues.length < values.length;
}