// ============================================================================
// 3dim_chart_gen/unified/data_processor_3d.js - 3D 데이터 변환 + 16개 제한
// ============================================================================

import { dataValidator } from '../../data_pipeline/index.js';

/**
 * 원시 데이터를 3D 차트용으로 변환하는 함수 (16개 제한 포함)
 * @param {Array} rawData - 원시 데이터 배열
 * @param {Object} dataMapping - 데이터 매핑 {x: 'field1', y: 'field2', z: 'field3'}
 * @returns {Object} 변환된 데이터와 메타정보
 */
export function processDataForChart3D(rawData, dataMapping) {
    console.log('[DATA_PROCESSOR_3D] 3D 데이터 변환 시작');
    console.log('[DATA_PROCESSOR_3D] 원시 데이터:', rawData?.length, '개');
    console.log('[DATA_PROCESSOR_3D] 매핑:', dataMapping);

    // 입력 검증
    if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
        throw new Error('유효한 데이터가 없습니다');
    }

    if (!dataMapping || typeof dataMapping !== 'object') {
        throw new Error('데이터 매핑이 필요합니다');
    }

    // 3D 필수 축 검증
    if (!dataMapping.x || !dataMapping.y || !dataMapping.z) {
        throw new Error('3D 차트는 x, y, z 축이 모두 필요합니다');
    }

    // 필드 타입 분석 (data_pipeline 모듈 사용)
    const fieldTypes = dataValidator.analyzeDataFieldTypes(rawData);
    console.log('[DATA_PROCESSOR_3D] 필드 타입:', fieldTypes);

    // 매핑 필드명 존재 여부 확인
    const availableFields = Object.keys(fieldTypes);
    console.log('[DATA_PROCESSOR_3D] === 3D 매핑 검증 시작 ===');
    console.log('[DATA_PROCESSOR_3D] dataMapping 객체:', dataMapping);

    const requiredFields = [dataMapping.x, dataMapping.y, dataMapping.z];
    const missingFields = requiredFields.filter(field => {
        const exists = availableFields.includes(field);
        console.log(`[DATA_PROCESSOR_3D] 필드 존재 확인: "${field}" → ${exists}`);
        return !exists;
    });

    if (missingFields.length > 0) {
        throw new Error(`3D 매핑된 필드가 데이터에 없습니다: ${missingFields.join(', ')}`);
    }

    console.log('[DATA_PROCESSOR_3D] === 3D 매핑 검증 완료 ===');

    // 🔥 3D 전용: 16개 제한 적용 (원본 데이터에서)
    const limitedRawData = rawData.slice(0, 16);
    console.log(`[DATA_PROCESSOR_3D] ⚠️ 3D 렌더링 최적화: ${rawData.length}개 → ${limitedRawData.length}개로 제한`);

    // 축 정보 생성
    const axes = [];
    const axisOrder = ['x', 'y', 'z'];

    axisOrder.forEach(axisType => {
        const fieldName = dataMapping[axisType];
        if (fieldName) {
            axes.push({
                name: fieldName,
                type: fieldTypes[fieldName] || 'double',
                allow_dup: calculateAllowDuplicates(limitedRawData, fieldName)
            });
        }
    });

    // 메타데이터 생성
    const metadata = {
        dim: 3, // 항상 3차원
        axes: axes,
        dataMapping: dataMapping,
        fieldTypes: fieldTypes,
        recordCount: limitedRawData.length,
        originalCount: rawData.length,
        isLimited: rawData.length > 16
    };

    // ✅ 3D 차트용 데이터 변환 (2D와 동일한 방식)
    console.log('[DATA_PROCESSOR_3D] === 3D 데이터 변환 시작 ===');

    const chartData = limitedRawData.map((row, index) => {
        const dataPoint = {
            _originalIndex: index,
            _fullData: row  // 🔥 원본 객체 직접 참조 (메모리 효율성)
        };

        // 매핑된 필드들을 축 이름으로 복사
        Object.entries(dataMapping).forEach(([axisType, fieldName]) => {
            if (fieldName && row[fieldName] !== undefined) {
                dataPoint[fieldName] = row[fieldName];
            }
        });

        return dataPoint;
    });

    console.log('[DATA_PROCESSOR_3D] === 3D 데이터 변환 완료 ===');

    const result = {
        data: chartData,
        metadata: metadata,
        originalData: limitedRawData
    };

    console.log('[DATA_PROCESSOR_3D] 3D 변환 완료:', chartData.length, '개 포인트');
    console.log('[DATA_PROCESSOR_3D] 첫 번째 변환된 포인트 샘플:', chartData[0]);
    
    // 제한 경고 출력
    if (metadata.isLimited) {
        console.warn(`[DATA_PROCESSOR_3D] ⚠️ 성능상 처음 16개 데이터만 사용됨 (전체 ${metadata.originalCount}개)`);
    }

    return result;
}

/**
 * 중복값 존재 여부 계산 (2D에서 복사)
 */
function calculateAllowDuplicates(data, fieldName) {
    if (!data || data.length === 0) return false;

    const values = data.map(item => item[fieldName]);
    const uniqueValues = [...new Set(values)];
    return uniqueValues.length < values.length;
}

/**
 * 3D 데이터 유효성 검사
 * @param {Array} data - 변환된 데이터
 * @param {Object} dataMapping - 데이터 매핑
 * @returns {Object} { isValid: boolean, errors: string[], warnings: string[] }
 */
export function validate3DData(data, dataMapping) {
    console.log('[DATA_PROCESSOR_3D] 3D 데이터 유효성 검사');
    
    const errors = [];
    const warnings = [];
    
    try {
        // 빈 데이터 검사
        if (!data || data.length === 0) {
            errors.push('변환된 3D 데이터가 비어있습니다');
            return { isValid: false, errors, warnings };
        }
        
        // 최소 데이터 개수 검사
        if (data.length < 3) {
            warnings.push(`3D 차트 데이터가 적습니다 (${data.length}개). 최소 3개 이상을 권장합니다.`);
        }
        
        // 축 데이터 유효성 검사
        const { x: xField, y: yField, z: zField } = dataMapping;
        let validPointCount = 0;
        
        data.forEach((point, index) => {
            const xVal = point[xField];
            const yVal = point[yField];
            const zVal = point[zField];
            
            const hasValidX = xVal !== null && xVal !== undefined && !isNaN(Number(xVal));
            const hasValidY = yVal !== null && yVal !== undefined && !isNaN(Number(yVal));
            const hasValidZ = zVal !== null && zVal !== undefined && !isNaN(Number(zVal));
            
            if (hasValidX && hasValidY && hasValidZ) {
                validPointCount++;
            }
        });
        
        if (validPointCount === 0) {
            errors.push('유효한 3D 좌표를 가진 데이터 포인트가 없습니다');
        } else if (validPointCount < data.length) {
            warnings.push(`${data.length - validPointCount}개 포인트에 유효하지 않은 좌표가 있습니다`);
        }
        
        const isValid = errors.length === 0;
        
        console.log('[DATA_PROCESSOR_3D] 3D 데이터 유효성 검사 완료:', {
            isValid,
            totalPoints: data.length,
            validPoints: validPointCount,
            errorCount: errors.length,
            warningCount: warnings.length
        });
        
        return { isValid, errors, warnings };
        
    } catch (error) {
        console.error('[DATA_PROCESSOR_3D] 유효성 검사 중 오류:', error);
        return {
            isValid: false,
            errors: [`3D 데이터 유효성 검사 실패: ${error.message}`],
            warnings
        };
    }
}