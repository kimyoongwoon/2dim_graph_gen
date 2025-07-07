// ============================================================================
// config.js - 차트 설정 페이지 로직
// ============================================================================

import { sessionStorageManager } from './shared/session_storage_manager/index.js';
import {
    dataValidator,
    dimensionCalculator,
    configBuilder
} from './data_pipeline_configuration_source/index.js';

import { showError } from './shared/error_handler.js';

// 전역 변수들
let raw_data = null;
let fieldTypes = {};
let numericFields = [];
let currentDimension = null;
let currentIs3D = null;
let maxAvailableDimensions = 4;

// ============================================================================
// 데이터 로드 및 초기화
// ============================================================================

function loadDataFromSessionStorage() {
    updateStatus('저장된 데이터 로드 중...', 'info');

    try {
        // sessionStorage에서 데이터 로드
        const { data, meta } = sessionStorageManager.loadRawDataFromSessionStorage();
        raw_data = data;

        const fieldNames = meta.fieldNames.join(', ');
        updateStatus(`✅ ${data.length}개 데이터 로드 완료 | 필드: ${fieldNames}`, 'success');

        // 필드 타입 분석 (기존 generation 단계에서 분석된 것을 재사용할 수도 있음)
        fieldTypes = analyzeFieldTypes(data);

        // 숫자 필드 목록 추출
        numericFields = dimensionCalculator.getNumericFields(data);
        console.log('[CONFIG] 숫자 필드:', numericFields);

        // 최대 차원수 계산
        maxAvailableDimensions = dimensionCalculator.calculateAvailableDimensionsFromData(data);

        // 2D/3D 모드 선택 UI 표시
        showModeSelection();

        document.getElementById('chartConfigSection').style.display = 'block';

    } catch (error) {
        console.error('[CONFIG] 데이터 로드 오류:', error);
        updateStatus(`데이터 로드 실패: ${error.message}. 데이터 생성기로 돌아가주세요.`, 'error');
        document.getElementById('chartConfigSection').style.display = 'none';
    }
}

// 간단한 필드 타입 분석 (generation 단계와 동일한 로직)
function analyzeFieldTypes(data) {
    const types = {};
    if (data.length === 0) return types;
    
    const fields = Object.keys(data[0]);
    fields.forEach(field => {
        const sampleValue = data[0][field];
        types[field] = typeof sampleValue === 'number' ? 'double' : 'string';
    });
    
    return types;
}

// ============================================================================
// UI 관리 함수들
// ============================================================================

function updateStatus(message, type = 'info') {
    const dataInfo = document.getElementById('data-info');
    if (dataInfo) {
        dataInfo.innerHTML = `<strong>${message}</strong>`;
        dataInfo.className = `data-info ${type}`;
    }
}

function showModeSelection() {
    console.log('[CONFIG] 2D/3D 모드 선택 UI 표시');

    clearAllSelectionUI();

    const modeContainer = document.createElement('div');
    modeContainer.className = 'mode-selection-container';
    modeContainer.style.cssText = `
        display: flex;
        gap: 15px;
        align-items: center;
        margin: 15px 0;
        padding: 15px;
        background: #e3f2fd;
        border: 1px solid #2196f3;
        border-radius: 4px;
    `;

    const label = document.createElement('span');
    label.textContent = '📊 차트 모드 선택:';
    label.style.cssText = 'font-weight: bold; color: #333; font-size: 16px;';
    modeContainer.appendChild(label);

    // 2D 버튼
    const btn2D = document.createElement('button');
    btn2D.textContent = '2D 차트 (Plotly)';
    btn2D.className = 'mode-btn btn-2d';
    btn2D.style.cssText = `
        padding: 10px 20px;
        background: #007bff;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        font-weight: bold;
        transition: background-color 0.2s;
    `;
    btn2D.onclick = () => selectMode(false);

    // 3D 버튼
    const btn3D = document.createElement('button');
    btn3D.textContent = '3D 차트 (Plotly)';
    btn3D.className = 'mode-btn btn-3d';
    btn3D.style.cssText = `
        padding: 10px 20px;
        background: #28a745;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        font-weight: bold;
        transition: background-color 0.2s;
    `;

    const canSupport3D = dimensionCalculator.canSupport3D(raw_data);
    if (canSupport3D && numericFields.length >= 3) {
        btn3D.onclick = () => selectMode(true);
    } else {
        btn3D.disabled = true;
        btn3D.style.background = '#6c757d';
        btn3D.style.cursor = 'not-allowed';
        btn3D.title = `3D 차트를 위해서는 숫자 필드가 3개 이상 필요합니다 (현재: ${numericFields.length}개)`;
    }

    modeContainer.appendChild(btn2D);
    modeContainer.appendChild(btn3D);

    const axisMapping = document.getElementById('axisMapping');
    axisMapping.parentNode.insertBefore(modeContainer, axisMapping);
}

