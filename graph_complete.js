// ============================================================================
// graph_complete.js - 차트 설정 및 시각화 페이지 (완전히 새로 작성)
// ============================================================================

import { generateChart } from './chart_gen/unified/index.js';
import { getRawData, clearAllChartData, showError } from './chart_gen/unified/index.js';
import { analyzeFieldTypes } from './chart_gen/data_processor.js';
import { getAvailableChartTypes } from './chart_gen/data_processor.js';

// 전역 변수들
let currentChartWrapper = null;
let raw_data = null;

// ============================================================================
// 유틸리티 함수들
// ============================================================================

function updateStatus(message, type = 'info') {
    console.log(`[STATUS] ${message}`);
    const dataInfo = document.getElementById('data-info');
    dataInfo.innerHTML = `<strong>${message}</strong>`;
    dataInfo.className = `data-info ${type}`;
}

function updateStepIndicator(activeStep) {
    for (let i = 1; i <= 3; i++) {
        const step = document.getElementById(`step${i}`);
        step.className = 'step';
        if (i < activeStep) step.className += ' completed';
        else if (i === activeStep) step.className += ' active';
    }
}

// ============================================================================
// UI 업데이트 함수들
// ============================================================================

function updateDimensionOptions(data) {
    const select = document.getElementById('dimensionSelect');
    const fieldCount = Object.keys(data[0] || {}).length;

    select.innerHTML = '<option value="">차원 선택</option>';

    for (let dim = 1; dim <= Math.min(fieldCount, 4); dim++) {
        const label = dim === 1 ? '1차원 (선형/카테고리)' :
            dim === 2 ? '2차원 (X-Y 산점도)' :
                dim === 3 ? '3차원 (X-Y + 크기/색상)' :
                    '4차원 (X-Y + 크기 + 색상)';
        select.innerHTML += `<option value="${dim}">${label}</option>`;
    }

    select.onchange = updateFieldSelection;
}

function updateFieldSelection() {
    const dimension = parseInt(document.getElementById('dimensionSelect').value);
    const container = document.getElementById('axisMapping');

    if (!dimension) {
        container.innerHTML = '';
        updateChartTypes([]);
        return;
    }

    const fieldTypes = analyzeFieldTypes(raw_data);
    container.innerHTML = '';

    console.log(`[FIELD_SELECTION] ${dimension}차원 선택`);

    // 차원수만큼 필드 선택기 생성
    for (let i = 0; i < dimension; i++) {
        const div = document.createElement('div');
        div.className = 'axis-selector';

        const label = document.createElement('label');
        label.innerHTML = `필드 ${i + 1}:<br><small>${getFieldDescription(i, dimension)}</small>`;

        const select = document.createElement('select');
        select.id = `field${i}`;
        select.className = 'field-selector';
        select.onchange = updateAllFieldOptions;
        select.innerHTML = '<option value="">필드 선택</option>';

        div.appendChild(label);
        div.appendChild(select);
        container.appendChild(div);
    }

    updateAllFieldOptions();
    updateChartTypes(getAvailableChartTypes(dimension));
}

function getFieldDescription(index, dimension) {
    if (dimension === 1) {
        return '데이터 값';
    } else if (dimension === 2) {
        return index === 0 ? 'X축 (모든 타입)' : 'Y축 (숫자만)';
    } else if (dimension === 3) {
        return index === 0 ? 'X축 (모든 타입)' :
            index === 1 ? 'Y축 (숫자만)' :
                '크기/색상 (숫자만)';
    } else { // 4차원
        return index === 0 ? 'X축 (모든 타입)' :
            index === 1 ? 'Y축 (숫자만)' :
                index === 2 ? '크기 (숫자만)' :
                    '색상 (숫자만)';
    }
}

