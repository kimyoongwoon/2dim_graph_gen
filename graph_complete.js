// ============================================================================
// graph_complete.js - 차트 생성 페이지 로직 (2D/3D 통합 시스템)
// ============================================================================

import {
    sessionStorageManager,
    dataValidator,
    dimensionCalculator,
    chartTypeProvider,
    configBuilder,
    containerCreator
} from './data_pipeline/index.js';

import { showError, clearAllChartData } from './shared/error_handler.js';
import { generateChart3D } from './3dim_chart_gen/index.js';
import { generateChart } from './2dim_chart_gen/index.js';  // 🆕 2D 차트 생성 함수 활성화

// 전역 변수들
let currentChartWrapper = null;
let raw_data = null;
let fieldTypes = {};
let numericFields = []; // 🆕 숫자 필드 목록
let currentDimension = null; // 🆕 현재 선택된 차원수
let currentIs3D = false; // 🆕 현재 3D 모드 여부

// 성능 최적화: 디버깅 모드 설정
const DEBUG_MODE = false;

function debugLog(...args) {
    if (DEBUG_MODE) {
        console.log(...args);
    }
}

// ============================================================================
// 데이터 로드 함수 (data_pipeline 모듈 사용)
// ============================================================================

function loadDataFromSessionStorage() {
    updateStatus('저장된 데이터 로드 중...', 'info');

    try {
        // sessionStorage에서 데이터 로드
        const { data, meta } = sessionStorageManager.loadRawDataFromSessionStorage();
        raw_data = data;

        const fieldNames = meta.fieldNames.join(', ');
        updateStatus(`✅ ${data.length}개 데이터 로드 완료 | 필드: ${fieldNames}`, 'success');

        // 필드 타입 분석
        fieldTypes = dataValidator.analyzeDataFieldTypes(data);

        // 🆕 숫자 필드 목록 추출
        numericFields = dimensionCalculator.getNumericFields(data);
        console.log('[CHART] 숫자 필드:', numericFields);

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
    // 사용 가능한 최대 차원수 계산
    const maxDimensions = dimensionCalculator.calculateAvailableDimensionsFromData(data);
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
// 🆕 2D/3D 통합 UI 업데이트 함수들
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

    select.onchange = onDimensionChange;
}

// 🆕 차원수 변경 핸들러
function onDimensionChange() {
    const dimension = parseInt(document.getElementById('dimensionSelect').value);
    currentDimension = dimension;

    if (!dimension) {
        hide2D3DSelection();
        hideFieldSelection();
        hideChartTypes();
        return;
    }

    // 2D/3D 선택 버튼 표시
    show2D3DSelection(dimension);
}

// 🆕 2D/3D 선택 UI 표시
function show2D3DSelection(dimension) {
    console.log('[CHART] 2D/3D 선택 UI 표시:', dimension);

    // 기존 버튼들 제거
    const existingSelection = document.querySelector('.dimension-type-selection');
    if (existingSelection) {
        existingSelection.remove();
    }

    // 2D/3D 선택 컨테이너 생성
    const selectionContainer = document.createElement('div');
    selectionContainer.className = 'dimension-type-selection';
    selectionContainer.style.cssText = `
        display: flex;
        gap: 15px;
        align-items: center;
        margin: 15px 0;
        padding: 15px;
        background: #f8f9fa;
        border: 1px solid #ddd;
        border-radius: 4px;
    `;

    // 라벨
    const label = document.createElement('span');
    label.textContent = '차트 종류 선택:';
    label.style.cssText = 'font-weight: bold; color: #333;';
    selectionContainer.appendChild(label);

    // 2D 버튼
    const btn2D = document.createElement('button');
    btn2D.textContent = '2D 차트 (Chart.js)';
    btn2D.className = 'chart-type-btn btn-2d';
    btn2D.style.cssText = `
        padding: 8px 16px;
        background: #007bff;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
    `;
    btn2D.onclick = () => select2D3D(false);

    // 3D 버튼
    const btn3D = document.createElement('button');
    btn3D.textContent = '3D 차트 (Plotly)';
    btn3D.className = 'chart-type-btn btn-3d';
    btn3D.style.cssText = `
        padding: 8px 16px;
        background: #28a745;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
    `;

    // 🔥 3D 지원 가능 여부 확인
    const canSupport3D = dimensionCalculator.canSupport3D(raw_data);
    console.log('[CHART] 3D 지원 가능:', canSupport3D, '숫자 필드:', numericFields.length);

    if (canSupport3D && numericFields.length >= 3) {
        btn3D.onclick = () => select2D3D(true);
    } else {
        // 3D 비활성화
        btn3D.disabled = true;
        btn3D.style.background = '#6c757d';
        btn3D.style.cursor = 'not-allowed';
        btn3D.title = `3D 차트를 위해서는 숫자 필드가 3개 이상 필요합니다 (현재: ${numericFields.length}개)`;
    }

    selectionContainer.appendChild(btn2D);
    selectionContainer.appendChild(btn3D);

    // 차원 선택기 다음에 삽입
    const dimensionSelect = document.getElementById('dimensionSelect').closest('.axis-selector');
    dimensionSelect.parentNode.insertBefore(selectionContainer, dimensionSelect.nextSibling);

    console.log('[CHART] 2D/3D 선택 UI 생성 완료');
}

// 🆕 2D/3D 선택 핸들러
function select2D3D(is3D) {
    console.log('[CHART] 2D/3D 선택:', is3D ? '3D' : '2D');
    currentIs3D = is3D;

    // 버튼 스타일 업데이트
    document.querySelectorAll('.chart-type-btn').forEach(btn => {
        btn.style.background = '#6c757d';
    });

    const activeBtn = document.querySelector(is3D ? '.btn-3d' : '.btn-2d');
    if (activeBtn && !activeBtn.disabled) {
        activeBtn.style.background = is3D ? '#28a745' : '#007bff';
    }

    // 필드 선택 UI 표시
    updateFieldSelection();
}

// 🆕 2D/3D 선택 숨김
function hide2D3DSelection() {
    const existingSelection = document.querySelector('.dimension-type-selection');
    if (existingSelection) {
        existingSelection.remove();
    }
}

// 🆕 수정된 필드 선택 업데이트
function updateFieldSelection() {
    if (currentDimension === null || currentIs3D === null) {
        hideFieldSelection();
        hideChartTypes();
        return;
    }

    const container = document.getElementById('axisMapping');
    container.innerHTML = '';

    // 필드 선택기 생성
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < currentDimension; i++) {
        const div = document.createElement('div');
        div.className = 'axis-selector';

        const label = document.createElement('label');
        label.innerHTML = `필드 ${i + 1}:<br><small>${dataValidator.getFieldDescription(i, currentDimension)}</small>`;

        const select = document.createElement('select');
        select.id = `field${i}`;
        select.className = 'field-selector';
        select.onchange = updateAllFieldOptions;
        select.innerHTML = '<option value="">필드 선택</option>';

        div.appendChild(label);
        div.appendChild(select);
        fragment.appendChild(div);
    }

    container.appendChild(fragment);

    updateAllFieldOptions();

    // 호환 가능한 차트 타입 가져오기
    try {
        if (currentIs3D) {
            // 3D 차트 타입
            const chartTypes = chartTypeProvider.getCompatibleChartTypesForData(raw_data, currentDimension);
            updateChartTypes(chartTypes);
        } else {
            // 2D 차트 타입 (임시로 기본 타입들 사용)
            const chart2DTypes = get2DChartTypes(currentDimension);
            updateChartTypes(chart2DTypes);
        }
    } catch (error) {
        console.error('[CHART] 차트 타입 조회 오류:', error);
        updateChartTypes([]);
    }
}

