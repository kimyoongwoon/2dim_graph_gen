// ============================================================================
// main.js - 데이터 생성 페이지 로직 (sessionStorage 제거, 전역변수 사용)
// ============================================================================

import { loadBinaryData, displayDataTable } from './chart_gen/data_load.js';
import { setRawData, clearAllChartData } from './chart_gen/unified/index.js';

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

// 데이터 생성 함수
window.generateData = function () {
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

        // 바이너리 데이터 로드
        loadBinaryData(dataProvider, (data) => {
            raw_data = data;
            setRawData(data); // 통합 시스템에 데이터 설정

            const fieldNames = Object.keys(data[0] || {}).join(', ');
            updateStatus(`✅ ${dataCount}개 데이터 생성 완료 | 필드: ${fieldNames}`, 'success');

            // 미리보기 표시
            displayDataPreview(data);
            updateStepIndicator(2);

            // 차트 생성 버튼 활성화
            document.getElementById('goToChartBtn').disabled = false;
        });

    } catch (error) {
        console.error('[MAIN] 데이터 생성 오류:', error);
        updateStatus('데이터 생성 실패: ' + error.message, 'error');
    }
};

// 데이터 미리보기 표시
function displayDataPreview(data) {
    const section = document.getElementById('dataPreviewSection');
    const table = document.getElementById('dataTable');

    displayDataTable(data, table);
    section.style.display = 'block';
}

// 차트 페이지로 이동 (sessionStorage 대신 메모리 데이터 사용)
window.goToVisualization = function () {
    if (!raw_data || raw_data.length === 0) {
        updateStatus('먼저 데이터를 생성해주세요', 'error');
        return;
    }

    console.log('[MAIN] 차트 페이지로 이동, 데이터:', raw_data.length, '개');
    window.location.href = 'graph_complete.html';
};

// QWebChannel 초기화
document.addEventListener('DOMContentLoaded', () => {
    console.log('=== 데이터 생성 페이지 초기화 ===');

    updateStepIndicator(1);

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
});

// 페이지 언로드시 데이터 정리
window.addEventListener('beforeunload', () => {
    clearAllChartData();
});