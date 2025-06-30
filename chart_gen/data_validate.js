// data_validate.js
// 차트 생성을 위한 입력값 유효성 검사

/**
 * 기본 입력값 유효성 검사
 */
export function validateBasicInputs(chartType, xAxisName) {
  if (!chartType) {
    return { isValid: false, error: 'Please enter a chart type' };
  }
  
  if (!xAxisName) {
    return { isValid: false, error: 'Please enter X axis name' };
  }
  
  return { isValid: true };
}

/**
 * Y축 필요 여부 및 입력값 검사
 */
export function validateYAxisRequirement(chartType, dimension, yAxisName) {
  const needsYAxis = chartType === 'scatter' || 
                     chartType.includes('scatter') || 
                     chartType === 'bar' || 
                     chartType.includes('bar');
  
  // For charts that need Y axis, require it for 2D+
  if (parseInt(dimension) >= 2 && needsYAxis && !yAxisName) {
    return { 
      isValid: false, 
      error: `Please enter Y axis name for ${chartType} charts`,
      needsYAxis 
    };
  }
  
  return { isValid: true, needsYAxis };
}

/**
 * 사이즈 스케일링 설정 검증
 */
export function validateSizeScaling(sizeScalingType, sizeScalingK) {
  let scalingConfig = { type: 'default', params: {} };
  
  if (sizeScalingType) {
    // Validate scaling type (case sensitive)
    if (sizeScalingType !== 'default' && sizeScalingType !== 'sigmoid') {
      return { 
        isValid: false, 
        error: 'Size Scaling Type must be exactly "default" or "sigmoid"' 
      };
    }
    
    if (sizeScalingType === 'sigmoid') {
      // Require K value for sigmoid
      if (!sizeScalingK) {
        return { 
          isValid: false, 
          error: 'K Value is required when using sigmoid scaling' 
        };
      }
      
      // Validate K value is a number between 0.1 and 10.0
      const kValue = parseFloat(sizeScalingK);
      if (isNaN(kValue) || kValue < 0.1 || kValue > 10.0) {
        return { 
          isValid: false, 
          error: 'K Value must be a number between 0.1 and 10.0' 
        };
      }
      
      scalingConfig = {
        type: 'sigmoid',
        params: { k: kValue }
      };
    } else {
      // For default scaling, ignore K value completely
      scalingConfig = {
        type: 'default',
        params: {}
      };
    }
  }
  
  return { isValid: true, scalingConfig };
}

/**
 * 윈도우 범위 검증
 */
export function validateWindowRanges(xAxisName, yAxisName, xRangeMin, xRangeMax, yRangeMin, yRangeMax, needsYAxis) {
  const windowRanges = {};
  
  // Validate X axis range if provided
  if (xRangeMin || xRangeMax) {
    if (!xRangeMin || !xRangeMax) {
      return { 
        isValid: false, 
        error: 'Both X Axis Range Min and Max must be provided if using X axis windowing' 
      };
    }
    const xMin = parseFloat(xRangeMin);
    const xMax = parseFloat(xRangeMax);
    if (isNaN(xMin) || isNaN(xMax) || xMin >= xMax) {
      return { 
        isValid: false, 
        error: 'X Axis Range Min must be less than Max and both must be valid numbers' 
      };
    }
    windowRanges[xAxisName] = { min: xMin, max: xMax };
  }
  
  // Validate Y axis range if provided and Y axis is used
  if (yRangeMin || yRangeMax) {
    if (!needsYAxis) {
      // Ignore Y range for charts that don't use Y axis
      console.log('Ignoring Y axis range for chart type that does not use Y axis');
    } else {
      if (!yRangeMin || !yRangeMax) {
        return { 
          isValid: false, 
          error: 'Both Y Axis Range Min and Max must be provided if using Y axis windowing' 
        };
      }
      const yMin = parseFloat(yRangeMin);
      const yMax = parseFloat(yRangeMax);
      if (isNaN(yMin) || isNaN(yMax) || yMin >= yMax) {
        return { 
          isValid: false, 
          error: 'Y Axis Range Min must be less than Max and both must be valid numbers' 
        };
      }
      windowRanges[yAxisName] = { min: yMin, max: yMax };
    }
  }
  
  return { isValid: true, windowRanges };
}

