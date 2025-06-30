// graph_complete.js
// 차트 설정 및 시각화 페이지 실행 로직

// 모듈 imports
import {
    convertToAxisFormat,
    getAvailableChartTypes,
    validateAxisAssignment,
    validateDataIntegrity
} from './chart_gen/data_processor.js';

import { createVisualization } from './chart_gen/chart_factory.js';
import { prepareDataForChart } from './chart_gen/data_processor.js';

// 전역 변수들
let globalData = [];
let convertedData = null;
let metadata = null;
let currentChart = null;

// ============================================================================
// 유틸리티 함수들
// ============================================================================

function updateStatus(message, type = 'info') {
    console.log(`[STATUS] ${message}`);
    const dataInfo = document.getElementById('data-info');
    dataInfo.innerHTML = `<strong>${message}</strong>`;
    dataInfo.className = `data-info ${type}`;
}

function showError(message) {
    const errorDiv = document.getElementById('errorDisplay');
    errorDiv.textContent = `오류: ${message}`;
    errorDiv.style.display = 'block';

    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

function updateStepIndicator(activeStep) {
    for (let i = 1; i <= 3; i++) {
        const step = document.getElementById(`step${i}`);
        step.className = 'step';
        if (i < activeStep) step.className += ' completed';
        else if (i === activeStep) step.className += ' active';
    }
}

function analyzeFieldTypes(data) {
    if (!data || data.length === 0) return {};

    const sample = data[0];
    const fieldTypes = {};

    for (const [field, value] of Object.entries(sample)) {
        if (typeof value === 'number') {
            fieldTypes[field] = 'double';
        } else if (typeof value === 'string') {
            fieldTypes[field] = 'string';
        } else {
            fieldTypes[field] = 'double';
        }
    }

    return fieldTypes;
}

// ============================================================================
// UI 업데이트 함수들
// ============================================================================

function updateDimensionOptions(data) {
    const select = document.getElementById('dimensionSelect');
    const fieldCount = Object.keys(data[0] || {}).length;

    select.innerHTML = '<option value="">차원 선택</option>';

    // 수정: 최대 차원수는 전체 필드 개수 (value 필드 분리 없음)
    for (let dim = 1; dim <= Math.min(fieldCount, 4); dim++) {
        const label = dim === 1 ? '1차원 (선형/카테고리)' :
            dim === 2 ? '2차원 (X-Y 산점도)' :
                dim === 3 ? '3차원 (X-Y + 크기/색상)' :
                    '4차원 (X-Y + 크기 + 색상)';
        select.innerHTML += `<option value="${dim}">${label}</option>`;
    }

    // 이벤트 리스너 추가
    select.onchange = updateFieldSelection;
}

// 새로운 함수: 필드 선택 UI 생성
function updateFieldSelection() {
    const dimension = parseInt(document.getElementById('dimensionSelect').value);
    const container = document.getElementById('axisMapping');

    if (!dimension) {
        container.innerHTML = '';
        updateChartTypes([]);
        return;
    }

    const fieldTypes = analyzeFieldTypes(globalData);
    const allFields = Object.keys(fieldTypes);

    container.innerHTML = '';

    console.log(`[FIELD_SELECTION] ${dimension}차원 선택 → ${dimension}개 필드 선택`);

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

    // 초기 필드 옵션 업데이트
    updateAllFieldOptions();
    updateChartTypes(getAvailableChartTypes(dimension));
}

// 필드별 설명 생성
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

// 모든 필드 선택기의 옵션 업데이트 (중복 방지)
function updateAllFieldOptions() {
    const dimension = parseInt(document.getElementById('dimensionSelect').value);
    if (!dimension) return;

    const fieldTypes = analyzeFieldTypes(globalData);
    const allFields = Object.keys(fieldTypes);

    // 현재 선택된 필드들 수집
    const selectedFields = [];
    for (let i = 0; i < dimension; i++) {
        const fieldSelect = document.getElementById(`field${i}`);
        if (fieldSelect && fieldSelect.value) {
            selectedFields.push(fieldSelect.value);
        }
    }

    console.log('[FIELD_OPTIONS] 선택된 필드들:', selectedFields);

    // 각 필드 선택기의 옵션 업데이트
    for (let i = 0; i < dimension; i++) {
        const fieldSelect = document.getElementById(`field${i}`);
        if (!fieldSelect) continue;

        const currentValue = fieldSelect.value; // 현재 선택값 보존

        // 사용 가능한 필드 필터링
        let availableFields = allFields;

        // 1. 타입 제한 (첫 번째 필드는 모든 타입, 나머지는 숫자만)
        if (i > 0) {
            availableFields = availableFields.filter(field => fieldTypes[field] === 'double');
        }

        // 2. 중복 제거 (현재 필드에서 선택한 값은 제외하지 않음)
        availableFields = availableFields.filter(field =>
            !selectedFields.includes(field) || field === currentValue
        );

        // 옵션 재생성
        fieldSelect.innerHTML = '<option value="">필드 선택</option>';
        availableFields.forEach(field => {
            const typeLabel = fieldTypes[field] === 'string' ? '[문자]' : '[숫자]';
            const option = document.createElement('option');
            option.value = field;
            option.textContent = `${typeLabel} ${field}`;
            fieldSelect.appendChild(option);
        });

        // 기존 선택값 복원 (가능한 경우)
        if (currentValue && availableFields.includes(currentValue)) {
            fieldSelect.value = currentValue;
        }
    }

    checkFormComplete();
}

function updateAxisMapping() {
    const dimension = parseInt(document.getElementById('dimensionSelect').value);
    const container = document.getElementById('axisMapping');

    if (!dimension) {
        container.innerHTML = '';
        updateChartTypes([]);
        return;
    }

    const fieldTypes = analyzeFieldTypes(globalData);
    const fields = Object.keys(fieldTypes);

    container.innerHTML = '';

    const axisNames = ['X축', 'Y축', 'Z축', 'W축'];
    const axisIds = ['xAxis', 'yAxis', 'zAxis', 'wAxis'];
    const axisDescriptions = [
        '가로축 (문자열/숫자)',
        '세로축 (숫자만)',
        '크기/색상 (숫자만)',
        '추가 인코딩 (숫자만)'
    ];

    // 수정: 차원수만큼만 축 생성 (value 필드 제외)
    for (let i = 0; i < dimension; i++) {
        const div = document.createElement('div');
        div.className = 'axis-selector';

        const label = document.createElement('label');
        label.innerHTML = `${axisNames[i]}:<br><small>${axisDescriptions[i]}</small>`;

        const select = document.createElement('select');
        select.id = axisIds[i];
        select.onchange = updateAllAxisOptions; // 수정: 모든 축 옵션 업데이트

        select.innerHTML = '<option value="">필드 선택</option>';

        div.appendChild(label);
        div.appendChild(select);
        container.appendChild(div);
    }

    // 초기 축 옵션 업데이트
    updateAllAxisOptions();
    updateChartTypes(getAvailableChartTypes(dimension));
}

// 새로운 함수: 모든 축의 옵션을 업데이트 (중복 방지)
function updateAllAxisOptions() {
    const dimension = parseInt(document.getElementById('dimensionSelect').value);
    if (!dimension) return;

    const fieldTypes = analyzeFieldTypes(globalData);
    const fields = Object.keys(fieldTypes);
    const axisIds = ['xAxis', 'yAxis', 'zAxis', 'wAxis'];

    // 현재 선택된 필드들 수집
    const selectedFields = [];
    for (let i = 0; i < dimension; i++) {
        const axisSelect = document.getElementById(axisIds[i]);
        if (axisSelect && axisSelect.value) {
            selectedFields.push(axisSelect.value);
        }
    }

    console.log('[AXIS_UPDATE] 선택된 필드들:', selectedFields);

    // 각 축의 옵션 업데이트
    for (let i = 0; i < dimension; i++) {
        const axisSelect = document.getElementById(axisIds[i]);
        if (!axisSelect) continue;

        const currentValue = axisSelect.value; // 현재 선택값 보존

        // 사용 가능한 필드 필터링
        let availableFields = fields;

        // 1. 타입 제한 (X축은 모든 타입, 나머지는 숫자만)
        if (i > 0) {
            availableFields = availableFields.filter(field => fieldTypes[field] === 'double');
        }

        // 2. 중복 제거 (현재 축에서 선택한 값은 제외하지 않음)
        availableFields = availableFields.filter(field =>
            !selectedFields.includes(field) || field === currentValue
        );

        // 옵션 재생성
        axisSelect.innerHTML = '<option value="">필드 선택</option>';
        availableFields.forEach(field => {
            const typeLabel = fieldTypes[field] === 'string' ? '[문자]' : '[숫자]';
            const option = document.createElement('option');
            option.value = field;
            option.textContent = `${typeLabel} ${field}`;
            axisSelect.appendChild(option);
        });

        // 기존 선택값 복원 (가능한 경우)
        if (currentValue && availableFields.includes(currentValue)) {
            axisSelect.value = currentValue;
        }
    }

    // Value 필드 옵션 업데이트
    updateValueFieldOptions();
}

function updateValueFieldOptions() {
    const dimension = parseInt(document.getElementById('dimensionSelect').value);
    if (!dimension) return;

    // 축에서 사용된 필드들 수집
    const usedFields = [];
    const axisIds = ['xAxis', 'yAxis', 'zAxis', 'wAxis'];

    for (let i = 0; i < dimension; i++) {
        const axisValue = document.getElementById(axisIds[i])?.value;
        if (axisValue) usedFields.push(axisValue);
    }

    console.log('[VALUE_UPDATE] 축에서 사용된 필드들:', usedFields);

    // Value 필드 선택기 생성 (없는 경우)
    let valueSelector = document.getElementById('valueFieldSelector');
    if (!valueSelector) {
        valueSelector = document.createElement('div');
        valueSelector.id = 'valueFieldSelector';
        valueSelector.className = 'axis-selector';

        const label = document.createElement('label');
        label.innerHTML = 'Value 필드:<br><small>출력 변수 (모든 타입)</small>';

        const select = document.createElement('select');
        select.id = 'valueField';
        select.onchange = checkFormComplete;

        valueSelector.appendChild(label);
        valueSelector.appendChild(select);
        document.getElementById('axisMapping').appendChild(valueSelector);
    }

    // Value 필드 옵션 업데이트
    const valueSelect = document.getElementById('valueField');
    const fieldTypes = analyzeFieldTypes(globalData);
    const allFields = Object.keys(fieldTypes);
    const availableFields = allFields.filter(field => !usedFields.includes(field));

    console.log('[VALUE_UPDATE] Value 필드 사용 가능한 필드들:', availableFields);

    const currentValue = valueSelect.value; // 현재 선택값 보존

    valueSelect.innerHTML = '<option value="">Value 필드 선택</option>';
    availableFields.forEach(field => {
        const typeLabel = fieldTypes[field] === 'string' ? '[문자]' : '[숫자]';
        const option = document.createElement('option');
        option.value = field;
        option.textContent = `${typeLabel} ${field}`;
        valueSelect.appendChild(option);
    });

    // 기존 선택값 복원 (가능한 경우)
    if (currentValue && availableFields.includes(currentValue)) {
        valueSelect.value = currentValue;
    } else if (!availableFields.includes(currentValue)) {
        valueSelect.value = ''; // 선택값이 더 이상 사용 불가능하면 초기화
    }

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
        // 모든 필드가 선택되었는지 확인
        for (let i = 0; i < parseInt(dimension); i++) {
            const fieldElement = document.getElementById(`field${i}`);
            if (!fieldElement || !fieldElement.value) {
                allFieldsSelected = false;
                break;
            }
        }
    }

    const isComplete = dimension && chartType && allFieldsSelected;

    console.log('[FORM_CHECK] 폼 완성 상태:', {
        dimension: !!dimension,
        chartType: !!chartType,
        allFieldsSelected,
        isComplete
    });

    document.getElementById('createChartBtn').disabled = !isComplete;
}

