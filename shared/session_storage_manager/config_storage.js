// ============================================================================
// shared/session_storage_manager/config_storage.js
// ============================================================================

/**
 * 차트 config를 sessionStorage에 저장
 * @param {Object} chartConfig - 저장할 차트 설정 객체
 * @param {string} storageKey - 저장소 키 (기본값: 'chartConfig')
 * @returns {Object} metaInfo - { configSize: number, timestamp: number, storageKey: string }
 * @throws {Error} 저장 실패시 (용량 초과, 설정 무효 등)
 */
export function saveChartConfig(chartConfig, storageKey = 'chartConfig') {
    console.log('[CONFIG_STORAGE] 차트 config 저장 시작');
    
    // 입력 검증
    if (!chartConfig || typeof chartConfig !== 'object') {
        throw new Error('유효한 chartConfig 객체가 필요합니다');
    }
    
    if (!storageKey || typeof storageKey !== 'string' || storageKey.trim() === '') {
        throw new Error('유효한 저장소 키가 필요합니다');
    }

    try {
        // config 직렬화
        const configString = JSON.stringify(chartConfig);
        
        // 메타데이터 생성
        const metaInfo = {
            configSize: configString.length,
            timestamp: Date.now(),
            storageKey: storageKey,
            version: '1.0',
            type: chartConfig.type || 'unknown',
            dimension: chartConfig.dataMapping ? Object.keys(chartConfig.dataMapping).length : 0,
            is3D: chartConfig.is3D || false
        };
        
        // 메타데이터 직렬화
        const metaString = JSON.stringify(metaInfo);
        
        // 저장 공간 확인 (대략적)
        const estimatedSize = configString.length + metaString.length;
        const maxSize = 1 * 1024 * 1024; // 1MB (config는 상대적으로 작음)
        
        if (estimatedSize > maxSize) {
            throw new Error(`Config 크기가 너무 큽니다 (${(estimatedSize / 1024).toFixed(2)}KB)`);
        }
        
        // sessionStorage에 저장
        sessionStorage.setItem(storageKey, configString);
        sessionStorage.setItem(`${storageKey}_meta`, metaString);
        
        console.log('[CONFIG_STORAGE] config 저장 완료:', {
            storageKey: storageKey,
            configSize: (configString.length / 1024).toFixed(2) + 'KB',
            metaSize: (metaString.length / 1024).toFixed(2) + 'KB',
            type: chartConfig.type,
            dimension: metaInfo.dimension
        });
        
        return metaInfo;
        
    } catch (error) {
        // 브라우저 저장소 관련 에러 처리
        if (error.name === 'QuotaExceededError') {
            throw new Error('브라우저 저장 공간이 부족합니다. 다른 탭의 데이터를 정리해주세요.');
        } 
        
        if (error.name === 'SecurityError') {
            throw new Error('브라우저 보안 설정으로 인해 설정을 저장할 수 없습니다.');
        }
        
        // JSON 직렬화 에러
        if (error.name === 'TypeError' && error.message.includes('JSON')) {
            throw new Error('설정에 직렬화할 수 없는 값이 포함되어 있습니다.');
        }
        
        // 기타 에러
        console.error('[CONFIG_STORAGE] config 저장 오류:', error);
        throw new Error(`설정 저장 실패: ${error.message}`);
    }
}

/**
 * sessionStorage에서 차트 config 로드
 * @param {string} storageKey - 저장소 키 (기본값: 'chartConfig')
 * @returns {Object} chartConfig - 로드된 차트 설정 객체
 * @throws {Error} 로드 실패 또는 config 없음
 */
