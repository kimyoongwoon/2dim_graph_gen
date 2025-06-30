// chart_gen/data_load.js
// C++ QWebChannel에서 받은 바이너리 데이터 역직렬화

/**
 * C++ QWebChannel에서 받은 바이너리 데이터를 역직렬화
 */
export function deserializeBinaryData(base64Data, schemaJson, count) {
    console.log('[DATA_LOAD] 바이너리 데이터 역직렬화 시작');
    console.log('[DATA_LOAD] 데이터 크기:', base64Data.length, 'chars');
    console.log('[DATA_LOAD] 예상 레코드 수:', count);

    try {
        // Base64 디코딩
        const binaryString = atob(base64Data);
        const buffer = new ArrayBuffer(binaryString.length);
        const uint8Array = new Uint8Array(buffer);
        
        for (let i = 0; i < binaryString.length; i++) {
            uint8Array[i] = binaryString.charCodeAt(i);
        }

        console.log('[DATA_LOAD] 바이너리 버퍼 크기:', buffer.byteLength, 'bytes');

        // 스키마 파싱
        const schema = JSON.parse(schemaJson);
        console.log('[DATA_LOAD] 스키마:', schema);

        // 데이터 역직렬화
        const view = new DataView(buffer);
        const result = [];
        let offset = 0;

        for (let i = 0; i < count; i++) {
            const obj = {};

            for (const field of schema) {
                switch (field.type) {
                    case 'int':
                        obj[field.name] = view.getInt32(offset, true);
                        offset += 4;
                        break;
                    case 'double':
                        obj[field.name] = view.getFloat64(offset, true);
                        offset += 8;
                        break;
                    case 'QString':
                        const strLen = view.getUint32(offset, true);
                        offset += 4;
                        const strBytes = new Uint8Array(buffer, offset, strLen);
                        obj[field.name] = new TextDecoder().decode(strBytes);
                        offset += strLen;
                        break;
                    default:
                        console.warn(`[DATA_LOAD] 알 수 없는 필드 타입: ${field.type}`);
                        break;
                }
            }

            result.push(obj);
        }

        console.log('[DATA_LOAD] 역직렬화 완료:', result.length, '개 레코드');
        if (result.length > 0) {
            console.log('[DATA_LOAD] 첫 번째 레코드:', result[0]);
            console.log('[DATA_LOAD] 마지막 레코드:', result[result.length - 1]);
        }

        return result;

    } catch (error) {
        console.error('[DATA_LOAD] 역직렬화 오류:', error);
        throw new Error(`데이터 역직렬화 실패: ${error.message}`);
    }
}

/**
 * QWebChannel을 통해 바이너리 데이터를 로드하고 역직렬화
 */
export function loadBinaryData(dataProvider, callback) {
    console.log('[DATA_LOAD] 바이너리 데이터 로드 시작');
    
    if (!dataProvider) {
        throw new Error('DataProvider가 연결되지 않았습니다');
    }

    dataProvider.getCount(count => {
        console.log('[DATA_LOAD] 데이터 개수:', count);

        dataProvider.getBinaryTransfer(transferObj => {
            if (!transferObj) {
                throw new Error('Binary transfer 객체를 가져올 수 없습니다');
            }

            transferObj.getBinaryDataBase64(base64Data => {
                transferObj.getSchemaJson(schemaJson => {
                    transferObj.getBinarySize(binarySize => {
                        console.log('[DATA_LOAD] 바이너리 데이터 수신 완료');
                        console.log('[DATA_LOAD] 바이너리 크기:', binarySize, 'bytes');

                        try {
                            // 역직렬화
                            const data = deserializeBinaryData(base64Data, schemaJson, count);
                            
                            console.log('[DATA_LOAD] 성공적으로 로드됨:', data.length, '개 레코드');
                            callback(data);
                            
                        } catch (error) {
                            console.error('[DATA_LOAD] 로드 실패:', error);
                            throw error;
                        }
                    });
                });
            });
        });
    });
}

/**
 * 데이터 테이블 표시 유틸리티
 */
export function displayDataTable(data, tableElement) {
    if (!data || data.length === 0) {
        tableElement.innerHTML = '<tr><td>데이터 없음</td></tr>';
        return;
    }

    const fields = Object.keys(data[0]);
    const headerElement = tableElement.querySelector('thead') || tableElement;
    const bodyElement = tableElement.querySelector('tbody') || tableElement;

    // 헤더 생성
    if (tableElement.querySelector('thead')) {
        headerElement.innerHTML = '<tr>' + fields.map(field => `<th>${field}</th>`).join('') + '</tr>';
    }
    
    // 데이터 행 생성 (최대 10개만 표시)
    const displayData = data.slice(0, 10);
    const bodyHTML = displayData.map(row =>
        '<tr>' + fields.map(field => {
            let value = row[field];
            if (typeof value === 'number') {
                value = Number.isInteger(value) ? value : value.toFixed(4);
            }
            return `<td>${value}</td>`;
        }).join('') + '</tr>'
    ).join('');

    if (tableElement.querySelector('tbody')) {
        bodyElement.innerHTML = bodyHTML;
    } else {
        tableElement.innerHTML = headerElement.innerHTML + bodyHTML;
    }

    console.log('[DATA_LOAD] 테이블에', displayData.length, '개 행 표시');
}

/**
 * 데이터 로더 정보
 */
export function getDataLoaderInfo() {
    return {
        version: '1.0.0',
        description: 'C++ QWebChannel 바이너리 데이터 역직렬화 모듈',
        supportedTypes: ['int', 'double', 'QString'],
        features: [
            'Base64 바이너리 데이터 디코딩',
            'JSON 스키마 파싱',
            'DataView를 이용한 바이너리 역직렬화',
            '에러 처리 및 로깅',
            '테이블 표시 유틸리티'
        ]
    };
}