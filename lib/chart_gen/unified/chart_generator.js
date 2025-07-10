// ============================================================================
// 3dim_chart_gen/unified/chart_generator.js - 통합 차트 생성 함수 (중앙 크기 관리)
// ============================================================================

import { processDataForChart, createTooltipData } from './data_processor.js';
import { ChartWrapper, ChartWrapperEnhanced } from './chart_wrapper.js';
import { createVisualization } from '../chart_factory.js';
import { createControlPanel, createSliderContainer, connectDataFilters } from '../utils/ui_controls.js';
import { createAreaSelectionContainer, connectAreaSelection } from '../utils/ui_aggregate_controls.js';

/**
 * 🎛️ 패널 크기 설정 (골든 레이아웃 최적화)
 * @param {string} layoutType - 'golden' | 'standard'
 * @returns {Object} 크기 설정 객체
 */
function getPanelSizeConfig(layoutType = 'golden') {
    const configs = {
        golden: {
            // 🔥 골든 레이아웃용 최적화: px 단위 사용, 컴팩트 크기
            panel: {
                collapsedHeight: '32px',     // 접힌 상태 (vh → px)
                expandedMaxHeight: '120px',  // 펼쳐진 상태 최대 높이
                marginBottom: '2px',         // 최소 여백
                borderRadius: '3px',
                transition: 'height 0.25s ease-out' // 부드러운 높이 변화
            },
            // 컨트롤 패널
            controlPanel: {
                headerHeight: '30px',        // 작은 고정 헤더 (vh → px)
                headerPadding: '3px 6px',    // 더 컴팩트한 헤더
                contentPadding: '5px 6px',   // 더 컴팩트한 내부
                fontSize: '10px',            // 더 작은 폰트
                fontWeight: 'bold',
                borderColor: '#ddd'
            },
            // 슬라이더 패널  
            sliderPanel: {
                headerHeight: '30px',        // 작은 고정 헤더 (vh → px)
                headerPadding: '3px 6px',
                contentPadding: '5px',
                minContentHeight: '85px',    // 펼쳐졌을 때 고정 높이
                maxContentHeight: '85px',    // 펼쳐졌을 때 최대 높이
                gap: '6px',                  // 줄어든 슬라이더 간격
                fontSize: '9px',             // 더 작은 폰트
                overflow: 'auto'             // 넘치면 스크롤
            },
            // 그래프 영역 (나머지 모든 공간)
            plotlyArea: {
                flex: '1 1 0',               // 남은 공간 모두 사용, 축소 가능
                minHeight: '0',              // flex 축소 허용
                maxHeight: '100%',           // 오버플로우 방지
                padding: '4px 0'             // 최소 패딩
            }
        },
        standard: {
            // 기존 크기 유지 (하위 호환성)
            panel: {
                collapsedHeight: 'auto',
                expandedMaxHeight: 'none',
                marginBottom: '15px',
                borderRadius: '4px',
                transition: 'none'
            },
            controlPanel: {
                headerHeight: 'auto',
                headerPadding: '8px 12px',
                contentPadding: '10px',
                fontSize: '13px',
                fontWeight: 'bold',
                borderColor: '#ddd'
            },
            sliderPanel: {
                headerHeight: 'auto',
                headerPadding: '8px 12px',
                contentPadding: '10px',
                minContentHeight: '60px',
                maxContentHeight: 'none',
                gap: '15px',
                fontSize: '12px',
                overflow: 'visible'
            },
            plotlyArea: {
                flex: '1',
                minHeight: '450px',
                padding: '10px 0'
            }
        }
    };

    return configs[layoutType] || configs.standard;
}

/**
 * 통합 차트 생성 메인 함수 (중앙 크기 관리 + 골든 레이아웃 최적화)
 * @param {Array} rawData - 원시 데이터
 * @param {Object} config - 차트 설정
 * @param {HTMLElement} containerElement - 컨테이너 엘리먼트
 * @param {string} layoutType - 'golden' | 'standard' (기본: 'golden')
 * @returns {ChartWrapperEnhanced} 향상된 차트 래퍼 객체
 */
