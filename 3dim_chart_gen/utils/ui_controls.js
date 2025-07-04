// ============================================================================
// 3dim_chart_gen/utils/ui_controls.js - 통합 UI 컨트롤 시스템 (6개 함수)
// 🔥 경량화: components + ui_controls + data 처리 통합
// ============================================================================

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
    const windowControlBox = createWindowControls();
    
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
 * 윈도우 컨트롤 박스 생성 (데이터 처리 옵션)
 * @returns {HTMLElement} 생성된 컨트롤 박스
 */
function createWindowControls() {
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
    
    // 숫자 입력 필드들 생성
    const controls = [
        { label: 'Start X', key: 'start_x', defaultValue: 0 },
        { label: 'Count X', key: 'count_x', defaultValue: 100 },
        { label: 'Start Y', key: 'start_y', defaultValue: 0 },
        { label: 'Count Y', key: 'count_y', defaultValue: 100 },
        { label: 'Compress', key: 'compress', defaultValue: 1 }
    ];
    
    controls.forEach(control => {
        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'display: flex; flex-direction: column; align-items: center;';
        
        const label = document.createElement('label');
        label.textContent = control.label;
        label.style.cssText = 'font-size: 11px; font-weight: bold; margin-bottom: 2px;';
        
        const input = document.createElement('input');
        input.type = 'number';
        input.value = control.defaultValue;
        input.className = `window-control-${control.key}`;
        input.style.cssText = 'width: 60px; padding: 2px 4px; font-size: 11px; text-align: center;';
        
        // TODO: 이벤트 리스너 연결 (데이터 재처리)
        input.addEventListener('change', () => {
            console.log(`[UI_CONTROLS] ${control.label} 값 변경:`, input.value);
            // TODO: 데이터 재처리 로직 연결
        });
        
        wrapper.appendChild(label);
        wrapper.appendChild(input);
        controlBox.appendChild(wrapper);
    });
    
    // 집계 함수 선택
    const aggWrapper = document.createElement('div');
    aggWrapper.style.cssText = 'display: flex; flex-direction: column; align-items: center;';
    
    const aggLabel = document.createElement('label');
    aggLabel.textContent = 'Aggregation';
    aggLabel.style.cssText = 'font-size: 11px; font-weight: bold; margin-bottom: 2px;';
    
    const aggSelect = document.createElement('select');
    aggSelect.className = 'aggregation-select';
    aggSelect.style.cssText = 'padding: 2px 4px; font-size: 11px;';
    
    const aggregationOptions = [
        { value: 'mean', text: 'Mean' },
        { value: 'min', text: 'Min' },
        { value: 'max', text: 'Max' },
        { value: 'median', text: 'Median' },
        { value: 'first', text: 'First' },
        { value: 'last', text: 'Last' }
    ];
    
    aggregationOptions.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option.value;
        optionElement.textContent = option.text;
        aggSelect.appendChild(optionElement);
    });
    
    // TODO: 집계 함수 변경 이벤트
    aggSelect.addEventListener('change', () => {
        console.log('[UI_CONTROLS] 집계 함수 변경:', aggSelect.value);
        // TODO: 집계 로직 연결
    });
    
    aggWrapper.appendChild(aggLabel);
    aggWrapper.appendChild(aggSelect);
    controlBox.appendChild(aggWrapper);
    
    return controlBox;
}

/**
 * 슬라이더 컨테이너 생성 (데이터 필터링용)
 * @param {HTMLElement} parentElement - 부모 엘리먼트
 * @param {Array} fieldList - 필터링 가능한 필드 목록
 * @returns {HTMLElement} 생성된 슬라이더 컨테이너
 */
