// ============================================================================
// 3dim_chart_gen/charts/3dim/3d_surface_scatter.js - 3D Surface + Scatter 차트
// ============================================================================

import { 
    createSurfaceGrid, 
    createScatterArrays, 
    createPlotlyLayout, 
    createPlotlyConfig,
    create3DColorScale 
} from '../../utils/plotly_helpers.js';

/**
 * 구조화된 툴팁 생성 함수 (3D용)
 */
function createStructuredTooltip(pointData, usedAxes = {}) {
    const original = pointData._fullData;
    if (!original || typeof original !== 'object') {
        return '';
    }
    
    const entries = Object.entries(original);
    const usedFields = [];
    const otherFields = [];
    
    // 사용된 축 우선 표시
    entries.forEach(([key, value]) => {
        if (usedAxes[key]) {
            usedFields.push(`${key}: ${value} ⭐ (${usedAxes[key]})`);
        } else {
            otherFields.push(`${key}: ${value}`);
        }
    });
    
    const result = [
        '\n📊 원본 데이터:',
        ...usedFields,
        ...(otherFields.length > 0 ? ['--- 기타 필드 ---', ...otherFields] : [])
    ].join('\n');
    
    return result;
}

/**
 * 3D Surface + Scatter 차트 생성
 * @param {Array} data - 처리된 데이터 포인트들
 * @param {Object} dataset - 데이터셋 설정
 * @param {Object} options - 추가 옵션들
 * @returns {Object} Plotly 차트 설정
 */
export function create3DSurfaceScatter(data, dataset, options = {}) {
    console.log('[3D_SURFACE_SCATTER] 3D Surface+Scatter 차트 생성 시작');
    console.log('[3D_SURFACE_SCATTER] 데이터 포인트 수:', data.length);
    console.log('[3D_SURFACE_SCATTER] 축 설정:', dataset.axes);
    
    // 축 이름 추출
    const xAxis = dataset.axes[0].name;
    const yAxis = dataset.axes[1].name;
    const zAxis = dataset.axes[2].name;
    
    console.log('[3D_SURFACE_SCATTER] 축 매핑:', { xAxis, yAxis, zAxis });
    
    // 빈 데이터 처리
    if (!data || data.length === 0) {
        console.warn('[3D_SURFACE_SCATTER] 빈 데이터로 기본 차트 생성');
        return createEmptyChart(xAxis, yAxis, zAxis);
    }
    
    // Surface용 그리드 데이터 생성
    const { x_grid, y_grid, z_grid } = createSurfaceGrid(data, xAxis, yAxis, zAxis);
    
    // Scatter용 배열 데이터 생성
    const { x_scatter, y_scatter, z_scatter } = createScatterArrays(data, xAxis, yAxis, zAxis);
    
    // Z값들로 색상 스케일 생성
    const colorScale = create3DColorScale(z_scatter);
    
    // Plotly traces 생성
    const traces = [];
    
    // Surface trace (기본적으로 표시)
    if (x_grid.length > 0 && y_grid.length > 0 && z_grid.length > 0) {
        const surfaceTrace = {
            type: 'surface',
            x: x_grid,
            y: y_grid,
            z: z_grid,
            colorscale: colorScale.colorscale,
            opacity: 0.7,
            showscale: false, // Scatter에서만 스케일 표시
            name: 'Surface',
            hovertemplate: 
                `${xAxis}: %{x}<br>` +
                `${yAxis}: %{y}<br>` +
                `${zAxis}: %{z}<br>` +
                '<extra></extra>'
        };
        traces.push(surfaceTrace);
    }
    
    // Scatter trace (기본적으로 표시)
    if (x_scatter.length > 0) {
        const scatterTrace = {
            type: 'scatter3d',
            mode: 'markers',
            x: x_scatter,
            y: y_scatter,
            z: z_scatter,
            marker: {
                size: 4,
                color: z_scatter,
                colorscale: colorScale.colorscale,
                opacity: 0.8,
                colorbar: colorScale.colorbar,
                showscale: true
            },
            name: 'Points',
            customdata: data.map(d => d._fullData), // 원본 데이터 저장
            hovertemplate: 
                `${xAxis}: %{x}<br>` +
                `${yAxis}: %{y}<br>` +
                `${zAxis}: %{z}<br>` +
                '<extra></extra>'
        };
        traces.push(scatterTrace);
    }
    
    // Plotly 레이아웃 생성
    const layout = createPlotlyLayout(
        `${xAxis} × ${yAxis} × ${zAxis}`,
        xAxis,
        yAxis,
        zAxis
    );
    
    // Plotly 설정 생성
    const config = createPlotlyConfig();
    
    const chartConfig = {
        data: traces,
        layout: layout,
        config: config
    };
    
    console.log('[3D_SURFACE_SCATTER] 3D 차트 설정 생성 완료');
    console.log('[3D_SURFACE_SCATTER] Surface 그리드:', x_grid.length, 'x', y_grid.length);
    console.log('[3D_SURFACE_SCATTER] Scatter 포인트:', x_scatter.length, '개');
    
    return chartConfig;
}

