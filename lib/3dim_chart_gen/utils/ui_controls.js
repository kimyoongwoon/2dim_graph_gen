// ============================================================================
// 3dim_chart_gen/utils/ui_controls.js - 통합 UI 컨트롤 시스템 (중앙 크기 관리 적용)
// ============================================================================
import { processDataForChart } from '../unified/data_processor.js';

/**
 * 🔥 중앙 관리된 크기 설정을 적용한 통합 컨트롤 패널 생성
 * @param {HTMLElement} parentElement - 부모 엘리먼트
 * @param {Object} chartWrapper - 차트 래퍼 객체
 * @param {Object} controlConfig - 컨트롤 패널 크기 설정
 * @param {Object} panelConfig - 공통 패널 크기 설정
 * @returns {HTMLElement} 생성된 컨트롤 패널
 */
export function createControlPanel(parentElement, chartWrapper = null, controlConfig = {}, panelConfig = {}) {
    console.log('[UI_CONTROLS] 중앙 관리 크기로 컨트롤 패널 생성');

    const panel = document.createElement('div');
    panel.className = 'control-panel-unified';
    panel.style.cssText = `
        width: 100%;
        height: 100%;
        border: 1px solid ${controlConfig.borderColor || '#ddd'};
        border-radius: ${panelConfig.borderRadius || '4px'};
        overflow: hidden;
        transition: ${panelConfig.transition || 'none'};
        background: white;
    `;

    // 🔥 헤더 - 정확한 높이 적용
    const header = document.createElement('div');
    header.className = 'control-panel-header';
    header.style.cssText = `
        width: 100%;
        height: ${controlConfig.headerHeight || 'auto'};
        background: #e9ecef;
        padding: ${controlConfig.headerPadding || '8px 12px'};
        font-weight: ${controlConfig.fontWeight || 'bold'};
        font-size: ${controlConfig.fontSize || '13px'};
        border-bottom: 1px solid ${controlConfig.borderColor || '#ddd'};
        cursor: pointer;
        user-select: none;
        display: flex;
        align-items: center;
        box-sizing: border-box;
    `;
    header.textContent = '차트 컨트롤';

    // 🔥 컨텐츠 영역 - 접기/펼치기 가능
    const content = document.createElement('div');
    content.className = 'control-panel-content';
    content.style.cssText = `
        width: 100%;
        padding: ${controlConfig.contentPadding || '10px'};
        display: none;
        overflow: auto;
        background: white;
        box-sizing: border-box;
        max-height: ${panelConfig.expandedMaxHeight || 'none'};
    `;

    // Show/Hide 버튼들 생성
    const showHideBox = createShowHideButtons(chartWrapper, controlConfig);

    // 윈도우 컨트롤들 생성
    const windowControlBox = createWindowControls(chartWrapper, controlConfig);

    content.appendChild(showHideBox);
    content.appendChild(windowControlBox);

    panel.appendChild(header);
    panel.appendChild(content);

    // 🔥 헤더 클릭으로 접기/펼치기 + 컨테이너 크기 조정 (px 기준)
    let isCollapsed = true; // 기본적으로 접힌 상태
    header.addEventListener('click', () => {
        isCollapsed = !isCollapsed;

        if (isCollapsed) {
            // 접힌 상태
            content.style.display = 'none';
            header.textContent = '차트 컨트롤';

            // 🔥 부모 컨테이너 크기를 접힌 상태로 조정 (px 단위)
            if (parentElement && panelConfig.collapsedHeight) {
                parentElement.style.height = panelConfig.collapsedHeight;
                parentElement.style.maxHeight = panelConfig.collapsedHeight;
            }
        } else {
            // 펼쳐진 상태
            content.style.display = 'block';
            header.textContent = '차트 컨트롤 (펼쳐짐)';

            // 🔥 부모 컨테이너 크기를 펼쳐진 상태로 조정 (px 단위)
            if (parentElement && panelConfig.expandedMaxHeight) {
                parentElement.style.height = panelConfig.expandedMaxHeight;
                parentElement.style.maxHeight = panelConfig.expandedMaxHeight;
            }
        }

        console.log('[UI_CONTROLS] 컨트롤 패널 상태 변경:', isCollapsed ? '접힘' : '펼쳐짐');
    });

    if (parentElement) {
        parentElement.appendChild(panel);
    }

    console.log('[UI_CONTROLS] 중앙 관리 컨트롤 패널 생성 완료');
    return panel;
}

