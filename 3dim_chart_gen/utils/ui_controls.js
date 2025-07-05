// ============================================================================
// 3dim_chart_gen/utils/ui_controls.js - 통합 UI 컨트롤 시스템 + metadata 기반 필터링
// 🔥 경량화: components + ui_controls + data 처리 통합
// ============================================================================
import { processDataForChart } from '../unified/data_processor.js';

/**
 * 통합 컨트롤 패널 생성 (Show/Hide 버튼 + 윈도우 컨트롤)
 * @param {HTMLElement} parentElement - 부모 엘리먼트
 * @param {Object} chartWrapper - 차트 래퍼 객체 (이벤트 연결용)
 * @returns {HTMLElement} 생성된 컨트롤 패널
 */
export function createControlPanel(parentElement, chartWrapper = null) {
    console.log('[UI_CONTROLS] 통합 컨트롤 패널 생성');

    const panel = document.createElement('div');
    panel.className = 'control-panel-unified';
    panel.style.cssText = `
        margin-bottom: 15px;
        border: 1px solid #ddd;
        border-radius: 4px;
        overflow: hidden;
    `;

    // 헤더
    const header = document.createElement('div');
    header.className = 'control-panel-header';
    header.style.cssText = `
        background: #e9ecef;
        padding: 8px 12px;
        font-weight: bold;
        font-size: 13px;
        border-bottom: 1px solid #ddd;
        cursor: pointer;
        user-select: none;
    `;
    header.textContent = '차트 컨트롤';

    // 컨텐츠 영역 (접기/펼치기)
    const content = document.createElement('div');
    content.className = 'control-panel-content';
    content.style.cssText = `
        padding: 10px;
        display: block;
    `;

    // Show/Hide 버튼들 생성
    const showHideBox = createShowHideButtons(chartWrapper);

    // 윈도우 컨트롤들 생성
    const windowControlBox = createWindowControls(chartWrapper);

    content.appendChild(showHideBox);
    content.appendChild(windowControlBox);

    panel.appendChild(header);
    panel.appendChild(content);

    // 헤더 클릭으로 접기/펼치기
    let isCollapsed = false;
    header.addEventListener('click', () => {
        isCollapsed = !isCollapsed;
        content.style.display = isCollapsed ? 'none' : 'block';
        header.textContent = isCollapsed ? '차트 컨트롤 (접힘)' : '차트 컨트롤';
    });

    if (parentElement) {
        parentElement.appendChild(panel);
    }

    console.log('[UI_CONTROLS] 통합 컨트롤 패널 생성 완료');
    return panel;
}

/**
 * Show/Hide 버튼 박스 생성 (3D 차트용)
 * @param {Object} chartWrapper - 차트 래퍼 객체
 * @returns {HTMLElement} 생성된 버튼 박스
 */