export function loadChartConfig(storageKey = 'chartConfig') {
    console.log('[CONFIG_STORAGE] 차트 config 로드 시작');
    
    // 입력 검증
    if (!storageKey || typeof storageKey !== 'string' || storageKey.trim() === '') {
        throw new Error('유효한 저장소 키가 필요합니다');
    }

    try {
        // sessionStorage에서 config 조회
        const configString = sessionStorage.getItem(storageKey);
        const metaString = sessionStorage.getItem(`${storageKey}_meta`);

        // config 존재 여부 확인
        if (!configString) {
            throw new Error(`저장된 차트 설정이 없습니다 (키: ${storageKey})`);
        }
        
        if (!metaString) {
            console.warn(`[CONFIG_STORAGE] 설정 메타데이터가 없습니다 (키: ${storageKey}_meta)`);
        }

        // JSON 파싱
        let config, meta = null;
        
        try {
            config = JSON.parse(configString);
        } catch (parseError) {
            throw new Error(`설정 파싱 실패: ${parseError.message}`);
        }
        
        if (metaString) {
            try {
                meta = JSON.parse(metaString);
            } catch (parseError) {
                console.warn(`[CONFIG_STORAGE] 메타데이터 파싱 실패: ${parseError.message}`);
            }
        }

        // config 유효성 검사
        if (!config || typeof config !== 'object') {
            throw new Error('저장된 설정이 유효하지 않습니다');
        }
        
        // 필수 필드 확인
        if (!config.type) {
            throw new Error('설정에 차트 타입이 없습니다');
        }
        
        if (!config.dataMapping || typeof config.dataMapping !== 'object') {
            throw new Error('설정에 데이터 매핑이 없습니다');
        }

        // 설정 연령 계산 
        const configAge = meta && meta.timestamp ? Date.now() - meta.timestamp : 0;
        const ageMinutes = (configAge / (1000 * 60)).toFixed(1);

        console.log('[CONFIG_STORAGE] config 로드 완료:', {
            storageKey: storageKey,
            configSize: (configString.length / 1024).toFixed(2) + 'KB',
            type: config.type,
            dimension: config.dataMapping ? Object.keys(config.dataMapping).length : 0,
            is3D: config.is3D || false,
            timestamp: meta && meta.timestamp ? new Date(meta.timestamp).toLocaleString() : '알 수 없음',
            ageMinutes: ageMinutes + '분'
        });

        return config;

    } catch (error) {
        console.error('[CONFIG_STORAGE] config 로드 오류:', error);
        
        // 구체적인 에러 메시지 제공
        if (error.message.includes('파싱 실패')) {
            throw new Error(`저장된 설정이 손상되었습니다: ${error.message}`);
        }
        
        if (error.message.includes('저장된 차트 설정이 없습니다')) {
            throw new Error('이전에 설정한 차트 정보가 없습니다. 설정 페이지에서 다시 설정해주세요.');
        }
        
        throw error;
    }
}

/**
 * 모든 차트 관련 데이터 정리 (데이터 + config)
 * @param {string[]} additionalKeys - 추가로 정리할 키들
 */
export function clearAllChartData(additionalKeys = []) {
    console.log('[CONFIG_STORAGE] 모든 차트 데이터 정리 시작');
    
    try {
        // 기본 차트 관련 키들
        const defaultKeys = [
            'chartData',
            'chartData_meta', 
            'chartConfig',
            'chartConfig_meta'
        ];
        
        // 모든 키 합치기
        const allKeys = [...defaultKeys, ...additionalKeys];
        
        let removedCount = 0;
        const removedKeys = [];
        
        allKeys.forEach(key => {
            if (sessionStorage.getItem(key)) {
                sessionStorage.removeItem(key);
                removedCount++;
                removedKeys.push(key);
            }
        });
        
        console.log('[CONFIG_STORAGE] 차트 데이터 정리 완료:', {
            removedCount,
            removedKeys,
            remainingKeys: Object.keys(sessionStorage)
        });
        
        return {
            removedCount,
            removedKeys
        };
        
    } catch (error) {
        console.error('[CONFIG_STORAGE] 데이터 정리 오류:', error);
        throw new Error(`데이터 정리 실패: ${error.message}`);
    }
}

/**
 * 특정 키들만 정리
 * @param {string[]} keys - 정리할 키 목록
 * @returns {Object} { removedCount: number, removedKeys: string[] }
 */
export function clearSpecificStorage(keys) {
    console.log('[CONFIG_STORAGE] 특정 스토리지 정리:', keys);
    
    if (!Array.isArray(keys)) {
        throw new Error('keys는 배열이어야 합니다');
    }
    
    try {
        let removedCount = 0;
        const removedKeys = [];
        
        keys.forEach(key => {
            if (typeof key === 'string' && sessionStorage.getItem(key)) {
                sessionStorage.removeItem(key);
                removedCount++;
                removedKeys.push(key);
            }
        });
        
        console.log('[CONFIG_STORAGE] 특정 스토리지 정리 완료:', {
            removedCount,
            removedKeys
        });
        
        return {
            removedCount,
            removedKeys
        };
        
    } catch (error) {
        console.error('[CONFIG_STORAGE] 특정 스토리지 정리 오류:', error);
        throw new Error(`스토리지 정리 실패: ${error.message}`);
    }
}

/**
 * 스토리지 정보 조회 (디버깅용)
 * @returns {Object} 스토리지 상태 정보
 */
export function getStorageInfo() {
    try {
        const info = {
            totalItems: sessionStorage.length,
            items: {},
            totalSize: 0
        };
        
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            const value = sessionStorage.getItem(key);
            
            info.items[key] = {
                size: value.length,
                sizeKB: (value.length / 1024).toFixed(2),
                type: key.includes('_meta') ? 'metadata' : 'data'
            };
            
            info.totalSize += value.length;
        }
        
        info.totalSizeKB = (info.totalSize / 1024).toFixed(2);
        info.totalSizeMB = (info.totalSize / 1024 / 1024).toFixed(2);
        
        return info;
        
    } catch (error) {
        console.error('[CONFIG_STORAGE] 스토리지 정보 조회 오류:', error);
        return { error: error.message };
    }
}

export default {
    saveChartConfig,
    loadChartConfig,
    clearAllChartData,
    clearSpecificStorage,
    getStorageInfo
};