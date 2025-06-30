// ============================================================================
// graph_complete.js - 차트 설정 및 시각화 페이지 (chart_data 모듈 사용)
// ============================================================================

// 🔄 chart_data 모듈들 import
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

// 🚨 TODO: shared/error_handler.js로 이동 후 import 경로 수정
import { showError, clearAllChartData } from './shared/error_handler.js';
//import { showError, clearAllChartData } from './chart_gen/unified/error_handler.js';

// 🚨 TODO: chart_gen 정리 후 import 경로 수정
import { generateChart } from './chart_gen/index.js';
//import { generateChart } from './chart_gen/unified/index.js';

// 전역 변수들
let currentChartWrapper = null;
let raw_data = null;
let fieldTypes = {};

// ============================================================================
// 데이터 로드 함수 (chart_data 모듈 사용)
// ============================================================================

/**
 * 🔄 chart_data/data_load.js 사용
 */
function loadDataFromSessionStorage() {
    updateStatus('저장된 데이터 로드 중...', 'info');

    try {
        // 🔄 chart_data/data_load.js의 loadFromSessionStorage 사용
        const { data, meta } = loadFromSessionStorage();

        // 전역 변수에 할당
        raw_data = data;

        console.log('[CHART] sessionStorage 데이터 로드 성공:', {
            recordCount: data.length,
            fields: meta.fieldNames,
            dataSize: (meta.dataSize / 1024).toFixed(2) + 'KB',
            timestamp: new Date(meta.timestamp).toLocaleString()
        });

        const fieldNames = meta.fieldNames.join(', ');
        updateStatus(`✅ ${data.length}개 데이터 로드 완료 | 필드: ${fieldNames}`, 'success');

        // 🔄 chart_data/data_validate.js 사용
        fieldTypes = analyzeFieldTypes(data);
        
        // UI 초기화
        initializeUI(data);
        updateStepIndicator(2);

        // 차트 설정 섹션 표시
        document.getElementById('chartConfigSection').style.display = 'block';

    } catch (error) {
        console.error('[CHART] sessionStorage 로드 오류:', error);
        updateStatus(`데이터 로드 실패: ${error.message}. 데이터 생성기로 돌아가주세요.`, 'error');
        document.getElementById('chartConfigSection').style.display = 'none';
    }
}

/**
 * UI 초기화 (chart_data 모듈 사용)
 */
