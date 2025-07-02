// ============================================================================
// 3dim_chart_gen/chart_factory_3d.js - 3D 차트 팩토리 (2D와 유사한 구조)
// ============================================================================

// 3D 차트 함수들 import
import { 
    create3DSurfaceScatter, 
    create3DSurfaceOnly, 
    create3DScatterOnly 
} from './charts/3dim/3d_surface_scatter.js';

/**
 * 3D 시각화 생성 팩토리 함수 (2D createVisualization과 유사)
 * @param {Object} dataset - 데이터셋 설정
 * @param {Object} vizType - 시각화 타입
 * @param {Array} data - 처리된 데이터
 * @param {Object} options - 추가 옵션들
 * @returns {Object} Plotly 차트 설정
 */
export function createVisualization3D(dataset, vizType, data, options = {}) {
    console.log('[CHART_FACTORY_3D] 3D 시각화 생성 시작');
    console.log('[CHART_FACTORY_3D] 차트 타입:', vizType.type);
    console.log('[CHART_FACTORY_3D] 데이터 포인트:', data.length, '개');

    // 입력 검증
    if (!dataset) {
        throw new Error('Dataset이 필요합니다');
    }

    if (!vizType || !vizType.type) {
        throw new Error('시각화 타입이 필요합니다');
    }

    if (!Array.isArray(data)) {
        throw new Error('데이터는 배열이어야 합니다');
    }

    // 3D 전용 검증
    if (!dataset.axes || dataset.axes.length < 3) {
        throw new Error('3D 차트는 최소 3개의 축이 필요합니다');
    }

    try {
        let chartConfig;

        switch (vizType.type) {
            // 3D Surface + Scatter 조합
            case '3d_surface_scatter':
                console.log('📊 3D Surface + Scatter 차트 생성');
                chartConfig = create3DSurfaceScatter(data, dataset, options);
                break;

            // 3D Surface만
            case '3d_surface_only':
                console.log('🏔️ 3D Surface 전용 차트 생성');
                chartConfig = create3DSurfaceOnly(data, dataset, options);
                break;

            // 3D Scatter만
            case '3d_scatter_only':
                console.log('⚫ 3D Scatter 전용 차트 생성');
                chartConfig = create3DScatterOnly(data, dataset, options);
                break;

            // 향후 확장 가능한 타입들
            case '3d_wireframe':
                console.log('🕸️ 3D Wireframe 차트 생성 (구현 예정)');
                chartConfig = create3DWireframe(data, dataset, options);
                break;

            case '3d_mesh':
                console.log('🌐 3D Mesh 차트 생성 (구현 예정)');
                chartConfig = create3DMesh(data, dataset, options);
                break;

            case '3d_volume':
                console.log('📦 3D Volume 차트 생성 (구현 예정)');
                chartConfig = create3DVolume(data, dataset, options);
                break;

            default:
                throw new Error(`알 수 없는 3D 차트 타입: ${vizType.type}`);
        }

        if (!chartConfig) {
            throw new Error(`3D 차트 함수가 null/undefined를 반환했습니다: ${vizType.type}`);
        }

        console.log('✅ 3D 차트 설정 생성 성공:', chartConfig);

        // 공통 3D 옵션 적용
        chartConfig = apply3DVisualizationOptions(chartConfig, options);

        return chartConfig;

    } catch (error) {
        console.error(`❌ 3D 차트 팩토리 오류 (${vizType.type}):`, error);
        console.error(`오류 스택:`, error.stack);
        throw error;
    }
}

/**
 * 3D 시각화 옵션 적용
 * @param {Object} chartConfig - Plotly 차트 설정
 * @param {Object} options - 적용할 옵션들
 * @returns {Object} 옵션이 적용된 차트 설정
 */
