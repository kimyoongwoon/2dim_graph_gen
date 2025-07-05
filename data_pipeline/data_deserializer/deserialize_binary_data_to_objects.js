// ============================================================================
// data_pipeline/data_deserializer/deserialize_binary_data_to_objects.js
// ============================================================================

/**
 * 바이너리 데이터를 rawData 객체 배열로 역직렬화
 * @param {Object} binaryData - { binary: string, schema: string, count: number }
 * @returns {Array<Object>} rawData - 역직렬화된 데이터 배열
 * @throws {Error} 역직렬화 실패시
 */
export default function deserializeBinaryDataToObjects(binaryData) {
    console.log('[DATA_DESERIALIZER] 바이너리 데이터 역직렬화 시작');
    
    // 입력 검증
    if (!binaryData || typeof binaryData !== 'object') {
        throw new Error('binaryData 객체가 필요합니다');
    }
    
    const { binary, schema, count } = binaryData;
    
    if (!binary || typeof binary !== 'string') {
        throw new Error('Base64 바이너리 데이터가 없습니다');
    }
    
    if (!schema || typeof schema !== 'string') {
        throw new Error('JSON 스키마가 없습니다');
    }
    
    if (!count || typeof count !== 'number' || count <= 0) {
        throw new Error(`유효하지 않은 레코드 수: ${count}`);
    }
    
    console.log('[DATA_DESERIALIZER] 데이터 크기:', binary.length, 'chars');
    console.log('[DATA_DESERIALIZER] 예상 레코드 수:', count);

    try {
        // Base64 디코딩
        const binaryString = atob(binary);
        const buffer = new ArrayBuffer(binaryString.length);
        const uint8Array = new Uint8Array(buffer);
        
        for (let i = 0; i < binaryString.length; i++) {
            uint8Array[i] = binaryString.charCodeAt(i);
        }

        console.log('[DATA_DESERIALIZER] 바이너리 버퍼 크기:', buffer.byteLength, 'bytes');

        // 스키마 파싱
        let parsedSchema;
        try {
            parsedSchema = JSON.parse(schema);
        } catch (schemaError) {
            throw new Error(`스키마 파싱 실패: ${schemaError.message}`);
        }
        
        if (!Array.isArray(parsedSchema) || parsedSchema.length === 0) {
            throw new Error('스키마는 비어있지 않은 배열이어야 합니다');
        }
        
        console.log('[DATA_DESERIALIZER] 스키마:', parsedSchema);

        // 데이터 역직렬화
        const view = new DataView(buffer);
        const result = [];
        let offset = 0;

        for (let i = 0; i < count; i++) {
            const obj = {};

            for (const field of parsedSchema) {
                if (!field || !field.name || !field.type) {
                    throw new Error(`유효하지 않은 필드 정의: ${JSON.stringify(field)}`);
                }

                try {
                    switch (field.type) {
                        case 'int':
                            if (offset + 4 > buffer.byteLength) {
                                throw new Error(`버퍼 오버플로우: int 필드 ${field.name} (offset: ${offset})`);
                            }
                            obj[field.name] = view.getInt32(offset, true);
                            offset += 4;
                            break;
                            
                        case 'double':
                            if (offset + 8 > buffer.byteLength) {
                                throw new Error(`버퍼 오버플로우: double 필드 ${field.name} (offset: ${offset})`);
                            }
                            obj[field.name] = view.getFloat64(offset, true);
                            offset += 8;
                            break;
                            
                        case 'QString':
                            if (offset + 4 > buffer.byteLength) {
                                throw new Error(`버퍼 오버플로우: QString 길이 읽기 실패 ${field.name} (offset: ${offset})`);
                            }
                            
                            const strLen = view.getUint32(offset, true);
                            offset += 4;
                            
                            if (strLen < 0 || strLen > 1000000) { // 1MB 제한
                                throw new Error(`비정상적인 문자열 길이: ${strLen} (필드: ${field.name})`);
                            }
                            
                            if (offset + strLen > buffer.byteLength) {
                                throw new Error(`버퍼 오버플로우: QString 데이터 읽기 실패 ${field.name} (offset: ${offset}, 길이: ${strLen})`);
                            }
                            
                            const strBytes = new Uint8Array(buffer, offset, strLen);
                            obj[field.name] = new TextDecoder('utf-8').decode(strBytes);
                            offset += strLen;
                            break;
                            
                        default:
                            throw new Error(`지원하지 않는 필드 타입: ${field.type} (필드: ${field.name})`);
                    }
                } catch (fieldError) {
                    throw new Error(`필드 ${field.name} 역직렬화 실패: ${fieldError.message}`);
                }
            }

            result.push(obj);
        }

        console.log('[DATA_DESERIALIZER] 역직렬화 완료:', result.length, '개 레코드');
        
        if (result.length > 0) {
            console.log('[DATA_DESERIALIZER] 첫 번째 레코드:', result[0]);
            console.log('[DATA_DESERIALIZER] 마지막 레코드:', result[result.length - 1]);
        }
        
        if (result.length !== count) {
            console.warn(`[DATA_DESERIALIZER] 예상 레코드 수(${count})와 실제 레코드 수(${result.length})가 다릅니다`);
        }

        return result;

    } catch (error) {
        console.error('[DATA_DESERIALIZER] 역직렬화 오류:', error);
        throw new Error(`데이터 역직렬화 실패: ${error.message}`);
    }
}