// 🆕 2D 차트 타입 목록 (임시)
function get2DChartTypes(dimension) {
    const chart2DTypes = {
        1: [
            { value: 'line', label: 'Line Chart', description: '선형 차트' },
            { value: 'bar', label: 'Bar Chart', description: '막대 차트' }
        ],
        2: [
            { value: 'scatter', label: 'Scatter Plot', description: 'X-Y 산점도' },
            { value: 'line2d', label: 'Line Chart', description: 'X-Y 선형 차트' },
            { value: 'bar2d', label: 'Bar Chart', description: 'X-Y 막대 차트' }
        ],
        3: [
            { value: 'bubble', label: 'Bubble Chart', description: '버블 차트 (크기 인코딩)' },
            { value: 'scatter_size', label: 'Scatter + Size', description: '산점도 + 크기' }
        ],
        4: [
            { value: 'bubble_color', label: 'Bubble + Color', description: '버블 + 색상 차트' }
        ]
    };

    return chart2DTypes[dimension] || [];
}

function hideFieldSelection() {
    const container = document.getElementById('axisMapping');
    if (container) {
        container.innerHTML = '';
    }
}

function hideChartTypes() {
    updateChartTypes([]);
}

function updateChartTypes(types) {
    const select = document.getElementById('chartTypeSelect');
    if (!select) return;

    select.innerHTML = '<option value="">차트 타입 선택</option>';

    types.forEach(type => {
        const optionText = type.priority ?
            `${type.label} (추천도: ${type.priority})` :
            type.label;
        select.innerHTML += `<option value="${type.value}">${optionText}</option>`;
    });

    select.onchange = checkFormComplete;
}

