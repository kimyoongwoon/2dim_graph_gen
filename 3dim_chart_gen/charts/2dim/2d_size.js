// ============================================================================
// 3dim_chart_gen/charts/2dim/2d_size.js - 2D 크기 차트 (X축 + 크기)
// ============================================================================

import { createTooltipData } from '../../unified/data_processor.js';
import { createPlotlyLayout, createPlotlyConfig } from '../../utils/plotly_helpers.js';
import { applySizeScaling } from '../../utils/scaling/size_scaling.js';

/**
 * 2D Size 차트 생성 (X축 값 + 크기로 2차원 표현, Y=0 고정)
 * @param {Array} data - 처리된 데이터 포인트들
 * @param {Object} dataset - 데이터셋 설정
 * @param {Object} scalingConfig - 크기 스케일링 설정
 * @returns {Object} Plotly 차트 설정
 */
export function create2DSize(data, dataset, scalingConfig = {}) {
    console.log('[2D_SIZE] 2D 크기 차트 생성 시작');
    console.log('[2D_SIZE] 데이터 포인트 수:', data.length);
    console.log('[2D_SIZE] 축 설정:', dataset.axes);
    console.log('[2D_SIZE] 크기 스케일링:', scalingConfig);
    
    // 축 이름 추출
    const xAxis = dataset.axes[0].name;
    const sizeAxis = dataset.axes[1].name;
    
    console.log('[2D_SIZE] 축 매핑:', { xAxis, sizeAxis });
    
    // 빈 데이터 처리
    if (!data || data.length === 0) {
        console.warn('[2D_SIZE] 빈 데이터로 기본 차트 생성');
        return createEmpty2DSizeChart(xAxis, sizeAxis);
    }
    
    // 🔥 크기 스케일링 적용
    let scaledSizes;
    try {
        scaledSizes = applySizeScaling(data, sizeAxis, scalingConfig);
        console.log('[2D_SIZE] 크기 스케일링 적용 완료:', {
            originalField: sizeAxis,
            scaledRange: `${Math.min(...scaledSizes)} ~ ${Math.max(...scaledSizes)}px`
        });
    } catch (error) {
        console.warn('[2D_SIZE] 크기 스케일링 실패, 기본 크기 사용:', error);
        scaledSizes = data.map(() => 8); // 기본 크기
    }
    
    // 사용된 축 정보 (툴팁용)
    const usedAxes = {
        [xAxis]: 'X축 (위치)',
        [sizeAxis]: '크기'
    };
    
    // Plotly trace 생성
    const trace = {
        type: 'scatter',
        mode: 'markers',
        x: data.map(d => d[xAxis]),
        y: data.map(() => 0), // Y축은 0으로 고정
        marker: {
            size: scaledSizes,
            color: 'rgba(255, 99, 132, 0.6)',
            line: { 
                width: 1, 
                color: 'rgba(255, 99, 132, 1)' 
            }
        },
        name: '2D Size',
        text: data.map(d => createTooltipData(d, usedAxes)),
        hovertemplate: '%{text}<extra></extra>'
    };
    
    // Plotly 레이아웃 생성
    const layout = createPlotlyLayout(
        `${xAxis} × ${sizeAxis} (크기)`,
        xAxis,
        '값' // Y축은 의미 없으므로 일반적인 이름
    );
    
    // 2D Size 전용 레이아웃 조정
    layout.xaxis = { 
        title: xAxis,
        showgrid: true,
        zeroline: false
    };
    layout.yaxis = { 
        title: '값 (크기로 표현)',
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
    
    console.log('[2D_SIZE] 2D 크기 차트 설정 생성 완료');
    console.log('[2D_SIZE] 크기 범위:', `${Math.min(...scaledSizes)} ~ ${Math.max(...scaledSizes)}px`);
    
    return chartConfig;
}

/**
 * 빈 데이터용 기본 2D 크기 차트 생성
 * @param {string} xAxis - X축 이름
 * @param {string} sizeAxis - 크기 축 이름
 * @returns {Object} 빈 Plotly 차트 설정
 */
function createEmpty2DSizeChart(xAxis, sizeAxis) {
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
        layout: createPlotlyLayout(`No Data - ${xAxis} × ${sizeAxis}`, xAxis, '값'),
        config: createPlotlyConfig()
    };
}