function selectMode(is3D) {
    console.log('[CONFIG] 모드 선택:', is3D ? '3D' : '2D');
    currentIs3D = is3D;

    // 버튼 스타일 업데이트
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.style.background = '#6c757d';
    });

    const activeBtn = document.querySelector(is3D ? '.btn-3d' : '.btn-2d');
    if (activeBtn && !activeBtn.disabled) {
        activeBtn.style.background = is3D ? '#28a745' : '#007bff';
    }

    if (is3D) {
        currentDimension = 3;
        hide2DSpecificUI();
        show3DModeInfo();
        updateFieldSelection();
    } else {
        hide3DSpecificUI();
        showDimensionSelection();
    }
}

function showDimensionSelection() {
    const existingDimSelector = document.querySelector('.dimension-selection-container');
    if (existingDimSelector) {
        existingDimSelector.remove();
    }

    const dimContainer = document.createElement('div');
    dimContainer.className = 'dimension-selection-container';
    dimContainer.style.cssText = `
        display: flex;
        gap: 15px;
        align-items: center;
        margin: 15px 0;
        padding: 15px;
        background: #fff3cd;
        border: 1px solid #ffeaa7;
        border-radius: 4px;
    `;

    const label = document.createElement('span');
    label.textContent = '📐 차원수 선택:';
    label.style.cssText = 'font-weight: bold; color: #333; font-size: 14px;';
    dimContainer.appendChild(label);

    const select = document.createElement('select');
    select.id = 'dimensionSelect';
    select.style.cssText = `
        padding: 8px 12px;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-size: 14px;
        min-width: 200px;
    `;

    select.innerHTML = '<option value="">차원 선택</option>';
    for (let dim = 1; dim <= maxAvailableDimensions; dim++) {
        const label = dim === 1 ? '1차원 (선형/카테고리)' :
            dim === 2 ? '2차원 (X-Y 산점도)' :
                dim === 3 ? '3차원 (X-Y + 크기/색상)' :
                    '4차원 (X-Y + 크기 + 색상)';
        select.innerHTML += `<option value="${dim}">${label}</option>`;
    }

    select.onchange = onDimensionChange;
    dimContainer.appendChild(select);

    const modeContainer = document.querySelector('.mode-selection-container');
    modeContainer.parentNode.insertBefore(dimContainer, modeContainer.nextSibling);
}

function onDimensionChange() {
    const dimension = parseInt(document.getElementById('dimensionSelect').value);
    currentDimension = dimension;

    if (!dimension) {
        hideFieldSelection();
        hideChartTypes();
        return;
    }

    show2DChartTypeUI();
    updateFieldSelection();
}

function updateFieldSelection() {
    if (currentDimension === null || currentIs3D === null) {
        hideFieldSelection();
        return;
    }

    const container = document.getElementById('axisMapping');
    container.innerHTML = '';

    const fieldCount = currentIs3D ? 3 : currentDimension;
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < fieldCount; i++) {
        const div = document.createElement('div');
        div.className = 'axis-selector';

        const label = document.createElement('label');
        if (currentIs3D) {
            const axisNames = ['X축 (숫자만)', 'Y축 (숫자만)', 'Z축 (숫자만)'];
            label.innerHTML = `${axisNames[i]}:<br><small>3D 공간 좌표</small>`;
        } else {
            label.innerHTML = `필드 ${i + 1}:<br><small>${dataValidator.getFieldDescription(i, currentDimension)}</small>`;
        }

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

    if (currentIs3D) {
        const chart3DTypes = get3DChartTypes(3);
        if (chart3DTypes.length > 0) {
            const defaultType = chart3DTypes[0];
            const chartTypeSelect = document.getElementById('chartTypeSelect');
            if (chartTypeSelect) {
                chartTypeSelect.innerHTML = `<option value="${defaultType.value}" selected>${defaultType.label}</option>`;
            }
        }
    }

    checkFormComplete();
}

