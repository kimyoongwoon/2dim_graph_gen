// ============================================================================
// graph_complete.js - 차트 생성 페이지 로직 (통합 시스템 연동)
// ============================================================================

import {
    sessionStorageManager,
    dataValidator,
    dimensionCalculator,
    //chartTypeProvider,
    configBuilder,
    //containerCreator
} from './data_pipeline/index.js';

import { showError, clearAllChartData } from './shared/error_handler.js';

// ✅ 통합 시스템 import (2D/3D/4D 모두 지원)
import {
    generateChart,
    createControlPanel,
    createSliderContainer,
    processDataFilter,
    ChartWrapper
} from './3dim_chart_gen/index.js';

// 전역 변수들
let currentChartWrapper = null;
let raw_data = null;
let fieldTypes = {};
let numericFields = [];
let currentDimension = null;
let currentIs3D = null;
let maxAvailableDimensions = 4;

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

        // 숫자 필드 목록 추출
        numericFields = dimensionCalculator.getNumericFields(data);
        console.log('[CHART] 숫자 필드:', numericFields);

        // 최대 차원수 계산 후 바로 2D/3D 선택 UI 표시
        maxAvailableDimensions = dimensionCalculator.calculateAvailableDimensionsFromData(data);

        // 먼저 2D/3D 모드 선택 UI 표시
        showModeSelection();

        updateStepIndicator(2);
        document.getElementById('chartConfigSection').style.display = 'block';

    } catch (error) {
        console.error('[CHART] 데이터 로드 오류:', error);
        updateStatus(`데이터 로드 실패: ${error.message}. 데이터 생성기로 돌아가주세요.`, 'error');
        document.getElementById('chartConfigSection').style.display = 'none';
    }
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
// 🆕 통합 시스템 연동 함수들
// ============================================================================

/**
 * 🆕 스케일링 설정 추출 (기존 UI에서)
 */
function extractScalingConfig() {
    const sizeScaling = document.getElementById('sizeScaling')?.value;
    const sigmoidK = parseFloat(document.getElementById('sigmoidK')?.value) || 1.0;

    if (sizeScaling === 'sigmoid') {
        return { type: 'sigmoid', params: { k: sigmoidK } };
    }
    return { type: 'default' };
}

/**
 * 🆕 data_pipeline config를 통합 시스템 config로 변환
 */
function convertToUnifiedConfig(dataPhaseConfig, scalingConfig) {
    return {
        type: mapChartType(dataPhaseConfig.type, dataPhaseConfig.is3D),
        dataMapping: dataPhaseConfig.dataMapping,
        scalingConfig: scalingConfig,
        colorConfig: { type: 'blueRed' }
    };
}

/**
 * 🆕 기존 차트 타입을 통합 시스템 타입으로 매핑
 */
function mapChartType(oldType, is3D) {
    if (is3D) {
        return '3d_surface_scatter'; // 모든 3D 타입은 통합
    }

    const mapping = {
        'scatter': '2d_scatter',
        'size': '2d_size',
        'color': '2d_color',
        'scatter_size': '3d_scatter_size',
        'scatter_color': '3d_scatter_color',
        'size_color': '3d_size_color',
        'scatter_size_color': '4d_scatter_size_color'
    };

    return mapping[oldType] || oldType;
}

// ============================================================================
// UI 순서: 2D/3D 선택 → 차원 선택 → 필드 선택
// ============================================================================

/**
 * 1단계: 2D/3D 모드 선택 UI 표시
 */
function showModeSelection() {
    console.log('[CHART] 2D/3D 모드 선택 UI 표시');

    // 기존 UI 정리
    clearAllSelectionUI();

    // 2D/3D 모드 선택 컨테이너 생성
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

    // 라벨
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

    // 3D 지원 가능 여부 확인
    const canSupport3D = dimensionCalculator.canSupport3D(raw_data);
    console.log('[CHART] 3D 지원 가능:', canSupport3D, '숫자 필드:', numericFields.length);

    if (canSupport3D && numericFields.length >= 3) {
        btn3D.onclick = () => selectMode(true);
    } else {
        // 3D 비활성화
        btn3D.disabled = true;
        btn3D.style.background = '#6c757d';
        btn3D.style.cursor = 'not-allowed';
        btn3D.title = `3D 차트를 위해서는 숫자 필드가 3개 이상 필요합니다 (현재: ${numericFields.length}개)`;
    }

    modeContainer.appendChild(btn2D);
    modeContainer.appendChild(btn3D);

    // axisMapping 컨테이너 앞에 삽입
    const axisMapping = document.getElementById('axisMapping');
    axisMapping.parentNode.insertBefore(modeContainer, axisMapping);

    console.log('[CHART] 2D/3D 모드 선택 UI 생성 완료');
}

