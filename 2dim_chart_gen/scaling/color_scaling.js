// visualizations/scaling/color_scaling.js

/**
 * Complete Color Scaling System
 * Handles blue to red gradient for color encoding
 */

// ============================================================================
// COLOR SCALING FUNCTIONS
// ============================================================================

/**
 * Apply blue to red gradient scaling
 * Dark blue (#00008B) -> Light blue (#ADD8E6) -> Light red (#FFB6C1) -> Strong red (#DC143C)
 */
export function applyColorScaling(dataValue, minData, maxData, colorScalingConfig = {}) {
  // Normalize to 0-1 range
  let normalizedValue;
  if (minData === maxData) {
    normalizedValue = 0.5; // Avoid division by zero
  } else {
    normalizedValue = (dataValue - minData) / (maxData - minData);
  }
  
  // Clamp to 0-1 range for safety
  normalizedValue = Math.max(0, Math.min(1, normalizedValue));
  
  return blueToRedGradient(normalizedValue);
}

/**
 * Generate blue to red gradient color
 * 0 = Dark blue, 1 = Strong red
 */
function blueToRedGradient(normalizedValue) {
  // Define color stops
  const darkBlue = { r: 0, g: 0, b: 139 };      // #00008B
  const lightBlue = { r: 173, g: 216, b: 230 }; // #ADD8E6
  const lightRed = { r: 255, g: 182, b: 193 };  // #FFB6C1
  const strongRed = { r: 220, g: 20, b: 60 };   // #DC143C
  
  let r, g, b;
  
  if (normalizedValue <= 0.33) {
    // Dark blue to light blue
    const t = normalizedValue / 0.33;
    r = Math.round(darkBlue.r + (lightBlue.r - darkBlue.r) * t);
    g = Math.round(darkBlue.g + (lightBlue.g - darkBlue.g) * t);
    b = Math.round(darkBlue.b + (lightBlue.b - darkBlue.b) * t);
  } else if (normalizedValue <= 0.67) {
    // Light blue to light red
    const t = (normalizedValue - 0.33) / 0.34;
    r = Math.round(lightBlue.r + (lightRed.r - lightBlue.r) * t);
    g = Math.round(lightBlue.g + (lightRed.g - lightBlue.g) * t);
    b = Math.round(lightBlue.b + (lightRed.b - lightBlue.b) * t);
  } else {
    // Light red to strong red
    const t = (normalizedValue - 0.67) / 0.33;
    r = Math.round(lightRed.r + (strongRed.r - lightRed.r) * t);
    g = Math.round(lightRed.g + (strongRed.g - lightRed.g) * t);
    b = Math.round(lightRed.b + (strongRed.b - lightRed.b) * t);
  }
  
  return `rgb(${r}, ${g}, ${b})`;
}

// ============================================================================
// UI CONTROLS
// ============================================================================

/**
 * Create color scaling controls section for a dataset
 * Only shows for datasets with color encoding
 */
export function createColorScalingSection(dataset, datasetIndex, onApplyColorScaling) {
  // Check if this dataset has color encoding
  if (!hasColorAxis(dataset)) {
    return null;
  }
  
  const section = document.createElement('div');
  section.className = 'color-scaling-section';
  section.style.marginTop = '5px';
  
  // Collapsible header
  const header = document.createElement('div');
  header.className = 'color-scaling-header';
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
  title.textContent = '고급 색상 스케일링 옵션';
  title.style.fontWeight = 'bold';
  
  header.appendChild(arrow);
  header.appendChild(title);
  
  // Controls container (initially hidden)
  const controls = document.createElement('div');
  controls.className = 'color-scaling-controls';
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
  
  // Color gradient info
  const gradientInfo = document.createElement('div');
  gradientInfo.style.cssText = 'margin-bottom: 15px;';
  
  const gradientLabel = document.createElement('div');
  gradientLabel.textContent = '색상 그라디언트:';
  gradientLabel.style.cssText = 'font-weight: bold; margin-bottom: 8px;';
  
  const gradientBar = document.createElement('div');
  gradientBar.style.cssText = `
    height: 20px;
    background: linear-gradient(to right, #00008B, #ADD8E6, #FFB6C1, #DC143C);
    border-radius: 10px;
    border: 1px solid #ccc;
    margin-bottom: 5px;
  `;
  
  const gradientLabels = document.createElement('div');
  gradientLabels.style.cssText = 'display: flex; justify-content: space-between; font-size: 12px; color: #666;';
  gradientLabels.innerHTML = '<span>최솟값 (진한 파랑)</span><span>최댓값 (강한 빨강)</span>';
  
  gradientInfo.appendChild(gradientLabel);
  gradientInfo.appendChild(gradientBar);
  gradientInfo.appendChild(gradientLabels);
  controls.appendChild(gradientInfo);
  
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
  applyButton.className = 'color-scaling-apply-btn';
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
  resetButton.className = 'color-scaling-reset-btn';
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
  
  // Event listeners
  applyButton.onclick = () => {
    const colorScalingConfig = { type: 'default' }; // For now, just default
    onApplyColorScaling(datasetIndex, colorScalingConfig);
  };
  
  resetButton.onclick = () => {
    const colorScalingConfig = { type: 'default' };
    onApplyColorScaling(datasetIndex, colorScalingConfig);
  };
  
  section.appendChild(header);
  section.appendChild(controls);
  
  return section;
}

/**
 * Check if dataset has color encoding
 */
function hasColorAxis(dataset) {
  if (!dataset.axes || !dataset.visualizationTypes) return false;
  
  const colorTypes = ['color', 'size_color', 'scatter_color', 'scatter_size_color', 'bar_color', 'grouped_bar_color'];
  
  // Check if ANY visualization type has color encoding (not just the first one)
  return dataset.visualizationTypes.some(vizType => colorTypes.includes(vizType.type));
}