function apply3DVisualizationOptions(chartConfig, options) {
    console.log('[CHART_FACTORY_3D] 3D 시각화 옵션 적용:', options);

    try {
        // 카메라 위치 설정
        if (options.cameraPosition) {
            chartConfig.layout = chartConfig.layout || {};
            chartConfig.layout.scene = chartConfig.layout.scene || {};
            chartConfig.layout.scene.camera = options.cameraPosition;
            console.log('📷 카메라 위치 적용:', options.cameraPosition);
        }

        // 배경 색상 설정
        if (options.backgroundColor) {
            chartConfig.layout = chartConfig.layout || {};
            chartConfig.layout.paper_bgcolor = options.backgroundColor;
            chartConfig.layout.plot_bgcolor = options.backgroundColor;
            console.log('🎨 배경 색상 적용:', options.backgroundColor);
        }

        // 차트 크기 설정
        if (options.width || options.height) {
            chartConfig.layout = chartConfig.layout || {};
            if (options.width) chartConfig.layout.width = options.width;
            if (options.height) chartConfig.layout.height = options.height;
            console.log('📏 차트 크기 적용:', { width: options.width, height: options.height });
        }

        // 3D 특화 옵션들
        if (options.plotly3DOptions) {
            const { showAxes, showGrid, axisLines, backgroundGrid } = options.plotly3DOptions;
            
            chartConfig.layout = chartConfig.layout || {};
            chartConfig.layout.scene = chartConfig.layout.scene || {};

            if (showAxes !== undefined) {
                chartConfig.layout.scene.xaxis = chartConfig.layout.scene.xaxis || {};
                chartConfig.layout.scene.yaxis = chartConfig.layout.scene.yaxis || {};
                chartConfig.layout.scene.zaxis = chartConfig.layout.scene.zaxis || {};
                
                chartConfig.layout.scene.xaxis.visible = showAxes;
                chartConfig.layout.scene.yaxis.visible = showAxes;
                chartConfig.layout.scene.zaxis.visible = showAxes;
                console.log('📐 축 표시 설정:', showAxes);
            }

            if (showGrid !== undefined) {
                chartConfig.layout.scene.xaxis = chartConfig.layout.scene.xaxis || {};
                chartConfig.layout.scene.yaxis = chartConfig.layout.scene.yaxis || {};
                chartConfig.layout.scene.zaxis = chartConfig.layout.scene.zaxis || {};
                
                chartConfig.layout.scene.xaxis.showgrid = showGrid;
                chartConfig.layout.scene.yaxis.showgrid = showGrid;
                chartConfig.layout.scene.zaxis.showgrid = showGrid;
                console.log('🔲 격자 표시 설정:', showGrid);
            }
        }

        // 색상 스케일 커스터마이징
        if (options.colorScale) {
            chartConfig.data.forEach(trace => {
                if (trace.colorscale !== undefined) {
                    trace.colorscale = options.colorScale;
                }
                if (trace.marker && trace.marker.colorscale !== undefined) {
                    trace.marker.colorscale = options.colorScale;
                }
            });
            console.log('🌈 색상 스케일 적용:', options.colorScale);
        }

        // 투명도 설정
        if (options.opacity) {
            const { surface = 0.7, scatter = 0.8 } = options.opacity;
            
            chartConfig.data.forEach(trace => {
                if (trace.type === 'surface') {
                    trace.opacity = surface;
                } else if (trace.type === 'scatter3d' && trace.marker) {
                    trace.marker.opacity = scatter;
                }
            });
            console.log('👻 투명도 적용:', options.opacity);
        }

        // 마커 크기 설정
        if (options.markerSize) {
            chartConfig.data.forEach(trace => {
                if (trace.type === 'scatter3d' && trace.marker) {
                    trace.marker.size = options.markerSize;
                }
            });
            console.log('⚫ 마커 크기 적용:', options.markerSize);
        }

        // Plotly 설정 옵션
        if (options.plotlyConfig) {
            chartConfig.config = { ...chartConfig.config, ...options.plotlyConfig };
            console.log('⚙️ Plotly 설정 적용');
        }

    } catch (error) {
        console.warn('⚠️ 3D 시각화 옵션 적용 실패:', error);
        // 옵션 적용 실패는 차트 생성을 중단시키지 않음
    }

    return chartConfig;
}

/**
 * 3D 차트 타입 유효성 검사
 * @param {string} chartType - 차트 타입
 * @returns {boolean} 유효한 3D 차트 타입인지 여부
 */
export function isValid3DChartType(chartType) {
    const valid3DTypes = [
        '3d_surface_scatter',
        '3d_surface_only', 
        '3d_scatter_only',
        '3d_wireframe',
        '3d_mesh',
        '3d_volume'
    ];
    
    return valid3DTypes.includes(chartType);
}

/**
 * 지원되는 3D 차트 타입 목록 반환
 * @returns {Array} 지원되는 3D 차트 타입들
 */
export function getSupportedChart3DTypes() {
    return [
        {
            type: '3d_surface_scatter',
            name: '3D Surface + Scatter',
            description: '3D 표면과 산점도 조합',
            implemented: true
        },
        {
            type: '3d_surface_only',
            name: '3D Surface',
            description: '3D 표면만',
            implemented: true
        },
        {
            type: '3d_scatter_only',
            name: '3D Scatter',
            description: '3D 산점도만',
            implemented: true
        },
        {
            type: '3d_wireframe',
            name: '3D Wireframe',
            description: '3D 와이어프레임',
            implemented: false
        },
        {
            type: '3d_mesh',
            name: '3D Mesh',
            description: '3D 메시',
            implemented: false
        },
        {
            type: '3d_volume',
            name: '3D Volume',
            description: '3D 볼륨',
            implemented: false
        }
    ];
}

// ============================================================================
// 향후 구현 예정 차트 타입들 (스켈레톤)
// ============================================================================

/**
 * 3D Wireframe 차트 (구현 예정)
 */
function create3DWireframe(data, dataset, options) {
    console.log('[CHART_FACTORY_3D] 3D Wireframe 구현 예정');
    // TODO: 구현 예정
    return create3DSurfaceScatter(data, dataset, options); // 임시로 기본 타입 반환
}

/**
 * 3D Mesh 차트 (구현 예정)
 */
function create3DMesh(data, dataset, options) {
    console.log('[CHART_FACTORY_3D] 3D Mesh 구현 예정');
    // TODO: 구현 예정
    return create3DSurfaceScatter(data, dataset, options); // 임시로 기본 타입 반환
}

/**
 * 3D Volume 차트 (구현 예정)
 */
function create3DVolume(data, dataset, options) {
    console.log('[CHART_FACTORY_3D] 3D Volume 구현 예정');
    // TODO: 구현 예정
    return create3DSurfaceScatter(data, dataset, options); // 임시로 기본 타입 반환
}