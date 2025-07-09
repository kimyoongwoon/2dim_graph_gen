// ============================================================================
// 3dim_chart_gen/charts/2dim/2d_scatter.js - 2D 산점도 차트
// ============================================================================

import { createTooltipData } from '../../unified/data_processor.js';
import { createPlotlyLayout, createPlotlyConfig } from '../../utils/plotly_helpers.js';

/**
 * 2D Scatter 차트 생성 (X,Y 산점도)
 * @param {Array} data - 처리된 데이터 포인트들
 * @param {Object} dataset - 데이터셋 설정
 * @param {Object} options - 추가 옵션들
 * @returns {Object} Plotly 차트 설정
 */
export function create2DScatter(data, dataset, options = {}) {
    console.log('[2D_SCATTER] 2D 산점도 차트 생성 시작');
    console.log('[2D_SCATTER] 데이터 포인트 수:', data.length);
    console.log('[2D_SCATTER] 축 설정:', dataset.axes);
    
    // 축 이름 추출
    const xAxis = dataset.axes[0].name;
    const yAxis = dataset.axes[1].name;
    
    console.log('[2D_SCATTER] 축 매핑:', { xAxis, yAxis });
    
    // 빈 데이터 처리
    if (!data || data.length === 0) {
        console.warn('[2D_SCATTER] 빈 데이터로 기본 차트 생성');
        return createEmpty2DChart(xAxis, yAxis);
    }
    
    // 사용된 축 정보 (툴팁용)
    const usedAxes = {
        [xAxis]: 'X축',
        [yAxis]: 'Y축'
    };
    
    // Plotly trace 생성
    const trace = {
        type: 'scatter',
        mode: 'markers',
        x: data.map(d => d[xAxis]),
        y: data.map(d => d[yAxis]),
        marker: {
            size: 8,
            color: 'rgba(99, 110, 250, 0.7)',
            line: { 
                width: 1, 
                color: 'rgba(99, 110, 250, 1)' 
            }
        },
        name: '2D Scatter',
        text: data.map(d => createTooltipData(d, usedAxes)),
        hovertemplate: '%{text}<extra></extra>'
    };
    
    // Plotly 레이아웃 생성
    const layout = createPlotlyLayout(
        `${xAxis} × ${yAxis}`,
        xAxis,
        yAxis
    );
    
    // 2D 전용 레이아웃 조정
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
    
    // Plotly 설정 생성
    const config = createPlotlyConfig();
    
    const chartConfig = {
        data: [trace],
        layout: layout,
        config: config
    };
    
    console.log('[2D_SCATTER] 2D 산점도 차트 설정 생성 완료');
    console.log('[2D_SCATTER] 데이터 포인트:', data.length, '개');
    
    return chartConfig;
}

/**
 * 빈 데이터용 기본 2D 차트 생성
 * @param {string} xAxis - X축 이름
 * @param {string} yAxis - Y축 이름
 * @returns {Object} 빈 Plotly 차트 설정
 */
function createEmpty2DChart(xAxis, yAxis) {
    return {
        data: [{
            type: 'scatter',
            mode: 'markers',
            x: [],
            y: [],
            marker: { 
                size: 8, 
                color: 'rgba(255, 0, 0, 0.5)' 
            },
            name: 'No Data'
        }],
        layout: createPlotlyLayout('No Data Available', xAxis, yAxis),
        config: createPlotlyConfig()
    };
}