// ============================================================================
// main.js - 데이터 생성 페이지 로직 (data_pipeline 모듈 사용)
// ============================================================================

import {
    qwebchannelReceiver,
    dataDeserializer
} from './index_source/index.js';

import { sessionStorageManager } from './shared/session_storage_manager/index.js';

// 전역 변수
let raw_data = null;
let dataProvider = null;

// 상태 업데이트 함수
function updateStatus(message, type = 'info') {
    console.log(`[STATUS] ${message}`);
    const statusDiv = document.getElementById('status');
    statusDiv.innerHTML = `<strong>${message}</strong>`;
    statusDiv.className = `status ${type}`;
}

function updateStepIndicator(activeStep) {
    for (let i = 1; i <= 3; i++) {
        const step = document.getElementById(`step${i}`);
        step.className = 'step';
        if (i < activeStep) step.className += ' completed';
        else if (i === activeStep) step.className += ' active';
    }
}

// 🔥 데이터 생성 함수 (data_pipeline 모듈 사용)
function generateData() {
    console.log('[MAIN] 데이터 생성 시작');

    const checkboxes = document.querySelectorAll('.field-selection input[type="checkbox"]:checked');
    const dataCount = parseInt(document.getElementById('dataCount').value);

    if (checkboxes.length === 0) {
        updateStatus('최소 하나의 필드를 선택해주세요', 'error');
        return;
    }

    if (!dataCount || dataCount < 1 || dataCount > 10000) {
        updateStatus('데이터 개수는 1-10000 사이여야 합니다', 'error');
        return;
    }

    updateStatus('데이터 생성 중...', 'info');

    try {
        const selectedFields = Array.from(checkboxes).map(cb => cb.value);
        console.log('[MAIN] 선택된 필드:', selectedFields);

        // C++ DataProvider 호출
        dataProvider.generateData(selectedFields, dataCount);

        // 🔄 data_pipeline 모듈 사용: QWebChannel에서 바이너리 데이터 수신
        qwebchannelReceiver.receiveBinaryDataFromQWebChannel(
            dataProvider,
            // 성공 콜백
            (binaryData) => {
                console.log('[MAIN] 바이너리 데이터 수신 완료:', binaryData);

                try {
                    // 🔄 data_pipeline 모듈 사용: 바이너리 데이터 역직렬화
                    const rawData = dataDeserializer.deserializeBinaryDataToObjects(binaryData);
                    raw_data = rawData;

                    console.log('[MAIN] 바이너리 데이터 역직렬화 완료:', rawData.length, '개');

                    // 🔄 data_pipeline 모듈 사용: sessionStorage에 저장
                    const metaInfo = sessionStorageManager.saveRawDataToSessionStorage(
                        rawData,
                        'chartData',
                        {
                            selectedFields: selectedFields,
                            generatedAt: new Date().toISOString()
                        }
                    );

                    console.log('[MAIN] sessionStorage 저장 완료:', {
                        dataSize: (metaInfo.dataSize / 1024).toFixed(2) + 'KB',
                        recordCount: metaInfo.recordCount,
                        fields: metaInfo.fieldNames.join(', ')
                    });

                    updateStatus(`✅ ${dataCount}개 데이터 생성 완료 | 필드: ${metaInfo.fieldNames.join(', ')}`, 'success');

                    // 🔄 data_pipeline 모듈 사용: 데이터 미리보기 표시
                    displayDataPreview(rawData);
                    updateStepIndicator(2);

                    // 차트 생성 버튼 활성화
                    document.getElementById('goToChartBtn').disabled = false;

                } catch (processingError) {
                    console.error('[MAIN] 데이터 처리 오류:', processingError);
                    updateStatus('데이터 처리 실패: ' + processingError.message, 'error');
                }
            },
            // 에러 콜백
            (error) => {
                console.error('[MAIN] 바이너리 데이터 수신 오류:', error);
                updateStatus('데이터 수신 실패: ' + error.message, 'error');
            }
        );

    } catch (error) {
        console.error('[MAIN] 데이터 생성 오류:', error);
        updateStatus('데이터 생성 실패: ' + error.message, 'error');
    }
}

function goToVisualization() {
    if (!raw_data || raw_data.length === 0) {
        updateStatus('먼저 데이터를 생성해주세요', 'error');
        return;
    }

    console.log('[MAIN] 차트 설정 페이지로 이동, 데이터:', raw_data.length, '개');
    // ✅ 수정: chart_config.html로 이동
    window.location.href = 'chart_config/chart_config.html';
}

// 🔄 데이터 미리보기 표시 (기존 로직 유지)
function displayDataPreview(data) {
    const section = document.getElementById('dataPreviewSection');
    const table = document.getElementById('dataTable');

    // 간단한 테이블 표시 로직
    displayDataTable(data, table);
    section.style.display = 'block';

    console.log('[MAIN] 데이터 미리보기 표시 완료');
}

function displayDataTable(data, tableElement) {
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

    console.log('[MAIN] 테이블에', displayData.length, '개 행 표시');
}

// QWebChannel 초기화
document.addEventListener('DOMContentLoaded', () => {
    console.log('=== 데이터 생성 페이지 초기화 ===');

    updateStepIndicator(1);

    // 이벤트 리스너 등록
    const generateBtn = document.getElementById('generateDataBtn');
    const goToChartBtn = document.getElementById('goToChartBtn');

    if (generateBtn) {
        generateBtn.addEventListener('click', generateData);
        console.log('[MAIN] generateData 이벤트 리스너 등록 완료');
    }

    if (goToChartBtn) {
        goToChartBtn.addEventListener('click', goToVisualization);
        console.log('[MAIN] goToVisualization 이벤트 리스너 등록 완료');
    }

    // QWebChannel 연결
    if (typeof QWebChannel !== 'undefined') {
        new QWebChannel(qt.webChannelTransport, (channel) => {
            dataProvider = channel.objects.dataProvider;
            console.log('[MAIN] DataProvider 연결 완료');
            updateStatus('데이터 생성기 준비 완료', 'success');
        });
    } else {
        console.warn('[MAIN] QWebChannel 사용 불가 - 테스트 모드');
        updateStatus('테스트 모드 - QWebChannel 연결 없음', 'info');
    }

    // 🔄 기존 sessionStorage 정리 (새로운 세션 시작)
    try {
        sessionStorageManager.clearAllChartData();
        console.log('[MAIN] 기존 sessionStorage 정리 완료');
    } catch (error) {
        console.warn('[MAIN] sessionStorage 정리 오류:', error);
    }
});

// 페이지 언로드시 데이터 정리
window.addEventListener('beforeunload', () => {
    console.log('[MAIN] 페이지 언로드 - 데이터 정리');
    
    // 차트 정리 함수가 존재하면 호출 (전역 함수)
    if (typeof clearAllChartData === 'function') {
        clearAllChartData();
    }

    // 선택적: sessionStorage 정리 (보통은 유지)
    // sessionStorageManager.clearAllChartData();
});