function updateAllFieldOptions() {
    const dimension = parseInt(document.getElementById('dimensionSelect').value);
    if (!dimension) return;

    const fieldTypes = analyzeFieldTypes(raw_data);
    const allFields = Object.keys(fieldTypes);

    // 현재 선택된 필드들 수집
    const selectedFields = [];
    for (let i = 0; i < dimension; i++) {
        const fieldSelect = document.getElementById(`field${i}`);
        if (fieldSelect && fieldSelect.value) {
            selectedFields.push(fieldSelect.value);
        }
    }

    // 배치 업데이트로 리플로우 최소화
    const updates = [];

    for (let i = 0; i < dimension; i++) {
        const fieldSelect = document.getElementById(`field${i}`);
        if (!fieldSelect) continue;

        const currentValue = fieldSelect.value;

        // 사용 가능한 필드 필터링
        let availableFields = allFields;
        if (i > 0) {
            availableFields = availableFields.filter(field => fieldTypes[field] === 'double');
        }
        availableFields = availableFields.filter(field =>
            !selectedFields.includes(field) || field === currentValue
        );

        // 옵션 변경사항 준비
        const newOptions = ['<option value="">필드 선택</option>'];
        availableFields.forEach(field => {
            const typeLabel = fieldTypes[field] === 'string' ? '[문자]' : '[숫자]';
            const selected = field === currentValue ? ' selected' : '';
            newOptions.push(`<option value="${field}"${selected}>${typeLabel} ${field}</option>`);
        });

        updates.push({
            select: fieldSelect,
            html: newOptions.join('')
        });
    }

    // 배치 DOM 업데이트
    updates.forEach(update => {
        if (update.select.innerHTML !== update.html) {
            update.select.innerHTML = update.html;
        }
    });

    checkFormComplete();
}

function updateChartTypes(types) {
    const select = document.getElementById('chartTypeSelect');
    select.innerHTML = '<option value="">차트 타입 선택</option>';

    types.forEach(type => {
        select.innerHTML += `<option value="${type.value}">${type.label}</option>`;
    });

    select.onchange = checkFormComplete;
}

function checkFormComplete() {
    const dimension = document.getElementById('dimensionSelect').value;
    const chartType = document.getElementById('chartTypeSelect').value;

    let allFieldsSelected = true;
    if (dimension) {
        for (let i = 0; i < parseInt(dimension); i++) {
            const fieldElement = document.getElementById(`field${i}`);
            if (!fieldElement || !fieldElement.value) {
                allFieldsSelected = false;
                break;
            }
        }
    }

    const isComplete = dimension && chartType && allFieldsSelected;
    document.getElementById('createChartBtn').disabled = !isComplete;
}

// ============================================================================
// 차트 생성 함수 (새로운 통합 시스템 사용)
// ============================================================================

window.createVisualization = function () {
    if (!raw_data || raw_data.length === 0) {
        showError('데이터를 먼저 생성해주세요');
        return;
    }

    const dimension = parseInt(document.getElementById('dimensionSelect').value);
    const chartType = document.getElementById('chartTypeSelect').value;

    // 선택된 필드들 수집
    const selectedFields = [];
    for (let i = 0; i < dimension; i++) {
        const fieldValue = document.getElementById(`field${i}`)?.value;
        if (fieldValue) {
            selectedFields.push(fieldValue);
        }
    }

    if (selectedFields.length !== dimension) {
        showError('모든 필드를 선택해주세요');
        return;
    }

    try {
        updateStatus('시각화 생성 중...', 'info');

        // 데이터 매핑 생성
        const dataMapping = createDataMapping(selectedFields, dimension);
        console.log('[CREATE_VIZ] 데이터 매핑:', dataMapping);

        // 차트 설정 생성
        const chartConfig = {
            type: chartType,
            dataMapping: dataMapping,
            options: {
                plugins: {
                    title: {
                        display: true,
                        text: `${chartType} Chart (${dimension}D)`
                    }
                }
            }
        };

        // 기존 차트 정리
        if (currentChartWrapper) {
            currentChartWrapper.destroy();
            currentChartWrapper = null;
        }

        // 차트 컨테이너 준비
        const chartContainer = document.getElementById('chartContainer');
        chartContainer.style.display = 'block';
        chartContainer.innerHTML = `
            <h3>시각화 결과</h3>
            <div id="chartInfo" class="chart-info">차트 정보가 여기에 표시됩니다</div>
            <div class="chart-canvas-wrapper" style="flex: 1; position: relative; min-height: 300px;">
            </div>
        `;

        const canvasWrapper = chartContainer.querySelector('.chart-canvas-wrapper');

        // 🆕 새로운 통합 시스템으로 차트 생성
        currentChartWrapper = generateChart(raw_data, chartConfig, canvasWrapper);

        // 이벤트 리스너 등록
        currentChartWrapper.on('dataUpdated', (newData) => {
            console.log('[CHART] 데이터 업데이트:', newData.length, '개');
        });

        currentChartWrapper.on('resized', (dimensions) => {
            console.log('[CHART] 크기 변경:', dimensions);
        });

        currentChartWrapper.on('error', (error) => {
            console.error('[CHART] 차트 에러:', error);
            showError('차트 오류: ' + error.message);
        });

        currentChartWrapper.on('destroyed', () => {
            console.log('[CHART] 차트 정리됨');
        });

        // UI 업데이트
        displayChartInfo(chartType, selectedFields, raw_data.length);
        updateStatus('시각화 생성 완료!', 'success');
        updateStepIndicator(3);

    } catch (error) {
        console.error('[CHART] 생성 오류:', error);
        showError('차트 생성 실패: ' + error.message);
        updateStatus('차트 생성 실패', 'error');
    }
};

