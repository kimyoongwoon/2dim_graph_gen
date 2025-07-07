// ============================================================================
// shared/session_storage_manager/clear_session_storage_data.js
// ============================================================================

/**
 * 모든 차트 관련 sessionStorage 데이터 정리
 * @param {string[]} additionalKeys - 추가로 정리할 키들
 */
export default function clearSessionStorageData(additionalKeys = []) {
    console.log('[SESSION_STORAGE_MANAGER] sessionStorage 데이터 정리 시작');
    
    try {
        // 기본 차트 데이터 키들
        const defaultKeys = [
            'chartData',
            'chartData_meta', 
            'chartConfig'
        ];
        
        // 모든 키 정리
        const allKeys = [...defaultKeys, ...additionalKeys];
        
        let clearedCount = 0;
        allKeys.forEach(key => {
            if (sessionStorage.getItem(key)) {
                sessionStorage.removeItem(key);
                clearedCount++;
                console.log(`[SESSION_STORAGE_MANAGER] 키 '${key}' 정리 완료`);
            }
        });
        
        console.log(`[SESSION_STORAGE_MANAGER] sessionStorage 정리 완료 (${clearedCount}개 키 정리)`);
        
        return {
            clearedKeys: clearedCount,
            totalKeys: allKeys.length
        };
        
    } catch (error) {
        console.error('[SESSION_STORAGE_MANAGER] sessionStorage 정리 오류:', error);
        throw new Error(`sessionStorage 정리 실패: ${error.message}`);
    }
}

/**
 * 특정 키만 정리하는 유틸리티 함수
 * @param {string} key - 정리할 특정 키
 * @returns {boolean} 정리 성공 여부
 */
export function clearSpecificKey(key) {
    try {
        if (sessionStorage.getItem(key)) {
            sessionStorage.removeItem(key);
            console.log(`[SESSION_STORAGE_MANAGER] 특정 키 '${key}' 정리 완료`);
            return true;
        }
        return false;
    } catch (error) {
        console.error(`[SESSION_STORAGE_MANAGER] 키 '${key}' 정리 오류:`, error);
        return false;
    }
}

/**
 * 차트 데이터만 정리 (설정은 유지)
 */
export function clearChartDataOnly() {
    console.log('[SESSION_STORAGE_MANAGER] 차트 데이터만 정리');
    
    try {
        const dataKeys = ['chartData', 'chartData_meta'];
        return clearSessionStorageData(dataKeys);
    } catch (error) {
        console.error('[SESSION_STORAGE_MANAGER] 차트 데이터 정리 오류:', error);
        throw error;
    }
}

/**
 * 모든 sessionStorage 정리 (차트 관련뿐만 아니라 전체)
 */
export function clearAllSessionStorage() {
    console.log('[SESSION_STORAGE_MANAGER] 전체 sessionStorage 정리');
    
    try {
        const keyCount = sessionStorage.length;
        sessionStorage.clear();
        console.log(`[SESSION_STORAGE_MANAGER] 전체 sessionStorage 정리 완료 (${keyCount}개 키)`);
        
        return { clearedKeys: keyCount };
    } catch (error) {
        console.error('[SESSION_STORAGE_MANAGER] 전체 sessionStorage 정리 오류:', error);
        throw new Error(`전체 sessionStorage 정리 실패: ${error.message}`);
    }
}