export function createSliderContainer(parentElement, fieldList = []) {
    console.log('[UI_CONTROLS] 슬라이더 컨테이너 생성');
    
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
    
    // 필드가 있으면 슬라이더 생성, 없으면 메시지 표시
    if (fieldList.length > 0) {
        fieldList.forEach(field => {
            const slider = createSlider({
                fieldName: field.name,
                label: field.label || field.name,
                min: field.min || 0,
                max: field.max || 100,
                value: field.value || field.min || 0,
                mode: field.mode || 'exact'
            });
            sliderArea.appendChild(slider);
        });
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
 * 개별 슬라이더 생성 (≥/≤/= 모드 포함)
 * @param {Object} config - 슬라이더 설정
 * @returns {HTMLElement} 생성된 슬라이더 엘리먼트
 */
export function createSlider(config) {
    const {
        fieldName,
        label,
        min = 0,
        max = 100,
        value = 0,
        step = 1,
        mode = 'exact' // 'exact' 또는 'range'
    } = config;
    
    console.log('[UI_CONTROLS] 슬라이더 생성:', { fieldName, label, mode });
    
    const sliderWrapper = document.createElement('div');
    sliderWrapper.className = 'slider-wrapper';
    sliderWrapper.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        margin: 0 10px;
        min-width: 150px;
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
    labelSpan.textContent = label || fieldName;
    labelSpan.style.fontWeight = 'bold';
    
    const valueSpan = document.createElement('span');
    valueSpan.className = `slider-value-${fieldName}`;
    valueSpan.textContent = value;
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
    slider.className = `slider-input-${fieldName}`;
    slider.min = min;
    slider.max = max;
    slider.value = value;
    slider.step = step;
    slider.style.cssText = 'width: 100%; margin-bottom: 5px;';
    
    // 슬라이더 값 변경 이벤트
    slider.addEventListener('input', () => {
        valueSpan.textContent = slider.value;
        console.log(`[UI_CONTROLS] 슬라이더 값 변경: ${fieldName} = ${slider.value}`);
        // TODO: 데이터 필터링 로직 연결
    });
    
    sliderWrapper.appendChild(labelDiv);
    sliderWrapper.appendChild(slider);
    
    // range 모드인 경우 모드 버튼 추가
    if (mode === 'range') {
        const modeButtons = createModeButtons(fieldName);
        sliderWrapper.appendChild(modeButtons);
    }
    
    return sliderWrapper;
}

/**
 * 범위 모드 버튼들 생성 (≥/≤/= 버튼)
 * @param {string} fieldName - 필드명
 * @returns {HTMLElement} 모드 버튼 컨테이너
 */
function createModeButtons(fieldName) {
    console.log('[UI_CONTROLS] 모드 버튼 생성:', fieldName);
    
    const modeBox = document.createElement('div');
    modeBox.className = `mode-buttons-${fieldName}`;
    modeBox.style.cssText = `
        display: flex;
        gap: 4px;
        margin-top: 2px;
    `;
    
    const modes = [
        { label: '≥', value: 'gte', title: '이상' },
        { label: '≤', value: 'lte', title: '이하' },
        { label: '=', value: 'eq', title: '같음' }
    ];
    
    modes.forEach((mode, index) => {
        const button = document.createElement('button');
        button.textContent = mode.label;
        button.title = mode.title;
        button.className = `mode-btn mode-btn-${mode.value}`;
        button.dataset.mode = mode.value;
        button.style.cssText = `
            padding: 2px 6px;
            font-size: 11px;
            border: 1px solid #ccc;
            background: ${index === 2 ? '#007bff' : '#f8f9fa'};
            color: ${index === 2 ? 'white' : 'black'};
            cursor: pointer;
            border-radius: 2px;
        `;
        
        // 기본적으로 '=' 모드 활성화
        if (index === 2) {
            button.classList.add('active');
        }
        
        // 모드 버튼 클릭 이벤트
        button.addEventListener('click', () => {
            // 다른 버튼들 비활성화
            modeBox.querySelectorAll('.mode-btn').forEach(btn => {
                btn.classList.remove('active');
                btn.style.background = '#f8f9fa';
                btn.style.color = 'black';
            });
            
            // 현재 버튼 활성화
            button.classList.add('active');
            button.style.background = '#007bff';
            button.style.color = 'white';
            
            console.log(`[UI_CONTROLS] 모드 변경: ${fieldName} = ${mode.value}`);
            // TODO: 필터링 모드 변경 로직 연결
        });
        
        modeBox.appendChild(button);
    });
    
    return modeBox;
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

/**
 * 슬라이더 상태에 따른 데이터 필터링 (구현 예정 → 기본 구현)
 * @param {Array} data - 원본 데이터
 * @param {Object} filterConfig - 필터 설정
 * @returns {Array} 필터링된 데이터
 */
function applySliderFilters(data, filterConfig) {
    console.log('[UI_CONTROLS] 슬라이더 필터링 적용:', filterConfig);
    
    // TODO: 완전한 필터링 로직 구현
    // 현재는 기본 구현만
    
    let filteredData = data;
    
    Object.entries(filterConfig).forEach(([fieldName, filter]) => {
        const { value, mode = 'eq' } = filter;
        
        filteredData = filteredData.filter(item => {
            const fieldValue = item[fieldName];
            if (fieldValue === null || fieldValue === undefined) return false;
            
            switch (mode) {
                case 'gte': return fieldValue >= value;
                case 'lte': return fieldValue <= value;
                case 'eq': return fieldValue === value;
                default: return true;
            }
        });
    });
    
    console.log('[UI_CONTROLS] 필터링 결과:', {
        원본: data.length,
        필터링후: filteredData.length
    });
    
    return filteredData;
}

/**
 * 윈도우 슬라이싱 적용 (구현 예정 → 기본 구현)
 * @param {Array} data - 데이터
 * @param {Object} windowConfig - 윈도우 설정
 * @returns {Array} 슬라이싱된 데이터
 */
function applyWindowSlicing(data, windowConfig) {
    console.log('[UI_CONTROLS] 윈도우 슬라이싱 적용:', windowConfig);
    
    const { start_x = 0, count_x = data.length, start_y = 0, count_y = data.length } = windowConfig;
    
    // 간단한 슬라이싱 구현
    const startIndex = Math.max(0, start_x);
    const endIndex = Math.min(data.length, startIndex + count_x);
    
    return data.slice(startIndex, endIndex);
}

/**
 * 데이터 집계 적용 (구현 예정 → 기본 구현)
 * @param {Array} data - 데이터
 * @param {Object} aggregationConfig - 집계 설정
 * @returns {Array} 집계된 데이터
 */
function aggregateData(data, aggregationConfig) {
    console.log('[UI_CONTROLS] 데이터 집계 적용:', aggregationConfig);
    
    const { type = 'mean', groupBy = null } = aggregationConfig;
    
    // TODO: 완전한 집계 로직 구현
    // 현재는 기본 구현만 (그룹핑 없이)
    
    if (!groupBy) {
        return data; // 그룹핑 없으면 원본 반환
    }
    
    // 간단한 그룹핑 구현
    const groups = {};
    data.forEach(item => {
        const key = item[groupBy];
        if (!groups[key]) groups[key] = [];
        groups[key].push(item);
    });
    
    // 각 그룹에서 첫 번째 아이템만 반환 (임시)
    return Object.values(groups).map(group => group[0]);
}