// ============================================================================
// 3dim_chart_gen/utils/plotly_helpers.js - 완전한 Plotly 헬퍼 함수들 (WebGL 기본 사용)
// ============================================================================

/**
 * 🔥 통합 Plotly trace 생성 (2D/3D/4D + 스케일링 지원) - WebGL 기본 사용
 * @param {Array} data - 처리된 데이터 포인트들
 * @param {Object} config - 차트 설정 {dimension, axes, scalingConfig, colorConfig}
 * @param {number} dimension - 차원 (2, 3, 4)
 * @returns {Object} Plotly trace 객체
 */
export function createPlotlyTrace(data, config, dimension) {
    console.log('[PLOTLY_HELPERS] 통합 Plotly trace 생성 (WebGL):', { dimension, dataPoints: data.length });
    
    // WebGL 지원 여부 확인
    if (!checkWebGLSupport()) {
        throw new Error('WebGL이 지원되지 않는 브라우저입니다. 최신 브라우저를 사용해주세요.');
    }
    
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
    
    // 차원별 처리 - 🔥 모든 2D는 scattergl 사용
    switch (dimension) {
        case 2:
            trace.type = 'scattergl';  // ← WebGL 사용
            trace.x = data.map(d => d[config.axes[0].name]);
            trace.y = data.map(d => d[config.axes[1] ? config.axes[1].name : 0]); // Y축이 없으면 0
            break;
            
        case 3:
            if (config.is3DSurface) {
                // 실제 3D 표면 차트 (이미 WebGL 사용)
                trace.type = 'scatter3d';
                trace.x = data.map(d => d[config.axes[0].name]);
                trace.y = data.map(d => d[config.axes[1].name]);
                trace.z = data.map(d => d[config.axes[2].name]);
            } else {
                // 2D + 시각적 인코딩 - WebGL 사용
                trace.type = 'scattergl';  // ← WebGL 사용
                trace.x = data.map(d => d[config.axes[0].name]);
                trace.y = data.map(d => d[config.axes[1] ? config.axes[1].name : 0]);
            }
            break;
            
        case 4:
            // 4D는 항상 2D + 이중 인코딩 - WebGL 사용
            trace.type = 'scattergl';  // ← WebGL 사용
            trace.x = data.map(d => d[config.axes[0].name]);
            trace.y = data.map(d => d[config.axes[1].name]);
            break;
            
        default:
            throw new Error(`지원하지 않는 차원: ${dimension}`);
    }
    
    // 🔥 스케일링 적용
    trace = applyScalingToTrace(trace, data, config);
    
    console.log('[PLOTLY_HELPERS] WebGL Plotly trace 생성 완료');
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
 * 빈 데이터용 기본 trace 생성 - WebGL 사용
 * @param {number} dimension - 차원
 * @returns {Object} 빈 trace 객체
 */
function createEmptyTrace(dimension) {
    // WebGL 지원 확인
    if (!checkWebGLSupport()) {
        throw new Error('WebGL이 지원되지 않는 브라우저입니다.');
    }

    const emptyTrace = {
        mode: 'markers',
        marker: { size: 5, color: 'rgba(255, 0, 0, 0.5)' },
        name: 'No Data'
    };
    
    switch (dimension) {
        case 2:
            emptyTrace.type = 'scattergl';  // ← WebGL 사용
            emptyTrace.x = [];
            emptyTrace.y = [];
            break;
        case 3:
        case 4:
            emptyTrace.type = 'scatter3d';  // ← 3D는 이미 WebGL
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
 * Plotly 기본 설정 생성 - WebGL 최적화 포함
 * @param {Object} options - 추가 옵션들 (선택적)
 * @returns {Object} Plotly config 객체
 */
export function createPlotlyConfig(options = {}) {
    console.log('[PLOTLY_HELPERS] WebGL 최적화 Plotly 설정 생성');
    
    // WebGL 지원 확인
    if (!checkWebGLSupport()) {
        throw new Error('WebGL이 지원되지 않습니다. 최신 브라우저를 사용해주세요.');
    }
    
    const config = {
        // 🔥 WebGL 최적화 기본 설정
        responsive: true,
        displayModeBar: true,
        
        // 🔥 WebGL 성능 최적화
        plotGlPixelRatio: window.devicePixelRatio || 1,
        
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
        
        // 스크롤 줌 설정 (WebGL 최적화)
        scrollZoom: true,
        
        // 더블클릭 동작
        doubleClick: 'reset+autosize',
        
        // 🔥 WebGL 전용 추가 설정
        webGlDebug: false,  // 운영환경에서는 false
        staticPlot: false,   // WebGL 인터랙션 활성화
        
        // 3D 차트용 추가 설정
        ...(options.is3D && {
            modeBarButtonsToAdd: ['tableRotation', 'resetCameraDefault3d', 'resetCameraLastSave3d']
        }),
        
        // 사용자 추가 옵션 병합
        ...options
    };
    
    console.log('[PLOTLY_HELPERS] WebGL 최적화 설정 생성 완료');
    return config;
}

// ============================================================================
// 🔥 WebGL 지원 및 최적화 함수들
// ============================================================================

/**
 * WebGL 지원 여부 확인
 * @returns {boolean} WebGL 지원 여부
 */
export function checkWebGLSupport() {
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        if (!gl) {
            console.error('[PLOTLY_HELPERS] WebGL이 지원되지 않습니다');
            return false;
        }
        
        // WebGL 컨텍스트 정리
        const loseContext = gl.getExtension('WEBGL_lose_context');
        if (loseContext) {
            loseContext.loseContext();
        }
        
        console.log('[PLOTLY_HELPERS] WebGL 지원 확인됨');
        return true;
        
    } catch (error) {
        console.error('[PLOTLY_HELPERS] WebGL 지원 확인 실패:', error);
        return false;
    }
}

/**
 * WebGL 컨텍스트 정보 가져오기 (디버깅용)
 * @returns {Object|null} WebGL 정보
 */
export function getWebGLInfo() {
    if (!checkWebGLSupport()) {
        return null;
    }
    
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        if (!gl) return null;
        
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        const info = {
            vendor: gl.getParameter(gl.VENDOR),
            renderer: gl.getParameter(gl.RENDERER),
            version: gl.getParameter(gl.VERSION),
            shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
            maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
            maxVertexAttributes: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
            maxFragmentUniforms: gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS)
        };
        
        if (debugInfo) {
            info.unmaskedVendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
            info.unmaskedRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        }
        
        // WebGL 컨텍스트 정리
        const loseContext = gl.getExtension('WEBGL_lose_context');
        if (loseContext) {
            loseContext.loseContext();
        }
        
        console.log('[PLOTLY_HELPERS] WebGL 정보:', info);
        return info;
        
    } catch (error) {
        console.error('[PLOTLY_HELPERS] WebGL 정보 수집 실패:', error);
        return null;
    }
}

