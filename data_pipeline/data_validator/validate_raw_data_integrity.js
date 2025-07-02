// ============================================================================
// data_pipeline/data_validator/validate_raw_data_integrity.js
// ============================================================================

/**
 * rawData 무결성 검증
 * @param {Array<Object>} rawData - 검증할 원시 데이터
 * @returns {Object} { isValid: boolean, errors: string[], warnings: string[] }
 * @throws {Error} rawData가 아예 없거나 유효하지 않을 때
 */
export default function validateRawDataIntegrity(rawData) {
    console.log('[DATA_VALIDATOR] rawData 무결성 검증 시작');
    
    // 기본 입력 검증 (즉시 throw)
    if (rawData === undefined || rawData === null) {
        throw new Error('rawData가 제공되지 않았습니다');
    }
    
    if (!Array.isArray(rawData)) {
        throw new Error('rawData는 배열이어야 합니다');
    }

    const errors = [];
    const warnings = [];

    try {
        // 빈 배열 검사
        if (rawData.length === 0) {
            errors.push('데이터가 비어있습니다');
            return { isValid: false, errors, warnings };
        }

        // 최소 데이터 개수 검사
        if (rawData.length < 2) {
            warnings.push(`데이터 개수가 매우 적습니다 (${rawData.length}개). 최소 2개 이상을 권장합니다.`);
        }

        // 최대 데이터 개수 검사 (성능 고려)
        if (rawData.length > 100000) {
            warnings.push(`데이터 개수가 매우 많습니다 (${rawData.length}개). 성능 문제가 발생할 수 있습니다.`);
        }

        // 첫 번째 레코드 검사
        const firstRecord = rawData[0];
        if (!firstRecord || typeof firstRecord !== 'object') {
            errors.push('첫 번째 데이터 레코드가 객체가 아닙니다');
            return { isValid: false, errors, warnings };
        }

        // 필드 존재 검사
        const fieldNames = Object.keys(firstRecord);
        if (fieldNames.length === 0) {
            errors.push('데이터 레코드에 필드가 없습니다');
            return { isValid: false, errors, warnings };
        }

        // 필드명 유효성 검사
        const invalidFieldNames = fieldNames.filter(name => 
            !name || typeof name !== 'string' || name.trim() === ''
        );
        if (invalidFieldNames.length > 0) {
            errors.push(`유효하지 않은 필드명: ${invalidFieldNames.join(', ')}`);
        }

        // 모든 레코드 구조 일관성 검사
        const structureErrors = [];
        const missingFieldsByRecord = {};
        const extraFieldsByRecord = {};

        for (let i = 1; i < Math.min(rawData.length, 1000); i++) { // 최대 1000개까지만 검사
            const record = rawData[i];
            
            if (!record || typeof record !== 'object') {
                structureErrors.push(`${i + 1}번째 레코드가 객체가 아닙니다`);
                continue;
            }

            const currentFields = Object.keys(record);
            
            // 누락된 필드 검사
            const missingFields = fieldNames.filter(field => !currentFields.includes(field));
            if (missingFields.length > 0) {
                if (!missingFieldsByRecord[i + 1]) missingFieldsByRecord[i + 1] = [];
                missingFieldsByRecord[i + 1].push(...missingFields);
            }

            // 추가된 필드 검사
            const extraFields = currentFields.filter(field => !fieldNames.includes(field));
            if (extraFields.length > 0) {
                if (!extraFieldsByRecord[i + 1]) extraFieldsByRecord[i + 1] = [];
                extraFieldsByRecord[i + 1].push(...extraFields);
            }
        }

        // 구조 오류 정리
        if (structureErrors.length > 0) {
            errors.push(...structureErrors.slice(0, 5)); // 최대 5개까지만 표시
            if (structureErrors.length > 5) {
                errors.push(`... 외 ${structureErrors.length - 5}개의 구조 오류`);
            }
        }

        // 누락 필드 오류 정리
        const missingRecords = Object.keys(missingFieldsByRecord);
        if (missingRecords.length > 0) {
            if (missingRecords.length <= 5) {
                missingRecords.forEach(recordNum => {
                    errors.push(`${recordNum}번째 레코드에서 누락된 필드: ${missingFieldsByRecord[recordNum].join(', ')}`);
                });
            } else {
                errors.push(`${missingRecords.length}개 레코드에서 필드 누락 발견`);
            }
        }

        // 추가 필드 경고 정리
        const extraRecords = Object.keys(extraFieldsByRecord);
        if (extraRecords.length > 0) {
            if (extraRecords.length <= 3) {
                extraRecords.forEach(recordNum => {
                    warnings.push(`${recordNum}번째 레코드에서 추가 필드: ${extraFieldsByRecord[recordNum].join(', ')}`);
                });
            } else {
                warnings.push(`${extraRecords.length}개 레코드에서 추가 필드 발견`);
            }
        }

        // 필드값 타입 일관성 검사 (샘플링)
        const sampleSize = Math.min(100, rawData.length);
        const fieldTypeInconsistencies = {};

        for (const fieldName of fieldNames) {
            const types = new Set();
            
            for (let i = 0; i < sampleSize; i++) {
                const value = rawData[i][fieldName];
                if (value !== null && value !== undefined) {
                    types.add(typeof value);
                }
            }

            if (types.size > 1) {
                fieldTypeInconsistencies[fieldName] = Array.from(types);
            }
        }

        // 타입 불일치 경고
        Object.entries(fieldTypeInconsistencies).forEach(([fieldName, types]) => {
            warnings.push(`필드 '${fieldName}'의 타입이 일관되지 않습니다: ${types.join(', ')}`);
        });

        // 빈 값 검사
        const emptyValueCounts = {};
        fieldNames.forEach(field => emptyValueCounts[field] = 0);

        for (let i = 0; i < Math.min(rawData.length, 1000); i++) {
            const record = rawData[i];
            fieldNames.forEach(field => {
                const value = record[field];
                if (value === null || value === undefined || value === '') {
                    emptyValueCounts[field]++;
                }
            });
        }

        // 빈 값 경고
        Object.entries(emptyValueCounts).forEach(([field, count]) => {
            const percentage = (count / Math.min(rawData.length, 1000) * 100).toFixed(1);
            if (count > 0) {
                if (percentage > 50) {
                    warnings.push(`필드 '${field}'의 ${percentage}%가 빈 값입니다`);
                } else if (percentage > 10) {
                    warnings.push(`필드 '${field}'에 빈 값이 ${count}개(${percentage}%) 있습니다`);
                }
            }
        });

        const isValid = errors.length === 0;

        console.log('[DATA_VALIDATOR] rawData 무결성 검증 완료:', {
            isValid,
            recordCount: rawData.length,
            fieldCount: fieldNames.length,
            errorCount: errors.length,
            warningCount: warnings.length
        });

        return {
            isValid,
            errors,
            warnings
        };

    } catch (error) {
        console.error('[DATA_VALIDATOR] 무결성 검증 중 오류:', error);
        throw new Error(`데이터 무결성 검증 실패: ${error.message}`);
    }
}