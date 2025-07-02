// ============================================================================
// data_pipeline/data_validator/validate_field_type_constraints.js
// ============================================================================

/**
 * 선택된 필드들의 타입 제약 조건 검증
 * @param {Array<string>} selectedFields - 선택된 필드명 배열
 * @param {Object} fieldTypes - 필드 타입 정보 { [fieldName]: 'string' | 'double' }
 * @param {number} dimension - 차원수 (1-4)
 * @returns {Object} { isValid: boolean, errors: string[] }
 * @throws {Error} 입력 매개변수가 유효하지 않을 때
 */
export default function validateFieldTypeConstraints(selectedFields, fieldTypes, dimension) {
    console.log('[DATA_VALIDATOR] 필드 타입 제약 검증 시작:', { selectedFields, fieldTypes, dimension });
    
    // 입력 검증
    if (!Array.isArray(selectedFields)) {
        throw new Error('selectedFields는 배열이어야 합니다');
    }
    
    if (!fieldTypes || typeof fieldTypes !== 'object') {
        throw new Error('fieldTypes는 객체여야 합니다');
    }
    
    if (!dimension || typeof dimension !== 'number' || dimension < 1 || dimension > 4) {
        throw new Error('dimension은 1-4 사이의 숫자여야 합니다');
    }
    
    if (selectedFields.length !== dimension) {
        throw new Error(`selectedFields 개수(${selectedFields.length})가 dimension(${dimension})과 일치하지 않습니다`);
    }

    const errors = [];
    const axisNames = ['X', 'Y', 'Z', 'W'];

    try {
        // 각 축별 제약 조건 검증
        for (let i = 0; i < dimension; i++) {
            const field = selectedFields[i];
            const axisName = axisNames[i];
            
            // 필드 선택 여부 확인
            if (!field || typeof field !== 'string' || field.trim() === '') {
                errors.push(`${axisName}축 필드가 선택되지 않았습니다`);
                continue;
            }
            
            // 필드 존재 여부 확인
            if (!(field in fieldTypes)) {
                errors.push(`${axisName}축 필드 '${field}'가 데이터에 존재하지 않습니다`);
                continue;
            }
            
            const fieldType = fieldTypes[field];
            
            // 타입 제약 조건 검증
            if (i === 0) {
                // X축: 모든 타입 허용 (string, double 모두 가능)
                if (fieldType !== 'string' && fieldType !== 'double') {
                    errors.push(`${axisName}축 필드 '${field}'의 타입이 유효하지 않습니다 (타입: ${fieldType})`);
                }
            } else {
                // Y, Z, W축: 숫자(double)만 허용
                if (fieldType === 'string') {
                    errors.push(`${axisName}축에는 숫자 필드만 사용할 수 있습니다 (현재: '${field}'은 문자열)`);
                } else if (fieldType !== 'double') {
                    errors.push(`${axisName}축 필드 '${field}'의 타입이 유효하지 않습니다 (타입: ${fieldType})`);
                }
            }
        }

        // 중복 필드 사용 검증
        const fieldCounts = {};
        selectedFields.forEach((field, index) => {
            if (field && field.trim() !== '') {
                const trimmedField = field.trim();
                if (!fieldCounts[trimmedField]) {
                    fieldCounts[trimmedField] = [];
                }
                fieldCounts[trimmedField].push(axisNames[index]);
            }
        });

        Object.entries(fieldCounts).forEach(([field, axes]) => {
            if (axes.length > 1) {
                errors.push(`필드 '${field}'가 여러 축에서 중복 사용됩니다: ${axes.join(', ')}`);
            }
        });

        // 차원별 특별 검증 규칙
        if (dimension >= 2) {
            // 2차원 이상에서는 X축과 Y축이 다른 타입이면 경고
            const xField = selectedFields[0];
            const yField = selectedFields[1];
            
            if (xField && yField && fieldTypes[xField] && fieldTypes[yField]) {
                if (fieldTypes[xField] !== fieldTypes[yField]) {
                    // 이건 에러가 아니라 정상적인 경우일 수 있으므로 에러에서 제외
                    console.log(`[DATA_VALIDATOR] X축(${fieldTypes[xField]})과 Y축(${fieldTypes[yField]})의 타입이 다릅니다`);
                }
            }
        }

        const isValid = errors.length === 0;

        console.log('[DATA_VALIDATOR] 필드 타입 제약 검증 완료:', {
            isValid,
            dimension,
            errorCount: errors.length,
            constraints: {
                'X축': '모든 타입 허용',
                'Y/Z/W축': '숫자만 허용'
            }
        });

        return {
            isValid,
            errors
        };

    } catch (error) {
        console.error('[DATA_VALIDATOR] 필드 타입 제약 검증 중 오류:', error);
        throw new Error(`필드 타입 제약 검증 실패: ${error.message}`);
    }
}