function displayMetadata(metadata) {
    const display = document.getElementById('metadataDisplay');
    display.textContent = JSON.stringify(metadata, null, 2);
}

function displayChartInfo(convertedData, chartType, selectedFields) {
    const info = document.getElementById('chartInfo');
    const basicData = convertedData.basic_data;

    const fieldsInfo = selectedFields.join(' → ');
    const axisInfo = basicData.axes.map(axis =>
        `${axis.name} (${axis.type}${axis.allow_dup ? ', 중복허용' : ''})`
    ).join(' | ');

    info.innerHTML = `
        <strong>차트 타입:</strong> ${chartType} | 
        <strong>차원:</strong> ${basicData.dim}D | 
        <strong>선택된 필드:</strong> ${fieldsInfo}<br>
        <strong>데이터 개수:</strong> ${convertedData.data_value.length}개 | 
        <strong>축 정보:</strong> ${axisInfo}
    `;
}

// ============================================================================
// 메인 함수들
// ============================================================================

function loadDataFromSession() {
    try {
        const dataString = sessionStorage.getItem('generatedBinaryData');
        if (!dataString) {
            showError('세션에서 데이터를 찾을 수 없습니다. 데이터를 다시 생성해주세요.');
            updateStatus('데이터 없음 - 데이터 생성기로 돌아가주세요', 'error');
            return false;
        }

        globalData = JSON.parse(dataString);
        console.log('📊 세션에서 데이터 로드:', globalData);

        const pointCount = globalData.length;
        const fieldNames = Object.keys(globalData[0] || {}).join(', ');

        updateStatus(`✅ ${pointCount}개 데이터 로드 완료 | 필드: ${fieldNames}`, 'success');

        updateDimensionOptions(globalData);
        updateStepIndicator(2);

        return true;

    } catch (error) {
        console.error('❌ 세션 데이터 로드 실패:', error);
        showError('데이터 로드 실패: ' + error.message);
        updateStatus('데이터 로드 실패', 'error');
        return false;
    }
}

