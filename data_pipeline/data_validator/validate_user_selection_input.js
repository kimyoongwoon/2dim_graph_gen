// ============================================================================
// data_pipeline/data_validator/validate_user_selection_input.js
// ============================================================================

/**
 * 사용자 선택 입력 종합 검증
 * @param {Object} userSelection - { dimension: number, chartType: string, selectedFields: string[] }
 * @param {Array<Object>} rawData - 원시 데이터
 * @returns {Object} { isValid: boolean, errors: string[], warnings: string[] }
 * @throws {Error} 입력 매개변수가 유효하지 않을 때
 */
export default function validateUserSelectionInput(userSelection, rawData) {
    console.log('[DATA_VALIDATOR] 사용자 선택 입력 종합 검증 시작');
    
    // 입력 검증
    if (!userSelection || typeof userSelection !== 'object') {
        throw new Error('userSelection 객체가 필요합니다');
    }
    
    if (!Array.isArray(rawData) || rawData.length === 0) {
        throw new Error('유효한 rawData가 필요합니다');
    }

    const { dimension, chartType, selectedFields } = userSelection;
    const errors = [];
    const warnings = [];

    try {
        // 1. 기본 필드 존재 여부 검증
        if (!dimension) {
            errors.push('차원수가 선택되지 않았습니다');
        } else if (typeof dimension !== 'number' || dimension < 1 || dimension > 4) {
            errors.push(`유효하지 않은 차원수: ${dimension} (1-4 사이여야 함)`);
        }

        if (!chartType || typeof chartType !== 'string' || chartType.trim() === '') {
            errors.push('차트 타입이 선택되지 않았습니다');
        }

        if (!selectedFields || !Array.isArray(selectedFields)) {
            errors.push('선택된 필드 배열이 없습니다');
        } else if (selectedFields.length === 0) {
            errors.push('선택된 필드가 없습니다');
        }

        // 기본 검증에서 오류가 있으면 여기서 중단
        if (errors.length > 0) {
            return { isValid: false, errors, warnings };
        }

        // 2. 차원수와 필드 개수 일치 검증
        if (selectedFields.length !== dimension) {
            errors.push(`선택된 필드 개수(${selectedFields.length})가 차원수(${dimension})와 일치하지 않습니다`);
        }

        // 3. 필드 선택 완성도 검증
        const emptyFields = [];
        selectedFields.forEach((field, index) => {
            if (!field || typeof field !== 'string' || field.trim() === '') {
                emptyFields.push(`필드 ${index + 1}`);
            }
        });

        if (emptyFields.length > 0) {
            errors.push(`다음 필드가 선택되지 않았습니다: ${emptyFields.join(', ')}`);
        }

        // 4. 데이터 필드 존재 여부 검증
        if (rawData.length > 0 && typeof rawData[0] === 'object') {
            const availableFields = Object.keys(rawData[0]);
            const missingFields = selectedFields.filter(field => 
                field && field.trim() !== '' && !availableFields.includes(field)
            );

            if (missingFields.length > 0) {
                errors.push(`다음 필드가 데이터에 존재하지 않습니다: ${missingFields.join(', ')}`);
            }
        }

        // 5. 차트 타입 유효성 검증
        const validChartTypes = getValidChartTypesForDimension(dimension);
        if (!validChartTypes.includes(chartType)) {
            errors.push(`${dimension}차원에서 지원하지 않는 차트 타입: ${chartType}`);
            warnings.push(`${dimension}차원에서 사용 가능한 차트 타입: ${validChartTypes.join(', ')}`);
        }

        // 6. 데이터 크기 관련 경고
        if (rawData.length < 5) {
            warnings.push(`데이터 개수가 적습니다 (${rawData.length}개). 시각화 효과가 제한적일 수 있습니다.`);
        } else if (rawData.length > 10000) {
            warnings.push(`데이터 개수가 많습니다 (${rawData.length}개). 렌더링 성능이 저하될 수 있습니다.`);
        }

        // 7. 차원별 특별 검증
        if (dimension >= 2) {
            // 2차원 이상에서 산점도 계열 차트 선택 시 X,Y축 타입 확인
            if (chartType.includes('scatter') && rawData.length > 0) {
                const xField = selectedFields[0];
                const yField = selectedFields[1];
                
                if (xField && yField && rawData[0][xField] && rawData[0][yField]) {
                    const xType = typeof rawData[0][xField];
                    const yType = typeof rawData[0][yField];
                    
                    if (xType === 'string' && yType === 'string') {
                        warnings.push('X축과 Y축이 모두 문자열입니다. 산점도 시각화가 제한적일 수 있습니다.');
                    }
                }
            }
        }

        if (dimension >= 3) {
            // 3차원 이상에서 크기/색상 인코딩 필드 확인
            const sizeField = selectedFields[2];
            if (sizeField && rawData.length > 0 && rawData[0][sizeField]) {
                const sizeType = typeof rawData[0][sizeField];
                if (sizeType === 'string') {
                    warnings.push('크기 인코딩 필드가 문자열입니다. 적절한 시각화를 위해 숫자 필드를 권장합니다.');
                }
            }
        }

        if (dimension >= 4) {
            // 4차원에서 색상 인코딩 필드 확인  
            const colorField = selectedFields[3];
            if (colorField && rawData.length > 0 && rawData[0][colorField]) {
                const colorType = typeof rawData[0][colorField];
                if (colorType === 'string') {
                    warnings.push('색상 인코딩 필드가 문자열입니다. 적절한 시각화를 위해 숫자 필드를 권장합니다.');
                }
            }
        }

        const isValid = errors.length === 0;

        console.log('[DATA_VALIDATOR] 사용자 선택 입력 종합 검증 완료:', {
            isValid,
            dimension,
            chartType,
            fieldCount: selectedFields.length,
            errorCount: errors.length,
            warningCount: warnings.length
        });

        return {
            isValid,
            errors,
            warnings
        };

    } catch (error) {
        console.error('[DATA_VALIDATOR] 사용자 선택 입력 검증 중 오류:', error);
        throw new Error(`사용자 선택 입력 검증 실패: ${error.message}`);
    }
}

/**
 * 차원별 유효한 차트 타입 목록 반환 (내부 함수)
 * @param {number} dimension - 차원수
 * @returns {string[]} 유효한 차트 타입 목록
 */
function getValidChartTypesForDimension(dimension) {
    const chartTypesByDimension = {
        1: ['line1d', 'category'],
        2: ['scatter', 'size', 'color', 'bar', 'bar_size', 'bar_color'],
        3: ['scatter_size', 'scatter_color', 'size_color', 'grouped_bar', 'grouped_bar_size', 'grouped_bar_color'],
        4: ['scatter_size_color', 'grouped_scatter_size_color']
    };
    
    return chartTypesByDimension[dimension] || [];
}