/**
 * 🔥 중앙 관리된 크기 설정을 적용한 슬라이더 컨테이너 생성
 * @param {HTMLElement} parentElement - 부모 엘리먼트
 * @param {Object} metadata - 차트 메타데이터
 * @param {Array} originalData - 원본 데이터
 * @param {Object} chartWrapper - 차트 래퍼 객체
 * @param {Object} sliderConfig - 슬라이더 패널 크기 설정
 * @param {Object} panelConfig - 공통 패널 크기 설정
 * @returns {HTMLElement} 생성된 슬라이더 컨테이너
 */
export function createSliderContainer(parentElement, metadata = null, originalData = null, chartWrapper = null, sliderConfig = {}, panelConfig = {}) {
    console.log('[UI_CONTROLS] 중앙 관리 크기로 슬라이더 컨테이너 생성');

    const container = document.createElement('div');
    container.className = 'slider-container-unified';
    container.style.cssText = `
        width: 100%;
        height: 100%;
        border: 1px solid #ddd;
        border-radius: ${panelConfig.borderRadius || '4px'};
        overflow: hidden;
        transition: ${panelConfig.transition || 'none'};
        background: white;
    `;

    // 🔥 헤더 - 정확한 높이 적용
    const header = document.createElement('div');
    header.className = 'slider-container-header';
    header.style.cssText = `
        width: 100%;
        height: ${sliderConfig.headerHeight || 'auto'};
        background: #e9ecef;
        padding: ${sliderConfig.headerPadding || '8px 12px'};
        font-weight: bold;
        font-size: ${sliderConfig.fontSize || '12px'};
        border-bottom: 1px solid #ddd;
        cursor: pointer;
        user-select: none;
        display: flex;
        align-items: center;
        box-sizing: border-box;
    `;
    header.textContent = 'Data Filters';

    // 🔥 슬라이더 영역 - 크기 설정 적용
    const sliderArea = document.createElement('div');
    sliderArea.className = 'slider-area';
    sliderArea.style.cssText = `
        width: 100%;
        padding: ${sliderConfig.contentPadding || '5px'};
        background: #f8f9fa;
        display: none;
        flex-wrap: wrap;
        gap: ${sliderConfig.gap || '6px'};
        align-items: center;
        min-height: ${sliderConfig.minContentHeight || '85px'};
        max-height: ${sliderConfig.maxContentHeight || '85px'};
        overflow: ${sliderConfig.overflow || 'auto'};
        box-sizing: border-box;
    `;

    // 🔥 필터링 가능한 필드 자동 감지
    const filterableFields = getFilterableFields(metadata, originalData);

    console.log('[UI_CONTROLS] 필터링 가능한 필드:', filterableFields);

    if (filterableFields.length > 0) {
        filterableFields.forEach(field => {
            const slider = createFilterSlider(field, chartWrapper, sliderConfig);
            sliderArea.appendChild(slider);
        });

        // 전체 초기화 버튼 추가
        const resetBtn = createResetFiltersButton(chartWrapper, sliderConfig);
        sliderArea.appendChild(resetBtn);

    } else {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'slider-empty-message';
        emptyMessage.style.cssText = `
            color: #6c757d;
            font-style: italic;
            font-size: ${sliderConfig.fontSize || '9px'};
            width: 100%;
            text-align: center;
            padding: 5px;
        `;
        emptyMessage.textContent = '필터링 가능한 필드가 없습니다';
        sliderArea.appendChild(emptyMessage);
    }

    container.appendChild(header);
    container.appendChild(sliderArea);

    // 🔥 헤더 클릭으로 접기/펼치기 + 컨테이너 크기 조정 (px 기준)
    let isCollapsed = true; // 기본적으로 접힌 상태
    header.addEventListener('click', () => {
        isCollapsed = !isCollapsed;

        if (isCollapsed) {
            // 접힌 상태
            sliderArea.style.display = 'none';
            header.textContent = 'Data Filters';

            // 🔥 부모 컨테이너 크기를 접힌 상태로 조정 (px 단위)
            if (parentElement && panelConfig.collapsedHeight) {
                parentElement.style.height = panelConfig.collapsedHeight;
                parentElement.style.maxHeight = panelConfig.collapsedHeight;
            }
        } else {
            // 펼쳐진 상태
            sliderArea.style.display = 'flex';
            header.textContent = 'Data Filters (펼쳐짐)';

            // 🔥 부모 컨테이너 크기를 펼쳐진 상태로 조정 (px 단위)
            if (parentElement && panelConfig.expandedMaxHeight) {
                parentElement.style.height = panelConfig.expandedMaxHeight;
                parentElement.style.maxHeight = panelConfig.expandedMaxHeight;
            }
        }

        console.log('[UI_CONTROLS] 슬라이더 컨테이너 상태 변경:', isCollapsed ? '접힘' : '펼쳐짐');
    });

    if (parentElement) {
        parentElement.appendChild(container);
    }

    console.log('[UI_CONTROLS] 중앙 관리 슬라이더 컨테이너 생성 완료');
    return container;
}