function updateAllFieldOptions() {
    if (currentDimension === null) return;

    // 🆕 3D 모드에서는 숫자 필드만 사용 가능
    const availableFields = currentIs3D ? numericFields : Object.keys(fieldTypes);
    const selectedFields = [];

    for (let i = 0; i < currentDimension; i++) {
        const fieldSelect = document.getElementById(`field${i}`);
        if (fieldSelect && fieldSelect.value) {
            selectedFields.push(fieldSelect.value);
        }
    }

    // 배치 업데이트로 리플로우 최소화
    const updates = [];

    for (let i = 0; i < currentDimension; i++) {
        const fieldSelect = document.getElementById(`field${i}`);
        if (!fieldSelect) continue;

        const currentValue = fieldSelect.value;
        let fieldOptions = availableFields;

        // 2D 모드에서 Y, Z, W축은 숫자만 허용
        if (!currentIs3D && i > 0) {
            fieldOptions = fieldOptions.filter(field => fieldTypes[field] === 'double');
        }

        // 중복 선택 방지
        fieldOptions = fieldOptions.filter(field =>
            !selectedFields.includes(field) || field === currentValue
        );

        const newOptions = ['<option value="">필드 선택</option>'];
        fieldOptions.forEach(field => {
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
    const dimension = currentDimension;
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

    // 폼 완성도 검증
    let isComplete = false;
    try {
        isComplete = dataValidator.validateFormCompleteness({
            dimension,
            chartType,
            selectedFields
        });
    } catch (error) {
        debugLog('[CHART] 폼 완성도 검증 오류:', error);
        isComplete = false;
    }

    const createBtn = document.getElementById('createChartBtn');
    if (createBtn) {
        createBtn.disabled = !isComplete;
    }
}

function displayChartInfo(chartType, selectedFields, dataCount) {
    const info = document.getElementById('chartInfo');
    if (!info) return;

    const fieldsInfo = selectedFields.join(' → ');
    const modeInfo = currentIs3D ? '3D (Plotly)' : '2D (Chart.js)';
    info.innerHTML = `
        <strong>모드:</strong> ${modeInfo} | 
        <strong>차트 타입:</strong> ${chartType} | 
        <strong>차원:</strong> ${selectedFields.length}D | 
        <strong>선택된 필드:</strong> ${fieldsInfo}<br>
        <strong>데이터 개수:</strong> ${dataCount}개
    `;
}

// ============================================================================
// 🆕 2D/3D 통합 차트 생성 함수
// ============================================================================

window.createVisualization = async function () {
    console.time('차트생성');

    if (!raw_data || raw_data.length === 0) {
        showError('데이터를 먼저 생성해주세요');
        return;
    }

    const dimension = currentDimension;
    const chartType = document.getElementById('chartTypeSelect').value;
    const is3D = currentIs3D;

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

        // 🆕 통합 사용자 입력 검증
        const validationResult = dataValidator.validateUserSelectionInput(
            { dimension, chartType, selectedFields },
            raw_data
        );

        if (!validationResult.isValid) {
            showError(`입력 검증 오류: ${validationResult.errors.join(', ')}`);
            return;
        }

        // 경고가 있으면 표시
        if (validationResult.warnings && validationResult.warnings.length > 0) {
            console.warn('[CHART] 검증 경고:', validationResult.warnings);
        }

        // 🆕 2D/3D 분기 차트 config 생성
        let config;
        if (is3D) {
            // 3D 차트 config 생성
            config = configBuilder.buildChartConfigForGeneration(
                chartType,
                selectedFields,
                dimension,
                {}, // extraOptions
                true // is3D = true
            );
        } else {
            // 2D 차트 config 생성 (기존 방식)
            config = configBuilder.buildChartConfigForGeneration(
                chartType,
                selectedFields,
                dimension,
                {} // extraOptions
                // is3D 기본값 = false
            );
        }

        // 기존 차트 정리
        if (currentChartWrapper) {
            currentChartWrapper.destroy();
            currentChartWrapper = null;
        }

        // DOM 조작 최적화
        requestAnimationFrame(() => {
            const chartContainer = document.getElementById('chartContainer');
            if (!chartContainer) {
                showError('chartContainer 엘리먼트를 찾을 수 없습니다');
                return;
            }

            chartContainer.style.display = 'flex';
            chartContainer.style.flexDirection = 'column';
            chartContainer.style.height = '600px';
            chartContainer.innerHTML = `
                <h3>시각화 결과</h3>
                <div id="chartInfo" class="chart-info">차트 정보가 여기에 표시됩니다</div>
                <div class="chart-canvas-wrapper" style="flex: 1; position: relative; min-height: 400px; height: 400px;">
                </div>
            `;

            const canvasWrapper = chartContainer.querySelector('.chart-canvas-wrapper');
            if (!canvasWrapper) {
                showError('chart-canvas-wrapper를 찾을 수 없습니다');
                return;
            }

            // 🆕 통합 컨테이너 생성
            setTimeout(() => {
                try {
                    console.time('실제차트생성');

                    // 🆕 2D/3D 분기 컨테이너 생성
                    let containerElement;
                    if (is3D) {
                        // 3D Plotly 컨테이너 생성
                        containerElement = containerCreator.createUnifiedChartContainer(
                            canvasWrapper,
                            true, // is3D = true
                            {
                                width: '100%',
                                height: '100%',
                                className: 'chart-container-3d-generated'
                            }
                        );
                    } else {
                        // 2D Canvas 컨테이너 생성
                        containerElement = containerCreator.createUnifiedChartContainer(
                            canvasWrapper,
                            false, // is3D = false
                            {
                                width: '100%',
                                height: '100%',
                                className: 'chart-container-2d-generated'
                            }
                        );
                    }

                    // 🆕 2D/3D 분기 차트 생성
                    if (is3D) {
                        // 3D 차트 생성
                        currentChartWrapper = generateChart3D(raw_data, config, containerElement);
                        console.log('[CHART] 3D 차트 생성 완료');
                    } else {
                        // 2D 차트 생성
                        currentChartWrapper = generateChart(raw_data, config, containerElement);
                        console.log('[CHART] 2D 차트 생성 완료');
                    }

                    console.timeEnd('실제차트생성');

                    // 이벤트 리스너 등록
                    currentChartWrapper.on('error', (error) => {
                        console.error('[CHART] 차트 에러:', error);
                        showError('차트 오류: ' + error.message);
                    });

                    displayChartInfo(chartType, selectedFields, raw_data.length);
                    updateStatus(`${is3D ? '3D' : '2D'} 시각화 생성 완료!`, 'success');
                    updateStepIndicator(3);

                    console.timeEnd('차트생성');

                } catch (error) {
                    console.error('[CHART] 차트 생성 오류:', error);
                    showError('차트 생성 실패: ' + error.message);
                    updateStatus('차트 생성 실패', 'error');
                }
            }, 10);
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
    numericFields = [];
    currentDimension = null;
    currentIs3D = false;

    window.location.href = 'index.html';
};

// ============================================================================
// 페이지 초기화
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