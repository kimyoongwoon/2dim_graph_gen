// visualizations/scaling/size_scaling.js

/**
 * Complete Size Scaling System
 * Handles different scaling functions and UI controls for circle sizes
 */

// ============================================================================
// SCALING FUNCTIONS
// ============================================================================

/**
 * Default scaling function (current implementation)
 * Maps data value to 0-1 range based on min/max
 */
export function defaultScaling(dataValue, minData, maxData) {
  if (minData === maxData) return 0.5; // Avoid division by zero
  return (dataValue - minData) / (maxData - minData);
}

/**
 * Linear scaling function: size = a * dataValue + b
 * Then normalized to 0-1 range
 */
export function linearScaling(dataValue, minData, maxData, params) {
  const { a = 1, b = 0 } = params || {};
  
  // Apply linear transformation
  const transformedValue = a * dataValue + b;
  
  // Apply same transformation to min/max to get the transformed range
  const transformedMin = a * minData + b;
  const transformedMax = a * maxData + b;
  
  // Normalize to 0-1 range
  if (transformedMin === transformedMax) return 0.5;
  return (transformedValue - transformedMin) / (transformedMax - transformedMin);
}

/**
 * Sigmoid scaling function
 * Uses steepness parameter k, midpoint automatically set
 */
export function sigmoidScaling(dataValue, minData, maxData, params) {
  const { k = 1 } = params || {};
  
  // Automatically set midpoint to middle of data range
  const midpoint = (minData + maxData) / 2;
  
  // Normalize input to roughly -3 to 3 range for better sigmoid behavior
  const normalizedInput = (dataValue - midpoint) / ((maxData - minData) / 6);
  
  // Apply sigmoid: 1 / (1 + e^(-k * normalizedInput))
  const sigmoidValue = 1 / (1 + Math.exp(-k * normalizedInput));
  
  return sigmoidValue;
}

/**
 * Apply scaling function and convert to pixel radius
 * Maintains the 3 + ... * 15 wrapper for consistency
 */
export function applyScaling(dataValue, minData, maxData, scalingConfig) {
  const { type = 'default', params = {} } = scalingConfig || {};
  
  let normalizedValue;
  
  switch (type) {
    case 'linear':
      normalizedValue = linearScaling(dataValue, minData, maxData, params);
      break;
    case 'sigmoid':
      normalizedValue = sigmoidScaling(dataValue, minData, maxData, params);
      break;
    case 'default':
    default:
      normalizedValue = defaultScaling(dataValue, minData, maxData);
      break;
  }
  
  // Clamp to 0-1 range for safety
  normalizedValue = Math.max(0, Math.min(1, normalizedValue));
  
  // Apply the 3 + ... * 15 wrapper (3 = min radius, 15 = size range)
  return 3 + normalizedValue * 15;
}

/**
 * Get default parameters for a scaling type
 */
export function getDefaultParams(scalingType) {
  switch (scalingType) {
    case 'linear':
      return { a: 1, b: 0 };
    case 'sigmoid':
      return { k: 1 };
    case 'default':
    default:
      return {};
  }
}

/**
 * Validate and constrain parameters within reasonable ranges
 */
export function validateParams(scalingType, params) {
  const validated = { ...params };
  
  switch (scalingType) {
    case 'linear':
      validated.a = Math.max(0.1, Math.min(5.0, validated.a || 1));
      validated.b = Math.max(-2.0, Math.min(2.0, validated.b || 0));
      break;
    case 'sigmoid':
      validated.k = Math.max(0.1, Math.min(10.0, validated.k || 1));
      break;
  }
  
  return validated;
}

// ============================================================================
// UI CONTROLS
// ============================================================================

/**
 * Create scaling controls section for a dataset
 * Only shows for datasets with size encoding
 */