/**
 * Show/Hide 버튼 박스 생성 (크기 설정 적용)
 */
function createShowHideButtons(chartWrapper, controlConfig = {}) {
    console.log('[UI_CONTROLS] Show/Hide 버튼 생성 (크기 설정 적용)');

    const buttonBox = document.createElement('div');
    buttonBox.className = 'show-hide-buttons';
    buttonBox.style.cssText = `
        display: flex;
        gap: 3px;
        margin-bottom: 3px;
        padding: 2px;
        background: #f5f5f5;
        border-radius: 2px;
        flex-wrap: wrap;
    `;

    // 3D 차트에서만 표시
    if (!chartWrapper || !chartWrapper.getChartType || !chartWrapper.getChartType().startsWith('3d_')) {
        buttonBox.style.display = 'none';
        return buttonBox;
    }

    const buttonStyle = `
        padding: 2px 4px;
        background: #007bff;
        color: white;
        border: none;
        border-radius: 1px;
        cursor: pointer;
        font-size: ${controlConfig.fontSize || '9px'};
        min-width: 45px;
        height: 20px;
    `;

    // Show Both 버튼
    const showBothBtn = document.createElement('button');
    showBothBtn.textContent = 'Show Both';
    showBothBtn.style.cssText = buttonStyle;

    // Points Only 버튼
    const pointsOnlyBtn = document.createElement('button');
    pointsOnlyBtn.textContent = 'Points Only';
    pointsOnlyBtn.style.cssText = buttonStyle.replace('#007bff', '#28a745');

    // Surface Only 버튼
    const surfaceOnlyBtn = document.createElement('button');
    surfaceOnlyBtn.textContent = 'Surface Only';
    surfaceOnlyBtn.style.cssText = buttonStyle.replace('#007bff', '#ffc107').replace('white', 'black');

    // 이벤트 리스너 연결
    if (chartWrapper && chartWrapper.toggleTrace) {
        showBothBtn.addEventListener('click', () => {
            chartWrapper.toggleTrace('surface', true);
            chartWrapper.toggleTrace('scatter3d', true);
        });

        pointsOnlyBtn.addEventListener('click', () => {
            chartWrapper.toggleTrace('surface', false);
            chartWrapper.toggleTrace('scatter3d', true);
        });

        surfaceOnlyBtn.addEventListener('click', () => {
            chartWrapper.toggleTrace('surface', true);
            chartWrapper.toggleTrace('scatter3d', false);
        });
    }

    buttonBox.appendChild(showBothBtn);
    buttonBox.appendChild(pointsOnlyBtn);
    buttonBox.appendChild(surfaceOnlyBtn);

    return buttonBox;
}

