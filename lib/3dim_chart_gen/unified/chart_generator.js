// ============================================================================
// 3dim_chart_gen/unified/chart_generator.js - 통합 차트 생성 함수 (2D/3D/4D)
// ============================================================================

import { processDataForChart, createTooltipData } from './data_processor.js';
import { ChartWrapper, ChartWrapperEnhanced } from './chart_wrapper.js';
import { createVisualization } from '../chart_factory.js';
import { createControlPanel, createSliderContainer, connectDataFilters } from '../utils/ui_controls.js';

/**
 * 통합 차트 생성 메인 함수 (2D/3D/4D 지원)
 * @param {Array} rawData - 원시 데이터
 * @param {Object} config - 차트 설정 {type, dataMapping, scalingConfig, colorConfig, options}
 * @param {HTMLElement} containerElement - 컨테이너 엘리먼트
 * @returns {ChartWrapperEnhanced} 향상된 차트 래퍼 객체
 */
export function generateChart(rawData, config, containerElement) {
    console.log('[CHART_GENERATOR] 통합 차트 생성 시작 (Enhanced + Filtering 버전)');
    console.log('[CHART_GENERATOR] 설정:', config);

    try {
        // 1단계: 설정 검증
        console.log('[CHART_GENERATOR] 설정 검증 시작');
        validateChartConfig(rawData, config, containerElement);

        // 2단계: 데이터 처리 (차원 자동 감지 + 조건부 제한)
        console.log('[CHART_GENERATOR] 데이터 처리 시작');
        const processedResult = processDataForChart(rawData, config.dataMapping, config.type);
        const { data: chartData, metadata } = processedResult;

        console.log('[CHART_GENERATOR] 처리된 데이터:', {
            dataCount: chartData.length,
            originalCount: metadata.originalCount,
            isLimited: metadata.isLimited,
            dimensions: metadata.dim,
            chartType: config.type,
            axes: metadata.axes.map(axis => axis.name)
        });

        // 3단계: 컨테이너 구조 생성
        console.log('[CHART_GENERATOR] 컨테이너 구조 생성');
        const chartStructure = createChartContainer(containerElement, config);

        // 4단계: 데이터셋 구성 (기존 차트 시스템 호환)
        const dataset = {
            name: `${config.type.toUpperCase()} Chart`,
            axes: metadata.axes,
            visualizationTypes: [{ type: config.type }]
        };

        const vizType = {
            name: config.type,
            type: config.type
        };

        console.log('[CHART_GENERATOR] 데이터셋:', dataset);

        // 5단계: Plotly 차트 설정 생성
        console.log('[CHART_GENERATOR] Plotly 차트 설정 생성');
        const chartConfig = createVisualization(
            dataset,
            vizType,
            chartData,
            config.scalingConfig || {},
            config.colorConfig || {}
        );

        // 6단계: Plotly 차트 렌더링
        console.log('[CHART_GENERATOR] Plotly 차트 렌더링');
        const plotlyDiv = chartStructure.plotlyContainer;

        // Plotly 렌더링
        if (!window.Plotly) {
            throw new Error('Plotly.js가 로드되지 않았습니다');
        }

        // Plotly.newPlot으로 차트 생성
        window.Plotly.newPlot(
            plotlyDiv,
            chartConfig.data,
            chartConfig.layout,
            chartConfig.config
        );

        // 7단계: 향상된 차트 래퍼 생성 🔥
        console.log('[CHART_GENERATOR] ChartWrapperEnhanced 생성');
        const chartWrapper = new ChartWrapperEnhanced(
            plotlyDiv,
            containerElement,
            config,
            chartConfig
        );

        // 8단계: UI 컴포넌트 연결 및 필터링 설정 🔥
        setupUIComponents(chartStructure, chartWrapper, metadata, rawData);

        console.log('[CHART_GENERATOR] 향상된 차트 생성 완료 (필터링 포함)');

        // 제한 경고 표시
        if (metadata.isLimited) {
            console.warn(`[CHART_GENERATOR] ⚠️ ${config.type}: 성능상 처음 16개 데이터만 표시됨 (전체 ${metadata.originalCount}개)`);
            chartWrapper.emit('dataLimited', {
                displayed: metadata.recordCount,
                total: metadata.originalCount,
                reason: '3D Surface 렌더링 최적화'
            });
        }

        return chartWrapper;

    } catch (error) {
        console.error('[CHART_GENERATOR] 차트 생성 오류:', error);

        // 에러 차트 표시
        return createErrorChart(containerElement, error.message);
    }
}

