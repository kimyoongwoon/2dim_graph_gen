// ============================================================================
// 3dim_chart_gen/chart_factory.js - 통합 차트 팩토리 (2D/3D/4D 지원)
// ============================================================================

// 2D 차트 함수들 import
import { create2DScatter } from './charts/2dim/2d_scatter.js';
import { create2DSize } from './charts/2dim/2d_size.js';
import { create2DColor } from './charts/2dim/2d_color.js';
import { create2DScatterTiled } from './charts/2dim/2d_scatter_tiled.js';

// 3D 차트 함수들 import
import { create3DScatterColor } from './charts/3dim/3d_scatter_color.js';
import { create3DScatterSize } from './charts/3dim/3d_scatter_size.js';
import { create3DSizeColor } from './charts/3dim/3d_size_color.js';
import { create3DSurfaceScatter } from './charts/3dim/3d_surface_scatter.js';

// 4D 차트 함수들 import
import { create4DScatterSizeColor } from './charts/4dim/4d_scatter_size_color.js';

/**
 * 통합 시각화 생성 팩토리 함수 (2D/3D/4D 지원)
 * @param {Object} dataset - 데이터셋 설정
 * @param {Object} vizType - 시각화 타입
 * @param {Array} data - 처리된 데이터
 * @param {Object} scalingConfig - 크기 스케일링 설정
 * @param {Object} colorConfig - 색상 스케일링 설정
 * @returns {Object} Plotly 차트 설정
 */
export function createVisualization(dataset, vizType, data, scalingConfig = {}, colorConfig = {}) {
    console.log('[CHART_FACTORY] 통합 시각화 생성 시작');
    console.log('[CHART_FACTORY] 차트 타입:', vizType.type);
    console.log('[CHART_FACTORY] 데이터 포인트:', data.length, '개');

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

    // 차원 자동 감지 (axes 개수 기반)
    const dimensions = dataset.axes ? dataset.axes.length : 0;
    console.log('[CHART_FACTORY] 감지된 차원:', dimensions);

    try {
        let chartConfig;

        switch (vizType.type) {
            // ===== 2차원 차트 (3개) =====
            case '2d_scatter':
                if (dimensions < 2) throw new Error('2D scatter는 최소 2개 축이 필요합니다');
                console.log('📊 2D Scatter 차트 생성');
                chartConfig = create2DScatter(data, dataset, {});
                break;

            case '2d_size':
                if (dimensions < 2) throw new Error('2D size는 최소 2개 축이 필요합니다');
                console.log('⚫ 2D Size 차트 생성');
                chartConfig = create2DSize(data, dataset, scalingConfig);
                break;

            case '2d_color':
                if (dimensions < 2) throw new Error('2D color는 최소 2개 축이 필요합니다');
                console.log('🌈 2D Color 차트 생성');
                chartConfig = create2DColor(data, dataset, colorConfig);
                break;

            case '2d_scatter_tiled':
                if (dimensions < 2) throw new Error('2D scatter tiled는 최소 2개 축이 필요합니다');
                console.log('🗺️ 2D Scatter Tiled 차트 생성');
                chartConfig = create2DScatterTiled(data, dataset, {});
                break;

            // ===== 3차원 차트 (4개) =====
            case '3d_scatter_color':
                if (dimensions < 3) throw new Error('3D scatter color는 최소 3개 축이 필요합니다');
                console.log('🌈 3D Scatter Color 차트 생성');
                chartConfig = create3DScatterColor(data, dataset, colorConfig);
                break;

            case '3d_scatter_size':
                if (dimensions < 3) throw new Error('3D scatter size는 최소 3개 축이 필요합니다');
                console.log('⚫ 3D Scatter Size 차트 생성');
                chartConfig = create3DScatterSize(data, dataset, scalingConfig);
                break;

            case '3d_size_color':
                if (dimensions < 3) throw new Error('3D size color는 최소 3개 축이 필요합니다');
                console.log('🎨 3D Size Color 차트 생성');
                chartConfig = create3DSizeColor(data, dataset, scalingConfig, colorConfig);
                break;

            case '3d_surface_scatter':
                if (dimensions < 3) throw new Error('3D surface scatter는 최소 3개 축이 필요합니다');
                console.log('🏔️ 3D Surface Scatter 차트 생성');
                chartConfig = create3DSurfaceScatter(data, dataset, {});
                break;

            // ===== 4차원 차트 (1개) =====
            case '4d_scatter_size_color':
                if (dimensions < 4) throw new Error('4D scatter size color는 최소 4개 축이 필요합니다');
                console.log('🎆 4D Scatter Size Color 차트 생성');
                chartConfig = create4DScatterSizeColor(data, dataset, scalingConfig, colorConfig);
                break;

            default:
                throw new Error(`알 수 없는 차트 타입: ${vizType.type}`);
        }

        if (!chartConfig) {
            throw new Error(`차트 함수가 null/undefined를 반환했습니다: ${vizType.type}`);
        }

        console.log('✅ 차트 설정 생성 성공:', chartConfig);

        // 공통 시각화 옵션 적용 (기존 apply3DVisualizationOptions 확장)
        chartConfig = applyVisualizationOptions(chartConfig, {});

        return chartConfig;

    } catch (error) {
        console.error(`❌ 차트 팩토리 오류 (${vizType.type}):`, error);
        console.error(`오류 스택:`, error.stack);
        throw error;
    }
}