export function generateChart(rawData, config, containerElement, layoutType = 'golden') {
    console.log('[CHART_GENERATOR] 통합 차트 생성 시작 (중앙 크기 관리)');
    console.log('[CHART_GENERATOR] 레이아웃 타입:', layoutType);
    console.log('[CHART_GENERATOR] 설정:', config);

    try {
        // 1단계: 설정 검증
        validateChartConfig(rawData, config, containerElement);

        // 2단계: 데이터 처리
        const processedResult = processDataForChart(rawData, config.dataMapping, config.type);
        const { data: chartData, metadata } = processedResult;

        // 3단계: 🔥 중앙 관리된 크기 설정으로 컨테이너 구조 생성
        const chartStructure = createChartContainer(containerElement, config, layoutType);

        // 4단계: 데이터셋 구성
        const dataset = {
            name: `${config.type.toUpperCase()} Chart`,
            axes: metadata.axes,
            visualizationTypes: [{ type: config.type }]
        };

        const vizType = { name: config.type, type: config.type };

        // 5단계: Plotly 차트 설정 생성
        const chartConfig = createVisualization(
            dataset,
            vizType,
            chartData,
            config.scalingConfig || {},
            config.colorConfig || {}
        );

        // 6단계: Plotly 차트 렌더링
        const plotlyDiv = chartStructure.plotlyContainer;

        if (!window.Plotly) {
            throw new Error('Plotly.js가 로드되지 않았습니다');
        }

        window.Plotly.newPlot(
            plotlyDiv,
            chartConfig.data,
            chartConfig.layout,
            chartConfig.config
        );

        // 7단계: 향상된 차트 래퍼 생성
        const chartWrapper = new ChartWrapperEnhanced(
            plotlyDiv,
            containerElement,
            config,
            chartConfig
        );

        // 8단계: 🔥 크기 설정을 포함한 UI 컴포넌트 연결
        setupUIComponents(chartStructure, chartWrapper, metadata, rawData);

        console.log('[CHART_GENERATOR] 골든 레이아웃 최적화 차트 생성 완료');

        // 제한 경고 표시
        if (metadata.isLimited) {
            console.warn(`[CHART_GENERATOR] ⚠️ ${config.type}: 성능상 처음 16개 데이터만 표시됨`);
            chartWrapper.emit('dataLimited', {
                displayed: metadata.recordCount,
                total: metadata.originalCount,
                reason: '3D Surface 렌더링 최적화'
            });
        }

        return chartWrapper;

    } catch (error) {
        console.error('[CHART_GENERATOR] 차트 생성 오류:', error);
        return createErrorChart(containerElement, error.message);
    }
}

/**
 * 🔥 중앙 관리된 크기 설정으로 차트 컨테이너 구조 생성
 * @param {HTMLElement} containerElement - 메인 컨테이너
 * @param {Object} config - 차트 설정
 * @param {string} layoutType - 레이아웃 타입
 * @returns {Object} 생성된 구조 엘리먼트들 + 크기 설정
 */
export function createChartContainer(containerElement, config, layoutType = 'golden') {
    console.log('[CHART_GENERATOR] 중앙 관리 컨테이너 구조 생성 (집계 포함):', layoutType);

    // 🔥 중앙 크기 설정 가져오기
    const sizeConfig = getPanelSizeConfig(layoutType);

    // 메인 래퍼 - 완전 반응형 (골든 레이아웃에 맞춤) + 오버플로우 방지
    const wrapper = document.createElement('div');
    wrapper.className = 'chart-wrapper';
    wrapper.style.cssText = `
        width: 100%;
        height: 100%;
        max-height: 100%;
        display: flex;
        flex-direction: column;
        position: relative;
        box-sizing: border-box;
        padding: 0;
        margin: 0;
        overflow: hidden;
    `;

    // 🔥 컨트롤 패널 컨테이너 - 고정 크기 + 오버플로우 방지
    const controlPanelContainer = document.createElement('div');
    controlPanelContainer.className = 'control-panel-container';
    controlPanelContainer.style.cssText = `
        width: 100%;
        height: ${sizeConfig.panel.collapsedHeight};
        max-height: ${sizeConfig.panel.expandedMaxHeight};
        margin-bottom: ${sizeConfig.panel.marginBottom};
        flex-shrink: 0;
        flex-grow: 0;
        transition: ${sizeConfig.panel.transition};
        z-index: 10;
        overflow: hidden;
    `;

    // 🔥 슬라이더 컨테이너 - 고정 크기 + 오버플로우 방지
    const sliderContainerDiv = document.createElement('div');
    sliderContainerDiv.className = 'slider-container-wrapper';
    sliderContainerDiv.style.cssText = `
        width: 100%;
        height: ${sizeConfig.panel.collapsedHeight};
        max-height: ${sizeConfig.panel.expandedMaxHeight};
        margin-bottom: ${sizeConfig.panel.marginBottom};
        flex-shrink: 0;
        flex-grow: 0;
        transition: ${sizeConfig.panel.transition};
        z-index: 10;
        overflow: hidden;
    `;

    // 🔥 집계 컨테이너 - 고정 크기 + 오버플로우 방지 (새로 추가)
    const aggregationContainerDiv = document.createElement('div');
    aggregationContainerDiv.className = 'aggregation-container-wrapper';
    aggregationContainerDiv.style.cssText = `
        width: 100%;
        height: ${sizeConfig.panel.collapsedHeight};
        max-height: ${sizeConfig.panel.expandedMaxHeight};
        margin-bottom: ${sizeConfig.panel.marginBottom};
        flex-shrink: 0;
        flex-grow: 0;
        transition: ${sizeConfig.panel.transition};
        z-index: 10;
        overflow: hidden;
    `;

    // 🔥 Plotly 차트 컨테이너 - 나머지 모든 공간 사용 + 오버플로우 방지
    const plotlyContainer = document.createElement('div');
    plotlyContainer.className = 'plotly-container';
    plotlyContainer.style.cssText = `
        width: 100%;
        flex: ${sizeConfig.plotlyArea.flex};
        min-height: ${sizeConfig.plotlyArea.minHeight};
        max-height: ${sizeConfig.plotlyArea.maxHeight};
        position: relative;
        padding: ${sizeConfig.plotlyArea.padding};
        overflow: hidden;
        z-index: 1;
        box-sizing: border-box;
    `;

    // 구조 조립
    wrapper.appendChild(controlPanelContainer);
    wrapper.appendChild(sliderContainerDiv);
    wrapper.appendChild(aggregationContainerDiv); // 🔥 집계 컨테이너 추가
    wrapper.appendChild(plotlyContainer);

    // 컨테이너에 추가
    containerElement.appendChild(wrapper);

    console.log('[CHART_GENERATOR] 골든 레이아웃 최적화 구조 생성 완료 (집계 포함)');

    return {
        wrapper,
        plotlyContainer,
        controlPanelContainer,
        sliderContainerDiv,
        aggregationContainerDiv,  // 🔥 집계 컨테이너 반환
        sizeConfig,  // 🔥 크기 설정도 함께 반환
        layoutType
    };
}


