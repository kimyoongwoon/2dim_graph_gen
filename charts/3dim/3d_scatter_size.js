// ============================================================================
// 3dim_chart_gen/charts/3dim/3d_scatter_size.js - 3D 산점도 + 크기 차트
// ============================================================================

import { createTooltipData } from '../../unified/data_processor.js';
import { createPlotlyLayout, createPlotlyConfig } from '../../utils/plotly_helpers.js';
import { applySizeScaling } from '../../utils/scaling/size_scaling.js';

/**
 * 3D Scatter Size 차트 생성 (X,Y 산점도 + 크기로 3차원 표현)
 * @param {Array} data - 처리된 데이터 포인트들
 * @param {Object} dataset - 데이터셋 설정
 * @param {Object} scalingConfig - 크기 스케일링 설정
 * @returns {Object} Plotly 차트 설정
 */
export function create3DScatterSize(data, dataset, scalingConfig = {}) {
    console.log('[3D_SCATTER_SIZE] 3D 산점도 크기 차트 생성 시작');
    console.log('[3D_SCATTER_SIZE] 데이터 포인트 수:', data.length);
    console.log('[3D_SCATTER_SIZE] 축 설정:', dataset.axes);
    console.log('[3D_SCATTER_SIZE] 크기 스케일링:', scalingConfig);
    
    // 축 이름 추출
    const xAxis = dataset.axes[0].name;
    const yAxis = dataset.axes[1].name;
    const sizeAxis = dataset.axes[2].name;
    
    console.log('[3D_SCATTER_SIZE] 축 매핑:', { xAxis, yAxis, sizeAxis });
    
    // 빈 데이터 처리
    if (!data || data.length === 0) {
        console.warn('[3D_SCATTER_SIZE] 빈 데이터로 기본 차트 생성');
        return createEmpty3DScatterSizeChart(xAxis, yAxis, sizeAxis);
    }
    
    // 🔥 크기 스케일링 적용
    let scaledSizes;
    try {
        scaledSizes = applySizeScaling(data, sizeAxis, scalingConfig);
        console.log('[3D_SCATTER_SIZE] 크기 스케일링 적용 완료:', {
            originalField: sizeAxis,
            scaledRange: `${Math.min(...scaledSizes)} ~ ${Math.max(...scaledSizes)}px`
        });
    } catch (error) {
        console.warn('[3D_SCATTER_SIZE] 크기 스케일링 실패, 기본 크기 사용:', error);
        scaledSizes = data.map(() => 8); // 기본 크기
    }
    
    // 사용된 축 정보 (툴팁용)
    const usedAxes = {
        [xAxis]: 'X축',
        [yAxis]: 'Y축',
        [sizeAxis]: '크기'
    };
    
    // Plotly trace 생성 (2D scatter + 크기 인코딩)
    const trace = {
        type: 'scatter',
        mode: 'markers',
        x: data.map(d => d[xAxis]),
        y: data.map(d => d[yAxis]),
        marker: {
            size: scaledSizes,
            color: 'rgba(54, 162, 235, 0.7)',
            line: { 
                width: 1, 
                color: 'rgba(54, 162, 235, 1)' 
            }
        },
        name: '3D Scatter Size',
        text: data.map(d => createTooltipData(d, usedAxes)),
        hovertemplate: '%{text}<extra></extra>'
    };
    
    // Plotly 레이아웃 생성
    const layout = createPlotlyLayout(
        `${xAxis} × ${yAxis} × ${sizeAxis} (크기)`,
        xAxis,
        yAxis
    );
    
    // 3D Scatter Size 전용 레이아웃 조정
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
    layout.showlegend = false; // 하나의 trace만 있으므로 범례 숨김
    
    // 크기 범례 추가 (annotation 형태)
    layout.annotations = [{
        text: `크기: ${sizeAxis}<br>범위: ${Math.min(...scaledSizes).toFixed(1)} ~ ${Math.max(...scaledSizes).toFixed(1)}px`,
        xref: 'paper',
        yref: 'paper',
        x: 1.02,
        y: 1,
        xanchor: 'left',
        yanchor: 'top',
        showarrow: false,
        font: { size: 10 },
        bgcolor: 'rgba(255, 255, 255, 0.8)',
        bordercolor: 'rgba(0, 0, 0, 0.2)',
        borderwidth: 1
    }];
    
    // Plotly 설정 생성
    const config = createPlotlyConfig();
    
    const chartConfig = {
        data: [trace],
        layout: layout,
        config: config
    };
    
    console.log('[3D_SCATTER_SIZE] 3D 산점도 크기 차트 설정 생성 완료');
    console.log('[3D_SCATTER_SIZE] 크기 범위:', `${Math.min(...scaledSizes)} ~ ${Math.max(...scaledSizes)}px`);
    
    return chartConfig;
}

/**
 * 빈 데이터용 기본 3D 산점도 크기 차트 생성
 * @param {string} xAxis - X축 이름
 * @param {string} yAxis - Y축 이름
 * @param {string} sizeAxis - 크기 축 이름
 * @returns {Object} 빈 Plotly 차트 설정
 */
function createEmpty3DScatterSizeChart(xAxis, yAxis, sizeAxis) {
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
        layout: createPlotlyLayout(`No Data - ${xAxis} × ${yAxis} × ${sizeAxis}`, xAxis, yAxis),
        config: createPlotlyConfig()
    };
}