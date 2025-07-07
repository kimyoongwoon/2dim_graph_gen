// ============================================================================
// graph_complete.js (드롭다운 UI 방식) - 사용자 친화적 Config Builder
// ============================================================================

import {
    sessionStorageManager,
    dataValidator,
    configBuilder,
    chartTypeProvider,
    dimensionCalculator,
    configSchema
} from './data_pipeline/index.js';
import { showError, clearAllChartData } from './shared/error_handler.js';

// 통합 시스템 import
import { generateChart } from './3dim_chart_gen/index.js';

// 전역 변수들
let currentChartWrapper = null;
let raw_data = null;
let fieldTypes = {};
let availableFields = [];

// ============================================================================
// 페이지 초기화 및 데이터 로드
// ============================================================================

function loadDataFromSessionStorage() {
    updateStatus('저장된 데이터 로드 중...', 'info');

    try {
        const { data, meta } = sessionStorageManager.loadRawDataFromSessionStorage();
        raw_data = data;

        const fieldNames = meta.fieldNames.join(', ');
        updateStatus(`✅ ${data.length}개 데이터 로드 완료 | 필드: ${fieldNames}`, 'success');

        // 필드 타입 분석
        fieldTypes = dataValidator.analyzeDataFieldTypes(data);
        availableFields = Object.keys(data[0] || {});

        // 필드 정보 표시
        displayFieldsInfo(data);

        // 진행 단계 초기화
        updateProgressSteps(1);

        console.log('[CHART] 데이터 로드 완료:', data.length, '개, 필드:', availableFields);

    } catch (error) {
        console.error('[CHART] 데이터 로드 오류:', error);
        updateStatus(`데이터 로드 실패: ${error.message}. 데이터 생성기로 돌아가주세요.`, 'error');
    }
}

function displayFieldsInfo(data) {
    const fieldsInfoSection = document.getElementById('fieldsInfoSection');
    const fieldsInfo = document.getElementById('fieldsInfo');

    if (!fieldsInfoSection || !fieldsInfo || !data || data.length === 0) return;

    const firstRecord = data[0];
    const fieldNames = Object.keys(firstRecord);

    // 필드별 타입 정보 생성
    const fieldList = fieldNames.map(field => {
        const value = firstRecord[field];
        const type = typeof value;
        const typeLabel = type === 'number' ? '[숫자]' : type === 'string' ? '[문자]' : `[${type}]`;
        return `${typeLabel} ${field}`;
    }).join(', ');

    fieldsInfo.innerHTML = `
        <strong>총 ${fieldNames.length}개 필드:</strong><br>
        ${fieldList}
    `;

    fieldsInfoSection.style.display = 'block';
}

// ============================================================================
// 드롭다운 UI 이벤트 핸들러들
// ============================================================================

/**
 * 차트 타입 변경시 - 해당 타입에 필요한 dataMapping 필드들 동적 생성
 */
function onChartTypeChange() {
    const chartTypeSelect = document.getElementById('chartTypeSelect');
    const dataMappingSection = document.getElementById('dataMappingSection');
    const dataMappingFields = document.getElementById('dataMappingFields');

    if (!chartTypeSelect || !dataMappingSection || !dataMappingFields) return;

    const chartType = chartTypeSelect.value;

    if (!chartType) {
        dataMappingSection.style.display = 'none';
        updateConfigPreview();
        checkFormCompleteness();
        return;
    }

    console.log('[CHART] 차트 타입 변경:', chartType);

    // 차트 타입별 요구사항 조회
    const requirements = configSchema.getChartTypeRequirements(chartType);
    if (!requirements) {
        console.error('[CHART] 차트 타입 요구사항을 찾을 수 없음:', chartType);
        return;
    }

    // 기존 필드들 제거
    dataMappingFields.innerHTML = '';

    // 필요한 필드들 동적 생성 (순서대로)
    requirements.required.forEach((fieldKey, index) => {
        const fieldDiv = document.createElement('div');
        fieldDiv.className = 'mapping-field';

        const label = document.createElement('label');
        label.textContent = `${index + 1}. ${getFieldLabel(fieldKey)}`;

        const description = document.createElement('div');
        description.className = 'field-description';
        description.textContent = getFieldDescription(fieldKey);

        const select = document.createElement('select');
        select.id = `field_${index}`; // 순서 기반 ID
        select.setAttribute('data-field-key', fieldKey); // 필드 키 저장
        select.innerHTML = '<option value="">필드 선택</option>';

        // 사용 가능한 필드들 추가
        availableFields.forEach(field => {
            const fieldType = fieldTypes[field];
            const typeLabel = fieldType === 'string' ? '[문자]' : '[숫자]';
            select.innerHTML += `<option value="${field}">${typeLabel} ${field}</option>`;
        });

        select.addEventListener('change', () => {
            updateConfigPreview();
            checkFormCompleteness();
        });

        fieldDiv.appendChild(label);
        fieldDiv.appendChild(description);
        fieldDiv.appendChild(select);
        dataMappingFields.appendChild(fieldDiv);
    });

    dataMappingSection.style.display = 'block';
    updateConfigPreview();
    checkFormCompleteness();
}

