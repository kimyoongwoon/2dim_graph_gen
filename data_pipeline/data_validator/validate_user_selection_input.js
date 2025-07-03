// ============================================================================
// data_pipeline/data_validator/validate_user_selection_input.js - 3D 차트 타입 지원 추가
// ============================================================================

/**
 * 사용자 선택 입력 종합 검증 (3D 지원 추가)
 * @param {Object} userSelection - { dimension: number, chartType: string, selectedFields: string[], is3D?: boolean }
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

    const { dimension, chartType, selectedFields, is3D = false } = userSelection; // ✅ is3D 추가
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

        // 5. ✅ 수정된 차트 타입 유효성 검증 (3D 지원)
        const validChartTypes = getValidChartTypesForDimensionAndMode(dimension, is3D);
        if (!validChartTypes.includes(chartType)) {
            const modeText = is3D ? '3D' : '2D';
            errors.push(`${dimension}차원 ${modeText} 모드에서 지원하지 않는 차트 타입: ${chartType}`);
            warnings.push(`${dimension}차원 ${modeText} 모드에서 사용 가능한 차트 타입: ${validChartTypes.join(', ')}`);
        }

        // 6. 데이터 크기 관련 경고
        if (rawData.length < 5) {
            warnings.push(`데이터 개수가 적습니다 (${rawData.length}개). 시각화 효과가 제한적일 수 있습니다.`);
        } else if (rawData.length > 10000) {
            warnings.push(`데이터 개수가 많습니다 (${rawData.length}개). 렌더링 성능이 저하될 수 있습니다.`);
        }

        // 7. ✅ 3D 모드 특별 검증
        if (is3D) {
            // 3D는 최소 3차원 필요
            if (dimension < 3) {
                errors.push('3D 차트는 최소 3차원이 필요합니다');
            }

            // 3D는 모든 필드가 숫자여야 함 (README 기준)
            // 이 검증은 다른 함수에서 처리하므로 여기서는 경고만
            warnings.push('3D 차트에서는 모든 축이 숫자 필드여야 합니다');
        }

        // 8. ✅ 2D 모드 차원별 특별 검증
        if (!is3D) {
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
        }

        const isValid = errors.length === 0;

        console.log('[DATA_VALIDATOR] 사용자 선택 입력 종합 검증 완료:', {
            isValid,
            dimension,
            chartType,
            is3D,
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
 * ✅ 차원별 + 모드별 유효한 차트 타입 목록 반환 (README 기반)
 * @param {number} dimension - 차원수 (1-4)
 * @param {boolean} is3D - 3D 모드 여부
 * @returns {string[]} 유효한 차트 타입 목록
 */
function getValidChartTypesForDimensionAndMode(dimension, is3D) {
    if (is3D) {
        // 3D 차트 타입 (README 기반)
        const chart3DTypes = {
            3: ['3d_surface_scatter', '3d_surface_only', '3d_scatter_only'],
            4: ['3d_surface_scatter_color'] // README에는 명시되지 않았지만 코드에서 사용
        };
        return chart3DTypes[dimension] || [];
    } else {
        // 2D 차트 타입 (README 기반)
        const chart2DTypes = {
            1: ['line1d', 'category'],
            2: ['scatter', 'size', 'color', 'bar', 'bar_size', 'bar_color'],
            3: ['scatter_size', 'scatter_color', 'size_color', 'grouped_bar', 'grouped_bar_size', 'grouped_bar_color'],
            4: ['scatter_size_color', 'grouped_scatter_size_color']
        };
        return chart2DTypes[dimension] || [];
    }
}

/**
 * ✅ 호환성을 위한 기존 함수 (기존 코드에서 사용될 수 있음)
 * @param {number} dimension - 차원수
 * @returns {string[]} 2D 유효한 차트 타입 목록 (기존 호환성)
 */
function getValidChartTypesForDimension(dimension) {
    return getValidChartTypesForDimensionAndMode(dimension, false);
}