/**
 * 윈도우 컨트롤 박스 생성 (크기 설정 적용)
 */
function createWindowControls(chartWrapper, controlConfig = {}) {
    console.log('[UI_CONTROLS] 윈도우 컨트롤 생성 (크기 설정 적용)');

    const controlBox = document.createElement('div');
    controlBox.className = 'window-controls';
    controlBox.style.cssText = `
        display: flex;
        flex-wrap: wrap;
        gap: 3px;
        margin-bottom: 3px;
        padding: 2px;
        background: #f8f9fa;
        border-radius: 2px;
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
        label.style.cssText = `font-size: ${controlConfig.fontSize || '9px'}; font-weight: bold; margin-bottom: 1px;`;

        const input = document.createElement('input');
        input.type = 'number';
        input.placeholder = 'Auto';
        input.value = control.defaultValue;
        input.className = `window-control-${control.key}`;
        input.style.cssText = `width: 50px; padding: 1px 2px; font-size: ${controlConfig.fontSize || '9px'}; text-align: center; border: 1px solid #ccc; border-radius: 1px; height: 18px;`;

        // 이벤트 리스너 연결
        input.addEventListener('change', () => applyRangeFilter(chartWrapper));
        input.addEventListener('blur', () => applyRangeFilter(chartWrapper));

        wrapper.appendChild(label);
        wrapper.appendChild(input);
        controlBox.appendChild(wrapper);
    });

    // Apply 버튼 추가
    const applyBtn = document.createElement('button');
    applyBtn.textContent = 'Apply Range';
    applyBtn.style.cssText = `
        padding: 2px 6px;
        background: #007bff;
        color: white;
        border: none;
        border-radius: 1px;
        cursor: pointer;
        font-size: ${controlConfig.fontSize || '9px'};
        margin-left: 4px;
        align-self: center;
        height: 20px;
    `;

    applyBtn.addEventListener('click', () => applyRangeFilter(chartWrapper));

    controlBox.appendChild(applyBtn);

    return controlBox;
}

/**
 * 🔥 필터링용 슬라이더 생성 (크기 설정 적용)
 */
function createFilterSlider(fieldConfig, chartWrapper, sliderConfig = {}) {
    const { name, label, min, max, value, step } = fieldConfig;

    const sliderWrapper = document.createElement('div');
    sliderWrapper.className = `filter-slider-${name}`;
    sliderWrapper.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        margin: 0 3px;
        min-width: 110px;
        padding: 3px;
        border: 1px solid #dee2e6;
        border-radius: 2px;
        background: white;
    `;

    // 라벨과 값 표시 (더 컴팩트)
    const labelDiv = document.createElement('div');
    labelDiv.style.cssText = `
        display: flex;
        justify-content: space-between;
        width: 100%;
        margin-bottom: 2px;
        font-size: ${sliderConfig.fontSize || '9px'};
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
        padding: 1px 2px;
        border-radius: 1px;
        font-size: ${sliderConfig.fontSize || '8px'};
    `;

    labelDiv.appendChild(labelSpan);
    labelDiv.appendChild(valueSpan);

    // 슬라이더 input (더 컴팩트)
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.className = `filter-slider-input-${name}`;
    slider.min = min;
    slider.max = max;
    slider.value = value;
    slider.step = step;
    slider.style.cssText = 'width: 100%; margin-bottom: 3px; height: 15px;';

    // 조건 버튼들 (더 컴팩트)
    const modeButtons = createFilterModeButtons(name, chartWrapper, sliderConfig);

    // 슬라이더 값 변경 이벤트
    slider.addEventListener('input', () => {
        valueSpan.textContent = parseFloat(slider.value).toFixed(2);
        applyDataFilters(chartWrapper);
    });

    sliderWrapper.appendChild(labelDiv);
    sliderWrapper.appendChild(slider);
    sliderWrapper.appendChild(modeButtons);

    return sliderWrapper;
}

/**
 * 필터 조건 모드 버튼들 생성 (컴팩트)
 */
function createFilterModeButtons(fieldName, chartWrapper, sliderConfig = {}) {
    const modeBox = document.createElement('div');
    modeBox.className = `filter-mode-buttons-${fieldName}`;
    modeBox.style.cssText = `
        display: flex;
        gap: 2px;
        margin-top: 3px;
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
            padding: 1px 3px;
            font-size: ${sliderConfig.fontSize || '7px'};
            border: 1px solid #ccc;
            background: ${index === 3 ? mode.color : '#f8f9fa'};
            color: ${index === 3 ? 'white' : 'black'};
            cursor: pointer;
            border-radius: 1px;
            min-width: 20px;
            height: 18px;
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
        });

        modeBox.appendChild(button);
    });

    return modeBox;
}