window.createVisualization = function () {
    if (globalData.length === 0) {
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

    console.log('[CREATE_VIZ] 선택된 필드들:', selectedFields);

    if (selectedFields.length !== dimension) {
        showError('모든 필드를 선택해주세요');
        return;
    }

    // 필드 타입 검증
    const fieldTypes = analyzeFieldTypes(globalData);
    const validation = validateSelectedFields(selectedFields, fieldTypes);
    if (!validation.isValid) {
        showError(validation.errors.join('; '));
        return;
    }

    try {
        updateStatus('시각화 생성 중...', 'info');

        // 새로운 매핑 방식: 선택된 필드들을 순서대로 축에 할당
        const fieldMapping = createFieldMapping(selectedFields, dimension);
        console.log('[CREATE_VIZ] 필드 매핑:', fieldMapping);

        // 데이터 변환
        convertedData = convertToAxisFormat(globalData, fieldMapping.axisMapping, fieldMapping.valueField);
        metadata = convertedData.basic_data;

        // 스케일링 설정
        const scalingConfig = {
            type: document.getElementById('sizeScaling').value,
            params: document.getElementById('sizeScaling').value === 'sigmoid' ?
                { k: parseFloat(document.getElementById('sigmoidK').value) } : {}
        };

        // 데이터 준비
        const preparedData = prepareDataForChart(convertedData.data_value, convertedData.basic_data.axes);

        // 데이터셋 객체 생성
        const dataset = {
            name: `${chartType} Chart`,
            dimension: dimension,
            axes: convertedData.basic_data.axes,
            dataType: `${dimension}D`
        };

        const vizType = {
            name: chartType,
            type: chartType
        };

        // 기존 차트 정리
        if (currentChart) {
            currentChart.destroy();
            currentChart = null;
        }

        // 차트 컨테이너 표시
        const chartContainer = document.getElementById('chartContainer');
        chartContainer.style.display = 'block';
        const canvas = document.getElementById('chart');

        // GitHub 차트 시스템 활용하여 차트 생성
        const chartConfig = createVisualization(
            dataset,
            vizType,
            preparedData,
            scalingConfig,
            {},
            {}
        );

        // Chart.js 인스턴스 생성
        currentChart = new Chart(canvas, chartConfig);

        // UI 업데이트
        displayMetadata(metadata);
        displayChartInfo(convertedData, chartType, selectedFields);
        document.getElementById('metadataSection').style.display = 'block';

        updateStatus('시각화 생성 완료!', 'success');
        updateStepIndicator(3);

    } catch (error) {
        console.error('[CHART] 생성 오류:', error);
        showError('차트 생성 실패: ' + error.message);
        updateStatus('차트 생성 실패', 'error');
    }
};

// 새로운 함수: 선택된 필드들을 축에 매핑
function createFieldMapping(selectedFields, dimension) {
    const axisMapping = {};
    let valueField;

    if (dimension === 1) {
        // 1차원: 하나의 필드만 사용
        axisMapping.x = selectedFields[0];
        valueField = selectedFields[0]; // 같은 필드를 value로도 사용
    } else if (dimension === 2) {
        // 2차원: X축, Y축
        axisMapping.x = selectedFields[0];
        axisMapping.y = selectedFields[1];
        valueField = selectedFields[0]; // 첫 번째 필드를 value로 사용
    } else if (dimension === 3) {
        // 3차원: X축, Y축, 크기/색상
        axisMapping.x = selectedFields[0];
        axisMapping.y = selectedFields[1];
        axisMapping.z = selectedFields[2];
        valueField = selectedFields[0]; // 첫 번째 필드를 value로 사용
    } else if (dimension === 4) {
        // 4차원: X축, Y축, 크기, 색상
        axisMapping.x = selectedFields[0];
        axisMapping.y = selectedFields[1];
        axisMapping.z = selectedFields[2];
        axisMapping.w = selectedFields[3];
        valueField = selectedFields[0]; // 첫 번째 필드를 value로 사용
    }

    console.log('[FIELD_MAPPING] 축 매핑:', axisMapping, 'Value:', valueField);

    return { axisMapping, valueField };
}

// 새로운 함수: 선택된 필드들의 타입 검증
function validateSelectedFields(selectedFields, fieldTypes) {
    const errors = [];

    // 첫 번째 필드는 모든 타입 허용
    // 나머지 필드들은 숫자만 허용
    for (let i = 1; i < selectedFields.length; i++) {
        const fieldName = selectedFields[i];
        const fieldType = fieldTypes[fieldName];

        if (fieldType === 'string') {
            errors.push(`필드 ${i + 1} (${fieldName})은 문자열입니다. 두 번째 필드부터는 숫자만 사용할 수 있습니다.`);
        }
    }

    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

window.goBackToGenerator = function () {
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

    // 세션에서 데이터 로드
    if (!loadDataFromSession()) {
        // 데이터가 없으면 뒤로가기 버튼만 활성화
        const backBtn = document.querySelector('.secondary-btn');
        if (backBtn) backBtn.style.display = 'block';
    }
});

// 페이지 언로드시 정리
window.addEventListener('beforeunload', () => {
    if (currentChart) {
        currentChart.destroy();
    }
});