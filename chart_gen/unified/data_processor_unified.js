// ============================================================================
// chart_gen/unified/data_processor_unified.js - 독립적 데이터 변환 (최적화됨)
// ============================================================================

import { analyzeFieldTypes } from '../../../chart_data/data_validate.js';

/**
 * 원시 데이터를 차트용으로 변환하는 독립적 함수 (성능 최적화)
 * @param {Array} rawData - 원시 데이터 배열 [{field1: val1, field2: val2}, ...]
 * @param {Object} dataMapping - 데이터 매핑 {x: 'field1', y: 'field2', size: 'field3', color: 'field4'}
 * @returns {Object} 변환된 데이터와 메타정보
 */
export function processDataForChart(rawData, dataMapping) {
    console.log('[DATA_PROCESSOR_UNIFIED] 데이터 변환 시작');
    console.log('[DATA_PROCESSOR_UNIFIED] 원시 데이터:', rawData?.length, '개');
    console.log('[DATA_PROCESSOR_UNIFIED] 매핑:', dataMapping);

    // 입력 검증
    if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
        throw new Error('유효한 데이터가 없습니다');
    }

    if (!dataMapping || typeof dataMapping !== 'object') {
        throw new Error('데이터 매핑이 필요합니다');
    }

    // 필드 타입 분석
    const fieldTypes = analyzeFieldTypes(rawData);
    console.log('[DATA_PROCESSOR_UNIFIED] 필드 타입:', fieldTypes);

    // 매핑 필드명 존재 여부 확인 (강화된 디버깅)
    const availableFields = Object.keys(fieldTypes);
    console.log('[DATA_PROCESSOR_UNIFIED] === 매핑 검증 시작 ===');
    console.log('[DATA_PROCESSOR_UNIFIED] dataMapping 객체:', dataMapping);
    console.log('[DATA_PROCESSOR_UNIFIED] Object.keys(dataMapping):', Object.keys(dataMapping));
    console.log('[DATA_PROCESSOR_UNIFIED] Object.values(dataMapping):', Object.values(dataMapping));

    const rawMappedFields = Object.values(dataMapping);
    console.log('[DATA_PROCESSOR_UNIFIED] rawMappedFields:', rawMappedFields);

    rawMappedFields.forEach((field, index) => {
        console.log(`[DATA_PROCESSOR_UNIFIED] 원시 매핑값 ${index}:`, {
            value: field,
            type: typeof field,
            length: field?.length,
            isEmpty: !field || (typeof field === 'string' && field.trim() === '')
        });
    });

    const mappedFields = Object.values(dataMapping).filter(field => {
        const isValid = field && typeof field === 'string' && field.trim() !== '';
        console.log(`[DATA_PROCESSOR_UNIFIED] 필드 검증:`, {
            field: field,
            isValid: isValid
        });
        return isValid;
    });

    console.log('[DATA_PROCESSOR_UNIFIED] 필터링된 mappedFields:', mappedFields);
    console.log('[DATA_PROCESSOR_UNIFIED] 사용 가능한 필드들:', availableFields);

    const missingFields = mappedFields.filter(field => {
        const exists = availableFields.includes(field);
        console.log(`[DATA_PROCESSOR_UNIFIED] 필드 존재 확인: "${field}" → ${exists}`);
        return !exists;
    });

    console.log('[DATA_PROCESSOR_UNIFIED] missingFields:', missingFields);

    if (missingFields.length > 0) {
        throw new Error(`매핑된 필드가 데이터에 없습니다: ${missingFields.join(', ')}`);
    }

    if (mappedFields.length === 0) {
        throw new Error('유효한 매핑 필드가 없습니다');
    }

    console.log('[DATA_PROCESSOR_UNIFIED] === 매핑 검증 완료 ===');

    // 간단한 검증만 수행 (복잡한 검증은 생략)
    console.log('[DATA_PROCESSOR_UNIFIED] 기본 검증 완료');

    // 축 정보 생성
    const axes = [];
    const axisOrder = ['x', 'y', 'size', 'color'];

    axisOrder.forEach(axisType => {
        const fieldName = dataMapping[axisType];
        if (fieldName) {
            axes.push({
                name: fieldName,
                type: fieldTypes[fieldName] || 'double',
                allow_dup: calculateAllowDuplicates(rawData, fieldName)
            });
        }
    });

    // 메타데이터 생성
    const metadata = {
        dim: axes.length,
        axes: axes,
        dataMapping: dataMapping,
        fieldTypes: fieldTypes,
        recordCount: rawData.length
    };

    // ✅ 성능 최적화: 차트용 데이터 변환 (원본 객체 직접 참조)
    console.log('[DATA_PROCESSOR_UNIFIED] === 성능 최적화된 데이터 변환 시작 ===');
    
    const chartData = rawData.map((row, index) => {
        const dataPoint = {
            _originalIndex: index,
            _fullData: row  // 🔥 성능 최적화: 원본 객체 직접 참조 (JSON.stringify 제거!)
        };

        // 매핑된 필드들을 축 이름으로 복사
        Object.entries(dataMapping).forEach(([axisType, fieldName]) => {
            if (fieldName && row[fieldName] !== undefined) {
                dataPoint[fieldName] = row[fieldName];
            }
        });

        return dataPoint;
    });

    console.log('[DATA_PROCESSOR_UNIFIED] === 성능 최적화 완료 ===');
    console.log('[DATA_PROCESSOR_UNIFIED] 원본 객체 직접 참조로 메모리 효율성 극대화');

    const result = {
        data: chartData,
        metadata: metadata,
        originalData: rawData
    };

    console.log('[DATA_PROCESSOR_UNIFIED] 변환 완료:', chartData.length, '개 포인트');
    console.log('[DATA_PROCESSOR_UNIFIED] 첫 번째 변환된 포인트 샘플:', chartData[0]);
    
    return result;
}

/**
 * 중복값 존재 여부 계산 (기존 함수에서 복사)
 */
function calculateAllowDuplicates(data, fieldName) {
    if (!data || data.length === 0) return false;

    const values = data.map(item => item[fieldName]);
    const uniqueValues = [...new Set(values)];
    return uniqueValues.length < values.length;
}