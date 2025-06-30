// ============================================================================
// chart_gen/unified/data_processor_unified.js - 독립적 데이터 변환 함수
// ============================================================================

import { validateDataIntegrity, validateAxisAssignment } from '../data_validate.js';
import { analyzeFieldTypes } from '../data_processor.js';

/**
 * 원시 데이터를 차트용으로 변환하는 독립적 함수
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

    // 매핑 필드 존재 여부 확인
    const availableFields = Object.keys(fieldTypes);
    const mappedFields = Object.values(dataMapping).filter(field => field);
    const missingFields = mappedFields.filter(field => !availableFields.includes(field));
    
    if (missingFields.length > 0) {
        throw new Error(`매핑된 필드가 데이터에 없습니다: ${missingFields.join(', ')}`);
    }

    // 축 타입 검증 (기존 함수 재사용)
    const axisMapping = {
        x: dataMapping.x,
        y: dataMapping.y,
        z: dataMapping.size || dataMapping.color,
        w: (dataMapping.size && dataMapping.color) ? dataMapping.color : undefined
    };

    const axisValidation = validateAxisAssignment(axisMapping, fieldTypes);
    if (!axisValidation.isValid) {
        throw new Error(`축 매핑 오류: ${axisValidation.errors.join('; ')}`);
    }

    // 데이터 무결성 검증 (기존 함수 재사용)
    const firstMappedField = Object.values(dataMapping)[0];
    const dataValidation = validateDataIntegrity(rawData, axisMapping, firstMappedField);
    if (!dataValidation.isValid) {
        throw new Error(`데이터 무결성 오류: ${dataValidation.error}`);
    }

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

    // 차트용 데이터 변환
    const chartData = rawData.map((row, index) => {
        const dataPoint = {
            _originalIndex: index,
            _fullData: `Point ${index}: ${JSON.stringify(row)}`
        };

        // 매핑된 필드들을 축 이름으로 복사
        Object.entries(dataMapping).forEach(([axisType, fieldName]) => {
            if (fieldName && row[fieldName] !== undefined) {
                dataPoint[fieldName] = row[fieldName];
            }
        });

        return dataPoint;
    });

    const result = {
        data: chartData,
        metadata: metadata,
        originalData: rawData
    };

    console.log('[DATA_PROCESSOR_UNIFIED] 변환 완료:', chartData.length, '개 포인트');
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