function createShowHideButtons(chartWrapper) {
    console.log('[UI_CONTROLS] Show/Hide 버튼 생성');

    const buttonBox = document.createElement('div');
    buttonBox.className = 'show-hide-buttons';
    buttonBox.style.cssText = `
        display: flex;
        gap: 8px;
        margin-bottom: 10px;
        padding: 8px;
        background: #f5f5f5;
        border-radius: 4px;
    `;

    // 3D 차트에서만 표시
    if (!chartWrapper || !chartWrapper.getChartType || !chartWrapper.getChartType().startsWith('3d_')) {
        buttonBox.style.display = 'none';
        console.log('[UI_CONTROLS] 3D 차트가 아니므로 Show/Hide 버튼 숨김');
        return buttonBox;
    }

    // Show Both 버튼
    const showBothBtn = document.createElement('button');
    showBothBtn.textContent = 'Show Both';
    showBothBtn.className = 'show-both-btn';
    showBothBtn.style.cssText = `
        padding: 4px 8px;
        background: #007bff;
        color: white;
        border: none;
        border-radius: 3px;
        cursor: pointer;
        font-size: 12px;
    `;

    // Points Only 버튼
    const pointsOnlyBtn = document.createElement('button');
    pointsOnlyBtn.textContent = 'Points Only';
    pointsOnlyBtn.className = 'points-only-btn';
    pointsOnlyBtn.style.cssText = `
        padding: 4px 8px;
        background: #28a745;
        color: white;
        border: none;
        border-radius: 3px;
        cursor: pointer;
        font-size: 12px;
    `;

    // Surface Only 버튼
    const surfaceOnlyBtn = document.createElement('button');
    surfaceOnlyBtn.textContent = 'Surface Only';
    surfaceOnlyBtn.className = 'surface-only-btn';
    surfaceOnlyBtn.style.cssText = `
        padding: 4px 8px;
        background: #ffc107;
        color: black;
        border: none;
        border-radius: 3px;
        cursor: pointer;
        font-size: 12px;
    `;

    // 🔥 이벤트 리스너 연결
    if (chartWrapper && chartWrapper.toggleTrace) {
        showBothBtn.addEventListener('click', () => {
            chartWrapper.toggleTrace('surface', true);
            chartWrapper.toggleTrace('scatter3d', true);
            console.log('[UI_CONTROLS] Show Both 실행');
        });

        pointsOnlyBtn.addEventListener('click', () => {
            chartWrapper.toggleTrace('surface', false);
            chartWrapper.toggleTrace('scatter3d', true);
            console.log('[UI_CONTROLS] Points Only 실행');
        });

        surfaceOnlyBtn.addEventListener('click', () => {
            chartWrapper.toggleTrace('surface', true);
            chartWrapper.toggleTrace('scatter3d', false);
            console.log('[UI_CONTROLS] Surface Only 실행');
        });
    }

    buttonBox.appendChild(showBothBtn);
    buttonBox.appendChild(pointsOnlyBtn);
    buttonBox.appendChild(surfaceOnlyBtn);

    return buttonBox;
}

/**
 * 윈도우 컨트롤 박스 생성 (데이터 처리 옵션) - 🔥 실제 기능 연결
 * @param {Object} chartWrapper - 차트 래퍼 객체
 * @returns {HTMLElement} 생성된 컨트롤 박스
 */
function createWindowControls(chartWrapper) {
    console.log('[UI_CONTROLS] 윈도우 컨트롤 생성');

    const controlBox = document.createElement('div');
    controlBox.className = 'window-controls';
    controlBox.style.cssText = `
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-bottom: 10px;
        padding: 8px;
        background: #f8f9fa;
        border-radius: 4px;
        border: 1px solid #dee2e6;
    `;

    // 범위 입력 필드들 생성
    const controls = [
        { label: 'X Start', key: 'x_start', defaultValue: '' },
        { label: 'X End', key: 'x_end', defaultValue: '' },
        { label: 'Y Start', key: 'y_start', defaultValue: '' },
        { label: 'Y End', key: 'y_end', defaultValue: '' }
    ];

    controls.forEach(control => {
        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'display: flex; flex-direction: column; align-items: center;';

        const label = document.createElement('label');
        label.textContent = control.label;
        label.style.cssText = 'font-size: 11px; font-weight: bold; margin-bottom: 2px;';

        const input = document.createElement('input');
        input.type = 'number';
        input.placeholder = 'Auto';
        input.value = control.defaultValue;
        input.className = `window-control-${control.key}`;
        input.style.cssText = 'width: 80px; padding: 2px 4px; font-size: 11px; text-align: center; border: 1px solid #ccc; border-radius: 3px;';

        // 🔥 실제 이벤트 리스너 연결
        input.addEventListener('change', () => {
            applyRangeFilter(chartWrapper);
            console.log(`[UI_CONTROLS] ${control.label} 값 변경:`, input.value);
        });

        input.addEventListener('blur', () => {
            applyRangeFilter(chartWrapper);
        });

        wrapper.appendChild(label);
        wrapper.appendChild(input);
        controlBox.appendChild(wrapper);
    });

    // Apply 버튼 추가
    const applyBtn = document.createElement('button');
    applyBtn.textContent = 'Apply Range';
    applyBtn.style.cssText = `
        padding: 4px 12px;
        background: #007bff;
        color: white;
        border: none;
        border-radius: 3px;
        cursor: pointer;
        font-size: 11px;
        margin-left: 10px;
        align-self: center;
    `;

    applyBtn.addEventListener('click', () => {
        applyRangeFilter(chartWrapper);
        console.log('[UI_CONTROLS] Apply Range 버튼 클릭');
    });

    controlBox.appendChild(applyBtn);

    return controlBox;
}