/**
 * 축 설정 검증 및 생성
 */
export function validateAndCreateAxes(chartType, dimension, xAxisName, yAxisName, colorAxisName, sizeAxisName, generatedData, createAxisConfig) {
  const axes = [];
  
  // Always add X axis
  const xAxis = createAxisConfig(xAxisName, generatedData);
  if (!xAxis) {
    return { 
      isValid: false, 
      error: `X axis "${xAxisName}" not found in data` 
    };
  }
  axes.push(xAxis);
  
  // Check if this chart type needs Y axis
  const needsYAxis = chartType === 'scatter' || 
                     chartType.includes('scatter') || 
                     chartType === 'bar' || 
                     chartType.includes('bar');
  
  // Add Y axis only for charts that need it
  if (needsYAxis && yAxisName) {
    const yAxis = createAxisConfig(yAxisName, generatedData);
    if (!yAxis) {
      return { 
        isValid: false, 
        error: `Y axis "${yAxisName}" not found in data` 
      };
    }
    axes.push(yAxis);
  }
  
  // Add 3rd and 4th axes based on chart type
  if (parseInt(dimension) >= 2) {
    // Determine which axes are needed based on chart type
    const needsColor = chartType.includes('color') || chartType === 'size_color' || chartType === 'color';
    const needsSize = chartType.includes('size') || chartType === 'size_color' || chartType === 'size';
    
    // For charts that need color
    if (needsColor && colorAxisName) {
      const colorAxis = createAxisConfig(colorAxisName, generatedData);
      if (!colorAxis) {
        return { 
          isValid: false, 
          error: `Color axis "${colorAxisName}" not found in data` 
        };
      }
      axes.push(colorAxis);
    }
    
    // For charts that need size
    if (needsSize && sizeAxisName) {
      const sizeAxis = createAxisConfig(sizeAxisName, generatedData);
      if (!sizeAxis) {
        return { 
          isValid: false, 
          error: `Size axis "${sizeAxisName}" not found in data` 
        };
      }
      axes.push(sizeAxis);
    }
  }
  
  return { isValid: true, axes };
}

/**
 * 전체 입력값 검증 - 모든 검증을 한번에 수행
 */
export function validateAllInputs(formData, generatedData, createAxisConfig) {
  const {
    dimension, chartType, xAxisName, yAxisName, colorAxisName, sizeAxisName,
    sizeScalingType, sizeScalingK, xRangeMin, xRangeMax, yRangeMin, yRangeMax
  } = formData;
  
  // 1. 기본 입력값 검증
  const basicValidation = validateBasicInputs(chartType, xAxisName);
  if (!basicValidation.isValid) {
    return basicValidation;
  }
  
  // 2. Y축 필요 여부 검증
  const yAxisValidation = validateYAxisRequirement(chartType, dimension, yAxisName);
  if (!yAxisValidation.isValid) {
    return yAxisValidation;
  }
  
  // 3. 사이즈 스케일링 검증
  const sizeScalingValidation = validateSizeScaling(sizeScalingType, sizeScalingK);
  if (!sizeScalingValidation.isValid) {
    return sizeScalingValidation;
  }
  
  // 4. 윈도우 범위 검증
  const windowValidation = validateWindowRanges(
    xAxisName, yAxisName, xRangeMin, xRangeMax, 
    yRangeMin, yRangeMax, yAxisValidation.needsYAxis
  );
  if (!windowValidation.isValid) {
    return windowValidation;
  }
  
  // 5. 축 설정 검증
  const axesValidation = validateAndCreateAxes(
    chartType, dimension, xAxisName, yAxisName, 
    colorAxisName, sizeAxisName, generatedData, createAxisConfig
  );
  if (!axesValidation.isValid) {
    return axesValidation;
  }
  
  return {
    isValid: true,
    validatedData: {
      axes: axesValidation.axes,
      scalingConfig: sizeScalingValidation.scalingConfig,
      windowRanges: windowValidation.windowRanges,
      needsYAxis: yAxisValidation.needsYAxis
    }
  };
}