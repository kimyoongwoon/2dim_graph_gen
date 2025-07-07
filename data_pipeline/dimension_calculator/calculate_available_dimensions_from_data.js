// ============================================================================
// data_pipeline/dimension_calculator/calculate_available_dimensions_from_data.js (경량화)
// ============================================================================

/**
 * 경량화된 사용 가능한 차원수 계산
 * @param {Array<Object>} rawData - 원시 데이터
 * @returns {number} maxDimensions - 최대 사용 가능한 차원수 (1-4)
 */
export default function calculateAvailableDimensionsFromData(rawData) {
    console.log('[DIMENSION_CALCULATOR] 기본 차원수 계산');

    if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
        return 1; // 최소 차원
    }

    const firstRecord = rawData[0];
    if (!firstRecord || typeof firstRecord !== 'object') {
        return 1;
    }

    // 기본 필드 개수 계산
    const fieldNames = Object.keys(firstRecord);
    const fieldCount = fieldNames.length;

    console.log('[DIMENSION_CALCULATOR] 총 필드:', fieldCount, '개');

    // 최대 4차원으로 제한
    const maxDimensions = Math.min(fieldCount, 4);

    console.log('[DIMENSION_CALCULATOR] 최대 차원:', maxDimensions);
    return maxDimensions;
}

/**
 * 3D 차트 지원 가능 여부 판단 (경량화)
 * @param {Array<Object>} rawData - 원시 데이터
 * @returns {boolean} 3D 차트 지원 가능 여부
 */
export function canSupport3D(rawData) {
    if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
        return false;
    }

    const numericFields = getNumericFields(rawData);
    const canSupport = numericFields.length >= 3;

    console.log('[DIMENSION_CALCULATOR] 3D 지원:', canSupport, '(숫자 필드:', numericFields.length, '개)');
    return canSupport;
}

/**
 * 숫자 필드 목록 반환 (경량화)
 * @param {Array<Object>} rawData - 원시 데이터
 * @returns {Array<string>} 숫자 필드명 배열
 */
export function getNumericFields(rawData) {
    if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
        return [];
    }

    const firstRecord = rawData[0];
    if (!firstRecord || typeof firstRecord !== 'object') {
        return [];
    }

    const fieldNames = Object.keys(firstRecord);
    const numericFields = [];

    // 첫 번째 레코드만 확인 (간단화)
    fieldNames.forEach(fieldName => {
        const value = firstRecord[fieldName];
        if (typeof value === 'number' && !isNaN(value)) {
            numericFields.push(fieldName);
        }
    });

    console.log('[DIMENSION_CALCULATOR] 숫자 필드:', numericFields);
    return numericFields;
}

/**
 * 모든 필드 타입 간단 분석
 * @param {Array<Object>} rawData - 원시 데이터
 * @returns {Object} { fieldNames: string[], numericFields: string[], stringFields: string[] }
 */
export function getFieldsSummary(rawData) {
    if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
        return { fieldNames: [], numericFields: [], stringFields: [] };
    }

    const firstRecord = rawData[0];
    if (!firstRecord || typeof firstRecord !== 'object') {
        return { fieldNames: [], numericFields: [], stringFields: [] };
    }

    const fieldNames = Object.keys(firstRecord);
    const numericFields = [];
    const stringFields = [];

    fieldNames.forEach(fieldName => {
        const value = firstRecord[fieldName];
        if (typeof value === 'number' && !isNaN(value)) {
            numericFields.push(fieldName);
        } else if (typeof value === 'string') {
            stringFields.push(fieldName);
        }
    });

    return { fieldNames, numericFields, stringFields };
}