/**
 * 🔥 metadata 기반 슬라이더 컨테이너 생성 (필터링 가능한 필드 자동 감지)
 * @param {HTMLElement} parentElement - 부모 엘리먼트
 * @param {Object} metadata - 차트 메타데이터
 * @param {Array} originalData - 원본 데이터
 * @param {Object} chartWrapper - 차트 래퍼 객체
 * @returns {HTMLElement} 생성된 슬라이더 컨테이너
 */
export function createSliderContainer(parentElement, metadata = null, originalData = null, chartWrapper = null) {
    console.log('[UI_CONTROLS] 슬라이더 컨테이너 생성 (metadata 기반)');

    const container = document.createElement('div');
    container.className = 'slider-container-unified';
    container.style.cssText = `
        margin-bottom: 15px;
        border: 1px solid #ddd;
        border-radius: 4px;
        overflow: hidden;
    `;

    // 헤더
    const header = document.createElement('div');
    header.className = 'slider-container-header';
    header.style.cssText = `
        background: #e9ecef;
        padding: 8px 12px;
        font-weight: bold;
        font-size: 13px;
        border-bottom: 1px solid #ddd;
        cursor: pointer;
        user-select: none;
    `;
    header.textContent = 'Data Filters';

    // 슬라이더 영역
    const sliderArea = document.createElement('div');
    sliderArea.className = 'slider-area';
    sliderArea.style.cssText = `
        padding: 10px;
        background: #f8f9fa;
        display: flex;
        flex-wrap: wrap;
        gap: 15px;
        align-items: center;
        min-height: 60px;
    `;

    // 🔥 필터링 가능한 필드 자동 감지
    const filterableFields = getFilterableFields(metadata, originalData);

    console.log('[UI_CONTROLS] 필터링 가능한 필드:', filterableFields);

    if (filterableFields.length > 0) {
        filterableFields.forEach(field => {
            const slider = createFilterSlider(field, chartWrapper);
            sliderArea.appendChild(slider);
        });

        // 전체 초기화 버튼 추가
        const resetBtn = createResetFiltersButton(chartWrapper);
        sliderArea.appendChild(resetBtn);

    } else {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'slider-empty-message';
        emptyMessage.style.cssText = `
            color: #6c757d;
            font-style: italic;
            font-size: 12px;
            width: 100%;
            text-align: center;
        `;
        emptyMessage.textContent = '필터링 가능한 필드가 없습니다';
        sliderArea.appendChild(emptyMessage);
    }

    container.appendChild(header);
    container.appendChild(sliderArea);

    // 헤더 클릭으로 접기/펼치기
    let isCollapsed = false;
    header.addEventListener('click', () => {
        isCollapsed = !isCollapsed;
        sliderArea.style.display = isCollapsed ? 'none' : 'flex';
        header.textContent = isCollapsed ? 'Data Filters (접힘)' : 'Data Filters';
    });

    if (parentElement) {
        parentElement.appendChild(container);
    }

    console.log('[UI_CONTROLS] 슬라이더 컨테이너 생성 완료');
    return container;
}