// 데이터 매핑 생성 함수
function createDataMapping(selectedFields, dimension) {
    const mapping = {};

    if (dimension >= 1) mapping.x = selectedFields[0];
    if (dimension >= 2) mapping.y = selectedFields[1];
    if (dimension >= 3) {
        // 3차원에서는 size 또는 color 중 하나
        mapping.size = selectedFields[2];
    }
    if (dimension >= 4) {
        // 4차원에서는 size와 color 모두
        mapping.color = selectedFields[3];
    }

    return mapping;
}

// 차트 정보 표시
function displayChartInfo(chartType, selectedFields, dataCount) {
    const info = document.getElementById('chartInfo');
    const fieldsInfo = selectedFields.join(' → ');

    info.innerHTML = `
        <strong>차트 타입:</strong> ${chartType} | 
        <strong>차원:</strong> ${selectedFields.length}D | 
        <strong>선택된 필드:</strong> ${fieldsInfo}<br>
        <strong>데이터 개수:</strong> ${dataCount}개
    `;
}

// 데이터 생성기로 돌아가기 (데이터 정리)
window.goBackToGenerator = function () {
    // 현재 차트 정리
    if (currentChartWrapper) {
        currentChartWrapper.destroy();
        currentChartWrapper = null;
    }

    // 전역 데이터 정리
    clearAllChartData();
    raw_data = null;

    window.location.href = 'index.html';
};

// ============================================================================
// 페이지 초기화
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('=== 차트 페이지 초기화 ===');

    // 크기 스케일링 변경 핸들러
    document.getElementById('sizeScaling').addEventListener('change', function () {
        const sigmoidContainer = document.getElementById('sigmoidKContainer');
        sigmoidContainer.style.display = this.value === 'sigmoid' ? 'flex' : 'none';
    });

    // 전역 데이터 가져오기
    raw_data = getRawData();

    if (!raw_data || raw_data.length === 0) {
        updateStatus('데이터가 없습니다. 데이터 생성기로 돌아가주세요.', 'error');
        // 뒤로가기 버튼만 표시
        document.getElementById('chartConfigSection').style.display = 'none';
        return;
    }

    const pointCount = raw_data.length;
    const fieldNames = Object.keys(raw_data[0] || {}).join(', ');

    updateStatus(`✅ ${pointCount}개 데이터 로드 완료 | 필드: ${fieldNames}`, 'success');
    updateDimensionOptions(raw_data);
    updateStepIndicator(2);
});

// 페이지 언로드시 정리
window.addEventListener('beforeunload', () => {
    if (currentChartWrapper) {
        currentChartWrapper.destroy();
    }
    clearAllChartData();
});