/**
 * 필터 초기화 버튼 생성 (컴팩트)
 */
function createResetFiltersButton(chartWrapper, sliderConfig = {}) {
    const resetBtn = document.createElement('button');
    resetBtn.textContent = 'Reset Filters';
    resetBtn.className = 'reset-filters-btn';
    resetBtn.style.cssText = `
        padding: 4px 8px;
        background: #6c757d;
        color: white;
        border: none;
        border-radius: 2px;
        cursor: pointer;
        font-size: ${sliderConfig.fontSize || '9px'};
        margin-left: auto;
        height: 24px;
    `;

    resetBtn.addEventListener('click', () => {
        const allModeButtons = document.querySelectorAll('.filter-mode-btn[data-mode="all"]');
        allModeButtons.forEach(btn => btn.click());
    });

    return resetBtn;
}

// ============================================================================
// 🔥 기존 필터링 로직들 (변경사항 없음)
// ============================================================================

/**
 * metadata 기반으로 필터링 가능한 필드 자동 감지
 */
function getFilterableFields(metadata, originalData) {
    if (!metadata || !metadata.axes || !originalData || originalData.length === 0) {
        return [];
    }

    const usedFields = metadata.axes.map(axis => axis.name);
    const allFields = Object.keys(originalData[0] || {});

    const filterableFields = allFields.filter(field =>
        !usedFields.includes(field) &&
        field !== '_originalIndex' &&
        field !== '_fullData'
    );

    const fieldsWithRange = filterableFields.map(fieldName => {
        const values = originalData
            .map(item => item[fieldName])
            .filter(v => v !== null && v !== undefined && !isNaN(Number(v)))
            .map(v => Number(v));

        if (values.length === 0) {
            return null;
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
            step: (max - min) / 100,
            values: values
        };
    }).filter(field => field !== null);

    return fieldsWithRange;
}

/**
 * 실제 데이터 필터링 적용
 */
function applyDataFilters(chartWrapper) {
    if (!chartWrapper || !chartWrapper._originalData) {
        return;
    }

    try {
        const originalData = chartWrapper._originalData;
        const filterConditions = collectFilterConditions();

        if (filterConditions.length === 0) {
            const processedResult = processDataForChart(
                originalData,
                chartWrapper.config.dataMapping,
                chartWrapper.config.type
            );
            chartWrapper.updateData(processedResult.data);
            return;
        }

        const filteredData = originalData.filter(item => {
            return filterConditions.every(condition => {
                const { fieldName, mode, value } = condition;
                const itemValue = item[fieldName];

                if (itemValue === null || itemValue === undefined || isNaN(Number(itemValue))) {
                    return false;
                }

                const numItemValue = Number(itemValue);
                const numFilterValue = Number(value);

                switch (mode) {
                    case 'gte': return numItemValue >= numFilterValue;
                    case 'lte': return numItemValue <= numFilterValue;
                    case 'eq': return Math.abs(numItemValue - numFilterValue) < 0.01;
                    case 'all': return true;
                    default: return true;
                }
            });
        });

        if (filteredData.length > 0) {
            const processedResult = processDataForChart(
                filteredData,
                chartWrapper.config.dataMapping,
                chartWrapper.config.type
            );
            chartWrapper.updateData(processedResult.data);
        } else {
            chartWrapper.updateData([]);
        }

    } catch (error) {
        console.error('[UI_CONTROLS] 데이터 필터링 실패:', error);
    }
}

