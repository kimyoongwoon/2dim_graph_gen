// main.js
// index.html�� ������ ���� ����

import { loadBinaryData, displayDataTable } from './chart_gen/data_load.js';

let dataProvider = null;
let globalData = [];

// ���� ������Ʈ
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
    updateStatus(`����: ${message}`, 'error');
}

// ������ ����
window.generateData = function () {
    const selectedFields = getSelectedFields();
    const count = parseInt(document.getElementById('dataCount').value);

    console.log('[GENERATE] ���õ� �ʵ�:', selectedFields);

    if (selectedFields.length === 0) {
        showError('�ּ� �ϳ��� �ʵ带 �������ּ���');
        return;
    }

    if (selectedFields.length < 2) {
        showError('�ּ� 2���� �ʵ带 �������ּ���');
        return;
    }

    // �ִ� ������ ��� (���õ� �ʵ� ���� ����, �ִ� 4����)
    const maxDimension = Math.min(selectedFields.length, 4);
    console.log('[GENERATE] �ִ� ���� ������ ������:', maxDimension);

    updateStatus(`������ ���� ��... (${selectedFields.join(', ')}, ${count}��) - �ִ� ${maxDimension}�������� ���� ����`, 'info');
    updateStepIndicator(1);

    dataProvider.generateData(selectedFields, count, () => {
        loadData();
    });
};

function loadData() {
    try {
        loadBinaryData(dataProvider, (data) => {
            globalData = data;

            // ���� ���丮���� ���� (���� ���������� ���)
            sessionStorage.setItem('generatedBinaryData', JSON.stringify(data));

            displayDataTable(data, document.getElementById('dataTable'));
            document.getElementById('dataPreviewSection').style.display = 'block';
            document.getElementById('goToChartBtn').disabled = false;

            updateStatus(`${data.length}�� ������ ���� �Ϸ� - ��Ʈ ���� �������� �̵����ּ���`, 'success');
            updateStepIndicator(2);
        });
    } catch (error) {
        console.error('[LOAD] ������ �ε� ����:', error);
        showError('������ �ε� ����: ' + error.message);
    }
}

// ��Ʈ �������� �̵�
window.goToVisualization = function () {
    window.location.href = 'graph_complete.html';
};

// ������ �ε�� �ʱ�ȭ
document.addEventListener('DOMContentLoaded', () => {
    console.log('=== ������ ���� ������ �ʱ�ȭ ===');

    // QWebChannel�� �̹� �ε�Ǿ� �ִ��� Ȯ��
    if (typeof QWebChannel !== 'undefined') {
        initializeWebChannel();
    } else {
        console.warn('[MAIN] QWebChannel not found - make sure qrc script is loaded');
        updateStatus('QWebChannel �ε� ���� - HTML���� qrc ��ũ��Ʈ�� Ȯ�����ּ���', 'error');
    }
});

function initializeWebChannel() {
    // QWebChannel ����
    new QWebChannel(qt.webChannelTransport, channel => {
        dataProvider = channel.objects.dataProvider;
        if (dataProvider) {
            updateStatus('DataProvider ���� �Ϸ� - �ʵ带 �����ϰ� �����͸� �������ּ���', 'success');
        } else {
            updateStatus('DataProvider ���� ����', 'error');
            showError('DataProvider ���ῡ �����߽��ϴ�. C++ ���ø����̼��� Ȯ�����ּ���.');
        }
    });
}