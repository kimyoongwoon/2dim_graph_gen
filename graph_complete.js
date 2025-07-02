// ============================================================================
// graph_complete.js - 성능 최적화 버전 (디버깅 로그 최소화)
// ============================================================================

import { loadFromSessionStorage, getStorageInfo } from './chart_data/data_load.js';
import {
    analyzeFieldTypes,
    getAvailableChartTypes,
    calculateAvailableDimensions,
    validateFieldConstraints,
    checkFormCompleteness,
    getFieldDescription
} from './chart_data/data_validate.js';
import {
    createDataMapping,
    createChartConfig,
    prepareGenerateChartParams,
    validateCompleteConfiguration
} from './chart_data/data_processor.js';
import { showError, clearAllChartData } from './shared/error_handler.js';
import { generateChart } from './chart_gen/index.js';

// 전역 변수들
let currentChartWrapper = null;
let raw_data = null;
let fieldTypes = {};

// 성능 최적화: 디버깅 모드 설정
const DEBUG_MODE = false; // 🔥 성능을 위해 false로 설정

function debugLog(...args) {
    if (DEBUG_MODE) {
        console.log(...args);
    }
}

// ============================================================================
// 데이터 로드 함수 (성능 최적화)
// ============================================================================

function loadDataFromSessionStorage() {
    updateStatus('저장된 데이터 로드 중...', 'info');

    try {
        const { data, meta } = loadFromSessionStorage();
        raw_data = data;

        const fieldNames = meta.fieldNames.join(', ');
        updateStatus(`✅ ${data.length}개 데이터 로드 완료 | 필드: ${fieldNames}`, 'success');

        fieldTypes = analyzeFieldTypes(data);
        initializeUI(data);
        updateStepIndicator(2);
        document.getElementById('chartConfigSection').style.display = 'block';

    } catch (error) {
        console.error('[CHART] 데이터 로드 오류:', error);
        updateStatus(`데이터 로드 실패: ${error.message}. 데이터 생성기로 돌아가주세요.`, 'error');
        document.getElementById('chartConfigSection').style.display = 'none';
    }
}

function initializeUI(data) {
    const maxDimensions = calculateAvailableDimensions(data);
    updateDimensionOptions(maxDimensions);
}

// ============================================================================
// 유틸리티 함수들
// ============================================================================

function updateStatus(message, type = 'info') {
    const dataInfo = document.getElementById('data-info');
    if (dataInfo) {
        dataInfo.innerHTML = `<strong>${message}</strong>`;
        dataInfo.className = `data-info ${type}`;
    }
}

function updateStepIndicator(activeStep) {
    for (let i = 1; i <= 3; i++) {
        const step = document.getElementById(`step${i}`);
        if (step) {
            step.className = 'step';
            if (i < activeStep) step.className += ' completed';
            else if (i === activeStep) step.className += ' active';
        }
    }
}

// ============================================================================
// UI 업데이트 함수들 (성능 최적화)
// ============================================================================

function updateDimensionOptions(maxDimensions) {
    const select = document.getElementById('dimensionSelect');
    if (!select) return;

    select.innerHTML = '<option value="">차원 선택</option>';

    for (let dim = 1; dim <= maxDimensions; dim++) {
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

    container.innerHTML = '';

    // 차원수만큼 필드 선택기 생성 (최적화된 DOM 조작)
    const fragment = document.createDocumentFragment();

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
        fragment.appendChild(div);
    }

    container.appendChild(fragment); // 🔥 한 번에 DOM 추가

    updateAllFieldOptions();

    const chartTypes = getAvailableChartTypes(dimension);
    updateChartTypes(chartTypes);
}

function updateChartTypes(types) {
    const select = document.getElementById('chartTypeSelect');
    if (!select) return;

    select.innerHTML = '<option value="">차트 타입 선택</option>';

    types.forEach(type => {
        select.innerHTML += `<option value="${type.value}">${type.label}</option>`;
    });

    select.onchange = checkFormComplete;
}

