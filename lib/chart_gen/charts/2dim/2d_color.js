// ============================================================================
// 3dim_chart_gen/charts/2dim/2d_color.js - 2D 색상 차트 (X축 + 색상)
// ============================================================================

import { createTooltipData } from '../../unified/data_processor.js';
import { createPlotlyLayout, createPlotlyConfig } from '../../utils/plotly_helpers.js';
import { applyColorScaling } from '../../utils/scaling/color_scaling.js';

/**
 * 2D Color 차트 생성 (X축 값 + 색상으로 2차원 표현, Y=0 고정)
 * @param {Array} data - 처리된 데이터 포인트들
 * @param {Object} dataset - 데이터셋 설정
 * @param {Object} colorConfig - 색상 스케일링 설정
 * @returns {Object} Plotly 차트 설정
 */
export function create2DColor(data, dataset, colorConfig = {}) {
    console.log('[2D_COLOR] 2D 색상 차트 생성 시작');
    console.log('[2D_COLOR] 데이터 포인트 수:', data.length);
    console.log('[2D_COLOR] 축 설정:', dataset.axes);
    console.log('[2D_COLOR] 색상 스케일링:', colorConfig);
    
    // 축 이름 추출
    const xAxis = dataset.axes[0].name;
    const colorAxis = dataset.axes[1].name;
    
    console.log('[2D_COLOR] 축 매핑:', { xAxis, colorAxis });
    
    // 빈 데이터 처리
    if (!data || data.length === 0) {
        console.warn('[2D_COLOR] 빈 데이터로 기본 차트 생성');
        return createEmpty2DColorChart(xAxis, colorAxis);
    }
    
    // 🔥 색상 스케일링 적용
    let colorScaling;
    try {
        colorScaling = applyColorScaling(data, colorAxis, colorConfig);
        console.log('[2D_COLOR] 색상 스케일링 적용 완료:', {
            originalField: colorAxis,
            colorRange: `${colorScaling.colorConfig.cmin} ~ ${colorScaling.colorConfig.cmax}`,
            gradientType: colorConfig.type || 'blueRed'
        });
    } catch (error) {
        console.warn('[2D_COLOR] 색상 스케일링 실패, 기본 색상 사용:', error);
        colorScaling = {
            normalizedColors: data.map(() => 0.5),
            colorConfig: {
                colorscale: 'Viridis',
                showscale: true,
                colorbar: { title: colorAxis }
            }
        };
    }
    
    // 사용된 축 정보 (툴팁용)
    const usedAxes = {
        [xAxis]: 'X축 (위치)',
        [colorAxis]: '색상'
    };
    
    // Plotly trace 생성
    const trace = {
        type: 'scattergl',
        mode: 'markers',
        x: data.map(d => d[xAxis]),
        y: data.map(() => 0), // Y축은 0으로 고정
        marker: {
            size: 12, // 색상 표현을 위해 기본보다 큰 마커
            color: colorScaling.normalizedColors,
            colorscale: colorScaling.colorConfig.colorscale,
            showscale: colorScaling.colorConfig.showscale,
            colorbar: colorScaling.colorConfig.colorbar,
            cmin: colorScaling.colorConfig.cmin,
            cmax: colorScaling.colorConfig.cmax,
            line: { 
                width: 1, 
                color: 'rgba(255, 255, 255, 0.8)' 
            }
        },
        name: '2D Color',
        text: data.map(d => createTooltipData(d, usedAxes)),
        hovertemplate: '%{text}<extra></extra>'
    };
    
    // Plotly 레이아웃 생성
    const layout = createPlotlyLayout(
        `${xAxis} × ${colorAxis} (색상)`,
        xAxis,
        '값' // Y축은 의미 없으므로 일반적인 이름
    );
    
    // 2D Color 전용 레이아웃 조정
    layout.xaxis = { 
        title: xAxis,
        showgrid: true,
        zeroline: false
    };
    layout.yaxis = { 
        title: '값 (색상으로 표현)',
        visible: false, // Y축 숨김 (의미 없음)
        showgrid: false,
        zeroline: true,
        range: [-1, 1] // Y=0 주변 작은 범위
    };
    
    // 범례 설정
    layout.showlegend = false; // 하나의 trace만 있으므로 범례 숨김
    
    // Plotly 설정 생성
    const config = createPlotlyConfig();
    
    const chartConfig = {
        data: [trace],
        layout: layout,
        config: config
    };
    
    console.log('[2D_COLOR] 2D 색상 차트 설정 생성 완료');
    console.log('[2D_COLOR] 색상 범위:', `${colorScaling.colorConfig.cmin} ~ ${colorScaling.colorConfig.cmax}`);
    
    return chartConfig;
}

/**
 * 빈 데이터용 기본 2D 색상 차트 생성
 * @param {string} xAxis - X축 이름
 * @param {string} colorAxis - 색상 축 이름
 * @returns {Object} 빈 Plotly 차트 설정
 */
function createEmpty2DColorChart(xAxis, colorAxis) {
    return {
        data: [{
            type: 'scattergl',
            mode: 'markers',
            x: [],
            y: [],
            marker: { 
                size: 12, 
                color: 'rgba(255, 0, 0, 0.5)' 
            },
            name: 'No Data'
        }],
        layout: createPlotlyLayout(`No Data - ${xAxis} × ${colorAxis}`, xAxis, '값'),
        config: createPlotlyConfig()
    };
}