/**
 * 스케일링 타입 변경시 - 파라미터 입력 필드 표시/숨김
 */
function onScalingTypeChange() {
    const scalingTypeSelect = document.getElementById('scalingTypeSelect');
    const scalingParams = document.getElementById('scalingParams');

    if (!scalingTypeSelect || !scalingParams) return;

    const scalingType = scalingTypeSelect.value;

    // 기존 파라미터 필드들 제거
    scalingParams.innerHTML = '';

    if (scalingType === 'linear') {
        scalingParams.style.display = 'block';
        scalingParams.innerHTML = `
            <div class="param-fields">
                <div class="param-field">
                    <label>기울기 (a)</label>
                    <input type="number" id="param_a" value="1" step="0.1" onchange="updateConfigPreview()">
                </div>
                <div class="param-field">
                    <label>오프셋 (b)</label>
                    <input type="number" id="param_b" value="0" step="0.1" onchange="updateConfigPreview()">
                </div>
            </div>
        `;
    } else if (scalingType === 'sigmoid') {
        scalingParams.style.display = 'block';
        scalingParams.innerHTML = `
            <div class="param-fields">
                <div class="param-field">
                    <label>급경사도 (k)</label>
                    <input type="number" id="param_k" value="1" min="0.1" max="10" step="0.1" onchange="updateConfigPreview()">
                </div>
            </div>
        `;
    } else {
        scalingParams.style.display = 'none';
    }

    updateConfigPreview();
    checkFormCompleteness();
}

// ============================================================================
// Config 미리보기 업데이트 (기존 함수 활용)
// ============================================================================

/**
 * 🔄 기존 build_chart_config_for_generation 함수를 사용하여 config 생성
 */
function updateConfigPreview() {
    const configPreview = document.getElementById('configPreview');

    if (!configPreview) return;

    try {
        // 현재 사용자 선택값들 수집
        const userSelection = collectUserSelections();

        if (!userSelection || !userSelection.chartType) {
            configPreview.value = '';
            return;
        }

        // 기존 build_chart_config_for_generation 함수 사용
        const config = configBuilder.buildChartConfigForGeneration(
            userSelection.chartType,
            userSelection.selectedFields,
            userSelection.dimension,
            userSelection.extraOptions,
            userSelection.is3D
        );

        // JSON 포맷팅하여 미리보기 업데이트
        configPreview.value = JSON.stringify(config, null, 2);

        console.log('[CHART] Config 미리보기 업데이트 (기존 함수 사용):', config);

    } catch (error) {
        console.error('[CHART] Config 미리보기 오류:', error);
        configPreview.value = `// Config 생성 오류: ${error.message}`;
    }
}

/**
 * 🔄 현재 UI에서 사용자 선택값들을 수집
 */
function collectUserSelections() {
    const chartType = document.getElementById('chartTypeSelect')?.value;
    if (!chartType) return null;

    // 차트 타입별 요구사항 조회
    const requirements = configSchema.getChartTypeRequirements(chartType);
    if (!requirements) return null;

    // 선택된 필드들을 순서대로 배열 구성
    const selectedFields = [];
    for (let i = 0; i < requirements.required.length; i++) {
        const fieldSelect = document.getElementById(`field_${i}`);
        if (fieldSelect && fieldSelect.value) {
            selectedFields.push(fieldSelect.value);
        } else {
            // 필드가 선택되지 않으면 빈 문자열로 (검증에서 걸릴 것)
            selectedFields.push('');
        }
    }

    // 차원수 계산
    const dimension = requirements.required.length;

    // 3D 여부 판단 (차트 타입 기반)
    const is3D = chartType.startsWith('3d_surface_scatter'); // 실제 3D는 이것만

    // 추가 옵션들 수집
    const extraOptions = collectExtraOptions();

    return {
        chartType,
        selectedFields,
        dimension,
        extraOptions,
        is3D
    };
}