/**
 * 2단계: 2D/3D 모드 선택 핸들러
 */
function selectMode(is3D) {
    console.log('[CHART] 모드 선택:', is3D ? '3D' : '2D');
    currentIs3D = is3D;

    // 버튼 스타일 업데이트
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.style.background = '#6c757d';
    });

    const activeBtn = document.querySelector(is3D ? '.btn-3d' : '.btn-2d');
    if (activeBtn && !activeBtn.disabled) {
        activeBtn.style.background = is3D ? '#28a745' : '#007bff';
    }

    // 차원/필드 선택 UI 업데이트
    if (is3D) {
        // 3D 모드: 차원을 3으로 고정하고 바로 필드 선택
        currentDimension = 3;
        hide2DSpecificUI();
        show3DModeInfo();
        updateFieldSelection();
    } else {
        // 2D 모드: 차원 선택 UI 표시
        hide3DSpecificUI();
        showDimensionSelection();
    }
}

/**
 * 3단계: 2D 모드에서만 차원 선택 UI 표시
 */
function showDimensionSelection() {
    console.log('[CHART] 2D 차원 선택 UI 표시');

    // 기존 차원 선택 UI 제거
    const existingDimSelector = document.querySelector('.dimension-selection-container');
    if (existingDimSelector) {
        existingDimSelector.remove();
    }

    // 차원 선택 컨테이너 생성
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

    // 라벨
    const label = document.createElement('span');
    label.textContent = '📐 차원수 선택:';
    label.style.cssText = 'font-weight: bold; color: #333; font-size: 14px;';
    dimContainer.appendChild(label);

    // 차원 선택 드롭다운
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

    // 모드 선택 컨테이너 다음에 삽입
    const modeContainer = document.querySelector('.mode-selection-container');
    modeContainer.parentNode.insertBefore(dimContainer, modeContainer.nextSibling);

    console.log('[CHART] 2D 차원 선택 UI 생성 완료');
}

/**
 * 4단계: 차원수 변경 핸들러 (2D 모드에서만 호출)
 */
function onDimensionChange() {
    const dimension = parseInt(document.getElementById('dimensionSelect').value);
    currentDimension = dimension;

    if (!dimension) {
        hideFieldSelection();
        hideChartTypes();
        return;
    }

    console.log('[CHART] 2D 차원 선택:', dimension);

    // 2D 차트 타입 표시
    show2DChartTypeUI();

    // 필드 선택 UI 표시
    updateFieldSelection();
}

/**
 * 2D 차트 타입 및 옵션 UI 표시
 */
function show2DChartTypeUI() {
    const chartTypeSection = document.querySelector('.config-column:nth-child(2)');
    if (!chartTypeSection) return;

    // 차트 타입 선택 표시
    const chartTypeSelector = chartTypeSection.querySelector('#chartTypeSelect').closest('.axis-selector');
    if (chartTypeSelector) {
        chartTypeSelector.style.display = 'flex';
    }

    // 고급 옵션 표시
    const advancedOptions = chartTypeSection.querySelector('.advanced-options');
    if (advancedOptions) {
        advancedOptions.style.display = 'block';
    }

    // 3D 안내 메시지 제거
    const infoDiv = chartTypeSection.querySelector('.mode-info');
    if (infoDiv) {
        infoDiv.remove();
    }

    // 2D 차트 타입 업데이트
    if (currentDimension) {
        const chart2DTypes = get2DChartTypes(currentDimension);
        updateChartTypes(chart2DTypes);
    }
}

/**
 * 3D 모드 안내 정보 표시
 */