/**
 * 차트 설정 검증 함수 (통합 검증)
 * @param {Array} rawData - 원시 데이터
 * @param {Object} config - 차트 설정
 * @param {HTMLElement} containerElement - 컨테이너 엘리먼트
 * @throws {Error} 검증 실패 시 오류 발생
 */
function validateChartConfig(rawData, config, containerElement) {
    console.log('[CHART_GENERATOR] === 설정 검증 시작 ===');

    // 기본 입력 검증
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

    // 데이터 매핑 검증
    const mappedFields = Object.keys(config.dataMapping);
    if (mappedFields.length < 2) {
        throw new Error('최소 2개 이상의 필드가 매핑되어야 합니다');
    }

    // 차트 타입별 요구사항 검증
    const supportedTypes = [
        '2d_scatter', '2d_scatter_tiled', '2d_size', '2d_color',
        '3d_scatter_color', '3d_scatter_size', '3d_size_color', '3d_surface_scatter',
        '4d_scatter_size_color'
    ];

    if (!supportedTypes.includes(config.type)) {
        throw new Error(`지원하지 않는 차트 타입: ${config.type}`);
    }

    // 차원별 최소 요구사항 확인
    const requiredDimensions = {
        '2d_scatter': 2,
        '2d_scatter_tiled': 2,
        '2d_size': 2,
        '2d_color': 2,
        '3d_scatter_color': 3,
        '3d_scatter_size': 3,
        '3d_size_color': 3,
        '3d_surface_scatter': 3,
        '4d_scatter_size_color': 4
    };

    const requiredDim = requiredDimensions[config.type];
    if (mappedFields.length < requiredDim) {
        throw new Error(`${config.type}는 최소 ${requiredDim}개 필드가 필요합니다 (현재: ${mappedFields.length}개)`);
    }

    console.log('[CHART_GENERATOR] === 설정 검증 완료 ===');
}

/**
 * 차트용 컨테이너 구조 생성 (2D/3D/4D 공통) - 🔥 개선된 버전
 * @param {HTMLElement} containerElement - 메인 컨테이너
 * @param {Object} config - 차트 설정
 * @returns {Object} 생성된 구조 엘리먼트들
 */
export function createChartContainer(containerElement, config) {
    console.log('[CHART_GENERATOR] 개선된 컨테이너 구조 생성');

    // 메인 래퍼 - 🔥 높이 설정 개선
    const wrapper = document.createElement('div');
    wrapper.className = 'chart-wrapper';
    wrapper.style.cssText = `
        width: 100%;
        height: 100vh;
        max-height: 800px;
        min-height: 500px;
        display: flex;
        flex-direction: column;
        position: relative;
        box-sizing: border-box;
        padding: 10px;
    `;

    // Plotly 차트 컨테이너 - 🔥 여백 개선
    const plotlyContainer = document.createElement('div');
    plotlyContainer.className = 'plotly-container';
    plotlyContainer.style.cssText = `
        flex: 1;
        width: 100%;
        min-height: 450px;
        position: relative;
        margin: 10px 0;
        overflow: hidden;
    `;

    // 컨트롤 패널 컨테이너
    const controlPanelContainer = document.createElement('div');
    controlPanelContainer.className = 'control-panel-container';
    controlPanelContainer.style.cssText = `
        margin-bottom: 15px;
        flex-shrink: 0;
    `;

    // 슬라이더 컨테이너
    const sliderContainerDiv = document.createElement('div');
    sliderContainerDiv.className = 'slider-container-wrapper';
    sliderContainerDiv.style.cssText = `
        margin-bottom: 15px;
        flex-shrink: 0;
    `;

    // 구조 조립
    wrapper.appendChild(controlPanelContainer);
    wrapper.appendChild(sliderContainerDiv);
    wrapper.appendChild(plotlyContainer);

    // 컨테이너에 추가
    containerElement.appendChild(wrapper);

    return {
        wrapper,
        plotlyContainer,
        controlPanelContainer,
        sliderContainerDiv
    };
}
/**
 * 🔥 UI 컴포넌트들 설정 및 필터링 연동 (metadata + originalData 전달)
 * @param {Object} chartStructure - 차트 구조 엘리먼트들
 * @param {ChartWrapperEnhanced} chartWrapper - 향상된 차트 래퍼
 * @param {Object} metadata - 차트 메타데이터 (필터링 필드 감지용)
 * @param {Array} rawData - 원본 데이터 (필터링용)
 */