/**
 * 시각화 옵션 적용 (2D/3D/4D 공통)
 * @param {Object} chartConfig - Plotly 차트 설정
 * @param {Object} options - 적용할 옵션들
 * @returns {Object} 옵션이 적용된 차트 설정
 */
function applyVisualizationOptions(chartConfig, options) {
    console.log('[CHART_FACTORY] 시각화 옵션 적용:', options);

    try {
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

        // Plotly 설정 옵션
        if (options.plotlyConfig) {
            chartConfig.config = { ...chartConfig.config, ...options.plotlyConfig };
            console.log('⚙️ Plotly 설정 적용');
        }

    } catch (error) {
        console.warn('⚠️ 시각화 옵션 적용 실패:', error);
        // 옵션 적용 실패는 차트 생성을 중단시키지 않음
    }

    return chartConfig;
}

/**
 * 지원되는 차트 타입 목록 반환
 * @returns {Array} 지원되는 차트 타입들
 */
export function getSupportedChartTypes() {
    return [
        // 2차원 차트
        {
            type: '2d_scatter',
            name: '2D Scatter',
            description: 'X,Y 산점도',
            dimension: 2,
            dataRequirement: ['x', 'y'],
            implemented: false // Phase 3에서 구현
        },
        {
            type: '2d_scatter_tiled',
            name: '2D Scatter Tiled',
            description: 'X,Y 산점도 (타일 형태로 표현)',
            dimension: 2,
            dataRequirement: ['x', 'y'],
            implemented: false // Phase 3에서 구현
        },
        {
            type: '2d_size',
            name: '2D Size',
            description: 'X축 값, 크기로 2차원 표현',
            dimension: 2,
            dataRequirement: ['x', 'size'],
            implemented: false
        },
        {
            type: '2d_color',
            name: '2D Color',
            description: 'X축 값, 색상으로 2차원 표현',
            dimension: 2,
            dataRequirement: ['x', 'color'],
            implemented: false
        },

        // 3차원 차트
        {
            type: '3d_scatter_color',
            name: '3D Scatter Color',
            description: 'X,Y 산점도 + 색상',
            dimension: 3,
            dataRequirement: ['x', 'y', 'color'],
            implemented: false
        },
        {
            type: '3d_scatter_size',
            name: '3D Scatter Size',
            description: 'X,Y 산점도 + 크기',
            dimension: 3,
            dataRequirement: ['x', 'y', 'size'],
            implemented: false
        },
        {
            type: '3d_size_color',
            name: '3D Size Color',
            description: 'X축 값 + 크기 + 색상',
            dimension: 3,
            dataRequirement: ['x', 'size', 'color'],
            implemented: false
        },
        {
            type: '3d_surface_scatter',
            name: '3D Surface Scatter',
            description: '3D 표면 + 산점도 (실제 3차원)',
            dimension: 3,
            dataRequirement: ['x', 'y', 'z'],
            implemented: true // 기존 구현
        },

        // 4차원 차트
        {
            type: '4d_scatter_size_color',
            name: '4D Scatter Size Color',
            description: 'X,Y 산점도 + 크기 + 색상',
            dimension: 4,
            dataRequirement: ['x', 'y', 'size', 'color'],
            implemented: false
        }
    ];
}