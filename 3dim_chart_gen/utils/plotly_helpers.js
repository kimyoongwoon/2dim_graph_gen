// ============================================================================
// 3dim_chart_gen/utils/plotly_helpers.js - Plotly 유틸리티 함수들
// ============================================================================

/**
 * 3D 표면 차트용 그리드 데이터 생성
 * @param {Array} data - 처리된 데이터 포인트들
 * @param {string} xField - X축 필드명
 * @param {string} yField - Y축 필드명  
 * @param {string} zField - Z축 필드명
 * @returns {Object} { x_grid, y_grid, z_grid }
 */
export function createSurfaceGrid(data, xField, yField, zField) {
    console.log('[PLOTLY_HELPERS] 표면 그리드 생성:', { xField, yField, zField });
    
    if (!data || data.length === 0) {
        return { x_grid: [], y_grid: [], z_grid: [] };
    }

    // 고유한 X, Y 값들 추출 및 정렬
    const xValues = [...new Set(data.map(d => d[xField]))].sort((a, b) => a - b);
    const yValues = [...new Set(data.map(d => d[yField]))].sort((a, b) => a - b);
    
    console.log('[PLOTLY_HELPERS] 그리드 크기:', xValues.length, 'x', yValues.length);

    // 포인트 맵 생성 (빠른 조회용)
    const pointMap = new Map();
    data.forEach(d => {
        const key = `${d[xField]}_${d[yField]}`;
        pointMap.set(key, d[zField]);
    });

    // 2D 그리드 생성
    const x_grid = [];
    const y_grid = [];
    const z_grid = [];

    for (let yi = 0; yi < yValues.length; yi++) {
        const x_row = [];
        const y_row = [];
        const z_row = [];

        for (let xi = 0; xi < xValues.length; xi++) {
            const x = xValues[xi];
            const y = yValues[yi];
            const key = `${x}_${y}`;
            
            x_row.push(x);
            y_row.push(y);
            z_row.push(pointMap.get(key) || null);
        }

        x_grid.push(x_row);
        y_grid.push(y_row);
        z_grid.push(z_row);
    }

    return { x_grid, y_grid, z_grid };
}

/**
 * 3D 산점도용 좌표 배열 생성
 * @param {Array} data - 처리된 데이터 포인트들
 * @param {string} xField - X축 필드명
 * @param {string} yField - Y축 필드명
 * @param {string} zField - Z축 필드명
 * @returns {Object} { x_scatter, y_scatter, z_scatter }
 */
export function createScatterArrays(data, xField, yField, zField) {
    console.log('[PLOTLY_HELPERS] 산점도 배열 생성:', { xField, yField, zField });
    
    if (!data || data.length === 0) {
        return { x_scatter: [], y_scatter: [], z_scatter: [] };
    }

    const x_scatter = [];
    const y_scatter = [];
    const z_scatter = [];

    data.forEach(d => {
        const x = d[xField];
        const y = d[yField];
        const z = d[zField];
        
        // 유효한 값만 추가
        if (x !== null && x !== undefined && 
            y !== null && y !== undefined && 
            z !== null && z !== undefined) {
            x_scatter.push(x);
            y_scatter.push(y);
            z_scatter.push(z);
        }
    });

    console.log('[PLOTLY_HELPERS] 산점도 포인트 수:', x_scatter.length);
    return { x_scatter, y_scatter, z_scatter };
}

/**
 * Plotly 레이아웃 기본 설정 생성
 * @param {string} title - 차트 제목
 * @param {string} xAxisTitle - X축 제목
 * @param {string} yAxisTitle - Y축 제목
 * @param {string} zAxisTitle - Z축 제목
 * @returns {Object} Plotly 레이아웃 객체
 */
export function createPlotlyLayout(title, xAxisTitle, yAxisTitle, zAxisTitle) {
    return {
        title: {
            text: title,
            font: { family: 'Arial, sans-serif', size: 20, color: '#000' },
            xref: 'paper',
            x: 0.5,
            xanchor: 'center'
        },
        margin: { t: 60, l: 0, r: 0, b: 0 },
        scene: {
            xaxis: { 
                title: { text: xAxisTitle },
                showgrid: true,
                zeroline: false
            },
            yaxis: { 
                title: { text: yAxisTitle },
                showgrid: true,
                zeroline: false
            },
            zaxis: { 
                title: { text: zAxisTitle },
                showgrid: true,
                zeroline: false
            },
            camera: {
                eye: { x: 1.5, y: 1.5, z: 1.5 }
            }
        },
        showlegend: true
    };
}

/**
 * Plotly 설정 옵션 생성
 * @returns {Object} Plotly 설정 객체
 */
export function createPlotlyConfig() {
    return {
        responsive: true,
        displayModeBar: true,
        modeBarButtonsToRemove: ['pan2d', 'lasso2d'],
        displaylogo: false,
        toImageButtonOptions: {
            format: 'png',
            filename: '3d_chart',
            height: 600,
            width: 800,
            scale: 1
        }
    };
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
 * 3D 차트 색상 스케일 생성
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