/**
 * 3D Surface만 차트 생성
 * @param {Array} data - 처리된 데이터 포인트들
 * @param {Object} dataset - 데이터셋 설정
 * @param {Object} options - 추가 옵션들
 * @returns {Object} Plotly 차트 설정
 */
export function create3DSurfaceOnly(data, dataset, options = {}) {
    console.log('[3D_SURFACE_SCATTER] 3D Surface 전용 차트 생성');
    
    const baseConfig = create3DSurfaceScatter(data, dataset, options);
    
    // Surface trace만 유지
    baseConfig.data = baseConfig.data.filter(trace => trace.type === 'surface');
    
    if (baseConfig.data.length > 0) {
        baseConfig.data[0].showscale = true; // Surface에서 색상 스케일 표시
    }
    
    return baseConfig;
}

/**
 * 3D Scatter만 차트 생성
 * @param {Array} data - 처리된 데이터 포인트들
 * @param {Object} dataset - 데이터셋 설정
 * @param {Object} options - 추가 옵션들
 * @returns {Object} Plotly 차트 설정
 */
export function create3DScatterOnly(data, dataset, options = {}) {
    console.log('[3D_SURFACE_SCATTER] 3D Scatter 전용 차트 생성');
    
    const baseConfig = create3DSurfaceScatter(data, dataset, options);
    
    // Scatter trace만 유지
    baseConfig.data = baseConfig.data.filter(trace => trace.type === 'scatter3d');
    
    return baseConfig;
}

/**
 * 빈 데이터용 기본 차트 생성
 * @param {string} xAxis - X축 이름
 * @param {string} yAxis - Y축 이름  
 * @param {string} zAxis - Z축 이름
 * @returns {Object} 빈 Plotly 차트 설정
 */
function createEmptyChart(xAxis, yAxis, zAxis) {
    return {
        data: [{
            type: 'scatter3d',
            mode: 'markers',
            x: [],
            y: [],
            z: [],
            marker: { size: 5 },
            name: 'No Data'
        }],
        layout: createPlotlyLayout('No Data Available', xAxis, yAxis, zAxis),
        config: createPlotlyConfig()
    };
}

/**
 * 차트 trace 가시성 토글
 * @param {Object} chartConfig - Plotly 차트 설정
 * @param {string} traceType - 'surface' 또는 'scatter3d'
 * @param {boolean} visible - 표시 여부
 * @returns {Object} 업데이트된 차트 설정
 */
export function toggleTraceVisibility(chartConfig, traceType, visible) {
    console.log('[3D_SURFACE_SCATTER] Trace 가시성 토글:', { traceType, visible });
    
    chartConfig.data.forEach(trace => {
        if (trace.type === traceType) {
            trace.visible = visible;
        }
    });
    
    return chartConfig;
}

/**
 * 차트 투명도 조정
 * @param {Object} chartConfig - Plotly 차트 설정
 * @param {number} surfaceOpacity - Surface 투명도 (0-1)
 * @param {number} scatterOpacity - Scatter 투명도 (0-1)
 * @returns {Object} 업데이트된 차트 설정
 */
export function adjustOpacity(chartConfig, surfaceOpacity = 0.7, scatterOpacity = 0.8) {
    console.log('[3D_SURFACE_SCATTER] 투명도 조정:', { surfaceOpacity, scatterOpacity });
    
    chartConfig.data.forEach(trace => {
        if (trace.type === 'surface') {
            trace.opacity = surfaceOpacity;
        } else if (trace.type === 'scatter3d' && trace.marker) {
            trace.marker.opacity = scatterOpacity;
        }
    });
    
    return chartConfig;
}