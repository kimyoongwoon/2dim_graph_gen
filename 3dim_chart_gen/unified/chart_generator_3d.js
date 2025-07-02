// ============================================================================
// 3dim_chart_gen/unified/chart_generator_3d.js - 메인 3D 차트 생성 함수
// ============================================================================

import { processDataForChart3D, validate3DData } from './data_processor_3d.js';
import { ChartWrapper3D } from './chart_wrapper_3d.js';
import { createVisualization3D } from '../chart_factory_3d.js';
import { createControlPanel } from '../components/control_panel.js';
import { createSliderContainer } from '../components/slider_container.js';

/**
 * 3D 차트 생성 메인 함수 (2D generateChart와 동일한 인터페이스)
 * @param {Array} rawData - 원시 데이터
 * @param {Object} config3D - 3D 차트 설정 {type, dataMapping, options}
 * @param {HTMLElement} containerElement - 컨테이너 엘리먼트
 * @returns {ChartWrapper3D} 3D 차트 래퍼 객체
 */
export function generateChart3D(rawData, config3D, containerElement) {
    console.log('[CHART_GENERATOR_3D] 3D 차트 생성 시작');
    console.log('[CHART_GENERATOR_3D] 설정:', config3D);

    try {
        // 입력 검증
        if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
            throw new Error('유효한 데이터가 없습니다');
        }

        if (!config3D || !config3D.type || !config3D.dataMapping) {
            throw new Error('3D 차트 설정이 올바르지 않습니다');
        }

        if (!containerElement) {
            throw new Error('컨테이너 엘리먼트가 필요합니다');
        }

        // 3D 전용 검증
        if (!config3D.dataMapping.x || !config3D.dataMapping.y || !config3D.dataMapping.z) {
            throw new Error('3D 차트는 x, y, z 축이 모두 필요합니다');
        }

        // 1단계: 데이터 처리 (16개 제한 포함)
        console.log('[CHART_GENERATOR_3D] 3D 데이터 처리 시작');
        const processedResult = processDataForChart3D(rawData, config3D.dataMapping);
        const { data: chartData, metadata } = processedResult;

        console.log('[CHART_GENERATOR_3D] 처리된 데이터:', {
            dataCount: chartData.length,
            originalCount: metadata.originalCount,
            isLimited: metadata.isLimited,
            metadata: metadata
        });

        // 2단계: 3D 데이터 유효성 검사
        const validationResult = validate3DData(chartData, config3D.dataMapping);
        if (!validationResult.isValid) {
            throw new Error(`3D 데이터 검증 오류: ${validationResult.errors.join(', ')}`);
        }

        // 경고가 있으면 표시
        if (validationResult.warnings && validationResult.warnings.length > 0) {
            console.warn('[CHART_GENERATOR_3D] 검증 경고:', validationResult.warnings);
        }

        // 3단계: 컨테이너 구조 생성
        console.log('[CHART_GENERATOR_3D] 컨테이너 구조 생성');
        const chartStructure = createChartContainer(containerElement, config3D);

        // 4단계: 데이터셋 구성 (기존 차트 시스템 호환)
        const dataset = {
            name: `3D ${config3D.type} Chart`,
            axes: metadata.axes,
            visualizationTypes: [{ type: config3D.type }]
        };

        const vizType = {
            name: config3D.type,
            type: config3D.type
        };

        console.log('[CHART_GENERATOR_3D] 데이터셋:', dataset);

        // 5단계: Plotly 차트 설정 생성
        console.log('[CHART_GENERATOR_3D] Plotly 차트 설정 생성');
        const chartConfig = createVisualization3D(
            dataset,
            vizType,
            chartData,
            config3D.options || {}
        );

        // 6단계: Plotly 차트 렌더링
        console.log('[CHART_GENERATOR_3D] Plotly 차트 렌더링');
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

        // 7단계: 3D 차트 래퍼 생성
        const chartWrapper = new ChartWrapper3D(
            plotlyDiv,
            containerElement,
            config3D,
            chartConfig
        );

        // 8단계: UI 컴포넌트 연결 (기능은 나중에)
        setupUIComponents(chartStructure, chartWrapper, metadata);

        console.log('[CHART_GENERATOR_3D] 3D 차트 생성 완료');
        
        // 제한 경고 표시
        if (metadata.isLimited) {
            console.warn(`[CHART_GENERATOR_3D] ⚠️ 성능상 처음 16개 데이터만 표시됨 (전체 ${metadata.originalCount}개)`);
            chartWrapper.emit('dataLimited', {
                displayed: metadata.recordCount,
                total: metadata.originalCount
            });
        }

        return chartWrapper;

    } catch (error) {
        console.error('[CHART_GENERATOR_3D] 3D 차트 생성 오류:', error);

        // 에러 차트 표시
        return createErrorChart3D(containerElement, error.message);
    }
}

