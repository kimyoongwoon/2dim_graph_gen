/**
 * 🔥 통합 Plotly trace 생성 (2D/3D/4D + 스케일링 지원)
 * @param {Array} data - 처리된 데이터 포인트들
 * @param {Object} config - 차트 설정 {dimension, axes, scalingConfig, colorConfig}
 * @param {number} dimension - 차원 (2, 3, 4)
 * @returns {Object} Plotly trace 객체
 */
export function createPlotlyTrace(data, config, dimension) {
    console.log('[PLOTLY_HELPERS] 통합 Plotly trace 생성:', { dimension, dataPoints: data.length });
    
    if (!data || data.length === 0) {
        console.warn('[PLOTLY_HELPERS] 빈 데이터로 기본 trace 생성');
        return createEmptyTrace(dimension);
    }
    
    // 기본 trace 구조
    const trace = {
        mode: 'markers',
        marker: {
            size: 8,  // 기본 크기
            color: 'rgba(99, 110, 250, 0.7)',  // 기본 색상
            line: { width: 1, color: 'rgba(99, 110, 250, 1)' }
        },
        hovertemplate: '%{text}<extra></extra>'
    };
    
    // 차원별 처리
    switch (dimension) {
        case 2:
            trace.type = 'scatter';
            trace.x = data.map(d => d[config.axes[0].name]);
            trace.y = data.map(d => d[config.axes[1] ? config.axes[1].name : 0]); // Y축이 없으면 0
            break;
            
        case 3:
            if (config.is3DSurface) {
                // 실제 3D 표면 차트 (기존 로직 유지)
                trace.type = 'scatter3d';
                trace.x = data.map(d => d[config.axes[0].name]);
                trace.y = data.map(d => d[config.axes[1].name]);
                trace.z = data.map(d => d[config.axes[2].name]);
            } else {
                // 2D + 시각적 인코딩
                trace.type = 'scatter';
                trace.x = data.map(d => d[config.axes[0].name]);
                trace.y = data.map(d => d[config.axes[1] ? config.axes[1].name : 0]);
            }
            break;
            
        case 4:
            // 4D는 항상 2D + 이중 인코딩
            trace.type = 'scatter';
            trace.x = data.map(d => d[config.axes[0].name]);
            trace.y = data.map(d => d[config.axes[1].name]);
            break;
            
        default:
            throw new Error(`지원하지 않는 차원: ${dimension}`);
    }
    
    // 🔥 스케일링 적용
    trace = applyScalingToTrace(trace, data, config);
    
    console.log('[PLOTLY_HELPERS] Plotly trace 생성 완료');
    return trace;
}

/**
 * 🔥 Plotly trace에 스케일링 적용
 * @param {Object} trace - Plotly trace 객체
 * @param {Array} data - 데이터
 * @param {Object} config - 설정
 * @returns {Object} 스케일링이 적용된 trace
 */
function applyScalingToTrace(trace, data, config) {
    console.log('[PLOTLY_HELPERS] trace에 스케일링 적용');
    
    // 크기 스케일링 적용
    if (config.sizeField && config.scalingConfig) {
        try {
            import('../scaling/size_scaling.js').then(({ applySizeScaling }) => {
                const scaledSizes = applySizeScaling(data, config.sizeField, config.scalingConfig);
                trace.marker.size = scaledSizes;
                console.log('[PLOTLY_HELPERS] 크기 스케일링 적용 완료');
            });
        } catch (error) {
            console.warn('[PLOTLY_HELPERS] 크기 스케일링 적용 실패:', error);
        }
    }
    
    // 색상 스케일링 적용
    if (config.colorField && config.colorConfig) {
        try {
            import('../scaling/color_scaling.js').then(({ applyColorScaling, createPlotlyColorConfig }) => {
                const { normalizedColors, colorConfig } = applyColorScaling(data, config.colorField, config.colorConfig);
                const plotlyColorConfig = createPlotlyColorConfig(normalizedColors, colorConfig);
                
                // trace.marker에 색상 설정 적용
                Object.assign(trace.marker, plotlyColorConfig);
                console.log('[PLOTLY_HELPERS] 색상 스케일링 적용 완료');
            });
        } catch (error) {
            console.warn('[PLOTLY_HELPERS] 색상 스케일링 적용 실패:', error);
        }
    }
    
    return trace;
}

/**
 * 빈 데이터용 기본 trace 생성
 * @param {number} dimension - 차원
 * @returns {Object} 빈 trace 객체
 */
function createEmptyTrace(dimension) {
    const emptyTrace = {
        mode: 'markers',
        marker: { size: 5, color: 'rgba(255, 0, 0, 0.5)' },
        name: 'No Data'
    };
    
    switch (dimension) {
        case 2:
            emptyTrace.type = 'scatter';
            emptyTrace.x = [];
            emptyTrace.y = [];
            break;
        case 3:
        case 4:
            emptyTrace.type = 'scatter3d';
            emptyTrace.x = [];
            emptyTrace.y = [];
            emptyTrace.z = [];
            break;
    }
    
    return emptyTrace;
}

/**
 * 데이터 포인트 유효성 검사
 * @param {*} value - 검사할 값
 * @returns {boolean} 유효한 숫자인지 여부
 */
export function isValidNumber(value) {
    return value !== null && 
           value !== undefined && 
           !isNaN(value) && 
           isFinite(value);
}

/**
 * 3D 차트 색상 스케일 생성 (기존 유지 - 하위 호환성)
 * @param {Array} values - Z축 값들
 * @param {string} colorscale - 색상 스케일 이름 (기본: 'Viridis')
 * @returns {Object} 색상 설정 객체
 */
export function create3DColorScale(values, colorscale = 'Viridis') {
    if (!values || values.length === 0) {
        return { colorscale, showscale: true };
    }
    
    const validValues = values.filter(v => isValidNumber(v));
    if (validValues.length === 0) {
        return { colorscale, showscale: true };
    }
    
    const min = Math.min(...validValues);
    const max = Math.max(...validValues);
    
    return {
        colorscale,
        cmin: min,
        cmax: max,
        showscale: true,
        colorbar: {
            title: 'Z Values',
            titleside: 'right'
        }
    };
}