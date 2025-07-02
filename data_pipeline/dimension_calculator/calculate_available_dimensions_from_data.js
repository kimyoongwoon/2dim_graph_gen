// ============================================================================
// data_pipeline/dimension_calculator/calculate_available_dimensions_from_data.js
// ============================================================================

/**
 * rawData에서 가능한 차원수 계산
 * @param {Array<Object>} rawData - 원시 데이터
 * @returns {number} maxDimensions - 최대 사용 가능한 차원수 (1-4)
 * @throws {Error} 데이터가 없거나 유효하지 않을 때
 */
export default function calculateAvailableDimensionsFromData(rawData) {
    console.log('[DIMENSION_CALCULATOR] 사용 가능한 차원수 계산 시작');
    
    // 입력 검증
    if (!rawData || !Array.isArray(rawData)) {
        throw new Error('차원 계산을 위한 rawData 배열이 필요합니다');
    }
    
    if (rawData.length === 0) {
        throw new Error('차원 계산을 위한 데이터가 비어있습니다');
    }

    try {
        // 첫 번째 레코드 검사
        const firstRecord = rawData[0];
        if (!firstRecord || typeof firstRecord !== 'object') {
            throw new Error('첫 번째 데이터 레코드가 객체가 아닙니다');
        }

        // 필드 개수 계산
        const fieldNames = Object.keys(firstRecord);
        const fieldCount = fieldNames.length;
        
        if (fieldCount === 0) {
            throw new Error('데이터 레코드에 필드가 없습니다');
        }

        console.log('[DIMENSION_CALCULATOR] 사용 가능한 필드:', fieldNames);
        console.log('[DIMENSION_CALCULATOR] 총 필드 개수:', fieldCount);

        // 유효한 필드 개수 계산 (null/undefined가 아닌 값을 가진 필드)
        const validFields = [];
        const fieldStatistics = {};

        // 샘플링으로 필드 유효성 검사 (최대 100개 레코드)
        const sampleSize = Math.min(rawData.length, 100);
        
        for (const fieldName of fieldNames) {
            let validValueCount = 0;
            let totalValueCount = 0;
            const sampleValues = [];

            for (let i = 0; i < sampleSize; i++) {
                const record = rawData[i];
                if (record && typeof record === 'object' && fieldName in record) {
                    totalValueCount++;
                    const value = record[fieldName];
                    
                    if (value !== null && value !== undefined && value !== '') {
                        validValueCount++;
                        sampleValues.push(value);
                    }
                }
            }

            const validRatio = totalValueCount > 0 ? validValueCount / totalValueCount : 0;
            
            fieldStatistics[fieldName] = {
                validValueCount,
                totalValueCount,
                validRatio,
                sampleValues: sampleValues.slice(0, 5) // 처음 5개 값만 저장
            };

            // 50% 이상의 유효한 값을 가진 필드만 유효한 것으로 간주
            if (validRatio >= 0.5) {
                validFields.push(fieldName);
            } else {
                console.warn(`[DIMENSION_CALCULATOR] 필드 '${fieldName}'은 유효한 값이 적습니다 (${(validRatio * 100).toFixed(1)}%)`);
            }
        }

        console.log('[DIMENSION_CALCULATOR] 유효한 필드:', validFields);
        console.log('[DIMENSION_CALCULATOR] 유효한 필드 개수:', validFields.length);

        // 최대 차원수 결정 (유효한 필드 수 기준, 최대 4차원)
        const maxDimensions = Math.min(validFields.length, 4);

        // 추가 검증: 데이터 크기 기반 권장사항
        let recommendedMaxDimensions = maxDimensions;
        
        if (rawData.length < 10) {
            // 데이터가 매우 적으면 차원 제한
            recommendedMaxDimensions = Math.min(maxDimensions, 2);
            console.warn(`[DIMENSION_CALCULATOR] 데이터 개수가 적어 최대 2차원을 권장합니다 (현재: ${rawData.length}개)`);
        } else if (rawData.length < 50) {
            // 데이터가 적으면 3차원까지만
            recommendedMaxDimensions = Math.min(maxDimensions, 3);
            console.warn(`[DIMENSION_CALCULATOR] 데이터 개수가 적어 최대 3차원을 권장합니다 (현재: ${rawData.length}개)`);
        }

        // 필드 타입 다양성 검사
        const typeSet = new Set();
        validFields.forEach(fieldName => {
            const sampleValue = fieldStatistics[fieldName].sampleValues[0];
            if (sampleValue !== undefined) {
                typeSet.add(typeof sampleValue);
            }
        });

        if (typeSet.size === 1 && typeSet.has('string')) {
            // 모든 필드가 문자열이면 차원 제한
            recommendedMaxDimensions = Math.min(recommendedMaxDimensions, 2);
            console.warn('[DIMENSION_CALCULATOR] 모든 필드가 문자열이므로 최대 2차원을 권장합니다');
        }

        const finalMaxDimensions = Math.max(1, recommendedMaxDimensions); // 최소 1차원은 보장

        console.log('[DIMENSION_CALCULATOR] 차원수 계산 완료:', {
            totalFields: fieldCount,
            validFields: validFields.length,
            calculatedMaxDimensions: maxDimensions,
            recommendedMaxDimensions: recommendedMaxDimensions,
            finalMaxDimensions: finalMaxDimensions,
            dataSize: rawData.length,
            fieldTypes: Array.from(typeSet)
        });

        // 상세 통계 로깅
        console.log('[DIMENSION_CALCULATOR] 필드별 통계:', fieldStatistics);

        return finalMaxDimensions;

    } catch (error) {
        console.error('[DIMENSION_CALCULATOR] 차원수 계산 중 오류:', error);
        throw new Error(`사용 가능한 차원수 계산 실패: ${error.message}`);
    }
}