export function createScalingSection(dataset, datasetIndex, onApplyScaling) {
  // Check if this dataset has size encoding
  if (!hasSecondAxis(dataset)) {
    return null;
  }
  
  const section = document.createElement('div');
  section.className = 'scaling-section';
  section.style.marginTop = '5px';
  
  // Collapsible header
  const header = document.createElement('div');
  header.className = 'scaling-header';
  header.style.cssText = `
    display: flex;
    align-items: center;
    cursor: pointer;
    padding: 8px;
    background: #f0f0f0;
    border-radius: 4px;
    margin-bottom: 5px;
    user-select: none;
  `;
  
  const arrow = document.createElement('span');
  arrow.textContent = '▶';
  arrow.style.cssText = `
    margin-right: 8px;
    transition: transform 0.2s;
    font-size: 12px;
  `;
  
  const title = document.createElement('span');
  title.textContent = '고급 크기 스케일링 옵션';
  title.style.fontWeight = 'bold';
  
  header.appendChild(arrow);
  header.appendChild(title);
  
  // Controls container (initially hidden)
  const controls = document.createElement('div');
  controls.className = 'scaling-controls';
  controls.style.display = 'none';
  controls.style.padding = '10px';
  controls.style.border = '1px solid #ddd';
  controls.style.borderRadius = '4px';
  controls.style.backgroundColor = '#fafafa';
  
  // Toggle functionality
  let isExpanded = false;
  header.onclick = () => {
    isExpanded = !isExpanded;
    controls.style.display = isExpanded ? 'block' : 'none';
    arrow.style.transform = isExpanded ? 'rotate(90deg)' : 'rotate(0deg)';
  };
  
  // Scaling type selector
  const typeSection = createTypeSelector(datasetIndex);
  controls.appendChild(typeSection);
  
  // Parameter controls container
  const paramSection = document.createElement('div');
  paramSection.className = 'param-controls';
  paramSection.style.marginTop = '10px';
  controls.appendChild(paramSection);
  
  // Apply and Reset buttons
  const buttonContainer = document.createElement('div');
  buttonContainer.style.cssText = `
    display: flex;
    gap: 10px;
    margin-top: 15px;
    justify-content: flex-end;
  `;
  
  const applyButton = document.createElement('button');
  applyButton.textContent = '적용';
  applyButton.className = 'scaling-apply-btn';
  applyButton.style.cssText = `
    padding: 6px 12px;
    background: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  `;
  
  const resetButton = document.createElement('button');
  resetButton.textContent = '기본값으로 재설정';
  resetButton.className = 'scaling-reset-btn';
  resetButton.style.cssText = `
    padding: 6px 12px;
    background: #6c757d;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  `;
  
  buttonContainer.appendChild(resetButton);
  buttonContainer.appendChild(applyButton);
  controls.appendChild(buttonContainer);
  
  // Initialize with default parameters
  updateParameterControls(paramSection, 'default', datasetIndex);
  
  // Event listeners
  const typeSelect = typeSection.querySelector('.scaling-type-select');
  typeSelect.onchange = () => {
    updateParameterControls(paramSection, typeSelect.value, datasetIndex);
  };
  
  applyButton.onclick = () => {
    const scalingConfig = getCurrentScalingConfig(controls, datasetIndex);
    onApplyScaling(datasetIndex, scalingConfig);
  };
  
  resetButton.onclick = () => {
    resetToDefaults(controls, datasetIndex);
    const scalingConfig = getCurrentScalingConfig(controls, datasetIndex);
    onApplyScaling(datasetIndex, scalingConfig);
  };
  
  section.appendChild(header);
  section.appendChild(controls);
  
  return section;
}

/**
 * Create scaling type selector dropdown
 */
function createTypeSelector(datasetIndex) {
  const container = document.createElement('div');
  container.style.marginBottom = '10px';
  
  const label = document.createElement('label');
  label.textContent = '스케일링 타입: ';
  label.style.fontWeight = 'bold';
  
  const select = document.createElement('select');
  select.className = 'scaling-type-select';
  select.style.cssText = `
    margin-left: 8px;
    padding: 4px 8px;
    border: 1px solid #ccc;
    border-radius: 3px;
  `;
  
  const options = [
    { value: 'default', text: '기본 (선형 정규화)' },
    { value: 'linear', text: '선형 변환 (ax + b)' },
    { value: 'sigmoid', text: '시그모이드 (S자 곡선)' }
  ];
  
  options.forEach(opt => {
    const option = document.createElement('option');
    option.value = opt.value;
    option.textContent = opt.text;
    select.appendChild(option);
  });
  
  container.appendChild(label);
  container.appendChild(select);
  
  return container;
}