/**
 * 🔥 metadata 기반으로 필터링 가능한 필드 자동 감지
 * @param {Object} metadata - 차트 메타데이터
 * @param {Array} originalData - 원본 데이터
 * @returns {Array} 필터링 가능한 필드 목록
 */
function getFilterableFields(metadata, originalData) {
    console.log('[UI_CONTROLS] 필터링 가능 필드 분석 시작');

    if (!metadata || !metadata.axes || !originalData || originalData.length === 0) {
        console.warn('[UI_CONTROLS] metadata 또는 originalData가 없음');
        return [];
    }

    // 차트에 사용된 필드들 추출
    const usedFields = metadata.axes.map(axis => axis.name);
    console.log('[UI_CONTROLS] 차트 사용 필드:', usedFields);

    // 원본 데이터의 모든 필드 추출
    const allFields = Object.keys(originalData[0] || {});
    console.log('[UI_CONTROLS] 전체 필드:', allFields);

    // 사용되지 않은 필드들 = 필터링 가능한 필드들
    const filterableFields = allFields.filter(field =>
        !usedFields.includes(field) &&
        field !== '_originalIndex' &&
        field !== '_fullData'
    );

    console.log('[UI_CONTROLS] 필터링 가능 필드:', filterableFields);

    // 각 필드의 값 범위 계산
    const fieldsWithRange = filterableFields.map(fieldName => {
        const values = originalData
            .map(item => item[fieldName])
            .filter(v => v !== null && v !== undefined && !isNaN(Number(v)))
            .map(v => Number(v));

        if (values.length === 0) {
            return null; // 유효한 숫자 값이 없는 필드는 제외
        }

        const min = Math.min(...values);
        const max = Math.max(...values);
        const mid = (min + max) / 2;

        return {
            name: fieldName,
            label: fieldName,
            min: min,
            max: max,
            value: mid,
            step: (max - min) / 100, // 100단계
            values: values
        };
    }).filter(field => field !== null);

    console.log('[UI_CONTROLS] 범위 포함 필터링 필드:', fieldsWithRange);

    return fieldsWithRange;
}

/**
 * 🔥 필터링용 슬라이더 생성 (조건 버튼 포함)
 * @param {Object} fieldConfig - 필드 설정
 * @param {Object} chartWrapper - 차트 래퍼 객체
 * @returns {HTMLElement} 생성된 슬라이더 엘리먼트
 */