/**
 * 스케일링, 색상 등 추가 옵션 수집
 */
function collectExtraOptions() {
    const extraOptions = {};

    // 스케일링 설정
    const scalingType = document.getElementById('scalingTypeSelect')?.value || 'default';
    extraOptions.scaling = { type: scalingType };

    if (scalingType === 'linear') {
        const a = parseFloat(document.getElementById('param_a')?.value) || 1;
        const b = parseFloat(document.getElementById('param_b')?.value) || 0;
        extraOptions.scaling.params = { a, b };
    } else if (scalingType === 'sigmoid') {
        const k = parseFloat(document.getElementById('param_k')?.value) || 1;
        extraOptions.scaling.params = { k };
    }

    // 색상 설정
    const colorType = document.getElementById('colorTypeSelect')?.value || 'blueRed';
    extraOptions.colorScheme = colorType;

    return extraOptions;
}

/**
 * 🆕 폼 완성도 체크
 */
function checkFormCompleteness() {
    const createBtn = document.getElementById('createChartBtn');
    if (!createBtn) return;

    try {
        const userSelection = collectUserSelections();

        if (!userSelection) {
            createBtn.disabled = true;
            calculateCurrentStep();
            return;
        }

        // 기본 완성도 체크
        const isComplete = dataValidator.validateFormCompleteness({
            dimension: userSelection.dimension,
            chartType: userSelection.chartType,
            selectedFields: userSelection.selectedFields
        });

        createBtn.disabled = !isComplete;

        // 진행 단계 업데이트
        calculateCurrentStep();

        console.log('[CHART] 폼 완성도:', isComplete ? '완료' : '미완료');

    } catch (error) {
        console.error('[CHART] 폼 완성도 체크 오류:', error);
        createBtn.disabled = true;
        calculateCurrentStep();
    }
}

// ============================================================================
// 최종 검증 및 차트 생성
// ============================================================================

/**
 * 🔄 기존 파이프라인을 활용한 최종 검증 및 차트 생성
 */
window.validateAndCreateChart = async function () {
    console.log('[CHART] 기존 파이프라인 활용 차트 생성 시작');

    if (!raw_data || raw_data.length === 0) {
        showError('데이터를 먼저 생성해주세요');
        return;
    }

    // 현재 사용자 선택값들 수집
    const userSelection = collectUserSelections();
    if (!userSelection || !userSelection.chartType) {
        showError('차트 타입을 선택해주세요');
        return;
    }

    console.log('[CHART] 수집된 사용자 선택:', userSelection);

    try {
        updateStatus('검증 및 차트 생성 중...', 'info');

        // 1. 🔄 기존 사용자 선택 입력 검증 (data_pipeline 활용)
        const inputValidation = dataValidator.validateUserSelectionInput(
            {
                dimension: userSelection.dimension,
                chartType: userSelection.chartType,
                selectedFields: userSelection.selectedFields,
                is3D: userSelection.is3D
            },
            raw_data
        );

        if (!inputValidation.isValid) {
            showValidationResult({
                isValid: false,
                errors: inputValidation.errors,
                warnings: inputValidation.warnings,
                suggestions: []
            });
            return;
        }

        // 2. 🔄 기존 config 생성 함수 활용
        const config = configBuilder.buildChartConfigForGeneration(
            userSelection.chartType,
            userSelection.selectedFields,
            userSelection.dimension,
            userSelection.extraOptions,
            userSelection.is3D
        );

        console.log('[CHART] 기존 함수로 생성된 config:', config);

        // 3. 🆕 최종 config 검증 (새로운 검증 함수)
        const configValidation = dataValidator.validateCompleteConfig(config, raw_data);
        if (!configValidation.isValid) {
            showValidationResult(configValidation);
            return;
        }

        // 4. 기존 차트 정리
        if (currentChartWrapper) {
            currentChartWrapper.destroy();
            currentChartWrapper = null;
        }

        // 5. 차트 컨테이너 준비
        const chartContainer = document.getElementById('chartContainer');
        if (!chartContainer) {
            showError('chartContainer를 찾을 수 없습니다');
            return;
        }

        chartContainer.style.display = 'block';

        // 캔버스 래퍼 준비
        const canvasWrapper = chartContainer.querySelector('.chart-canvas-wrapper');
        if (!canvasWrapper) {
            showError('chart-canvas-wrapper를 찾을 수 없습니다');
            return;
        }

        canvasWrapper.innerHTML = ''; // 기존 내용 제거

        // 6. 🔄 통합 시스템으로 차트 생성 (기존과 동일)
        currentChartWrapper = generateChart(raw_data, config, canvasWrapper);

        console.log('[CHART] 통합 시스템 차트 생성 완료');

        // 7. 이벤트 리스너 등록
        currentChartWrapper.on('error', (error) => {
            console.error('[CHART] 차트 오류:', error);
            showError('차트 오류: ' + error.message);
        });

        currentChartWrapper.on('dataLimited', (limitInfo) => {
            console.warn('[CHART] 데이터 제한:', limitInfo);
            updateStatus(`⚠️ 성능 최적화로 ${limitInfo.displayed}/${limitInfo.total}개 데이터 표시`, 'info');
        });

        // 8. 차트 정보 표시
        displayChartInfo(config);

        updateStatus('통합 시각화 생성 완료!', 'success');

        // 검증 결과 숨김 (성공시)
        const validationResult = document.getElementById('validationResult');
        if (validationResult) {
            validationResult.classList.add('hidden');
        }

    } catch (error) {
        console.error('[CHART] 차트 생성 오류:', error);
        showError('차트 생성 실패: ' + error.message);
        updateStatus('차트 생성 실패', 'error');

        // 자세한 오류 정보 표시
        showValidationResult({
            isValid: false,
            errors: [`차트 생성 실패: ${error.message}`],
            warnings: [],
            suggestions: ['설정을 다시 확인해주세요']
        });
    }
};