/**
 * 현재 설정된 모든 필터 조건 수집
 */
function collectFilterConditions() {
    const conditions = [];
    const activeButtons = document.querySelectorAll('.filter-mode-btn.active:not([data-mode="all"])');

    activeButtons.forEach(button => {
        const fieldName = button.dataset.fieldName;
        const mode = button.dataset.mode;
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

/**
 * X/Y 범위 기반 데이터 필터링
 */
function applyRangeFilter(chartWrapper) {
    if (!chartWrapper || !chartWrapper._originalData) {
        return;
    }

    try {
        const xStartInput = document.querySelector('.window-control-x_start');
        const xEndInput = document.querySelector('.window-control-x_end');
        const yStartInput = document.querySelector('.window-control-y_start');
        const yEndInput = document.querySelector('.window-control-y_end');

        const xStart = xStartInput ? parseFloat(xStartInput.value) : null;
        const xEnd = xEndInput ? parseFloat(xEndInput.value) : null;
        const yStart = yStartInput ? parseFloat(yStartInput.value) : null;
        const yEnd = yEndInput ? parseFloat(yEndInput.value) : null;

        const xRange = (xStart !== null && !isNaN(xStart) && xEnd !== null && !isNaN(xEnd)) ? [xStart, xEnd] : null;
        const yRange = (yStart !== null && !isNaN(yStart) && yEnd !== null && !isNaN(yEnd)) ? [yStart, yEnd] : null;

        if (chartWrapper.setAxisRange) {
            chartWrapper.setAxisRange(xRange, yRange);
        }

        if (window.Plotly && chartWrapper.plotlyDiv) {
            const updateObj = {};
            if (xRange) updateObj['xaxis.range'] = xRange;
            if (yRange) updateObj['yaxis.range'] = yRange;

            if (Object.keys(updateObj).length > 0) {
                window.Plotly.relayout(chartWrapper.plotlyDiv, updateObj);
            }
        }

    } catch (error) {
        console.error('[UI_CONTROLS] 범위 필터 적용 실패:', error);
    }
}

/**
 * 차트 래퍼와 데이터 필터 연동 설정
 */
export function connectDataFilters(chartWrapper, originalData) {
    if (!chartWrapper || !originalData) {
        return null;
    }

    chartWrapper._originalData = originalData;
    return () => applyDataFilters(chartWrapper);
}

/**
 * X/Y 범위 기반 데이터 필터링
 */
export function filterDataByRange(data, xField, yField, xRange, yRange) {
    if (!data || !Array.isArray(data)) {
        return [];
    }

    const filteredData = data.filter(item => {
        const xValue = item[xField];
        const yValue = item[yField];

        const xInRange = xRange ? (xValue >= xRange[0] && xValue <= xRange[1]) : true;
        const yInRange = yRange ? (yValue >= yRange[0] && yValue <= yRange[1]) : true;

        return xInRange && yInRange;
    });

    return filteredData;
}




/**
 * 하위 호환성을 위한 기존 함수들
 */
export function createSlider(config) {
    return createFilterSlider(config, null);
}

export function processDataFilter(data, processingConfig = {}) {
    if (!data || data.length === 0) {
        return [];
    }

    let processedData = [...data];

    try {
        if (processingConfig.filters) {
            processedData = applySliderFilters(processedData, processingConfig.filters);
        }

        if (processingConfig.window) {
            processedData = applyWindowSlicing(processedData, processingConfig.window);
        }

        if (processingConfig.aggregation) {
            processedData = aggregateData(processedData, processingConfig.aggregation);
        }

        return processedData;

    } catch (error) {
        console.error('[UI_CONTROLS] 데이터 처리 오류:', error);
        return data;
    }
}

function applySliderFilters(data, filterConfig) {
    return data;
}

function applyWindowSlicing(data, windowConfig) {
    return data;
}

function aggregateData(data, aggregationConfig) {
    return data;
}