/**
 * 🔥 크기 설정을 포함한 UI 컴포넌트들 설정
 * @param {Object} chartStructure - 차트 구조 + 크기 설정
 * @param {ChartWrapperEnhanced} chartWrapper - 차트 래퍼
 * @param {Object} metadata - 차트 메타데이터
 * @param {Array} rawData - 원본 데이터
 */
function setupUIComponents(chartStructure, chartWrapper, metadata, rawData) {
    console.log('[CHART_GENERATOR] 중앙 관리 크기 설정으로 UI 컴포넌트 설정');

    try {
        // 🔥 크기 설정을 UI 함수들에 전달
        const controlPanel = createControlPanel(
            chartStructure.controlPanelContainer,
            chartWrapper,
            chartStructure.sizeConfig.controlPanel,  // ← 컨트롤 패널 크기 설정
            chartStructure.sizeConfig.panel          // ← 공통 패널 크기 설정
        );

        const sliderContainer = createSliderContainer(
            chartStructure.sliderContainerDiv,
            metadata,
            rawData,
            chartWrapper,
            chartStructure.sizeConfig.sliderPanel,   // ← 슬라이더 패널 크기 설정
            chartStructure.sizeConfig.panel          // ← 공통 패널 크기 설정
        );

        const areaSelectionContainer = createAreaSelectionContainer(
            chartStructure.aggregationContainerDiv,
            metadata,
            rawData,
            chartWrapper,
            chartStructure.sizeConfig.aggregationPanel,
            chartStructure.sizeConfig.panel
        );

        // 데이터 필터 연동
        const filterFunction = connectDataFilters(chartWrapper, rawData);
        if (filterFunction) {
            chartWrapper._applyFilter = filterFunction;
            chartWrapper._filteringInfo = {
                totalFields: Object.keys(rawData[0] || {}).length,
                usedFields: metadata.axes.map(axis => axis.name),
                originalDataCount: rawData.length
            };
        }

        const areaSelectionFunction = connectAreaSelection(chartWrapper, rawData);
        if (areaSelectionFunction) {
            chartWrapper._applyAreaSelection = areaSelectionFunction;
            chartWrapper._areaSelectionInfo = {
                totalFields: Object.keys(rawData[0] || {}).length,
                usedFields: metadata.axes.map(axis => axis.name),
                availableForSelection: metadata.axes.map(axis => axis.role)
            };
        }

        console.log('[CHART_GENERATOR] 중앙 관리 UI 컴포넌트 설정 완료');

    } catch (error) {
        console.warn('[CHART_GENERATOR] UI 컨트롤 설정 오류:', error);
        // UI 오류는 차트 생성을 중단시키지 않음
    }
}

