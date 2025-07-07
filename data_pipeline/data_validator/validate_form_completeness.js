// ============================================================================
// data_pipeline/data_validator/validate_form_completeness.js (경량화)
// ============================================================================

/**
 * 경량화된 폼 완성도 검증
 * @param {Object} userSelection - { dimension: number, chartType: string, selectedFields: string[] }
 * @returns {boolean} 폼이 완성되었는지 여부
 */
export default function validateFormCompleteness(userSelection) {
    console.log('[DATA_VALIDATOR] 폼 완성도 기본 검증');

    if (!userSelection || typeof userSelection !== 'object') {
        return false;
    }

    const { dimension, chartType, selectedFields } = userSelection;

    // 기본 필수 필드만 확인
    if (!dimension || !chartType || !Array.isArray(selectedFields)) {
        return false;
    }

    if (selectedFields.length !== dimension) {
        return false;
    }

    // 모든 필드가 선택되었는지 확인
    for (const field of selectedFields) {
        if (!field || typeof field !== 'string' || field.trim() === '') {
            return false;
        }
    }

    console.log('[DATA_VALIDATOR] 폼 완성도: 통과');
    return true;
}