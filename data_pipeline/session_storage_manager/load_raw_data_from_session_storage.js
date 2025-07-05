// ============================================================================
// data_pipeline/session_storage_manager/load_raw_data_from_session_storage.js
// ============================================================================

/**
 * sessionStorage에서 rawData 로드
 * @param {string} storageKey - 저장소 키 (기본값: 'chartData')
 * @returns {Object} { data: Array<Object>, meta: Object }
 * @throws {Error} 로드 실패 또는 데이터 없음
 */
export default function loadRawDataFromSessionStorage(storageKey = 'chartData') {
    console.log('[SESSION_STORAGE_MANAGER] rawData 로드 시작');
    
    // 입력 검증
    if (!storageKey || typeof storageKey !== 'string' || storageKey.trim() === '') {
        throw new Error('유효한 저장소 키가 필요합니다');
    }

    try {
        // sessionStorage에서 데이터 조회
        const dataString = sessionStorage.getItem(storageKey);
        const metaString = sessionStorage.getItem(`${storageKey}_meta`);

        // 데이터 존재 여부 확인
        if (!dataString) {
            throw new Error(`저장된 데이터가 없습니다 (키: ${storageKey})`);
        }
        
        if (!metaString) {
            throw new Error(`저장된 메타데이터가 없습니다 (키: ${storageKey}_meta)`);
        }

        // JSON 파싱
        let data, meta;
        
        try {
            data = JSON.parse(dataString);
        } catch (parseError) {
            throw new Error(`데이터 파싱 실패: ${parseError.message}`);
        }
        
        try {
            meta = JSON.parse(metaString);
        } catch (parseError) {
            throw new Error(`메타데이터 파싱 실패: ${parseError.message}`);
        }

        // 데이터 유효성 검사
        if (!Array.isArray(data)) {
            throw new Error('저장된 데이터가 배열 형태가 아닙니다');
        }
        
        if (data.length === 0) {
            throw new Error('저장된 데이터가 비어있습니다');
        }

        // 메타데이터 유효성 검사
        if (!meta || typeof meta !== 'object') {
            throw new Error('메타데이터가 유효하지 않습니다');
        }
        
        if (!meta.fieldNames || !Array.isArray(meta.fieldNames)) {
            throw new Error('메타데이터에 필드명 정보가 없습니다');
        }
        
        if (!meta.recordCount || typeof meta.recordCount !== 'number') {
            throw new Error('메타데이터에 레코드 수 정보가 없습니다');
        }

        // 데이터 일관성 검사
        if (data.length !== meta.recordCount) {
            console.warn(`[SESSION_STORAGE_MANAGER] 데이터 불일치: 실제 ${data.length}개 vs 메타 ${meta.recordCount}개`);
        }
        
        // 필드 존재 여부 확인 (첫 번째 레코드 기준)
        const firstRecord = data[0];
        const actualFields = Object.keys(firstRecord);
        const missingFields = meta.fieldNames.filter(field => !actualFields.includes(field));
        
        if (missingFields.length > 0) {
            console.warn(`[SESSION_STORAGE_MANAGER] 누락된 필드: ${missingFields.join(', ')}`);
        }

        // 데이터 연령 계산 
        const dataAge = Date.now() - (meta.timestamp || 0);
        const ageHours = (dataAge / (1000 * 60 * 60)).toFixed(1);

        console.log('[SESSION_STORAGE_MANAGER] sessionStorage 로드 완료:', {
            storageKey: storageKey,
            recordCount: data.length,
            fieldCount: meta.fieldNames.length,
            fields: meta.fieldNames.join(', '),
            dataSize: (dataString.length / 1024).toFixed(2) + 'KB',
            metaSize: (metaString.length / 1024).toFixed(2) + 'KB',
            timestamp: new Date(meta.timestamp).toLocaleString(),
            ageHours: ageHours + '시간'
        });

        return { 
            data: data, 
            meta: {
                ...meta,
                actualRecordCount: data.length,
                actualFieldNames: actualFields,
                dataAge: dataAge
            }
        };

    } catch (error) {
        console.error('[SESSION_STORAGE_MANAGER] sessionStorage 로드 오류:', error);
        
        // 구체적인 에러 메시지 제공
        if (error.message.includes('파싱 실패')) {
            throw new Error(`저장된 데이터가 손상되었습니다: ${error.message}`);
        }
        
        if (error.message.includes('저장된 데이터가 없습니다')) {
            throw new Error('이전에 생성된 데이터가 없습니다. 먼저 데이터를 생성해주세요.');
        }
        
        throw error;
    }
}