/**
 * WebGL 성능 최적화 설정 생성
 * @param {number} dataSize - 데이터 크기
 * @returns {Object} 최적화 설정
 */
export function createWebGLOptimization(dataSize = 1000) {
    const optimization = {
        // 기본 설정
        antialias: dataSize < 10000,  // 대용량 데이터에서는 안티앨리어싱 비활성화
        preserveDrawingBuffer: false,  // 메모리 절약
        premultipliedAlpha: false,     // 성능 향상
        
        // 마커 최적화
        markerMaxDisplayed: Math.min(dataSize, 20000),  // 최대 표시 마커 수
        
        // 렌더링 최적화
        plotGlPixelRatio: dataSize > 50000 ? 1 : (window.devicePixelRatio || 1),
        
        // 메모리 관리
        clearColor: [0, 0, 0, 0],  // 투명 배경
        
        // 성능 모니터링
        logPerformance: dataSize > 100000
    };
    
    console.log('[PLOTLY_HELPERS] WebGL 최적화 설정 생성:', {
        dataSize,
        antialias: optimization.antialias,
        maxMarkers: optimization.markerMaxDisplayed
    });
    
    return optimization;
}

/**
 * WebGL 오류 처리 및 대안 제공
 * @param {Error} error - WebGL 오류
 * @param {string} context - 오류 발생 컨텍스트
 */
export function handleWebGLError(error, context = 'unknown') {
    console.error(`[PLOTLY_HELPERS] WebGL 오류 (${context}):`, error);
    
    // 오류 세부 정보 로깅
    const webglInfo = getWebGLInfo();
    if (webglInfo) {
        console.error('[PLOTLY_HELPERS] WebGL 환경 정보:', webglInfo);
    }
    
    // 사용자에게 표시할 오류 메시지
    const userMessage = `
        WebGL 렌더링 오류가 발생했습니다.
        
        가능한 해결책:
        1. 브라우저를 최신 버전으로 업데이트
        2. 하드웨어 가속 활성화 확인
        3. GPU 드라이버 업데이트
        4. 다른 브라우저 사용 (Chrome, Firefox, Edge)
        
        기술적 정보: ${error.message}
    `;
    
    // 에러 객체 생성 및 throw
    const webglError = new Error(userMessage);
    webglError.name = 'WebGLRenderingError';
    webglError.originalError = error;
    webglError.context = context;
    webglError.webglInfo = webglInfo;
    
    throw webglError;
}

