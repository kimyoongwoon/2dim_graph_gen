// ============================================================================
// 3dim_chart_gen/components/control_panel.js - 컨트롤 패널 UI (기능 연결 없음)
// ============================================================================

/**
 * Show/Hide 버튼 박스 생성
 * @param {HTMLElement} parentElement - 부모 엘리먼트
 * @returns {HTMLElement} 생성된 버튼 박스
 */
export function createShowHideButtons(parentElement) {
    console.log('[CONTROL_PANEL] Show/Hide 버튼 생성');
    
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
    
    buttonBox.appendChild(showBothBtn);
    buttonBox.appendChild(pointsOnlyBtn);
    buttonBox.appendChild(surfaceOnlyBtn);
    
    if (parentElement) {
        parentElement.appendChild(buttonBox);
    }
    
    // TODO: 이벤트 리스너는 나중에 연결
    console.log('[CONTROL_PANEL] Show/Hide 버튼 생성 완료 (이벤트 연결 없음)');
    
    return buttonBox;
}

/**
 * 윈도우 컨트롤 박스 생성
 * @param {HTMLElement} parentElement - 부모 엘리먼트
 * @returns {HTMLElement} 생성된 컨트롤 박스
 */
export function createWindowControls(parentElement) {
    console.log('[CONTROL_PANEL] 윈도우 컨트롤 생성');
    
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
        { value: 'last', text: 'Last' },
        { value: 'candlestick', text: 'Candlestick' }
    ];
    
    aggregationOptions.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option.value;
        optionElement.textContent = option.text;
        aggSelect.appendChild(optionElement);
    });
    
    aggWrapper.appendChild(aggLabel);
    aggWrapper.appendChild(aggSelect);
    controlBox.appendChild(aggWrapper);
    
    if (parentElement) {
        parentElement.appendChild(controlBox);
    }
    
    // TODO: 이벤트 리스너는 나중에 연결
    console.log('[CONTROL_PANEL] 윈도우 컨트롤 생성 완료 (이벤트 연결 없음)');
    
    return controlBox;
}

/**
 * 전체 컨트롤 패널 생성
 * @param {HTMLElement} parentElement - 부모 엘리먼트
 * @returns {HTMLElement} 생성된 컨트롤 패널
 */
export function createControlPanel(parentElement) {
    console.log('[CONTROL_PANEL] 전체 컨트롤 패널 생성');
    
    const panel = document.createElement('div');
    panel.className = 'control-panel-3d';
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
    `;
    header.textContent = '3D Chart Controls';
    
    // 컨텐츠 영역
    const content = document.createElement('div');
    content.className = 'control-panel-content';
    content.style.cssText = 'padding: 10px;';
    
    panel.appendChild(header);
    panel.appendChild(content);
    
    // Show/Hide 버튼과 윈도우 컨트롤 추가
    createShowHideButtons(content);
    createWindowControls(content);
    
    if (parentElement) {
        parentElement.appendChild(panel);
    }
    
    console.log('[CONTROL_PANEL] 전체 컨트롤 패널 생성 완료');
    return panel;
}