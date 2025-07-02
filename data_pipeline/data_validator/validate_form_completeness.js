// ============================================================================
// data_pipeline/data_validator/validate_form_completeness.js
// ============================================================================

/**
 * 폼 완성도 검증
 * @param {Object} userSelection - { dimension: number, chartType: string, selectedFields: string[] }
 * @returns {boolean} 폼이 완전히 완성되었는지 여부
 * @throws {Error} userSelection이 유효하지 않을 때
 */
export default function validateFormCompleteness(userSelection) {
    console.log('[DATA_VALIDATOR] 폼 완성도 검증 시작');
    
    // 입력 검증
    if (!userSelection || typeof userSelection !== 'object') {
        throw new Error('userSelection 객체가 필요합니다');
    }

    const { dimension, chartType, selectedFields } = userSelection;
    
    console.log('[DATA_VALIDATOR] 폼 완성도 검사:', { dimension, chartType, selectedFields });

    try {
        // 1. 차원수 검사
        if (!dimension) {
            console.log('[DATA_VALIDATOR] 차원수가 선택되지 않음');
            return false;
        }

        if (typeof dimension !== 'number' || dimension < 1 || dimension > 4) {
            console.log('[DATA_VALIDATOR] 유효하지 않은 차원수:', dimension);
            return false;
        }

        // 2. 차트 타입 검사
        if (!chartType) {
            console.log('[DATA_VALIDATOR] 차트 타입이 선택되지 않음');
            return false;
        }

        if (typeof chartType !== 'string' || chartType.trim() === '') {
            console.log('[DATA_VALIDATOR] 유효하지 않은 차트 타입:', chartType);
            return false;
        }

        // 3. 선택된 필드 배열 검사
        if (!selectedFields || !Array.isArray(selectedFields)) {
            console.log('[DATA_VALIDATOR] selectedFields가 배열이 아님');
            return false;
        }

        if (selectedFields.length !== dimension) {
            console.log(`[DATA_VALIDATOR] selectedFields 길이(${selectedFields.length})가 dimension(${dimension})과 다름`);
            return false;
        }

        // 4. 각 필드 선택 여부 검사
        for (let i = 0; i < dimension; i++) {
            const field = selectedFields[i];
            
            if (!field) {
                console.log(`[DATA_VALIDATOR] 필드 ${i + 1}이 null/undefined`);
                return false;
            }
            
            if (typeof field !== 'string') {
                console.log(`[DATA_VALIDATOR] 필드 ${i + 1}이 문자열이 아님:`, typeof field);
                return false;
            }
            
            if (field.trim() === '') {
                console.log(`[DATA_VALIDATOR] 필드 ${i + 1}이 빈 문자열`);
                return false;
            }
        }

        // 5. 추가 유효성 검사
        
        // 중복 필드 선택 검사
        const trimmedFields = selectedFields.map(field => field.trim());
        const uniqueFields = [...new Set(trimmedFields)];
        
        if (uniqueFields.length !== trimmedFields.length) {
            console.log('[DATA_VALIDATOR] 중복된 필드가 선택됨');
            return false;
        }

        // 필드명 유효성 검사 (기본적인 검사)
        const invalidFields = trimmedFields.filter(field => {
            // 기본적인 필드명 패턴 검사 (영문, 숫자, 언더스코어 허용)
            return !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(field);
        });

        if (invalidFields.length > 0) {
            console.log('[DATA_VALIDATOR] 유효하지 않은 필드명:', invalidFields);
            // 필드명이 유효하지 않아도 완성도 검사에서는 통과시킴 (다른 검증에서 처리)
            console.log('[DATA_VALIDATOR] 필드명 유효성은 다른 검증에서 처리하므로 통과');
        }

        console.log('[DATA_VALIDATOR] 폼 완성도: 통과');
        return true;

    } catch (error) {
        console.error('[DATA_VALIDATOR] 폼 완성도 검증 중 오류:', error);
        throw new Error(`폼 완성도 검증 실패: ${error.message}`);
    }
}