function showValidationResult(result) {
    const validationResult = document.getElementById('validationResult');
    if (!validationResult) return;

    let resultText = '';
    let resultClass = '';

    if (result.isValid) {
        resultText = '✅ Config 검증 통과!\n';
        resultClass = 'valid';
    } else {
        resultText = '❌ Config 검증 실패!\n\n';
        resultClass = 'invalid';
    }

    // 오류 표시
    if (result.errors && result.errors.length > 0) {
        resultText += '🚫 오류:\n';
        result.errors.forEach(error => {
            resultText += `  • ${error}\n`;
        });
        resultText += '\n';
    }

    // 경고 표시
    if (result.warnings && result.warnings.length > 0) {
        resultText += '⚠️ 경고:\n';
        result.warnings.forEach(warning => {
            resultText += `  • ${warning}\n`;
        });
        resultText += '\n';
    }

    // 제안사항 표시
    if (result.suggestions && result.suggestions.length > 0) {
        resultText += '💡 제안:\n';
        result.suggestions.forEach(suggestion => {
            resultText += `  • ${suggestion}\n`;
        });
    }

    validationResult.textContent = resultText;
    validationResult.className = `validation-result ${resultClass}`;
    validationResult.classList.remove('hidden');
}

// ============================================================================
// 설정 초기화 및 기타 유틸리티
// ============================================================================

/**
 * 모든 설정 초기화
 */
window.resetConfiguration = function () {
    console.log('[CHART] 설정 초기화');

    // 드롭다운들 초기화
    const chartTypeSelect = document.getElementById('chartTypeSelect');
    const scalingTypeSelect = document.getElementById('scalingTypeSelect');
    const colorTypeSelect = document.getElementById('colorTypeSelect');
    const configPreview = document.getElementById('configPreview');
    const createBtn = document.getElementById('createChartBtn');
    const dataMappingSection = document.getElementById('dataMappingSection');
    const scalingParams = document.getElementById('scalingParams');
    const validationResult = document.getElementById('validationResult');

    if (chartTypeSelect) chartTypeSelect.value = '';
    if (scalingTypeSelect) scalingTypeSelect.value = 'default';
    if (colorTypeSelect) colorTypeSelect.value = 'blueRed';
    if (configPreview) configPreview.value = '';
    if (createBtn) createBtn.disabled = true;
    if (dataMappingSection) dataMappingSection.style.display = 'none';
    if (scalingParams) scalingParams.style.display = 'none';
    if (validationResult) validationResult.classList.add('hidden');

    // 기존 차트 제거
    if (currentChartWrapper) {
        currentChartWrapper.destroy();
        currentChartWrapper = null;
    }

    const chartContainer = document.getElementById('chartContainer');
    if (chartContainer) {
        chartContainer.style.display = 'none';
    }

    updateStatus('설정이 초기화되었습니다', 'info');
};