function updateAllFieldOptions() {
    const dimension = parseInt(document.getElementById('dimensionSelect').value);
    if (!dimension) return;

    const allFields = Object.keys(fieldTypes);
    const selectedFields = [];

    for (let i = 0; i < dimension; i++) {
        const fieldSelect = document.getElementById(`field${i}`);
        if (fieldSelect && fieldSelect.value) {
            selectedFields.push(fieldSelect.value);
        }
    }

    // 🔥 배치 업데이트로 리플로우 최소화
    const updates = [];

    for (let i = 0; i < dimension; i++) {
        const fieldSelect = document.getElementById(`field${i}`);
        if (!fieldSelect) continue;

        const currentValue = fieldSelect.value;
        let availableFields = allFields;

        if (i > 0) {
            availableFields = availableFields.filter(field => fieldTypes[field] === 'double');
        }
        availableFields = availableFields.filter(field =>
            !selectedFields.includes(field) || field === currentValue
        );

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

    updates.forEach(update => {
        if (update.select.innerHTML !== update.html) {
            update.select.innerHTML = update.html;
        }
    });

    checkFormComplete();
}

function checkFormComplete() {
    const dimension = parseInt(document.getElementById('dimensionSelect').value);
    const chartType = document.getElementById('chartTypeSelect').value;

    const selectedFields = [];
    if (dimension) {
        for (let i = 0; i < dimension; i++) {
            const fieldElement = document.getElementById(`field${i}`);
            if (fieldElement && fieldElement.value) {
                selectedFields.push(fieldElement.value);
            }
        }
    }

    const isComplete = checkFormCompleteness(dimension, chartType, selectedFields);
    const createBtn = document.getElementById('createChartBtn');
    if (createBtn) {
        createBtn.disabled = !isComplete;
    }
}

function displayChartInfo(chartType, selectedFields, dataCount) {
    const info = document.getElementById('chartInfo');
    if (!info) return;

    const fieldsInfo = selectedFields.join(' → ');
    info.innerHTML = `
        <strong>차트 타입:</strong> ${chartType} | 
        <strong>차원:</strong> ${selectedFields.length}D | 
        <strong>선택된 필드:</strong> ${fieldsInfo}<br>
        <strong>데이터 개수:</strong> ${dataCount}개
    `;
}

// ============================================================================
// 차트 생성 함수 (성능 최적화)
// ============================================================================

window.createVisualization = async function () {
    // 🔥 성능 측정
    console.time('차트생성');

    if (!raw_data || raw_data.length === 0) {
        showError('데이터를 먼저 생성해주세요');
        return;
    }

    const dimension = parseInt(document.getElementById('dimensionSelect').value);
    const chartType = document.getElementById('chartTypeSelect').value;

    // 선택된 필드들 수집
    const selectedFields = [];
    for (let i = 0; i < dimension; i++) {
        const fieldElement = document.getElementById(`field${i}`);
        const fieldValue = fieldElement?.value;

        if (fieldValue && fieldValue.trim() !== '') {
            selectedFields.push(fieldValue.trim());
        } else {
            showError(`필드 ${i + 1}이 선택되지 않았습니다`);
            return;
        }
    }

    // 필드 존재 여부 확인
    const availableFields = Object.keys(raw_data[0] || {});
    const missingFields = selectedFields.filter(field => !availableFields.includes(field));
    if (missingFields.length > 0) {
        showError(`선택된 필드가 데이터에 없습니다: ${missingFields.join(', ')}`);
        return;
    }

    try {
        updateStatus('시각화 생성 중...', 'info');

        // 검증 (간소화)
        const fieldValidation = validateFieldConstraints(selectedFields, fieldTypes, dimension);
        if (!fieldValidation.isValid) {
            showError(`필드 제약 오류: ${fieldValidation.errors.join(', ')}`);
            return;
        }

        const userSelections = { dimension, chartType, selectedFields };
        const configValidation = validateCompleteConfiguration(raw_data, userSelections, fieldTypes);

        if (!configValidation.isValid) {
            showError(`설정 검증 오류: ${configValidation.errors.join(', ')}`);
            return;
        }

        const { chartConfig } = prepareGenerateChartParams(raw_data, userSelections);

        // 기존 차트 정리
        if (currentChartWrapper) {
            currentChartWrapper.destroy();
            currentChartWrapper = null;
        }

        // 🔥 DOM 조작 최적화: requestAnimationFrame 사용
        requestAnimationFrame(() => {
            const chartContainer = document.getElementById('chartContainer');
            if (!chartContainer) {
                showError('chartContainer 엘리먼트를 찾을 수 없습니다');
                return;
            }

            chartContainer.style.display = 'block';
            chartContainer.innerHTML = `
                <h3>시각화 결과</h3>
                <div id="chartInfo" class="chart-info">차트 정보가 여기에 표시됩니다</div>
                <div class="chart-canvas-wrapper" style="flex: 1; position: relative; min-height: 300px;">
                </div>
            `;

            const canvasWrapper = chartContainer.querySelector('.chart-canvas-wrapper');
            if (!canvasWrapper) {
                showError('chart-canvas-wrapper를 찾을 수 없습니다');
                return;
            }

            // 🔥 차트 생성 (비동기)
            setTimeout(() => {
                try {
                    console.time('실제차트생성');
                    currentChartWrapper = generateChart(raw_data, chartConfig, canvasWrapper);
                    console.timeEnd('실제차트생성');

                    // 이벤트 리스너 등록 (간소화)
                    currentChartWrapper.on('error', (error) => {
                        console.error('[CHART] 차트 에러:', error);
                        showError('차트 오류: ' + error.message);
                    });

                    displayChartInfo(chartType, selectedFields, raw_data.length);
                    updateStatus('시각화 생성 완료!', 'success');
                    updateStepIndicator(3);

                    console.timeEnd('차트생성');

                } catch (error) {
                    console.error('[CHART] 차트 생성 오류:', error);
                    showError('차트 생성 실패: ' + error.message);
                    updateStatus('차트 생성 실패', 'error');
                }
            }, 10); // 10ms 지연으로 UI 응답성 향상
        });

    } catch (error) {
        console.error('[CHART] 검증 오류:', error);
        showError('차트 생성 실패: ' + error.message);
        updateStatus('차트 생성 실패', 'error');
    }
};

// 데이터 생성기로 돌아가기
window.goBackToGenerator = function () {
    if (currentChartWrapper) {
        currentChartWrapper.destroy();
        currentChartWrapper = null;
    }

    clearAllChartData();
    raw_data = null;
    fieldTypes = {};

    window.location.href = 'index.html';
};

// ============================================================================
// 페이지 초기화 (간소화)
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    // 크기 스케일링 변경 핸들러
    const sizeScalingSelect = document.getElementById('sizeScaling');
    if (sizeScalingSelect) {
        sizeScalingSelect.addEventListener('change', function () {
            const sigmoidContainer = document.getElementById('sigmoidKContainer');
            if (sigmoidContainer) {
                sigmoidContainer.style.display = this.value === 'sigmoid' ? 'flex' : 'none';
            }
        });
    }

    loadDataFromSessionStorage();
});

window.addEventListener('beforeunload', () => {
    if (currentChartWrapper) {
        currentChartWrapper.destroy();
    }
    clearAllChartData();
});