function updateAllFieldOptions() {
    const fieldCount = currentIs3D ? 3 : currentDimension;
    if (fieldCount === null) return;

    const availableFields = currentIs3D ? numericFields : Object.keys(fieldTypes);
    const selectedFields = [];

    for (let i = 0; i < fieldCount; i++) {
        const fieldSelect = document.getElementById(`field${i}`);
        if (fieldSelect && fieldSelect.value) {
            selectedFields.push(fieldSelect.value);
        }
    }

    for (let i = 0; i < fieldCount; i++) {
        const fieldSelect = document.getElementById(`field${i}`);
        if (!fieldSelect) continue;

        const currentValue = fieldSelect.value;
        let fieldOptions = availableFields;

        if (!currentIs3D && i > 0) {
            fieldOptions = fieldOptions.filter(field => fieldTypes[field] === 'double');
        }

        fieldOptions = fieldOptions.filter(field =>
            !selectedFields.includes(field) || field === currentValue
        );

        const newOptions = ['<option value="">필드 선택</option>'];
        fieldOptions.forEach(field => {
            const typeLabel = fieldTypes[field] === 'string' ? '[문자]' : '[숫자]';
            const selected = field === currentValue ? ' selected' : '';
            newOptions.push(`<option value="${field}"${selected}>${typeLabel} ${field}</option>`);
        });

        fieldSelect.innerHTML = newOptions.join('');
    }

    checkFormComplete();
}

function checkFormComplete() {
    const dimension = currentDimension;
    const is3D = currentIs3D;
    let chartType;

    if (is3D) {
        const chart3DTypes = get3DChartTypes(3);
        chartType = chart3DTypes.length > 0 ? chart3DTypes[0].value : null;
    } else {
        chartType = document.getElementById('chartTypeSelect')?.value;
    }

    const fieldCount = is3D ? 3 : dimension;
    const selectedFields = [];
    if (fieldCount) {
        for (let i = 0; i < fieldCount; i++) {
            const fieldElement = document.getElementById(`field${i}`);
            if (fieldElement && fieldElement.value) {
                selectedFields.push(fieldElement.value);
            }
        }
    }

    let isComplete = false;
    try {
        isComplete = dataValidator.validateFormCompleteness({
            dimension: fieldCount,
            chartType,
            selectedFields
        });
    } catch (error) {
        console.warn('[CONFIG] 폼 완성도 검증 오류:', error);
        isComplete = false;
    }

    const proceedBtn = document.getElementById('proceedBtn');
    if (proceedBtn) {
        proceedBtn.disabled = !isComplete;
    }
}

// ============================================================================
// 차트 타입 관련
// ============================================================================

function get2DChartTypes(dimension) {
    const chart2DTypes = {
        1: [
            { value: 'line1d', label: 'Line Chart' },
            { value: 'category', label: 'Category Chart' }
        ],
        2: [
            { value: 'scatter', label: 'Scatter Plot' },
            { value: 'size', label: 'Size Chart' },
            { value: 'color', label: 'Color Chart' }
        ],
        3: [
            { value: 'scatter_size', label: 'Scatter + Size' },
            { value: 'scatter_color', label: 'Scatter + Color' },
            { value: 'size_color', label: 'Size + Color' }
        ],
        4: [
            { value: 'scatter_size_color', label: 'Scatter + Size + Color' }
        ]
    };
    return chart2DTypes[dimension] || [];
}

function get3DChartTypes(dimension) {
    return [{ value: '3d_surface_scatter', label: '3D Surface + Scatter' }];
}

function show2DChartTypeUI() {
    const chartTypeSection = document.querySelector('.config-column:nth-child(2)');
    if (!chartTypeSection) return;

    const chartTypeSelector = chartTypeSection.querySelector('#chartTypeSelect').closest('.axis-selector');
    if (chartTypeSelector) {
        chartTypeSelector.style.display = 'flex';
    }

    const advancedOptions = chartTypeSection.querySelector('.advanced-options');
    if (advancedOptions) {
        advancedOptions.style.display = 'block';
    }

    const infoDiv = chartTypeSection.querySelector('.mode-info');
    if (infoDiv) {
        infoDiv.remove();
    }

    if (currentDimension) {
        const chart2DTypes = get2DChartTypes(currentDimension);
        updateChartTypes(chart2DTypes);
    }
}