function initializeUI(data) {
    console.log('[CHART] UI 초기화 시작');
    
    // 🔄 chart_data/data_validate.js 사용
    const maxDimensions = calculateAvailableDimensions(data);
    updateDimensionOptions(maxDimensions);
    
    console.log('[CHART] UI 초기화 완료');
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
// UI 업데이트 함수들 (순수 UI 로직만)
// ============================================================================

function updateDimensionOptions(maxDimensions) {
    const select = document.getElementById('dimensionSelect');

    select.innerHTML = '<option value="">차원 선택</option>';

    for (let dim = 1; dim <= maxDimensions; dim++) {
        const label = dim === 1 ? '1차원 (선형/카테고리)' :
            dim === 2 ? '2차원 (X-Y 산점도)' :
                dim === 3 ? '3차원 (X-Y + 크기/색상)' :
                    '4차원 (X-Y + 크기 + 색상)';
        select.innerHTML += `<option value="${dim}">${label}</option>`;
    }

    select.onchange = updateFieldSelection;
    console.log(`[CHART] 차원 옵션 업데이트: 최대 ${maxDimensions}차원`);
}

function updateFieldSelection() {
    const dimension = parseInt(document.getElementById('dimensionSelect').value);
    const container = document.getElementById('axisMapping');

    if (!dimension) {
        container.innerHTML = '';
        updateChartTypes([]);
        return;
    }

    console.log(`[CHART] ${dimension}차원 선택 - 필드 선택 UI 생성`);

    container.innerHTML = '';

    // 차원수만큼 필드 선택기 생성
    for (let i = 0; i < dimension; i++) {
        const div = document.createElement('div');
        div.className = 'axis-selector';

        const label = document.createElement('label');
        // 🔄 chart_data/data_validate.js 사용
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
    
    // 🔄 chart_data/data_validate.js 사용
    const chartTypes = getAvailableChartTypes(dimension);
    updateChartTypes(chartTypes);
}

function updateChartTypes(types) {
    const select = document.getElementById('chartTypeSelect');
    select.innerHTML = '<option value="">차트 타입 선택</option>';

    types.forEach(type => {
        select.innerHTML += `<option value="${type.value}">${type.label}</option>`;
    });

    select.onchange = checkFormComplete;
    console.log('[CHART] 차트 타입 옵션 업데이트:', types.length, '개');
}

function updateAllFieldOptions() {
    const dimension = parseInt(document.getElementById('dimensionSelect').value);
    if (!dimension) return;

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
            // Y,Z,W축은 숫자만 허용
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

function checkFormComplete() {
    const dimension = parseInt(document.getElementById('dimensionSelect').value);
    const chartType = document.getElementById('chartTypeSelect').value;

    // 선택된 필드들 수집
    const selectedFields = [];
    if (dimension) {
        for (let i = 0; i < dimension; i++) {
            const fieldElement = document.getElementById(`field${i}`);
            if (fieldElement && fieldElement.value) {
                selectedFields.push(fieldElement.value);
            }
        }
    }

    // 🔄 chart_data/data_validate.js 사용
    const isComplete = checkFormCompleteness(dimension, chartType, selectedFields);
    document.getElementById('createChartBtn').disabled = !isComplete;
    
    console.log('[CHART] 폼 완성도 검사:', { dimension, chartType, selectedFields, isComplete });
}

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

// ============================================================================
// 차트 생성 함수 (chart_data 모듈 사용)
// ============================================================================

window.createVisualization = function () {
    console.log('[CHART] 차트 생성 시작');
    
    if (!raw_data || raw_data.length === 0) {
        showError('데이터를 먼저 생성해주세요');
        return;
    }

    const dimension = parseInt(document.getElementById('dimensionSelect').value);
    const chartType = document.getElementById('chartTypeSelect').value;

    console.log('[CHART] 사용자 선택:', { dimension, chartType });

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

    console.log('[CHART] 수집된 필드들:', selectedFields);

    // 실제 데이터 필드명 확인
    const availableFields = Object.keys(raw_data[0] || {});
    console.log('[CHART] 사용 가능한 필드들:', availableFields);

    // 선택된 필드가 실제 데이터에 있는지 확인
    const missingFields = selectedFields.filter(field => !availableFields.includes(field));
    if (missingFields.length > 0) {
        showError(`선택된 필드가 데이터에 없습니다: ${missingFields.join(', ')}`);
        return;
    }

    try {
        updateStatus('시각화 생성 중...', 'info');

        // 🔄 chart_data/data_validate.js 사용
        const fieldValidation = validateFieldConstraints(selectedFields, fieldTypes, dimension);
        if (!fieldValidation.isValid) {
            showError(`필드 제약 오류: ${fieldValidation.errors.join(', ')}`);
            return;
        }

        // 🔄 chart_data/data_processor.js 사용
        const userSelections = { dimension, chartType, selectedFields };
        const configValidation = validateCompleteConfiguration(raw_data, userSelections, fieldTypes);
        
        if (!configValidation.isValid) {
            showError(`설정 검증 오류: ${configValidation.errors.join(', ')}`);
            return;
        }

        // 🔄 chart_data/data_processor.js 사용  
        const { chartConfig } = prepareGenerateChartParams(raw_data, userSelections);

        console.log('[CHART] 생성된 차트 설정:', chartConfig);

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

        // 🔄 차트 엔진 호출 (generateChart)
        console.log('[CHART] generateChart 호출:', {
            dataCount: raw_data.length,
            configType: chartConfig.type,
            mappingKeys: Object.keys(chartConfig.dataMapping)
        });

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

        console.log('[CHART] 차트 생성 완료');

    } catch (error) {
        console.error('[CHART] 생성 오류:', error);
        showError('차트 생성 실패: ' + error.message);
        updateStatus('차트 생성 실패', 'error');
    }
};

// 데이터 생성기로 돌아가기
window.goBackToGenerator = function () {
    console.log('[CHART] 데이터 생성기로 돌아가기');
    
    // 현재 차트 정리
    if (currentChartWrapper) {
        currentChartWrapper.destroy();
        currentChartWrapper = null;
    }

    // 전역 데이터 정리
    clearAllChartData();
    raw_data = null;
    fieldTypes = {};

    // sessionStorage는 유지 (사용자가 다시 돌아올 수 있음)
    
    window.location.href = 'index.html';
};

// ============================================================================
// 페이지 초기화
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('=== 차트 페이지 초기화 ===');

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

    // 🔄 chart_data/data_load.js 사용
    loadDataFromSessionStorage();
});

// 페이지 언로드시 정리
window.addEventListener('beforeunload', () => {
    console.log('[CHART] 페이지 언로드 - 차트 정리');
    
    if (currentChartWrapper) {
        currentChartWrapper.destroy();
    }
    clearAllChartData();

    // sessionStorage는 유지 (브라우저 세션 종료시까지)
});