/**
 * 3D 차트용 컨테이너 구조 생성
 * @param {HTMLElement} containerElement - 메인 컨테이너
 * @param {Object} config3D - 3D 설정
 * @returns {Object} 생성된 구조 엘리먼트들
 */
function createChartContainer(containerElement, config3D) {
    console.log('[CHART_GENERATOR_3D] 3D 컨테이너 구조 생성');

    // 메인 래퍼
    const wrapper = document.createElement('div');
    wrapper.className = 'chart-3d-wrapper';
    wrapper.style.cssText = `
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        position: relative;
    `;

    // Plotly 차트 컨테이너
    const plotlyContainer = document.createElement('div');
    plotlyContainer.className = 'plotly-container-3d';
    plotlyContainer.style.cssText = `
        flex: 1;
        width: 100%;
        min-height: 400px;
        position: relative;
    `;

    // 컨트롤 패널 컨테이너
    const controlPanelContainer = document.createElement('div');
    controlPanelContainer.className = 'control-panel-container-3d';
    controlPanelContainer.style.cssText = `
        margin-bottom: 10px;
    `;

    // 슬라이더 컨테이너
    const sliderContainerDiv = document.createElement('div');
    sliderContainerDiv.className = 'slider-container-wrapper-3d';
    sliderContainerDiv.style.cssText = `
        margin-bottom: 10px;
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
 * UI 컴포넌트들 설정 (기능 연결은 나중에)
 * @param {Object} chartStructure - 차트 구조 엘리먼트들
 * @param {ChartWrapper3D} chartWrapper - 차트 래퍼
 * @param {Object} metadata - 메타데이터
 */
function setupUIComponents(chartStructure, chartWrapper, metadata) {
    console.log('[CHART_GENERATOR_3D] UI 컴포넌트 설정');

    try {
        // 컨트롤 패널 생성 (기능 연결 없음)
        const controlPanel = createControlPanel(chartStructure.controlPanelContainer);
        
        // 슬라이더 컨테이너 생성 (기능 연결 없음)
        const sliderContainer = createSliderContainer(chartStructure.sliderContainerDiv);

        console.log('[CHART_GENERATOR_3D] UI 컴포넌트 생성 완료 (기능 연결 예정)');

        // TODO: 나중에 이벤트 리스너 연결
        // - Show/Hide 버튼 → chartWrapper.toggleTrace()
        // - 윈도우 컨트롤 → 데이터 재처리
        // - 슬라이더 → 데이터 필터링

    } catch (error) {
        console.warn('[CHART_GENERATOR_3D] UI 컴포넌트 설정 오류:', error);
        // UI 오류는 차트 생성을 중단시키지 않음
    }
}

/**
 * 3D 에러 차트 생성
 * @param {HTMLElement} containerElement - 컨테이너
 * @param {string} errorMessage - 에러 메시지
 * @returns {Object} 에러 차트 래퍼 객체
 */
function createErrorChart3D(containerElement, errorMessage = '3D 차트 생성에 실패했습니다') {
    console.error('[CHART_GENERATOR_3D] 3D 에러 차트 생성:', errorMessage);

    // 컨테이너 정리
    containerElement.innerHTML = '';

    // 에러 표시 div 생성
    const errorDiv = document.createElement('div');
    errorDiv.className = 'chart-3d-error';
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
            <div style="font-size: 16px; margin-bottom: 10px;">3D 차트 오류</div>
            <div style="font-size: 14px; color: #666;">${errorMessage}</div>
        </div>
    `;

    containerElement.appendChild(errorDiv);

    // 2D와 동일한 인터페이스의 더미 래퍼 반환
    return {
        plotlyDiv: null,
        container: containerElement,
        on: () => {},
        off: () => {},
        emit: () => {},
        updateData: () => {},
        resize: () => {},
        getConfig: () => ({}),
        getData: () => null,
        toggleTrace: () => {},
        adjustOpacity: () => {},
        setCameraPosition: () => {},
        destroy: () => {
            containerElement.innerHTML = '';
        }
    };
}

/**
 * 다중 3D 차트 생성 (확장 기능)
 * @param {Array} configurations - 다중 설정 배열 [{rawData, config3D, containerElement}]
 * @returns {Array} 3D 차트 래퍼 배열
 */
export function generateMultiple3DCharts(configurations) {
    console.log('[CHART_GENERATOR_3D] 다중 3D 차트 생성:', configurations.length, '개');

    const chartWrappers = [];

    configurations.forEach((config, index) => {
        try {
            const wrapper = generateChart3D(
                config.rawData, 
                config.config3D, 
                config.containerElement
            );
            chartWrappers.push(wrapper);
            console.log(`[CHART_GENERATOR_3D] ${index + 1}번째 3D 차트 생성 완료`);
        } catch (error) {
            console.error(`[CHART_GENERATOR_3D] ${index + 1}번째 3D 차트 생성 실패:`, error);
            chartWrappers.push(null);
        }
    });

    return chartWrappers;
}