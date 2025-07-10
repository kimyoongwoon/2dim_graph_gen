// ============================================================================
// 3dim_chart_gen/charts/3dim/3d_scatter_color.js - 3D 산점도 + 색상 차트
// ============================================================================

import { createTooltipData } from '../../unified/data_processor.js';
import { createPlotlyLayout, createPlotlyConfig } from '../../utils/plotly_helpers.js';
import { applyColorScaling } from '../../utils/scaling/color_scaling.js';

/**
 * 3D Scatter Color 차트 생성 (X,Y 산점도 + 색상으로 3차원 표현)
 * @param {Array} data - 처리된 데이터 포인트들
 * @param {Object} dataset - 데이터셋 설정
 * @param {Object} colorConfig - 색상 스케일링 설정
 * @returns {Object} Plotly 차트 설정
 */
export function create3DScatterColor(data, dataset, colorConfig = {}) {
    console.log('[3D_SCATTER_COLOR] 3D 산점도 색상 차트 생성 시작');
    console.log('[3D_SCATTER_COLOR] 데이터 포인트 수:', data.length);
    console.log('[3D_SCATTER_COLOR] 축 설정:', dataset.axes);
    console.log('[3D_SCATTER_COLOR] 색상 스케일링:', colorConfig);
    
    // 축 이름 추출
    const xAxis = dataset.axes[0].name;
    const yAxis = dataset.axes[1].name;
    const colorAxis = dataset.axes[2].name;
    
    console.log('[3D_SCATTER_COLOR] 축 매핑:', { xAxis, yAxis, colorAxis });
    
    // 빈 데이터 처리
    if (!data || data.length === 0) {
        console.warn('[3D_SCATTER_COLOR] 빈 데이터로 기본 차트 생성');
        return createEmpty3DScatterColorChart(xAxis, yAxis, colorAxis);
    }
    
    // 🔥 색상 스케일링 적용
    let colorScaling;
    try {
        colorScaling = applyColorScaling(data, colorAxis, colorConfig);
        console.log('[3D_SCATTER_COLOR] 색상 스케일링 적용 완료:', {
            originalField: colorAxis,
            colorRange: `${colorScaling.colorConfig.cmin} ~ ${colorScaling.colorConfig.cmax}`,
            gradientType: colorConfig.type || 'blueRed'
        });
    } catch (error) {
        console.warn('[3D_SCATTER_COLOR] 색상 스케일링 실패, 기본 색상 사용:', error);
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
        [xAxis]: 'X축',
        [yAxis]: 'Y축',
        [colorAxis]: '색상'
    };
    
    // Plotly trace 생성 (2D scatter + 색상 인코딩)
    const trace = {
        type: 'scattergl',
        mode: 'markers',
        x: data.map(d => d[xAxis]),
        y: data.map(d => d[yAxis]),
        marker: {
            size: 10, // 색상 표현을 위해 적당한 크기
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
        name: '3D Scatter Color',
        text: data.map(d => createTooltipData(d, usedAxes)),
        hovertemplate: '%{text}<extra></extra>'
    };
    
    // Plotly 레이아웃 생성
    const layout = createPlotlyLayout(
        `${xAxis} × ${yAxis} × ${colorAxis} (색상)`,
        xAxis,
        yAxis
    );
    
    // 3D Scatter Color 전용 레이아웃 조정
    layout.xaxis = { 
        title: xAxis,
        showgrid: true,
        zeroline: false
    };
    layout.yaxis = { 
        title: yAxis,
        showgrid: true,
        zeroline: false
    };
    
    // 범례 설정
    layout.showlegend = false; // 색상바가 있으므로 범례 숨김
    
    // Plotly 설정 생성
    const config = createPlotlyConfig();
    
    const chartConfig = {
        data: [trace],
        layout: layout,
        config: config
    };
    
    console.log('[3D_SCATTER_COLOR] 3D 산점도 색상 차트 설정 생성 완료');
    console.log('[3D_SCATTER_COLOR] 색상 범위:', `${colorScaling.colorConfig.cmin} ~ ${colorScaling.colorConfig.cmax}`);
    
    return chartConfig;
}

/**
 * 빈 데이터용 기본 3D 산점도 색상 차트 생성
 * @param {string} xAxis - X축 이름
 * @param {string} yAxis - Y축 이름
 * @param {string} colorAxis - 색상 축 이름
 * @returns {Object} 빈 Plotly 차트 설정
 */
function createEmpty3DScatterColorChart(xAxis, yAxis, colorAxis) {
    return {
        data: [{
            type: 'scattergl',
            mode: 'markers',
            x: [],
            y: [],
            marker: { 
                size: 10, 
                color: 'rgba(255, 0, 0, 0.5)' 
            },
            name: 'No Data'
        }],
        layout: createPlotlyLayout(`No Data - ${xAxis} × ${yAxis} × ${colorAxis}`, xAxis, yAxis),
        config: createPlotlyConfig()
    };
}