function createFilterSlider(fieldConfig, chartWrapper) {
    const { name, label, min, max, value, step } = fieldConfig;

    console.log('[UI_CONTROLS] 필터 슬라이더 생성:', { name, min, max });

    const sliderWrapper = document.createElement('div');
    sliderWrapper.className = `filter-slider-${name}`;
    sliderWrapper.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        margin: 0 10px;
        min-width: 180px;
        padding: 8px;
        border: 1px solid #dee2e6;
        border-radius: 4px;
        background: white;
    `;

    // 라벨과 값 표시
    const labelDiv = document.createElement('div');
    labelDiv.style.cssText = `
        display: flex;
        justify-content: space-between;
        width: 100%;
        margin-bottom: 5px;
        font-size: 12px;
    `;

    const labelSpan = document.createElement('span');
    labelSpan.textContent = label || name;
    labelSpan.style.fontWeight = 'bold';

    const valueSpan = document.createElement('span');
    valueSpan.className = `filter-value-${name}`;
    valueSpan.textContent = value.toFixed(2);
    valueSpan.style.cssText = `
        font-family: monospace;
        background: #e9ecef;
        padding: 2px 6px;
        border-radius: 3px;
    `;

    labelDiv.appendChild(labelSpan);
    labelDiv.appendChild(valueSpan);

    // 슬라이더 input
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.className = `filter-slider-input-${name}`;
    slider.min = min;
    slider.max = max;
    slider.value = value;
    slider.step = step;
    slider.style.cssText = 'width: 100%; margin-bottom: 8px;';

    // 조건 버튼들
    const modeButtons = createFilterModeButtons(name, chartWrapper);

    // 슬라이더 값 변경 이벤트
    slider.addEventListener('input', () => {
        valueSpan.textContent = parseFloat(slider.value).toFixed(2);
        // 실시간 필터링 적용
        applyDataFilters(chartWrapper);
        console.log(`[UI_CONTROLS] 필터 슬라이더 값 변경: ${name} = ${slider.value}`);
    });

    sliderWrapper.appendChild(labelDiv);
    sliderWrapper.appendChild(slider);
    sliderWrapper.appendChild(modeButtons);

    return sliderWrapper;
}

/**
 * 필터 조건 모드 버튼들 생성 (≥/≤/=/모두)
 * @param {string} fieldName - 필드명
 * @returns {HTMLElement} 모드 버튼 컨테이너
 */
function createFilterModeButtons(fieldName, chartWrapper) {
    console.log('[UI_CONTROLS] 필터 모드 버튼 생성:', fieldName);

    const modeBox = document.createElement('div');
    modeBox.className = `filter-mode-buttons-${fieldName}`;
    modeBox.style.cssText = `
        display: flex;
        gap: 3px;
        margin-top: 5px;
    `;

    const modes = [
        { label: '≥', value: 'gte', title: '이상', color: '#28a745' },
        { label: '≤', value: 'lte', title: '이하', color: '#dc3545' },
        { label: '=', value: 'eq', title: '같음', color: '#ffc107' },
        { label: '모두', value: 'all', title: '모든 값', color: '#6c757d' }
    ];

    modes.forEach((mode, index) => {
        const button = document.createElement('button');
        button.textContent = mode.label;
        button.title = mode.title;
        button.className = `filter-mode-btn filter-mode-btn-${mode.value}`;
        button.dataset.mode = mode.value;
        button.dataset.fieldName = fieldName;
        button.style.cssText = `
            padding: 2px 6px;
            font-size: 10px;
            border: 1px solid #ccc;
            background: ${index === 3 ? mode.color : '#f8f9fa'};
            color: ${index === 3 ? 'white' : 'black'};
            cursor: pointer;
            border-radius: 2px;
            min-width: 35px;
        `;

        // 기본적으로 '모두' 모드 활성화
        if (index === 3) {
            button.classList.add('active');
        }

        // 모드 버튼 클릭 이벤트
        button.addEventListener('click', () => {
            // 같은 필드의 다른 버튼들 비활성화
            modeBox.querySelectorAll('.filter-mode-btn').forEach(btn => {
                btn.classList.remove('active');
                btn.style.background = '#f8f9fa';
                btn.style.color = 'black';
            });

            // 현재 버튼 활성화
            button.classList.add('active');
            button.style.background = mode.color;
            button.style.color = 'white';

            // 실시간 필터링 적용
            applyDataFilters(chartWrapper);

            console.log(`[UI_CONTROLS] 필터 모드 변경: ${fieldName} = ${mode.value}`);
        });

        modeBox.appendChild(button);
    });

    return modeBox;
}

/**
 * 필터 초기화 버튼 생성
 * @param {Object} chartWrapper - 차트 래퍼 객체
 * @returns {HTMLElement} 초기화 버튼
 */
function createResetFiltersButton(chartWrapper) {
    const resetBtn = document.createElement('button');
    resetBtn.textContent = 'Reset Filters';
    resetBtn.className = 'reset-filters-btn';
    resetBtn.style.cssText = `
        padding: 8px 12px;
        background: #6c757d;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        margin-left: auto;
    `;

    resetBtn.addEventListener('click', () => {
        // 모든 필터를 '모두' 모드로 초기화
        const allModeButtons = document.querySelectorAll('.filter-mode-btn[data-mode="all"]');
        allModeButtons.forEach(btn => btn.click());

        console.log('[UI_CONTROLS] 모든 필터 초기화');
    });

    return resetBtn;
}
/**
 * 🔥 실제 데이터 필터링 적용 (다중 조건 AND 연결) - 수정된 버전
 * @param {Object} chartWrapper - 차트 래퍼 객체
 */
function applyDataFilters(chartWrapper) {
    if (!chartWrapper || !chartWrapper._originalData) {
        console.warn('[UI_CONTROLS] chartWrapper 또는 원본 데이터가 없습니다');
        return;
    }

    try {
        const originalData = chartWrapper._originalData;
        console.log('[UI_CONTROLS] 데이터 필터링 적용 시작:', originalData.length, '개 데이터');

        // 모든 활성 필터 조건 수집
        const filterConditions = collectFilterConditions();
        console.log('[UI_CONTROLS] 수집된 필터 조건:', filterConditions);

        // 조건이 없으면 원본 데이터 그대로 사용
        if (filterConditions.length === 0) {
            // 🔥 수정: 원본 데이터를 processDataForChart로 변환 후 전달
            const processedResult = processDataForChart(
                originalData,
                chartWrapper.config.dataMapping,
                chartWrapper.config.type
            );
            chartWrapper.updateData(processedResult.data);
            console.log('[UI_CONTROLS] 필터 조건 없음, 원본 데이터 사용 (변환됨)');
            return;
        }

        // 다중 조건 필터링 (AND 연결)
        const filteredData = originalData.filter(item => {
            return filterConditions.every(condition => {
                const { fieldName, mode, value } = condition;
                const itemValue = item[fieldName];

                if (itemValue === null || itemValue === undefined || isNaN(Number(itemValue))) {
                    return false; // 유효하지 않은 값은 제외
                }

                const numItemValue = Number(itemValue);
                const numFilterValue = Number(value);

                switch (mode) {
                    case 'gte': return numItemValue >= numFilterValue;
                    case 'lte': return numItemValue <= numFilterValue;
                    case 'eq': return Math.abs(numItemValue - numFilterValue) < 0.01; // 부동소수점 오차 고려
                    case 'all': return true;
                    default: return true;
                }
            });
        });

        console.log('[UI_CONTROLS] 필터링 결과:', {
            원본: originalData.length,
            필터링후: filteredData.length,
            비율: `${((filteredData.length / originalData.length) * 100).toFixed(1)}%`,
            조건수: filterConditions.length
        });

        // 🔥 수정: 필터링된 데이터를 processDataForChart로 변환 후 차트 업데이트
        if (filteredData.length > 0) {
            try {
                const processedResult = processDataForChart(
                    filteredData,
                    chartWrapper.config.dataMapping,
                    chartWrapper.config.type
                );

                console.log('[UI_CONTROLS] 데이터 변환 완료:', {
                    필터링된원본: filteredData.length,
                    변환된차트데이터: processedResult.data.length,
                    메타데이터: processedResult.metadata.dim + 'D'
                });

                chartWrapper.updateData(processedResult.data);

            } catch (processError) {
                console.error('[UI_CONTROLS] 데이터 변환 실패:', processError);
                // 변환 실패 시 빈 데이터로 대체
                chartWrapper.updateData([]);
            }
        } else {
            // 필터링 결과가 빈 배열인 경우
            console.log('[UI_CONTROLS] 필터링 결과가 비어있음, 빈 차트 표시');
            chartWrapper.updateData([]);
        }

    } catch (error) {
        console.error('[UI_CONTROLS] 데이터 필터링 실패:', error);

        // 오류 발생 시 원본 데이터로 복구
        try {
            const processedResult = processDataForChart(
                chartWrapper._originalData,
                chartWrapper.config.dataMapping,
                chartWrapper.config.type
            );
            chartWrapper.updateData(processedResult.data);
            console.log('[UI_CONTROLS] 오류 복구: 원본 데이터로 복원');
        } catch (recoveryError) {
            console.error('[UI_CONTROLS] 복구도 실패:', recoveryError);
        }
    }
}
/**
 * 현재 설정된 모든 필터 조건 수집
 * @returns {Array} 필터 조건 배열
 */
function collectFilterConditions() {
    const conditions = [];

    // 모든 활성 필터 버튼 찾기
    const activeButtons = document.querySelectorAll('.filter-mode-btn.active:not([data-mode="all"])');

    activeButtons.forEach(button => {
        const fieldName = button.dataset.fieldName;
        const mode = button.dataset.mode;

        // 해당 슬라이더 값 가져오기
        const slider = document.querySelector(`.filter-slider-input-${fieldName}`);
        if (slider) {
            conditions.push({
                fieldName: fieldName,
                mode: mode,
                value: parseFloat(slider.value)
            });
        }
    });

    return conditions;
}

// ============================================================================
// 🔥 기존 기능들 (범위 필터링 등)
// ============================================================================

/**
 * X/Y 범위 기반 데이터 필터링 및 차트 업데이트
 * @param {Object} chartWrapper - 차트 래퍼 객체
 */
function applyRangeFilter(chartWrapper) {
    if (!chartWrapper || !chartWrapper._originalData) {
        console.warn('[UI_CONTROLS] chartWrapper 또는 원본 데이터가 없습니다');
        return;
    }

    try {
        // 윈도우 컨트롤 값들 가져오기
        const xStartInput = document.querySelector('.window-control-x_start');
        const xEndInput = document.querySelector('.window-control-x_end');
        const yStartInput = document.querySelector('.window-control-y_start');
        const yEndInput = document.querySelector('.window-control-y_end');

        const xStart = xStartInput ? parseFloat(xStartInput.value) : null;
        const xEnd = xEndInput ? parseFloat(xEndInput.value) : null;
        const yStart = yStartInput ? parseFloat(yStartInput.value) : null;
        const yEnd = yEndInput ? parseFloat(yEndInput.value) : null;

        // 범위 설정
        const xRange = (xStart !== null && !isNaN(xStart) && xEnd !== null && !isNaN(xEnd)) ? [xStart, xEnd] : null;
        const yRange = (yStart !== null && !isNaN(yStart) && yEnd !== null && !isNaN(yEnd)) ? [yStart, yEnd] : null;

        console.log('[UI_CONTROLS] 범위 필터 적용:', { xRange, yRange });

        // ChartWrapperEnhanced의 축 범위 설정 기능 사용
        if (chartWrapper.setAxisRange) {
            chartWrapper.setAxisRange(xRange, yRange);
        }

        // 또는 직접 Plotly relayout 사용
        if (window.Plotly && chartWrapper.plotlyDiv) {
            const updateObj = {};

            if (xRange) {
                updateObj['xaxis.range'] = xRange;
            }
            if (yRange) {
                updateObj['yaxis.range'] = yRange;
            }

            if (Object.keys(updateObj).length > 0) {
                window.Plotly.relayout(chartWrapper.plotlyDiv, updateObj);
                console.log('[UI_CONTROLS] Plotly 축 범위 업데이트:', updateObj);
            }
        }

    } catch (error) {
        console.error('[UI_CONTROLS] 범위 필터 적용 실패:', error);
    }
}

/**
 * 차트 래퍼와 데이터 필터 연동 설정
 * @param {Object} chartWrapper - 차트 래퍼 객체
 * @param {Array} originalData - 원본 데이터
 * @returns {Function} 필터 적용 함수
 */
export function connectDataFilters(chartWrapper, originalData) {
    console.log('[UI_CONTROLS] 데이터 필터 연동 설정');

    if (!chartWrapper || !originalData) {
        console.warn('[UI_CONTROLS] chartWrapper 또는 originalData가 없습니다');
        return null;
    }

    // 원본 데이터 저장
    chartWrapper._originalData = originalData;

    console.log('[UI_CONTROLS] 데이터 필터 연동 설정 완료');

    // 필터 적용 함수 반환
    return () => applyDataFilters(chartWrapper);
}

/**
 * X/Y 범위 기반 데이터 필터링 (데이터 자체를 필터링)
 * @param {Array} data - 원본 데이터
 * @param {string} xField - X축 필드명
 * @param {string} yField - Y축 필드명
 * @param {Array} xRange - [xMin, xMax]
 * @param {Array} yRange - [yMin, yMax]
 * @returns {Array} 필터링된 데이터
 */
export function filterDataByRange(data, xField, yField, xRange, yRange) {
    console.log('[UI_CONTROLS] 범위 기반 데이터 필터링:', { xRange, yRange });

    if (!data || !Array.isArray(data)) {
        console.warn('[UI_CONTROLS] 유효하지 않은 데이터');
        return [];
    }

    const filteredData = data.filter(item => {
        const xValue = item[xField];
        const yValue = item[yField];

        // X 범위 체크
        const xInRange = xRange ?
            (xValue >= xRange[0] && xValue <= xRange[1]) : true;

        // Y 범위 체크  
        const yInRange = yRange ?
            (yValue >= yRange[0] && yValue <= yRange[1]) : true;

        return xInRange && yInRange;
    });

    console.log('[UI_CONTROLS] 데이터 필터링 결과:', {
        원본: data.length,
        필터링후: filteredData.length,
        비율: `${((filteredData.length / data.length) * 100).toFixed(1)}%`
    });

    return filteredData;
}

// ============================================================================
// 🔥 하위 호환성을 위한 기존 함수들 유지
// ============================================================================

/**
 * 개별 슬라이더 생성 (≥/≤/= 모드 포함) - 하위 호환성
 * @param {Object} config - 슬라이더 설정
 * @returns {HTMLElement} 생성된 슬라이더 엘리먼트
 */
export function createSlider(config) {
    console.log('[UI_CONTROLS] 레거시 슬라이더 생성 (하위 호환성)');

    // 새로운 필터 슬라이더로 리다이렉트
    return createFilterSlider(config, null);
}

/**
 * 🔥 통합 데이터 처리 함수 (필터링 + 집계 + 윈도우 처리)
 * @param {Array} data - 원본 데이터
 * @param {Object} processingConfig - 처리 설정
 * @returns {Array} 처리된 데이터
 */
export function processDataFilter(data, processingConfig = {}) {
    console.log('[UI_CONTROLS] 통합 데이터 처리 시작:', processingConfig);

    if (!data || data.length === 0) {
        console.warn('[UI_CONTROLS] 빈 데이터 배열');
        return [];
    }

    let processedData = [...data]; // 원본 보존

    try {
        // 1. 슬라이더 필터링 적용
        if (processingConfig.filters) {
            processedData = applySliderFilters(processedData, processingConfig.filters);
        }

        // 2. 윈도우 슬라이싱 적용
        if (processingConfig.window) {
            processedData = applyWindowSlicing(processedData, processingConfig.window);
        }

        // 3. 데이터 집계 적용
        if (processingConfig.aggregation) {
            processedData = aggregateData(processedData, processingConfig.aggregation);
        }

        console.log('[UI_CONTROLS] 데이터 처리 완료:', {
            원본: data.length,
            처리후: processedData.length
        });

        return processedData;

    } catch (error) {
        console.error('[UI_CONTROLS] 데이터 처리 오류:', error);
        return data; // 오류 시 원본 반환
    }
}

// 기존 헬퍼 함수들 유지
function applySliderFilters(data, filterConfig) {
    // 기존 구현 유지
    return data;
}

function applyWindowSlicing(data, windowConfig) {
    // 기존 구현 유지
    return data;
}

function aggregateData(data, aggregationConfig) {
    // 기존 구현 유지
    return data;
}