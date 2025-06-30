// main.js
// index.html의 데이터 생성 로직

import { loadBinaryData, displayDataTable } from './chart_gen/data_load.js';

let dataProvider = null;
let globalData = [];

// 상태 업데이트
function updateStatus(message, type = 'info') {
    console.log(`[STATUS] ${message}`);
    const statusEl = document.getElementById('status');
    statusEl.textContent = message;
    statusEl.className = `status ${type}`;
}

function updateStepIndicator(activeStep) {
    for (let i = 1; i <= 3; i++) {
        const step = document.getElementById(`step${i}`);
        step.className = 'step';
        if (i < activeStep) step.className += ' completed';
        else if (i === activeStep) step.className += ' active';
    }
}

function getSelectedFields() {
    const checkboxes = document.querySelectorAll('.field-checkbox input[type="checkbox"]:checked');
    return Array.from(checkboxes).map(cb => cb.value);
}

function showError(message) {
    updateStatus(`오류: ${message}`, 'error');
}

// 데이터 생성
window.generateData = function () {
    const selectedFields = getSelectedFields();
    const count = parseInt(document.getElementById('dataCount').value);

    console.log('[GENERATE] 선택된 필드:', selectedFields);

    if (selectedFields.length === 0) {
        showError('최소 하나의 필드를 선택해주세요');
        return;
    }

    if (selectedFields.length < 2) {
        showError('최소 2개의 필드를 선택해주세요');
        return;
    }

    // 최대 차원수 계산 (선택된 필드 수와 동일, 최대 4차원)
    const maxDimension = Math.min(selectedFields.length, 4);
    console.log('[GENERATE] 최대 생성 가능한 차원수:', maxDimension);

    updateStatus(`데이터 생성 중... (${selectedFields.join(', ')}, ${count}개) - 최대 ${maxDimension}차원까지 설정 가능`, 'info');
    updateStepIndicator(1);

    dataProvider.generateData(selectedFields, count, () => {
        loadData();
    });
};

function loadData() {
    try {
        loadBinaryData(dataProvider, (data) => {
            globalData = data;

            // 세션 스토리지에 저장 (다음 페이지에서 사용)
            sessionStorage.setItem('generatedBinaryData', JSON.stringify(data));

            displayDataTable(data, document.getElementById('dataTable'));
            document.getElementById('dataPreviewSection').style.display = 'block';
            document.getElementById('goToChartBtn').disabled = false;

            updateStatus(`${data.length}개 데이터 생성 완료 - 차트 생성 페이지로 이동해주세요`, 'success');
            updateStepIndicator(2);
        });
    } catch (error) {
        console.error('[LOAD] 데이터 로드 오류:', error);
        showError('데이터 로딩 실패: ' + error.message);
    }
}

// 차트 페이지로 이동
window.goToVisualization = function () {
    window.location.href = 'graph_complete.html';
};

// 페이지 로드시 초기화
document.addEventListener('DOMContentLoaded', () => {
    console.log('=== 데이터 생성 페이지 초기화 ===');

    // QWebChannel이 이미 로드되어 있는지 확인
    if (typeof QWebChannel !== 'undefined') {
        initializeWebChannel();
    } else {
        console.warn('[MAIN] QWebChannel not found - make sure qrc script is loaded');
        updateStatus('QWebChannel 로딩 실패 - HTML에서 qrc 스크립트를 확인해주세요', 'error');
    }
});

function initializeWebChannel() {
    // QWebChannel 연결
    new QWebChannel(qt.webChannelTransport, channel => {
        dataProvider = channel.objects.dataProvider;
        if (dataProvider) {
            updateStatus('DataProvider 연결 완료 - 필드를 선택하고 데이터를 생성해주세요', 'success');
        } else {
            updateStatus('DataProvider 연결 실패', 'error');
            showError('DataProvider 연결에 실패했습니다. C++ 애플리케이션을 확인해주세요.');
        }
    });
}