/**
 * 차트 설정 검증 함수 (기존과 동일)
 */
function validateChartConfig(rawData, config, containerElement) {
    console.log('[CHART_GENERATOR] === 설정 검증 시작 ===');

    if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
        throw new Error('유효한 데이터가 없습니다');
    }

    if (!config || typeof config !== 'object') {
        throw new Error('차트 설정이 필요합니다');
    }

    if (!config.type || typeof config.type !== 'string') {
        throw new Error('차트 타입(type)이 필요합니다');
    }

    if (!config.dataMapping || typeof config.dataMapping !== 'object') {
        throw new Error('데이터 매핑(dataMapping)이 필요합니다');
    }

    if (!containerElement) {
        throw new Error('컨테이너 엘리먼트가 필요합니다');
    }

    const mappedFields = Object.keys(config.dataMapping);
    if (mappedFields.length < 2) {
        throw new Error('최소 2개 이상의 필드가 매핑되어야 합니다');
    }

    const supportedTypes = [
        '2d_scatter', '2d_size', '2d_color',
        '3d_scatter_color', '3d_scatter_size', '3d_size_color', '3d_surface_scatter',
        '4d_scatter_size_color'
    ];

    if (!supportedTypes.includes(config.type)) {
        throw new Error(`지원하지 않는 차트 타입: ${config.type}`);
    }

    const requiredDimensions = {
        '2d_scatter': 2, '2d_size': 2, '2d_color': 2,
        '3d_scatter_color': 3, '3d_scatter_size': 3, '3d_size_color': 3, '3d_surface_scatter': 3,
        '4d_scatter_size_color': 4
    };

    const requiredDim = requiredDimensions[config.type];
    if (mappedFields.length < requiredDim) {
        throw new Error(`${config.type}는 최소 ${requiredDim}개 필드가 필요합니다 (현재: ${mappedFields.length}개)`);
    }

    console.log('[CHART_GENERATOR] === 설정 검증 완료 ===');
}

/**
 * 에러 차트 생성 (기존과 동일)
 */
export function createErrorChart(containerElement, errorMessage = '차트 생성에 실패했습니다') {
    console.error('[CHART_GENERATOR] 에러 차트 생성:', errorMessage);

    containerElement.innerHTML = '';

    const errorDiv = document.createElement('div');
    errorDiv.className = 'chart-error';
    errorDiv.style.cssText = `
        width: 100%;
        height: 100%;
        min-height: 400px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f8d7da;
        border: 1px solid #f5c6cb;
        border-radius: 4px;
        color: #721c24;
        font-weight: bold;
        text-align: center;
        padding: 20px;
    `;

    errorDiv.innerHTML = `
        <div>
            <div style="font-size: 24px; margin-bottom: 10px;">⚠️</div>
            <div style="font-size: 16px; margin-bottom: 10px;">차트 오류</div>
            <div style="font-size: 14px; color: #666;">${errorMessage}</div>
        </div>
    `;

    containerElement.appendChild(errorDiv);

    return {
        plotlyDiv: null,
        container: containerElement,
        on: () => { },
        off: () => { },
        emit: () => { },
        updateData: () => { },
        resize: () => { },
        getConfig: () => ({}),
        getData: () => null,
        getChartType: () => 'error',
        toggleTrace: () => { },
        adjustOpacity: () => { },
        setCameraPosition: () => { },
        setAxisRange: () => { },
        destroy: () => { containerElement.innerHTML = ''; }
    };
}

/**
 * 다중 차트 생성 (골든 레이아웃 최적화)
 * @param {Array} configurations - 다중 설정 배열
 * @param {string} layoutType - 레이아웃 타입
 * @returns {Array} 차트 래퍼 배열
 */
export function generateMultipleCharts(configurations, layoutType = 'golden') {
    console.log('[CHART_GENERATOR] 다중 차트 생성 (골든 레이아웃):', configurations.length, '개');

    const chartWrappers = [];

    configurations.forEach((config, index) => {
        try {
            const wrapper = generateChart(
                config.rawData,
                config.config,
                config.containerElement,
                layoutType  // ← 통일된 레이아웃 타입 적용
            );
            chartWrappers.push(wrapper);
            console.log(`[CHART_GENERATOR] ${index + 1}번째 골든 레이아웃 차트 생성 완료`);
        } catch (error) {
            console.error(`[CHART_GENERATOR] ${index + 1}번째 차트 생성 실패:`, error);
            chartWrappers.push(null);
        }
    });

    return chartWrappers;
}