function show3DModeInfo() {
    const chartTypeSection = document.querySelector('.config-column:nth-child(2)');
    if (!chartTypeSection) return;

    // 차트 타입 선택 숨김
    const chartTypeSelector = chartTypeSection.querySelector('#chartTypeSelect').closest('.axis-selector');
    if (chartTypeSelector) {
        chartTypeSelector.style.display = 'none';
    }

    // 고급 옵션 숨김
    const advancedOptions = chartTypeSection.querySelector('.advanced-options');
    if (advancedOptions) {
        advancedOptions.style.display = 'none';
    }

    // 3D 모드 안내 메시지 추가
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

/**
 * 수정된 필드 선택 업데이트
 */
function updateFieldSelection() {
    if (currentDimension === null || currentIs3D === null) {
        hideFieldSelection();
        hideChartTypes();
        return;
    }

    const container = document.getElementById('axisMapping');
    container.innerHTML = '';

    // 필드 개수 결정
    const fieldCount = currentIs3D ? 3 : currentDimension; // 3D는 항상 3개, 2D는 선택한 차원

    // 필드 선택기 생성
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < fieldCount; i++) {
        const div = document.createElement('div');
        div.className = 'axis-selector';

        const label = document.createElement('label');

        if (currentIs3D) {
            // 3D는 X, Y, Z 고정
            const axisNames = ['X축 (숫자만)', 'Y축 (숫자만)', 'Z축 (숫자만)'];
            label.innerHTML = `${axisNames[i]}:<br><small>3D 공간 좌표</small>`;
        } else {
            // 2D는 기존 방식
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

    // 3D 모드에서 차트 타입 자동 설정
    if (currentIs3D) {
        const chart3DTypes = get3DChartTypes(3); // 3D는 항상 3차원
        if (chart3DTypes.length > 0) {
            const defaultType = chart3DTypes[0];
            const chartTypeSelect = document.getElementById('chartTypeSelect');
            if (chartTypeSelect) {
                chartTypeSelect.innerHTML = `<option value="${defaultType.value}" selected>${defaultType.label}</option>`;
                console.log('[CHART] 3D 모드: 기본 차트 타입 설정 -', defaultType.value);
            }
        }
    }

    checkFormComplete();
}

// ============================================================================
// UI 정리 함수들
// ============================================================================

function clearAllSelectionUI() {
    // 모든 선택 UI 제거
    const containers = [
        '.mode-selection-container',
        '.dimension-selection-container',
        '.dimension-type-selection'
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
// 차트 타입 함수들 (✅ 통합 시스템 타입으로 업데이트)
// ============================================================================

/**
 * ✅ 2D 차트 타입 목록 (통합 시스템 타입 사용)
 */
function get2DChartTypes(dimension) {
    const chart2DTypes = {
        1: [
            { value: 'line1d', label: 'Line Chart', description: '1D 선형 차트 (숫자 데이터)' },
            { value: 'category', label: 'Category Chart', description: '카테고리 막대 차트 (문자열 데이터)' }
        ],
        2: [
            { value: 'scatter', label: 'Scatter Plot', description: 'X-Y 산점도' },
            { value: 'size', label: 'Size Chart', description: 'X축 + 크기 인코딩' },
            { value: 'color', label: 'Color Chart', description: 'X축 + 색상 인코딩' }
        ],
        3: [
            { value: 'scatter_size', label: 'Scatter + Size', description: 'X-Y 산점도 + 크기' },
            { value: 'scatter_color', label: 'Scatter + Color', description: 'X-Y 산점도 + 색상' },
            { value: 'size_color', label: 'Size + Color', description: 'X축 + 크기 + 색상' }
        ],
        4: [
            { value: 'scatter_size_color', label: 'Scatter + Size + Color', description: 'X-Y 산점도 + 크기 + 색상 (최대 차원)' }
        ]
    };

    return chart2DTypes[dimension] || [];
}

/**
 * ✅ 3D 차트 타입 목록 (통합 시스템 타입 사용)
 */
function get3DChartTypes(dimension) {
    const chart3DTypes = {
        3: [
            { value: '3d_surface_scatter', label: '3D Surface + Scatter', description: 'Surface와 Scatter 조합' }
        ]
    };

    return chart3DTypes[dimension] || chart3DTypes[3];
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
    const fieldCount = currentIs3D ? 3 : currentDimension;
    if (fieldCount === null) return;

    // 3D 모드에서는 숫자 필드만 사용 가능
    const availableFields = currentIs3D ? numericFields : Object.keys(fieldTypes);
    const selectedFields = [];

    for (let i = 0; i < fieldCount; i++) {
        const fieldSelect = document.getElementById(`field${i}`);
        if (fieldSelect && fieldSelect.value) {
            selectedFields.push(fieldSelect.value);
        }
    }

    // 배치 업데이트로 리플로우 최소화
    const updates = [];

    for (let i = 0; i < fieldCount; i++) {
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
    const is3D = currentIs3D;
    let chartType;

    // 차트 타입 처리
    if (is3D) {
        // 3D 모드: 자동으로 설정되므로 항상 유효
        const chart3DTypes = get3DChartTypes(3);
        chartType = chart3DTypes.length > 0 ? chart3DTypes[0].value : null;
    } else {
        // 2D 모드: 사용자 선택 확인
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

    // 폼 완성도 검증
    let isComplete = false;
    try {
        isComplete = dataValidator.validateFormCompleteness({
            dimension: fieldCount, // 3D는 3, 2D는 선택한 차원
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

    // Show both old name (user-friendly) and unified name (technical)
    const unifiedType = mapChartType(chartType, currentIs3D);

    info.innerHTML = `
        <strong>차트 타입:</strong> ${chartType} → ${unifiedType} | 
        <strong>선택된 필드:</strong> ${fieldsInfo} | 
        <strong>데이터 개수:</strong> ${dataCount}개
    `;
}

// ============================================================================
// ✅ 통합 시스템 차트 생성 함수 (완전 재작성)
// ============================================================================

window.createVisualization = async function () {
    console.log('🚨🚨🚨 createVisualization CALLED! Stack trace:');
    console.trace(); // This will show exactly what called this function

    console.time('차트생성');
    console.time('차트생성');

    if (!raw_data || raw_data.length === 0) {
        showError('데이터를 먼저 생성해주세요');
        return;
    }

    const is3D = currentIs3D;
    const dimension = is3D ? 3 : currentDimension; // 3D는 항상 3차원
    let chartType;

    // 차트 타입 처리
    if (is3D) {
        // 3D 모드: 자동으로 차트 타입 설정
        const chart3DTypes = get3DChartTypes(3);
        if (chart3DTypes.length === 0) {
            showError('3D 차트 타입을 찾을 수 없습니다');
            return;
        }

        chartType = chart3DTypes[0].value;
        console.log('[CHART] 3D 모드: 자동 차트 타입 -', chartType);

    } else {
        // 2D 모드: 사용자 선택 차트 타입 사용
        chartType = document.getElementById('chartTypeSelect').value;
        if (!chartType) {
            showError('차트 타입을 선택해주세요');
            return;
        }
    }

    // 선택된 필드들 수집
    const fieldCount = is3D ? 3 : dimension;
    const selectedFields = [];
    for (let i = 0; i < fieldCount; i++) {
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
        updateStatus('통합 시각화 생성 중...', 'info');

        // 기존 검증 (is3D 정보 포함)
        const validationResult = dataValidator.validateUserSelectionInput(
            { dimension, chartType, selectedFields, is3D },
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

        // ✅ 1. 스케일링 설정 추출 (UI 제거 전에 먼저 추출)
        const scalingConfig = extractScalingConfig();

        // ✅ 2. data_pipeline config 생성
        const dataPhaseConfig = configBuilder.buildChartConfigForGeneration(
            chartType,
            selectedFields,
            dimension,
            {},
            is3D
        );

        // ✅ 3. 통합 시스템용 config 변환
        const unifiedConfig = convertToUnifiedConfig(dataPhaseConfig, scalingConfig);

        console.log('[CHART] 통합 config 생성:', unifiedConfig);

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
                <h3>통합 시각화 결과</h3>
                <div id="chartInfo" class="chart-info">차트 정보가 여기에 표시됩니다</div>
                <div class="chart-canvas-wrapper" style="flex: 1; position: relative; min-height: 400px; height: 400px;">
                </div>
            `;

            const canvasWrapper = chartContainer.querySelector('.chart-canvas-wrapper');
            if (!canvasWrapper) {
                showError('chart-canvas-wrapper를 찾을 수 없습니다');
                return;
            }

            setTimeout(() => {
                try {
                    console.time('실제차트생성');

                    // ✅ 4. 통합 시스템으로 차트 생성 (자동 컨테이너 생성)
                    currentChartWrapper = generateChart(raw_data, unifiedConfig, canvasWrapper);

                    console.log('[CHART] 통합 시스템 차트 생성 완료');
                    console.timeEnd('실제차트생성');

                    // ✅ 5. 고급 옵션 UI 제거 (Option C)
                    const advancedOptions = document.querySelector('.advanced-options');
                    if (advancedOptions) {
                        advancedOptions.style.display = 'none';
                        console.log('[CHART] 기존 고급 옵션 UI 숨김');
                    }

                    // ✅ 6. 이벤트 리스너 등록
                    currentChartWrapper.on('error', (error) => {
                        console.error('[CHART] 차트 에러:', error);
                        showError('차트 오류: ' + error.message);
                    });

                    currentChartWrapper.on('dataLimited', (limitInfo) => {
                        console.warn('[CHART] 데이터 제한:', limitInfo);
                        updateStatus(`⚠️ 성능 최적화로 ${limitInfo.displayed}/${limitInfo.total}개 데이터 표시`, 'info');
                    });

                    // ✅ 7. 차트 정보 표시 (기술적 이름)
                    displayChartInfo(unifiedConfig.type, selectedFields, raw_data.length);

                    updateStatus('통합 시각화 생성 완료!', 'success');
                    updateStepIndicator(3);

                    console.timeEnd('차트생성');

                } catch (error) {
                    console.error('[CHART] 통합 시스템 차트 생성 오류:', error);
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
    currentIs3D = null;

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