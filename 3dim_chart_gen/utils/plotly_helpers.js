// ============================================================================
// 3dim_chart_gen/utils/plotly_helpers.js - 완전한 Plotly 헬퍼 함수들
// ============================================================================

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

// ============================================================================
// 🆕 누락된 함수들 구현 (3d_surface_scatter.js용)
// ============================================================================

/**
 * 3D Surface용 그리드 데이터 생성
 * @param {Array} data - 원본 데이터 포인트들
 * @param {string} xAxis - X축 필드명
 * @param {string} yAxis - Y축 필드명  
 * @param {string} zAxis - Z축 필드명
 * @returns {Object} { x_grid, y_grid, z_grid }
 */
export function createSurfaceGrid(data, xAxis, yAxis, zAxis) {
    console.log('[PLOTLY_HELPERS] Surface 그리드 생성:', { dataPoints: data.length });
    
    if (!data || data.length === 0) {
        console.warn('[PLOTLY_HELPERS] 빈 데이터로 빈 그리드 반환');
        return { x_grid: [], y_grid: [], z_grid: [] };
    }
    
    try {
        // 유효한 데이터 포인트 필터링
        const validData = data.filter(d => 
            isValidNumber(d[xAxis]) && 
            isValidNumber(d[yAxis]) && 
            isValidNumber(d[zAxis])
        );
        
        if (validData.length === 0) {
            console.warn('[PLOTLY_HELPERS] 유효한 데이터 없음');
            return { x_grid: [], y_grid: [], z_grid: [] };
        }
        
        // X, Y 값들 추출 및 정렬
        const xValues = [...new Set(validData.map(d => d[xAxis]))].sort((a, b) => a - b);
        const yValues = [...new Set(validData.map(d => d[yAxis]))].sort((a, b) => a - b);
        
        console.log('[PLOTLY_HELPERS] 그리드 크기:', { xCount: xValues.length, yCount: yValues.length });
        
        // 그리드 생성 (X x Y 매트릭스)
        const z_grid = [];
        
        for (let i = 0; i < yValues.length; i++) {
            const row = [];
            for (let j = 0; j < xValues.length; j++) {
                const x = xValues[j];
                const y = yValues[i];
                
                // 해당 (x, y) 좌표의 z값 찾기
                const point = validData.find(d => d[xAxis] === x && d[yAxis] === y);
                
                if (point) {
                    row.push(point[zAxis]);
                } else {
                    // 보간 또는 기본값 (가장 가까운 점의 값 사용)
                    const nearestPoint = findNearestPoint(validData, x, y, xAxis, yAxis);
                    row.push(nearestPoint ? nearestPoint[zAxis] : 0);
                }
            }
            z_grid.push(row);
        }
        
        console.log('[PLOTLY_HELPERS] Surface 그리드 생성 완료');
        
        return {
            x_grid: xValues,
            y_grid: yValues,
            z_grid: z_grid
        };
        
    } catch (error) {
        console.error('[PLOTLY_HELPERS] Surface 그리드 생성 오류:', error);
        return { x_grid: [], y_grid: [], z_grid: [] };
    }
}

/**
 * 가장 가까운 데이터 포인트 찾기 (보간용)
 * @param {Array} data - 데이터 배열
 * @param {number} targetX - 목표 X값
 * @param {number} targetY - 목표 Y값  
 * @param {string} xAxis - X축 필드명
 * @param {string} yAxis - Y축 필드명
 * @returns {Object|null} 가장 가까운 데이터 포인트
 */
function findNearestPoint(data, targetX, targetY, xAxis, yAxis) {
    let nearestPoint = null;
    let minDistance = Infinity;
    
    for (const point of data) {
        const dx = point[xAxis] - targetX;
        const dy = point[yAxis] - targetY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < minDistance) {
            minDistance = distance;
            nearestPoint = point;
        }
    }
    
    return nearestPoint;
}

/**
 * 3D Scatter용 배열 데이터 생성
 * @param {Array} data - 원본 데이터 포인트들
 * @param {string} xAxis - X축 필드명
 * @param {string} yAxis - Y축 필드명
 * @param {string} zAxis - Z축 필드명
 * @returns {Object} { x_scatter, y_scatter, z_scatter }
 */
