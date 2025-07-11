// ============================================================================
// shared/session_storage_manager/raw_data_checker.js
// ============================================================================

/**
 * rawData 존재 여부 확인
 * @param {string} storageKey - 저장소 키 (기본값: 'chartData')
 * @returns {boolean} 데이터 존재 여부
 */
export function hasRawData(storageKey = 'chartData') {
    try {
        const dataString = sessionStorage.getItem(storageKey);
        const metaString = sessionStorage.getItem(`${storageKey}_meta`);
        
        if (!dataString || !metaString) {
            return false;
        }
        
        // 간단한 유효성 검사
        const data = JSON.parse(dataString);
        const meta = JSON.parse(metaString);
        
        return Array.isArray(data) && data.length > 0 && 
               meta && meta.fieldNames && Array.isArray(meta.fieldNames);
               
    } catch (error) {
        console.warn('[RAW_DATA_CHECKER] hasRawData 확인 중 오류:', error);
        return false;
    }
}

export default { hasRawData };