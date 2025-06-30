// ============================================================================
// chart_data/data_filter.js - 데이터 필터링 (윈도우 범위 등)
// ============================================================================

/**
 * 윈도우 범위 기반 데이터 필터링
 */
export function applyWindowFiltering(data, windowRanges) {
    console.log(`[DATA_FILTER] 윈도우 필터링 적용:`, windowRanges);
    
    if (!data || data.length === 0) {
        console.warn('[DATA_FILTER] 필터링할 데이터가 없습니다');
        return [];
    }
    
    if (!windowRanges || Object.keys(windowRanges).length === 0) {
        console.log('[DATA_FILTER] 윈도우 범위가 없어 원본 데이터 반환');
        return data;
    }
    
    const filteredData = data.filter(dataPoint => {
        for (const axisName in windowRanges) {
            const range = windowRanges[axisName];
            const value = dataPoint[axisName];

            // 값이 존재하고 숫자인 경우만 범위 검사
            if (value !== undefined && value !== null && !isNaN(value)) {
                if (value < range.min || value > range.max) {
                    return false; // 범위 밖 포인트 필터링
                }
            } else {
                // 값이 없거나 숫자가 아닌 경우 해당 축은 검사하지 않음
                console.warn(`[DATA_FILTER] ${axisName} 축의 값이 유효하지 않음:`, value);
            }
        }
        return true; // 모든 범위 내 포인트 유지
    });
    
    // 필터링 결과 로깅
    Object.entries(windowRanges).forEach(([axisName, range]) => {
        const originalValues = data.map(d => d[axisName]).filter(v => v !== undefined && v !== null && !isNaN(v));
        const filteredValues = filteredData.map(d => d[axisName]).filter(v => v !== undefined && v !== null && !isNaN(v));
        console.log(`[DATA_FILTER] 윈도우 ${axisName}: [${range.min}, ${range.max}] → ${originalValues.length} → ${filteredValues.length} 포인트`);
    });
    
    console.log(`[DATA_FILTER] 전체 필터링 결과: ${data.length} → ${filteredData.length} 포인트`);
    return filteredData;
}

/**
 * 윈도우 범위 설정 검증
 */
export function validateWindowRanges(ranges) {
    console.log('[DATA_FILTER] 윈도우 범위 검증:', ranges);
    
    const errors = [];
    
    if (!ranges || typeof ranges !== 'object') {
        return { isValid: true, errors: [] }; // 범위가 없으면 유효한 것으로 간주
    }
    
    Object.entries(ranges).forEach(([axis, range]) => {
        // 범위 객체 구조 검증
        if (!range || typeof range !== 'object') {
            errors.push(`${axis}축: 범위 설정이 올바르지 않습니다`);
            return;
        }
        
        if (typeof range.min !== 'number' || typeof range.max !== 'number') {
            errors.push(`${axis}축: 최솟값과 최댓값은 숫자여야 합니다`);
            return;
        }
        
        if (range.min >= range.max) {
            errors.push(`${axis}축: 최솟값(${range.min})이 최댓값(${range.max})보다 크거나 같습니다`);
        }
        
        if (!isFinite(range.min) || !isFinite(range.max)) {
            errors.push(`${axis}축: 최솟값과 최댓값은 유한한 숫자여야 합니다`);
        }
    });
    
    const result = { isValid: errors.length === 0, errors };
    console.log('[DATA_FILTER] 윈도우 범위 검증 결과:', result);
    
    return result;
}

/**
 * 최종 데이터 생성 (윈도우 필터링 포함)
 */
export function makefinaldata(preparedData, windowRanges = {}, showError = null) {
    console.log('[DATA_FILTER] 최종 데이터 생성 시작');
    console.log('[DATA_FILTER] 준비된 데이터:', preparedData?.length, '개');
    console.log('[DATA_FILTER] 윈도우 범위:', windowRanges);
    
    if (!preparedData || preparedData.length === 0) {
        console.warn('[DATA_FILTER] 준비된 데이터가 없습니다');
        return [];
    }
    
    let finalData = preparedData;
    
    // 윈도우 범위가 있으면 필터링 적용
    if (Object.keys(windowRanges).length > 0) {
        // 범위 검증
        const validation = validateWindowRanges(windowRanges);
        if (!validation.isValid) {
            const errorMsg = `윈도우 범위 설정 오류: ${validation.errors.join(', ')}`;
            console.error('[DATA_FILTER]', errorMsg);
            if (showError) {
                showError(errorMsg);
            }
            return preparedData; // 오류 시 원본 데이터 반환
        }
        
        // 필터링 적용
        finalData = applyWindowFiltering(preparedData, windowRanges);
        console.log(`[DATA_FILTER] 윈도우 적용: ${preparedData.length} → ${finalData.length} 포인트`);
        
        // 필터링 후 데이터가 없으면 경고
        if (finalData.length === 0) {
            const errorMsg = '윈도우 범위 적용 후 데이터 포인트가 남지 않습니다. 범위를 조정해주세요.';
            console.warn('[DATA_FILTER]', errorMsg);
            if (showError) {
                showError(errorMsg);
            }
            return []; // 빈 배열 반환
        }
    }
    
    console.log('[DATA_FILTER] 최종 데이터 생성 완료:', finalData.length, '개');
    return finalData;
}