/**
 * Update parameter controls based on selected scaling type
 */
function updateParameterControls(container, scalingType, datasetIndex) {
  container.innerHTML = '';
  
  if (scalingType === 'default') {
    container.innerHTML = '<p style="color: #666; font-style: italic;">기본 스케일링은 추가 매개변수가 필요하지 않습니다.</p>';
    return;
  }
  
  const params = getDefaultParams(scalingType);
  
  if (scalingType === 'linear') {
    container.appendChild(createSliderControl('a', '기울기 (a)', params.a, 0.1, 5.0, 0.1));
    container.appendChild(createSliderControl('b', '오프셋 (b)', params.b, -2.0, 2.0, 0.1));
  } else if (scalingType === 'sigmoid') {
    container.appendChild(createSliderControl('k', '급경사도 (k)', params.k, 0.1, 10.0, 0.1));
    
    const note = document.createElement('p');
    note.style.cssText = 'color: #666; font-size: 12px; margin-top: 5px; font-style: italic;';
    note.textContent = '※ 중점은 자동으로 데이터 범위의 중간값으로 설정됩니다.';
    container.appendChild(note);
  }
}

/**
 * Create individual slider control
 */
function createSliderControl(paramName, label, defaultValue, min, max, step) {
  const container = document.createElement('div');
  container.style.cssText = 'margin-bottom: 15px;';
  
  const labelDiv = document.createElement('div');
  labelDiv.style.cssText = 'display: flex; justify-content: space-between; margin-bottom: 5px;';
  
  const labelSpan = document.createElement('span');
  labelSpan.textContent = label;
  labelSpan.style.fontWeight = 'bold';
  
  const valueSpan = document.createElement('span');
  valueSpan.className = `param-value-${paramName}`;
  valueSpan.textContent = defaultValue.toFixed(1);
  valueSpan.style.cssText = 'font-family: monospace; background: #e9ecef; padding: 2px 6px; border-radius: 3px;';
  
  labelDiv.appendChild(labelSpan);
  labelDiv.appendChild(valueSpan);
  
  const slider = document.createElement('input');
  slider.type = 'range';
  slider.className = `param-slider-${paramName}`;
  slider.min = min;
  slider.max = max;
  slider.step = step;
  slider.value = defaultValue;
  slider.style.cssText = 'width: 100%;';
  
  slider.oninput = () => {
    valueSpan.textContent = parseFloat(slider.value).toFixed(1);
  };
  
  container.appendChild(labelDiv);
  container.appendChild(slider);
  
  return container;
}

/**
 * Get current scaling configuration from controls
 */
function getCurrentScalingConfig(controlsContainer, datasetIndex) {
  const typeSelect = controlsContainer.querySelector('.scaling-type-select');
  const type = typeSelect.value;
  
  const params = {};
  
  if (type === 'linear') {
    const aSlider = controlsContainer.querySelector('.param-slider-a');
    const bSlider = controlsContainer.querySelector('.param-slider-b');
    if (aSlider) params.a = parseFloat(aSlider.value);
    if (bSlider) params.b = parseFloat(bSlider.value);
  } else if (type === 'sigmoid') {
    const kSlider = controlsContainer.querySelector('.param-slider-k');
    if (kSlider) params.k = parseFloat(kSlider.value);
  }
  
  return {
    type: type,
    params: validateParams(type, params)
  };
}

/**
 * Reset controls to default values
 */
function resetToDefaults(controlsContainer, datasetIndex) {
  const typeSelect = controlsContainer.querySelector('.scaling-type-select');
  typeSelect.value = 'default';
  
  const paramSection = controlsContainer.querySelector('.param-controls');
  updateParameterControls(paramSection, 'default', datasetIndex);
}

/**
 * Check if dataset has size encoding (second axis)
 */
function hasSecondAxis(dataset) {
  return dataset.axes && dataset.axes.length >= 2 && 
         ['size', 'scatter_size', 'size_color', 'scatter_size_color', 'bar_size', 'grouped_bar_size'].includes(dataset.visualizationTypes[0]?.type);
}