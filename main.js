// ============================================================================
// main.js - 데이터 생성 페이지 로직 (chart_data 모듈 사용)
// ============================================================================

import { 
    loadBinaryData, 
    displayDataTable, 
    saveToSessionStorage, 
    clearSessionStorage 
} from './chart_data/data_load.js';

// 🚨 TODO: shared/error_handler.js로 이동 후 import 경로 수정
import { clearAllChartData } from './shared/error_handler.js';
//import { clearAllChartData } from './chart_gen/unified/error_handler.js';

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

// 🔥 데이터 생성 함수 (chart_data 모듈 사용)
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

        // 🔄 chart_data/data_load.js 사용
        loadBinaryData(dataProvider, (data) => {
            raw_data = data;

            console.log('[MAIN] 바이너리 데이터 로드 완료:', data.length, '개');

            // 🔄 chart_data/data_load.js의 saveToSessionStorage 사용
            try {
                const metaInfo = saveToSessionStorage(data, {
                    selectedFields: selectedFields,
                    generatedAt: new Date().toISOString()
                });

                console.log('[MAIN] sessionStorage 저장 완료:', {
                    dataSize: (metaInfo.dataSize / 1024).toFixed(2) + 'KB',
                    recordCount: metaInfo.recordCount,
                    fields: metaInfo.fieldNames.join(', ')
                });

                updateStatus(`✅ ${dataCount}개 데이터 생성 완료 | 필드: ${metaInfo.fieldNames.join(', ')}`, 'success');

                // 🔄 chart_data/data_load.js의 displayDataTable 사용
                displayDataPreview(data);
                updateStepIndicator(2);

                // 차트 생성 버튼 활성화
                document.getElementById('goToChartBtn').disabled = false;

            } catch (storageError) {
                console.error('[MAIN] sessionStorage 저장 오류:', storageError);
                updateStatus('데이터 저장 실패: ' + storageError.message, 'error');
            }
        });

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

    console.log('[MAIN] 차트 페이지로 이동, 데이터:', raw_data.length, '개');
    window.location.href = 'graph_complete.html';
}

// 🔄 chart_data/data_load.js 사용
function displayDataPreview(data) {
    const section = document.getElementById('dataPreviewSection');
    const table = document.getElementById('dataTable');

    displayDataTable(data, table);
    section.style.display = 'block';
    
    console.log('[MAIN] 데이터 미리보기 표시 완료');
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

    // 기존 sessionStorage 정리 (새로운 세션 시작)
    try {
        clearSessionStorage();
        console.log('[MAIN] 기존 sessionStorage 정리 완료');
    } catch (error) {
        console.warn('[MAIN] sessionStorage 정리 오류:', error);
    }
});

// 페이지 언로드시 데이터 정리
window.addEventListener('beforeunload', () => {
    console.log('[MAIN] 페이지 언로드 - 데이터 정리');
    clearAllChartData();
    
    // 선택적: sessionStorage 정리 (보통은 유지)
    // clearSessionStorage();
});