/**
 * 필드별 값 범위 계산
 */
export function calculateFieldRanges(data, fieldNames = null) {
    console.log('[DATA_FILTER] 필드 범위 계산 시작');
    
    if (!data || data.length === 0) {
        console.warn('[DATA_FILTER] 범위 계산할 데이터가 없습니다');
        return {};
    }
    
    const fields = fieldNames || Object.keys(data[0]);
    const ranges = {};
    
    fields.forEach(field => {
        const values = data.map(row => row[field])
                          .filter(value => value !== undefined && value !== null && typeof value === 'number' && isFinite(value));
        
        if (values.length > 0) {
            ranges[field] = {
                min: Math.min(...values),
                max: Math.max(...values),
                count: values.length,
                range: Math.max(...values) - Math.min(...values)
            };
        } else {
            console.warn(`[DATA_FILTER] ${field} 필드에 유효한 숫자 값이 없습니다`);
        }
    });
    
    console.log('[DATA_FILTER] 계산된 필드 범위:', ranges);
    return ranges;
}

/**
 * 자동 윈도우 범위 제안
 */
export function suggestWindowRanges(data, percentile = 95) {
    console.log(`[DATA_FILTER] 자동 윈도우 범위 제안 (${percentile}% 범위)`);
    
    if (!data || data.length === 0) {
        return {};
    }
    
    const fieldRanges = calculateFieldRanges(data);
    const suggestions = {};
    
    Object.entries(fieldRanges).forEach(([field, range]) => {
        if (range.count > 0) {
            // 데이터의 중앙값과 표준편차를 고려한 범위 제안
            const values = data.map(row => row[field])
                              .filter(value => value !== undefined && value !== null && typeof value === 'number' && isFinite(value))
                              .sort((a, b) => a - b);
            
            const lowerIndex = Math.floor((100 - percentile) / 2 / 100 * values.length);
            const upperIndex = Math.ceil((100 + percentile) / 2 / 100 * values.length) - 1;
            
            suggestions[field] = {
                min: values[Math.max(0, lowerIndex)],
                max: values[Math.min(values.length - 1, upperIndex)],
                originalRange: range,
                percentile: percentile
            };
        }
    });
    
    console.log('[DATA_FILTER] 제안된 윈도우 범위:', suggestions);
    return suggestions;
}

/**
 * 필터링 통계 계산
 */
export function calculateFilteringStats(originalData, filteredData, windowRanges) {
    const stats = {
        originalCount: originalData?.length || 0,
        filteredCount: filteredData?.length || 0,
        filteredPercentage: 0,
        removedCount: 0,
        removedPercentage: 0,
        filteringRules: Object.keys(windowRanges).length
    };
    
    if (stats.originalCount > 0) {
        stats.filteredPercentage = (stats.filteredCount / stats.originalCount * 100).toFixed(1);
        stats.removedCount = stats.originalCount - stats.filteredCount;
        stats.removedPercentage = (stats.removedCount / stats.originalCount * 100).toFixed(1);
    }
    
    console.log('[DATA_FILTER] 필터링 통계:', stats);
    return stats;
}

/**
 * 필터링 조건별 세부 통계
 */
export function calculateDetailedFilteringStats(data, windowRanges) {
    if (!data || data.length === 0 || Object.keys(windowRanges).length === 0) {
        return {};
    }
    
    const detailedStats = {};
    
    Object.entries(windowRanges).forEach(([axisName, range]) => {
        const axisValues = data.map(d => d[axisName]).filter(v => v !== undefined && v !== null && !isNaN(v));
        const withinRange = axisValues.filter(v => v >= range.min && v <= range.max);
        const belowRange = axisValues.filter(v => v < range.min);
        const aboveRange = axisValues.filter(v => v > range.max);
        
        detailedStats[axisName] = {
            total: axisValues.length,
            withinRange: withinRange.length,
            belowRange: belowRange.length,
            aboveRange: aboveRange.length,
            retentionRate: (withinRange.length / axisValues.length * 100).toFixed(1) + '%',
            range: range
        };
    });
    
    console.log('[DATA_FILTER] 세부 필터링 통계:', detailedStats);
    return detailedStats;
}