function show3DModeInfo() {
    const chartTypeSection = document.querySelector('.config-column:nth-child(2)');
    if (!chartTypeSection) return;

    const chartTypeSelector = chartTypeSection.querySelector('#chartTypeSelect').closest('.axis-selector');
    if (chartTypeSelector) {
        chartTypeSelector.style.display = 'none';
    }

    const advancedOptions = chartTypeSection.querySelector('.advanced-options');
    if (advancedOptions) {
        advancedOptions.style.display = 'none';
    }

    let infoDiv = chartTypeSection.querySelector('.mode-info');
    if (!infoDiv) {
        infoDiv = document.createElement('div');
        infoDiv.className = 'mode-info';
        infoDiv.style.cssText = `
            background: #d4edda;
            color: #155724;
            padding: 15px;
            border: 1px solid #c3e6cb;
            border-radius: 4px;
            margin: 10px 0;
            font-size: 14px;
        `;
        chartTypeSelector.parentNode.insertBefore(infoDiv, chartTypeSelector);
    }
    infoDiv.innerHTML = `
        <strong>🌐 3D 모드 (Plotly)</strong><br>
        • 차원: 3차원 고정 (X, Y, Z축)<br>
        • 차트 타입: Surface + Scatter 자동 설정<br>
        • 모든 축은 숫자 필드만 사용 가능
    `;
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

// ============================================================================
// UI 정리 함수들
// ============================================================================

function clearAllSelectionUI() {
    const containers = [
        '.mode-selection-container',
        '.dimension-selection-container'
    ];

    containers.forEach(selector => {
        const element = document.querySelector(selector);
        if (element) element.remove();
    });
}

function hide2DSpecificUI() {
    const dimContainer = document.querySelector('.dimension-selection-container');
    if (dimContainer) {
        dimContainer.style.display = 'none';
    }
}

function hide3DSpecificUI() {
    const infoDiv = document.querySelector('.mode-info');
    if (infoDiv) {
        infoDiv.remove();
    }
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

// ============================================================================
// 설정 빌더 함수들
// ============================================================================

function buildScalingConfig() {
    const scalingType = document.getElementById('sizeScaling')?.value || 'default';
    
    switch (scalingType) {
        case 'sigmoid':
            const k = parseFloat(document.getElementById('sigmoidK')?.value) || 1.0;
            return {
                type: 'sigmoid',
                params: { k }
            };
            
        case 'linear':
            // 기본 선형 파라미터 (필요시 UI로 확장 가능)
            return {
                type: 'linear',
                params: { a: 1.0, b: 0 }
            };
            
        default:
            return {
                type: 'default'
            };
    }
}

// ============================================================================
// 네비게이션 함수들
// ============================================================================

window.proceedToVisualization = function() {
    if (!raw_data || raw_data.length === 0) {
        showError('데이터가 없습니다');
        return;
    }

    const dimension = currentIs3D ? 3 : currentDimension;
    let chartType;

    if (currentIs3D) {
        const chart3DTypes = get3DChartTypes(3);
        chartType = chart3DTypes.length > 0 ? chart3DTypes[0].value : null;
    } else {
        chartType = document.getElementById('chartTypeSelect').value;
    }

    const fieldCount = currentIs3D ? 3 : dimension;
    const selectedFields = [];
    for (let i = 0; i < fieldCount; i++) {
        const fieldElement = document.getElementById(`field${i}`);
        if (fieldElement && fieldElement.value) {
            selectedFields.push(fieldElement.value);
        }
    }

    // 설정을 sessionStorage에 저장
    const chartConfig = {
        dimension,
        chartType,
        selectedFields,
        is3D: currentIs3D,
        scalingConfig: buildScalingConfig(),
        colorConfig: { type: 'blueRed' } // 기본 색상 설정
    };

    try {
        sessionStorage.setItem('chartConfig', JSON.stringify(chartConfig));
        console.log('[CONFIG] 차트 설정 저장 완료:', chartConfig);
        
        // 시각화 페이지로 이동
        window.location.href = 'visualization.html';
    } catch (error) {
        console.error('[CONFIG] 설정 저장 오류:', error);
        showError('설정 저장에 실패했습니다: ' + error.message);
    }
};

window.goBackToGenerator = function() {
    window.location.href = 'index.html';
};

// ============================================================================
// 페이지 초기화
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    // 크기 스케일링 변경 핸들러
    const sizeScalingSelect = document.getElementById('sizeScaling');
    if (sizeScalingSelect) {
        sizeScalingSelect.addEventListener('change', function() {
            const sigmoidContainer = document.getElementById('sigmoidKContainer');
            if (sigmoidContainer) {
                sigmoidContainer.style.display = this.value === 'sigmoid' ? 'flex' : 'none';
            }
        });
    }

    loadDataFromSessionStorage();
});