export function createScatterArrays(data, xAxis, yAxis, zAxis) {
    console.log('[PLOTLY_HELPERS] Scatter 배열 생성:', { dataPoints: data.length });
    
    if (!data || data.length === 0) {
        console.warn('[PLOTLY_HELPERS] 빈 데이터로 빈 배열 반환');
        return { x_scatter: [], y_scatter: [], z_scatter: [] };
    }
    
    try {
        // 유효한 데이터 포인트만 필터링
        const validData = data.filter(d => 
            isValidNumber(d[xAxis]) && 
            isValidNumber(d[yAxis]) && 
            isValidNumber(d[zAxis])
        );
        
        if (validData.length === 0) {
            console.warn('[PLOTLY_HELPERS] 유효한 Scatter 데이터 없음');
            return { x_scatter: [], y_scatter: [], z_scatter: [] };
        }
        
        const arrays = {
            x_scatter: validData.map(d => d[xAxis]),
            y_scatter: validData.map(d => d[yAxis]),
            z_scatter: validData.map(d => d[zAxis])
        };
        
        console.log('[PLOTLY_HELPERS] Scatter 배열 생성 완료:', arrays.x_scatter.length, '개 포인트');
        
        return arrays;
        
    } catch (error) {
        console.error('[PLOTLY_HELPERS] Scatter 배열 생성 오류:', error);
        return { x_scatter: [], y_scatter: [], z_scatter: [] };
    }
}

/**
 * Plotly 레이아웃 설정 생성 (2D/3D 공용)
 * @param {string} title - 차트 제목
 * @param {string} xAxis - X축 라벨
 * @param {string} yAxis - Y축 라벨 (선택적)
 * @param {string} zAxis - Z축 라벨 (3D용, 선택적)
 * @returns {Object} Plotly 레이아웃 객체
 */
export function createPlotlyLayout(title, xAxis, yAxis = null, zAxis = null) {
    console.log('[PLOTLY_HELPERS] Plotly 레이아웃 생성:', { title, is3D: !!zAxis });
    
    const layout = {
        title: {
            text: title,
            font: { size: 16, color: '#333' }
        },
        margin: { t: 50, l: 50, r: 50, b: 50 },
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { family: 'Arial, sans-serif', size: 12, color: '#333' },
        hovermode: 'closest'
    };
    
    if (zAxis) {
        // 3D 레이아웃
        layout.scene = {
            xaxis: { 
                title: xAxis,
                showgrid: true,
                gridcolor: 'rgba(0,0,0,0.1)',
                showbackground: true,
                backgroundcolor: 'rgba(230,230,230,0.3)'
            },
            yaxis: { 
                title: yAxis,
                showgrid: true,
                gridcolor: 'rgba(0,0,0,0.1)',
                showbackground: true,
                backgroundcolor: 'rgba(230,230,230,0.3)'
            },
            zaxis: { 
                title: zAxis,
                showgrid: true,
                gridcolor: 'rgba(0,0,0,0.1)',
                showbackground: true,
                backgroundcolor: 'rgba(230,230,230,0.3)'
            },
            camera: {
                eye: { x: 1.5, y: 1.5, z: 1.5 },
                center: { x: 0, y: 0, z: 0 }
            }
        };
    } else {
        // 2D 레이아웃
        layout.xaxis = {
            title: xAxis,
            showgrid: true,
            gridcolor: 'rgba(0,0,0,0.1)',
            zeroline: false
        };
        
        if (yAxis) {
            layout.yaxis = {
                title: yAxis,
                showgrid: true,
                gridcolor: 'rgba(0,0,0,0.1)',
                zeroline: false
            };
        }
    }
    
    console.log('[PLOTLY_HELPERS] 레이아웃 생성 완료');
    return layout;
}

/**
 * Plotly 기본 설정 생성
 * @param {Object} options - 추가 옵션들 (선택적)
 * @returns {Object} Plotly config 객체
 */
export function createPlotlyConfig(options = {}) {
    console.log('[PLOTLY_HELPERS] Plotly 설정 생성');
    
    const config = {
        // 기본 설정
        responsive: true,
        displayModeBar: true,
        
        // 모드바 버튼 설정
        modeBarButtonsToRemove: [
            'pan2d', 'select2d', 'lasso2d', 'autoScale2d', 
            'hoverClosestCartesian', 'hoverCompareCartesian',
            'toggleSpikelines'
        ],
        
        // 표시할 버튼들
        modeBarButtonsToAdd: [],
        
        // 기타 설정
        displaylogo: false,
        showTips: false,
        
        // 로케일 설정
        locale: 'ko',
        
        // 이미지 다운로드 설정
        toImageButtonOptions: {
            format: 'png',
            filename: 'chart',
            height: 600,
            width: 800,
            scale: 2
        },
        
        // 편집 가능한 요소들
        editable: false,
        
        // 스크롤 줌 설정
        scrollZoom: true,
        
        // 더블클릭 동작
        doubleClick: 'reset+autosize',
        
        // 3D 차트용 추가 설정
        ...(options.is3D && {
            modeBarButtonsToAdd: ['tableRotation', 'resetCameraDefault3d', 'resetCameraLastSave3d']
        }),
        
        // 사용자 추가 옵션 병합
        ...options
    };
    
    console.log('[PLOTLY_HELPERS] 설정 생성 완료');
    return config;
}