// ============================================================================
// 진행 단계 관리
// ============================================================================

/**
 * 진행 단계 업데이트
 * @param {number} currentStep - 현재 단계 (1-4)
 */
function updateProgressSteps(currentStep) {
    for (let i = 1; i <= 4; i++) {
        const stepElement = document.getElementById(`step${i}`);
        if (!stepElement) continue;

        stepElement.className = 'step-item';
        if (i < currentStep) {
            stepElement.className += ' completed';
        } else if (i === currentStep) {
            stepElement.className += ' active';
        }
    }
}

/**
 * 현재 진행 상황에 따른 단계 계산
 */
function calculateCurrentStep() {
    const chartType = document.getElementById('chartTypeSelect')?.value;

    if (!chartType) {
        updateProgressSteps(1); // 차트 타입 선택 단계
        return;
    }

    const userSelection = collectUserSelections();
    if (!userSelection) {
        updateProgressSteps(1);
        return;
    }

    // 필드 매핑 완성도 확인
    const hasEmptyFields = userSelection.selectedFields.some(field => !field || field.trim() === '');
    if (hasEmptyFields) {
        updateProgressSteps(2); // 필드 매핑 단계
        return;
    }

    // 차트 생성 가능 여부 확인
    const createBtn = document.getElementById('createChartBtn');
    if (createBtn && !createBtn.disabled) {
        updateProgressSteps(4); // 차트 생성 준비 완료
    } else {
        updateProgressSteps(3); // 옵션 설정 단계
    }
}

// ============================================================================
// 헬퍼 함수들 (수정됨)
// ============================================================================

function getFieldLabel(fieldKey) {
    const labels = {
        'x': 'X축',
        'y': 'Y축',
        'z': 'Z축',
        'size': '크기',
        'color': '색상'
    };
    return labels[fieldKey] || fieldKey;
}

function getFieldDescription(fieldKey) {
    const descriptions = {
        'x': 'X축(가로축) 위치 값',
        'y': 'Y축(세로축) 위치 값',
        'z': 'Z축(깊이축) 위치 값 - 3D 전용',
        'size': '마커 크기로 인코딩할 값 - 숫자 권장',
        'color': '마커 색상으로 인코딩할 값 - 숫자 권장'
    };
    return descriptions[fieldKey] || '';
}

function displayChartInfo(config) {
    const chartInfo = document.getElementById('chartInfo');
    if (!chartInfo) return;

    const mappingInfo = Object.entries(config.dataMapping)
        .map(([axis, field]) => `${axis}: ${field}`)
        .join(' | ');

    chartInfo.innerHTML = `
        <strong>차트 타입:</strong> ${config.type} | 
        <strong>필드 매핑:</strong> ${mappingInfo} | 
        <strong>데이터 개수:</strong> ${raw_data.length}개
    `;
}

function updateStatus(message, type = 'info') {
    const dataInfo = document.getElementById('data-info');
    if (dataInfo) {
        dataInfo.innerHTML = `<strong>${message}</strong>`;
        dataInfo.className = `data-info ${type}`;
    }
}

window.goBackToGenerator = function () {
    if (currentChartWrapper) {
        currentChartWrapper.destroy();
        currentChartWrapper = null;
    }

    clearAllChartData();
    raw_data = null;
    fieldTypes = {};
    availableFields = [];

    window.location.href = 'index.html';
};

// ============================================================================
// 페이지 초기화
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('=== 3DIM Chart Generator 초기화 (드롭다운 UI) ===');

    // 데이터 로드
    loadDataFromSessionStorage();

    // 이벤트 리스너 등록
    const chartTypeSelect = document.getElementById('chartTypeSelect');
    const scalingTypeSelect = document.getElementById('scalingTypeSelect');
    const colorTypeSelect = document.getElementById('colorTypeSelect');

    if (chartTypeSelect) {
        chartTypeSelect.addEventListener('change', onChartTypeChange);
    }

    if (scalingTypeSelect) {
        scalingTypeSelect.addEventListener('change', onScalingTypeChange);
    }

    if (colorTypeSelect) {
        colorTypeSelect.addEventListener('change', () => {
            updateConfigPreview();
            checkFormCompleteness();
        });
    }

    console.log('[CHART] 드롭다운 UI 이벤트 리스너 등록 완료');
});

window.addEventListener('beforeunload', () => {
    if (currentChartWrapper) {
        currentChartWrapper.destroy();
    }
    clearAllChartData();
});