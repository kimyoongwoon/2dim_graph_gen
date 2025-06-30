// ============================================================================
// graph_complete.js - 차트 설정 및 시각화 페이지 (sessionStorage 버전)
// ============================================================================

import { generateChart } from './chart_gen/unified/index.js';
import { clearAllChartData, showError } from './chart_gen/unified/index.js';
import { analyzeFieldTypes } from './chart_gen/data_processor.js';
import { getAvailableChartTypes } from './chart_gen/data_processor.js';

// 전역 변수들
let currentChartWrapper = null;
let raw_data = null;

// ============================================================================
// 데이터 로드 함수
// ============================================================================

/**
 * sessionStorage에서 이전에 생성된 데이터를 로드
 */
function loadDataFromSessionStorage() {
    updateStatus('저장된 데이터 로드 중...', 'info');

    try {
        // sessionStorage에서 데이터 읽기
        const dataString = sessionStorage.getItem('chartData');
        const metaString = sessionStorage.getItem('chartMeta');

        if (!dataString || !metaString) {
            throw new Error('저장된 데이터가 없습니다');
        }

        // JSON 파싱
        const data = JSON.parse(dataString);
        const meta = JSON.parse(metaString);

        // 데이터 유효성 검사
        if (!Array.isArray(data) || data.length === 0) {
            throw new Error('유효하지 않은 데이터입니다');
        }

        // 전역 변수에 할당
        raw_data = data;

        console.log('[CHART] sessionStorage 데이터 로드 성공:', {
            recordCount: data.length,
            fields: meta.fieldNames,
            dataSize: (dataString.length / 1024).toFixed(2) + 'KB',
            timestamp: new Date(meta.timestamp).toLocaleString()
        });

        const fieldNames = meta.fieldNames.join(', ');
        updateStatus(`✅ ${data.length}개 데이터 로드 완료 | 필드: ${fieldNames}`, 'success');

        // UI 초기화
        updateDimensionOptions(data);
        updateStepIndicator(2);

        // 차트 설정 섹션 표시
        document.getElementById('chartConfigSection').style.display = 'block';

    } catch (error) {
        console.error('[CHART] sessionStorage 로드 오류:', error);
        updateStatus(`데이터 로드 실패: ${error.message}. 데이터 생성기로 돌아가주세요.`, 'error');
        document.getElementById('chartConfigSection').style.display = 'none';
    }
}

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