// ============================================================================
// 차트 변환 및 생성 함수들
// ============================================================================

// 2D 차트 함수들 import
import { create2DScatter } from '../charts/2dim/2d_scatter.js';
import { create2DSize } from '../charts/2dim/2d_size.js';
import { create2DColor } from '../charts/2dim/2d_color.js';
import { create2DScatterTiled } from '../charts/2dim/2d_scatter_tiled.js';

// 3D 차트 함수들 import
import { create3DScatterColor } from '../charts/3dim/3d_scatter_color.js';
import { create3DScatterSize } from '../charts/3dim/3d_scatter_size.js';
import { create3DSizeColor } from '../charts/3dim/3d_size_color.js';
import { create3DSurfaceScatter } from '../charts/3dim/3d_surface_scatter.js';

// 4D 차트 함수들 import
import { create4DScatterSizeColor } from '../charts/4dim/4d_scatter_size_color.js';

/**
 * 🔥 필터링된 데이터를 Plotly traces로 변환 (모든 차트 타입 지원) - WebGL 사용
 * @param {Array} dataPoints - 필터링된 데이터 포인트들
 * @param {Object} config - 차트 설정 (dataMapping, type, scalingConfig, colorConfig 포함)
 * @returns {Array} Plotly traces 배열
 */
export function convertDataToTraces(dataPoints, config) {
    console.log('[PLOTLY_HELPERS] 데이터를 WebGL Plotly traces로 변환:', config.type);

    try {
        // WebGL 지원 확인
        if (!checkWebGLSupport()) {
            throw new Error('WebGL이 지원되지 않는 브라우저입니다. 최신 브라우저를 사용해주세요.');
        }

        // 최소 dataset 구조 생성
        const dataset = {
            axes: Object.entries(config.dataMapping).map(([role, fieldName]) => ({
                name: fieldName,
                role: role
            }))
        };

        // 기존 차트 생성 함수 재사용 (WebGL 버전)
        const chartConfig = createChartConfigForType(dataPoints, dataset, config);

        console.log('[PLOTLY_HELPERS] WebGL Traces 변환 완료:', chartConfig.data.length, '개 trace');
        return chartConfig.data;
    } catch (error) {
        console.error('[PLOTLY_HELPERS] WebGL Traces 변환 실패:', error);
        
        // WebGL 오류 처리
        if (error.message.includes('WebGL')) {
            handleWebGLError(error, 'convertDataToTraces');
        }
        
        // 빈 trace 반환
        return [createEmptyTrace(config.dimension || 2)];
    }
}

/**
 * 차트 타입별 설정 생성 (기존 chart creation 함수들 재사용)
 * @param {Array} data - 데이터 포인트들
 * @param {Object} dataset - 축 정보
 * @param {Object} config - 차트 설정
 * @returns {Object} 차트 설정 객체
 */
function createChartConfigForType(data, dataset, config) {
    // 필요한 차트 생성 함수들 동적 import (실제 경로에 맞게 수정)
    switch (config.type) {
        case '2d_scatter':
            return create2DScatter(data, dataset, {});
        case '2d_scatter_tiled':
            return create2DScatterTiled(data, dataset, {});
        case '2d_size':
            return create2DSize(data, dataset, config.scalingConfig || {});
        case '2d_color':
            return create2DColor(data, dataset, config.colorConfig || {});
        case '3d_scatter_color':
            return create3DScatterColor(data, dataset, config.colorConfig || {});
        case '3d_scatter_size':
            return create3DScatterSize(data, dataset, config.scalingConfig || {});
        case '3d_size_color':
            return create3DSizeColor(data, dataset, config.scalingConfig || {}, config.colorConfig || {});
        case '3d_surface_scatter':
            return create3DSurfaceScatter(data, dataset, {});
        case '4d_scatter_size_color':
            return create4DScatterSizeColor(data, dataset, config.scalingConfig || {}, config.colorConfig || {});
        default:
            throw new Error(`Unknown chart type: ${config.type}`);
    }
}