function setupUIComponents(chartStructure, chartWrapper, metadata, rawData) {
    console.log('[CHART_GENERATOR] 향상된 UI 컴포넌트 설정 (필터링 연동)');
    console.log('[CHART_GENERATOR] 메타데이터:', metadata);
    console.log('[CHART_GENERATOR] 원본 데이터 수:', rawData?.length);

    try {
        // 1. 통합 UI 컨트롤 생성 (기존 기능)
        const controlPanel = createControlPanel(chartStructure.controlPanelContainer, chartWrapper);

        // 2. 🔥 metadata 기반 슬라이더 컨테이너 생성 (새로운 기능)
        const sliderContainer = createSliderContainer(
            chartStructure.sliderContainerDiv,
            metadata,     // 차트 메타데이터 (사용된 필드 정보)
            rawData,      // 원본 데이터 (필터링 대상 필드 감지용)
            chartWrapper  // 차트 래퍼 (필터링 적용용)
        );

        // 3. 🔥 데이터 필터 연동 설정
        const filterFunction = connectDataFilters(chartWrapper, rawData);

        if (filterFunction) {
            console.log('[CHART_GENERATOR] 데이터 필터 연동 성공');

            // chartWrapper에 필터 함수 저장 (나중에 사용할 수 있도록)
            chartWrapper._applyFilter = filterFunction;

            // 필터링 정보 저장 (디버깅용)
            chartWrapper._filteringInfo = {
                totalFields: Object.keys(rawData[0] || {}).length,
                usedFields: metadata.axes.map(axis => axis.name),
                originalDataCount: rawData.length
            };

            console.log('[CHART_GENERATOR] 필터링 정보:', chartWrapper._filteringInfo);
        }

        console.log('[CHART_GENERATOR] 향상된 UI 컨트롤 생성 완료 (metadata 기반 필터링 연동됨)');

    } catch (error) {
        console.warn('[CHART_GENERATOR] UI 컨트롤 설정 오류:', error);
        // UI 오류는 차트 생성을 중단시키지 않음

        // 최소한의 기본 UI라도 생성
        try {
            createControlPanel(chartStructure.controlPanelContainer, chartWrapper);
            console.log('[CHART_GENERATOR] 기본 컨트롤 패널만 생성됨');
        } catch (fallbackError) {
            console.error('[CHART_GENERATOR] 기본 UI 생성도 실패:', fallbackError);
        }
    }
}

/**
 * 에러 차트 생성
 * @param {HTMLElement} containerElement - 컨테이너
 * @param {string} errorMessage - 에러 메시지
 * @returns {Object} 에러 차트 래퍼 객체
 */
export function createErrorChart(containerElement, errorMessage = '차트 생성에 실패했습니다') {
    console.error('[CHART_GENERATOR] 에러 차트 생성:', errorMessage);

    // 컨테이너 정리
    containerElement.innerHTML = '';

    // 에러 표시 div 생성
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

    // 통일된 인터페이스의 더미 래퍼 반환
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
        destroy: () => {
            containerElement.innerHTML = '';
        }
    };
}

/**
 * 다중 차트 생성 (확장 기능)
 * @param {Array} configurations - 다중 설정 배열 [{rawData, config, containerElement}]
 * @returns {Array} 차트 래퍼 배열
 */
export function generateMultipleCharts(configurations) {
    console.log('[CHART_GENERATOR] 다중 차트 생성 (Enhanced + Filtering):', configurations.length, '개');

    const chartWrappers = [];

    configurations.forEach((config, index) => {
        try {
            const wrapper = generateChart(
                config.rawData,
                config.config,
                config.containerElement
            );
            chartWrappers.push(wrapper);
            console.log(`[CHART_GENERATOR] ${index + 1}번째 향상된 차트 생성 완료 (필터링 포함)`);
        } catch (error) {
            console.error(`[CHART_GENERATOR] ${index + 1}번째 차트 생성 실패:`, error);
            chartWrappers.push(null);
        }
    });

    return chartWrappers;
}