// 데이터 매핑 생성 함수 (디버깅 강화)
function createDataMapping(selectedFields, dimension) {
    console.log('[CREATE_MAPPING] === 디버깅 시작 ===');
    console.log('[CREATE_MAPPING] 입력 selectedFields:', selectedFields);
    console.log('[CREATE_MAPPING] selectedFields 타입:', typeof selectedFields);
    console.log('[CREATE_MAPPING] selectedFields.length:', selectedFields?.length);
    console.log('[CREATE_MAPPING] 입력 dimension:', dimension);

    // 각 필드 개별 검사
    selectedFields.forEach((field, index) => {
        console.log(`[CREATE_MAPPING] 필드 ${index}:`, {
            value: field,
            type: typeof field,
            length: field?.length,
            trimmed: field?.trim(),
            isEmpty: !field || field.trim() === ''
        });
    });

    const mapping = {};

    // 1차원: x만
    if (dimension >= 1 && selectedFields[0]) {
        const field = selectedFields[0].trim();
        if (field) {
            mapping.x = field;
            console.log('[CREATE_MAPPING] X축 설정:', field);
        } else {
            console.error('[CREATE_MAPPING] X축 필드가 빈 값입니다!');
        }
    }

    // 2차원: x, y
    if (dimension >= 2 && selectedFields[1]) {
        const field = selectedFields[1].trim();
        if (field) {
            mapping.y = field;
            console.log('[CREATE_MAPPING] Y축 설정:', field);
        } else {
            console.error('[CREATE_MAPPING] Y축 필드가 빈 값입니다!');
        }
    }

    // 3차원: x, y, size
    if (dimension >= 3 && selectedFields[2]) {
        const field = selectedFields[2].trim();
        if (field) {
            mapping.size = field;
            console.log('[CREATE_MAPPING] Size축 설정:', field);
        } else {
            console.error('[CREATE_MAPPING] Size축 필드가 빈 값입니다!');
        }
    }

    // 4차원: x, y, size, color
    if (dimension >= 4 && selectedFields[3]) {
        const field = selectedFields[3].trim();
        if (field) {
            mapping.color = field;
            console.log('[CREATE_MAPPING] Color축 설정:', field);
        } else {
            console.error('[CREATE_MAPPING] Color축 필드가 빈 값입니다!');
        }
    }

    console.log('[CREATE_MAPPING] 생성된 매핑:', mapping);

    // Object.values 검사
    const mappingValues = Object.values(mapping);
    console.log('[CREATE_MAPPING] Object.values(mapping):', mappingValues);

    mappingValues.forEach((value, index) => {
        console.log(`[CREATE_MAPPING] 매핑값 ${index}:`, {
            value: value,
            type: typeof value,
            length: value?.length,
            isEmpty: !value || value.trim() === ''
        });
    });

    // 빈 값 제거
    const cleanMapping = {};
    Object.entries(mapping).forEach(([key, value]) => {
        if (value && value.trim && value.trim() !== '') {
            cleanMapping[key] = value.trim();
        } else {
            console.warn(`[CREATE_MAPPING] 빈 값 제거: ${key} = "${value}"`);
        }
    });

    console.log('[CREATE_MAPPING] 정리된 매핑:', cleanMapping);
    console.log('[CREATE_MAPPING] === 디버깅 완료 ===');

    return cleanMapping;
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





window.createVisualization = function () {
    if (!raw_data || raw_data.length === 0) {
        showError('데이터를 먼저 생성해주세요');
        return;
    }

    const dimension = parseInt(document.getElementById('dimensionSelect').value);
    const chartType = document.getElementById('chartTypeSelect').value;

    console.log('[CREATE_VIZ] 시작:', { dimension, chartType });

    // 선택된 필드들 수집 (디버깅 강화)
    const selectedFields = [];
    for (let i = 0; i < dimension; i++) {
        const fieldElement = document.getElementById(`field${i}`);
        const fieldValue = fieldElement?.value;

        console.log(`[CREATE_VIZ] 필드 ${i}:`, {
            element: fieldElement ? 'exists' : 'null',
            value: fieldValue,
            trimmed: fieldValue?.trim()
        });

        if (fieldValue && fieldValue.trim() !== '') {
            selectedFields.push(fieldValue.trim());
        } else {
            showError(`필드 ${i + 1}이 선택되지 않았습니다`);
            return;
        }
    }

    console.log('[CREATE_VIZ] 수집된 필드들:', selectedFields);

    if (selectedFields.length !== dimension) {
        showError(`선택된 필드 수(${selectedFields.length})가 차원수(${dimension})와 일치하지 않습니다`);
        return;
    }

    // 실제 데이터 필드명 확인
    const availableFields = Object.keys(raw_data[0] || {});
    console.log('[CREATE_VIZ] 사용 가능한 필드들:', availableFields);

    // 선택된 필드가 실제 데이터에 있는지 확인
    const missingFields = selectedFields.filter(field => !availableFields.includes(field));
    if (missingFields.length > 0) {
        showError(`선택된 필드가 데이터에 없습니다: ${missingFields.join(', ')}`);
        return;
    }

    try {
        updateStatus('시각화 생성 중...', 'info');

        // 데이터 매핑 생성
        const dataMapping = createDataMapping(selectedFields, dimension);
        console.log('[CREATE_VIZ] 데이터 매핑:', dataMapping);

        // 매핑 검증
        const mappingValues = Object.values(dataMapping);
        if (mappingValues.length === 0) {
            throw new Error('데이터 매핑이 비어있습니다');
        }

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

    // 🔥 sessionStorage 정리 (선택사항)
    // sessionStorage.removeItem('chartData');
    // sessionStorage.removeItem('chartMeta');

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

    // 🔥 sessionStorage에서 데이터 로드
    loadDataFromSessionStorage();
});

// 페이지 언로드시 정리
window.addEventListener('beforeunload', () => {
    if (currentChartWrapper) {
        currentChartWrapper.destroy();
    }
    clearAllChartData();

    // 🔥 선택사항: sessionStorage 정리 (보통은 브라우저 세션 종료시까지 유지)
    // sessionStorage.removeItem('chartData');
    // sessionStorage.removeItem('chartMeta');
});