// ============================================================================
// 3dim_chart_gen/components/slider_factory.js - 개별 슬라이더 생성 (기능 연결 없음)
// ============================================================================

/**
 * 기본 슬라이더 생성
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
    
    console.log('[SLIDER_FACTORY] 슬라이더 생성:', { fieldName, label, mode });
    
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
    
    sliderWrapper.appendChild(labelDiv);
    sliderWrapper.appendChild(slider);
    
    // range 모드인 경우 모드 버튼 추가
    if (mode === 'range') {
        const modeButtons = createModeButtons(fieldName);
        sliderWrapper.appendChild(modeButtons);
    }
    
    // TODO: 이벤트 리스너는 나중에 연결
    console.log('[SLIDER_FACTORY] 슬라이더 생성 완료 (이벤트 연결 없음)');
    
    return sliderWrapper;
}

/**
 * 범위 모드 버튼들 생성 (≥/≤/= 버튼)
 * @param {string} fieldName - 필드명
 * @returns {HTMLElement} 모드 버튼 컨테이너
 */
export function createModeButtons(fieldName) {
    console.log('[SLIDER_FACTORY] 모드 버튼 생성:', fieldName);
    
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
        
        modeBox.appendChild(button);
    });
    
    // TODO: 이벤트 리스너는 나중에 연결
    console.log('[SLIDER_FACTORY] 모드 버튼 생성 완료 (이벤트 연결 없음)');
    
    return modeBox;
}

/**
 * 다중 슬라이더 생성
 * @param {Array} configs - 슬라이더 설정 배열
 * @returns {Array} 생성된 슬라이더 엘리먼트들
 */
export function createMultipleSliders(configs) {
    console.log('[SLIDER_FACTORY] 다중 슬라이더 생성:', configs.length, '개');
    
    return configs.map(config => createSlider(config));
}

/**
 * 슬라이더 값 가져오기 (UI에서)
 * @param {string} fieldName - 필드명
 * @returns {Object} { value, mode }
 */
export function getSliderValue(fieldName) {
    const slider = document.querySelector(`.slider-input-${fieldName}`);
    const modeButtons = document.querySelectorAll(`.mode-buttons-${fieldName} .mode-btn`);
    
    let mode = 'eq'; // 기본값
    modeButtons.forEach(btn => {
        if (btn.classList.contains('active')) {
            mode = btn.dataset.mode;
        }
    });
    
    const value = slider ? parseFloat(slider.value) : 0;
    
    console.log('[SLIDER_FACTORY] 슬라이더 값 조회:', { fieldName, value, mode });
    
    return { value, mode };
}

/**
 * 슬라이더 값 설정하기 (UI에)
 * @param {string} fieldName - 필드명
 * @param {number} value - 설정할 값
 * @param {string} mode - 설정할 모드
 */
export function setSliderValue(fieldName, value, mode = 'eq') {
    const slider = document.querySelector(`.slider-input-${fieldName}`);
    const valueSpan = document.querySelector(`.slider-value-${fieldName}`);
    
    if (slider) {
        slider.value = value;
    }
    
    if (valueSpan) {
        valueSpan.textContent = value;
    }
    
    // 모드 버튼 업데이트
    const modeButtons = document.querySelectorAll(`.mode-buttons-${fieldName} .mode-btn`);
    modeButtons.forEach(btn => {
        if (btn.dataset.mode === mode) {
            btn.classList.add('active');
            btn.style.background = '#007bff';
            btn.style.color = 'white';
        } else {
            btn.classList.remove('active');
            btn.style.background = '#f8f9fa';
            btn.style.color = 'black';
        }
    });
    
    console.log('[SLIDER_FACTORY] 슬라이더 값 설정:', { fieldName, value, mode });
}