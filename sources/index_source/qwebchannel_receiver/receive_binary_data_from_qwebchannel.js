// ============================================================================
// data_pipeline/qwebchannel_receiver/receive_binary_data_from_qwebchannel.js
// ============================================================================

/**
 * QWebChannel에서 바이너리 데이터 수신 (콜백 기반 - QWebChannel 특성상 비동기)
 * @param {Object} dataProvider - QWebChannel 데이터 제공자
 * @param {Function} onSuccess - 성공 콜백: (result) => {}
 *   result: { binary: string, schema: string, count: number, size: number }
 * @param {Function} onError - 에러 콜백: (error) => {}
 * @throws {Error} dataProvider가 없거나 유효하지 않을 때 즉시 throw
 */
export default function receiveBinaryDataFromQWebChannel(dataProvider, onSuccess, onError) {
    console.log('[QWEBCHANNEL_RECEIVER] 바이너리 데이터 수신 시작');
    
    // 동기적 검증 (즉시 throw)
    if (!dataProvider) {
        throw new Error('DataProvider가 연결되지 않았습니다');
    }
    
    if (typeof onSuccess !== 'function') {
        throw new Error('onSuccess 콜백 함수가 필요합니다');
    }
    
    if (typeof onError !== 'function') {
        throw new Error('onError 콜백 함수가 필요합니다');
    }

    try {
        // QWebChannel 비동기 호출 체인
        dataProvider.getCount(count => {
            try {
                console.log('[QWEBCHANNEL_RECEIVER] 데이터 개수:', count);
                
                if (!count || count <= 0) {
                    onError(new Error(`유효하지 않은 데이터 개수: ${count}`));
                    return;
                }

                dataProvider.getBinaryTransfer(transferObj => {
                    try {
                        if (!transferObj) {
                            onError(new Error('Binary transfer 객체를 가져올 수 없습니다'));
                            return;
                        }

                        transferObj.getBinaryDataBase64(base64Data => {
                            try {
                                if (!base64Data) {
                                    onError(new Error('Base64 데이터가 비어있습니다'));
                                    return;
                                }

                                transferObj.getSchemaJson(schemaJson => {
                                    try {
                                        if (!schemaJson) {
                                            onError(new Error('스키마 JSON이 비어있습니다'));
                                            return;
                                        }

                                        transferObj.getBinarySize(binarySize => {
                                            try {
                                                console.log('[QWEBCHANNEL_RECEIVER] 바이너리 데이터 수신 완료');
                                                console.log('[QWEBCHANNEL_RECEIVER] 바이너리 크기:', binarySize, 'bytes');

                                                const result = {
                                                    binary: base64Data,
                                                    schema: schemaJson,
                                                    count: count,
                                                    size: binarySize
                                                };

                                                onSuccess(result);

                                            } catch (error) {
                                                onError(new Error(`바이너리 크기 조회 실패: ${error.message}`));
                                            }
                                        });

                                    } catch (error) {
                                        onError(new Error(`스키마 조회 실패: ${error.message}`));
                                    }
                                });

                            } catch (error) {
                                onError(new Error(`Base64 데이터 조회 실패: ${error.message}`));
                            }
                        });

                    } catch (error) {
                        onError(new Error(`Binary transfer 조회 실패: ${error.message}`));
                    }
                });

            } catch (error) {
                onError(new Error(`데이터 개수 조회 실패: ${error.message}`));
            }
        });

    } catch (error) {
        // 즉시 발생하는 에러는 onError로 전달
        if (onError) {
            onError(new Error(`QWebChannel 호출 실패: ${error.message}`));
        }
    }
}