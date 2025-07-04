// ============================================================================
// 3dim_chart_gen/unified/data_processor.js - 통합 데이터 변환 (2D/3D/4D 지원)
// ============================================================================

import { dataValidator } from '../../data_pipeline/index.js';

/**
 * 원시 데이터를 차트용으로 변환하는 통합 함수 (2D/3D/4D 지원)
 * @param {Array} rawData - 원시 데이터 배열
 * @param {Object} dataMapping - 데이터 매핑 {x: 'field1', y: 'field2', ...}
 * @param {string} chartType - 차트 타입 (16개 제한 판단용)
 * @returns {Object} 변환된 데이터와 메타정보
 */
export function processDataForChart(rawData, dataMapping, chartType) {
    console.log('[DATA_PROCESSOR] 통합 데이터 변환 시작');
    console.log('[DATA_PROCESSOR] 원시 데이터:', rawData?.length, '개');
    console.log('[DATA_PROCESSOR] 매핑:', dataMapping);
    console.log('[DATA_PROCESSOR] 차트 타입:', chartType);

    // 입력 검증
    if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
        throw new Error('유효한 데이터가 없습니다');
    }

    if (!dataMapping || typeof dataMapping !== 'object') {
        throw new Error('데이터 매핑이 필요합니다');
    }

    // 차원 자동 감지
    const mappedFields = Object.keys(dataMapping);
    const dimensions = mappedFields.length;
    console.log('[DATA_PROCESSOR] 감지된 차원:', dimensions, '(필드:', mappedFields.join(', '), ')');

    // 차원별 최소 요구사항 검증
    if (dimensions < 2) {
        throw new Error('최소 2개 이상의 필드가 매핑되어야 합니다');
    }

    // 필드 타입 분석 (data_pipeline 모듈 사용)
    const fieldTypes = dataValidator.analyzeDataFieldTypes(rawData);
    console.log('[DATA_PROCESSOR] 필드 타입:', fieldTypes);

    // 매핑 필드명 존재 여부 확인
    const availableFields = Object.keys(fieldTypes);
    console.log('[DATA_PROCESSOR] === 매핑 검증 시작 ===');
    console.log('[DATA_PROCESSOR] dataMapping 객체:', dataMapping);

    const requiredFields = Object.values(dataMapping);
    const missingFields = requiredFields.filter(field => {
        const exists = availableFields.includes(field);
        console.log(`[DATA_PROCESSOR] 필드 존재 확인: "${field}" → ${exists}`);
        return !exists;
    });

    if (missingFields.length > 0) {
        throw new Error(`매핑된 필드가 데이터에 없습니다: ${missingFields.join(', ')}`);
    }

    console.log('[DATA_PROCESSOR] === 매핑 검증 완료 ===');

    // 🔥 조건부 데이터 제한: 3d_surface_scatter만 16개 제한
    let processedRawData = rawData;
    let isLimited = false;
    
    if (chartType === '3d_surface_scatter') {
        processedRawData = rawData.slice(0, 16);
        isLimited = rawData.length > 16;
        console.log(`[DATA_PROCESSOR] ⚠️ 3D Surface 최적화: ${rawData.length}개 → ${processedRawData.length}개로 제한`);
    } else {
        console.log(`[DATA_PROCESSOR] ✅ 데이터 제한 없음 (${chartType}): ${rawData.length}개 유지`);
    }

    // 축 정보 생성 (필드 순서대로)
    const axes = [];
    Object.entries(dataMapping).forEach(([axisType, fieldName]) => {
        if (fieldName) {
            axes.push({
                name: fieldName,
                type: fieldTypes[fieldName] || 'double',
                role: axisType, // x, y, size, color 등
                allow_dup: calculateAllowDuplicates(processedRawData, fieldName)
            });
        }
    });

    // 메타데이터 생성
    const metadata = {
        dim: dimensions,
        axes: axes,
        dataMapping: dataMapping,
        fieldTypes: fieldTypes,
        recordCount: processedRawData.length,
        originalCount: rawData.length,
        isLimited: isLimited,
        chartType: chartType
    };

    // ✅ 차트용 데이터 변환 (모든 차원 지원)
    console.log('[DATA_PROCESSOR] === 데이터 변환 시작 ===');

    const chartData = processedRawData.map((row, index) => {
        const dataPoint = {
            _originalIndex: index,
            _fullData: row  // 🔥 원본 객체 직접 참조 (툴팁용)
        };

        // 매핑된 필드들을 축 이름으로 복사
        Object.entries(dataMapping).forEach(([axisType, fieldName]) => {
            if (fieldName && row[fieldName] !== undefined) {
                dataPoint[fieldName] = row[fieldName];
                // 추가로 역할별 별칭도 생성 (차트에서 쉽게 접근)
                dataPoint[axisType] = row[fieldName];
            }
        });

        return dataPoint;
    });

    console.log('[DATA_PROCESSOR] === 데이터 변환 완료 ===');

    const result = {
        data: chartData,
        metadata: metadata,
        originalData: processedRawData
    };

    console.log('[DATA_PROCESSOR] 변환 완료:', chartData.length, '개 포인트');
    console.log('[DATA_PROCESSOR] 첫 번째 변환된 포인트 샘플:', chartData[0]);
    
    // 제한 경고 출력
    if (metadata.isLimited) {
        console.warn(`[DATA_PROCESSOR] ⚠️ 성능상 처음 16개 데이터만 사용됨 (전체 ${metadata.originalCount}개)`);
    }

    return result;
}

/**
 * 🔥 통합 툴팁 데이터 생성 (모든 차트 공통)
 * rawData 전체를 구조화된 형태로 표시
 * @param {Object} dataPoint - 데이터 포인트 (변환된 데이터)
 * @param {Object} usedAxes - 사용된 축 정보 (선택적)
 * @returns {string} 구조화된 툴팁 HTML
 */
export function createTooltipData(dataPoint, usedAxes = {}) {
    console.log('[DATA_PROCESSOR] 툴팁 데이터 생성');
    
    // 원본 데이터 접근
    const original = dataPoint._fullData;
    if (!original || typeof original !== 'object') {
        return '데이터 없음';
    }
    
    const entries = Object.entries(original);
    const usedFields = [];
    const otherFields = [];
    
    // 사용된 축과 기타 필드 분리
    entries.forEach(([key, value]) => {
        if (usedAxes[key]) {
            usedFields.push(`${key}: ${value} ⭐ (${usedAxes[key]})`);
        } else {
            otherFields.push(`${key}: ${value}`);
        }
    });
    
    // HTML 형태로 구조화
    const tooltipParts = ['📊 원본 데이터:'];
    
    // 사용된 필드들 먼저 표시
    if (usedFields.length > 0) {
        tooltipParts.push(...usedFields);
    }
    
    // 기타 필드들 표시
    if (otherFields.length > 0) {
        tooltipParts.push('--- 기타 필드 ---');
        tooltipParts.push(...otherFields);
    }
    
    const result = tooltipParts.join('<br>');
    console.log('[DATA_PROCESSOR] 툴팁 생성 완료');
    
    return result;
}

/**
 * 중복값 존재 여부 계산
 * @param {Array} data - 데이터 배열
 * @param {string} fieldName - 필드명
 * @returns {boolean} 중복값 존재 여부
 */
function calculateAllowDuplicates(data, fieldName) {
    if (!data || data.length === 0) return false;

    const values = data.map(item => item[fieldName]);
    const uniqueValues = [...new Set(values)];
    return uniqueValues.length < values.length;
}