// ============================================================================
// data_pipeline/session_storage_manager/save_raw_data_to_session_storage.js
// ============================================================================

/**
 * rawData를 sessionStorage에 저장
 * @param {Array<Object>} rawData - 저장할 원시 데이터
 * @param {string} storageKey - 저장소 키 (기본값: 'chartData')
 * @param {Object} additionalMetadata - 추가 메타데이터
 * @returns {Object} metaInfo - { fieldNames: string[], recordCount: number, timestamp: number, dataSize: number }
 * @throws {Error} 저장 실패시 (용량 초과, 데이터 무효 등)
 */
export default function saveRawDataToSessionStorage(rawData, storageKey = 'chartData', additionalMetadata = {}) {
    console.log('[SESSION_STORAGE_MANAGER] rawData 저장 시작');
    
    // 입력 검증
    if (!Array.isArray(rawData)) {
        throw new Error('rawData는 배열이어야 합니다');
    }
    
    if (rawData.length === 0) {
        throw new Error('저장할 데이터가 비어있습니다');
    }
    
    if (!storageKey || typeof storageKey !== 'string' || storageKey.trim() === '') {
        throw new Error('유효한 저장소 키가 필요합니다');
    }
    
    if (additionalMetadata && typeof additionalMetadata !== 'object') {
        throw new Error('additionalMetadata는 객체여야 합니다');
    }

    try {
        // 데이터 직렬화
        const dataString = JSON.stringify(rawData);
        
        // 메타데이터 생성
        const metaInfo = {
            fieldNames: Object.keys(rawData[0] || {}),
            recordCount: rawData.length,
            timestamp: Date.now(),
            dataSize: dataString.length,
            storageKey: storageKey,
            ...additionalMetadata
        };
        
        // 메타데이터 직렬화
        const metaString = JSON.stringify(metaInfo);
        
        // 저장 공간 확인 (대략적)
        const estimatedSize = dataString.length + metaString.length;
        const maxSize = 5 * 1024 * 1024; // 5MB (sessionStorage 일반적 제한)
        
        if (estimatedSize > maxSize) {
            throw new Error(`데이터 크기가 너무 큽니다 (${(estimatedSize / 1024 / 1024).toFixed(2)}MB). 데이터 개수를 줄여주세요.`);
        }
        
        // sessionStorage에 저장
        sessionStorage.setItem(storageKey, dataString);
        sessionStorage.setItem(`${storageKey}_meta`, metaString);
        
        console.log('[SESSION_STORAGE_MANAGER] sessionStorage 저장 완료:', {
            storageKey: storageKey,
            dataSize: (dataString.length / 1024).toFixed(2) + 'KB',
            metaSize: (metaString.length / 1024).toFixed(2) + 'KB',
            recordCount: rawData.length,
            fieldCount: metaInfo.fieldNames.length,
            fields: metaInfo.fieldNames.join(', ')
        });
        
        return metaInfo;
        
    } catch (error) {
        // 브라우저 저장소 관련 에러 처리
        if (error.name === 'QuotaExceededError') {
            throw new Error('브라우저 저장 공간이 부족합니다. 데이터 개수를 줄이거나 다른 탭의 데이터를 정리해주세요.');
        } 
        
        if (error.name === 'SecurityError') {
            throw new Error('브라우저 보안 설정으로 인해 데이터를 저장할 수 없습니다.');
        }
        
        // JSON 직렬화 에러
        if (error.name === 'TypeError' && error.message.includes('JSON')) {
            throw new Error('데이터에 직렬화할 수 없는 값이 포함되어 있습니다.');
        }
        
        // 기타 에러
        console.error('[SESSION_STORAGE_MANAGER] sessionStorage 저장 오류:', error);
        throw new Error(`데이터 저장 실패: ${error.message}`);
    }
}