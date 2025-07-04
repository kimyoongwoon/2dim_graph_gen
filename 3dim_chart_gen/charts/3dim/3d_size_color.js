// ============================================================================
// 3dim_chart_gen/charts/3dim/3d_size_color.js - 3D 크기 + 색상 차트 (X축 + 이중 인코딩)
// ============================================================================

import { createTooltipData } from '../../unified/data_processor.js';
import { createPlotlyLayout, createPlotlyConfig } from '../../utils/plotly_helpers.js';
import { applySizeScaling } from '../../utils/scaling/size_scaling.js';
import { applyColorScaling } from '../../utils/scaling/color_scaling.js';

/**
 * 3D Size Color 차트 생성 (X축 값 + 크기 + 색상으로 3차원 표현, Y=0 고정)
 * @param {Array} data - 처리된 데이터 포인트들
 * @param {Object} dataset - 데이터셋 설정
 * @param {Object} scalingConfig - 크기 스케일링 설정
 * @param {Object} colorConfig - 색상 스케일링 설정
 * @returns {Object} Plotly 차트 설정
 */
export function create3DSizeColor(data, dataset, scalingConfig = {}, colorConfig = {}) {
    console.log('[3D_SIZE_COLOR] 3D 크기 색상 차트 생성 시작');
    console.log('[3D_SIZE_COLOR] 데이터 포인트 수:', data.length);
    console.log('[3D_SIZE_COLOR] 축 설정:', dataset.axes);
    console.log('[3D_SIZE_COLOR] 크기 스케일링:', scalingConfig);
    console.log('[3D_SIZE_COLOR] 색상 스케일링:', colorConfig);
    
    // 축 이름 추출
    const xAxis = dataset.axes[0].name;
    const sizeAxis = dataset.axes[1].name;
    const colorAxis = dataset.axes[2].name;
    
    console.log('[3D_SIZE_COLOR] 축 매핑:', { xAxis, sizeAxis, colorAxis });
    
    // 빈 데이터 처리
    if (!data || data.length === 0) {
        console.warn('[3D_SIZE_COLOR] 빈 데이터로 기본 차트 생성');
        return createEmpty3DSizeColorChart(xAxis, sizeAxis, colorAxis);
    }
    
    // 🔥 크기 스케일링 적용
    let scaledSizes;
    try {
        scaledSizes = applySizeScaling(data, sizeAxis, scalingConfig);
        console.log('[3D_SIZE_COLOR] 크기 스케일링 적용 완료:', {
            originalField: sizeAxis,
            scaledRange: `${Math.min(...scaledSizes)} ~ ${Math.max(...scaledSizes)}px`
        });
    } catch (error) {
        console.warn('[3D_SIZE_COLOR] 크기 스케일링 실패, 기본 크기 사용:', error);
        scaledSizes = data.map(() => 8); // 기본 크기
    }
    
    // 🔥 색상 스케일링 적용
    let colorScaling;
    try {
        colorScaling = applyColorScaling(data, colorAxis, colorConfig);
        console.log('[3D_SIZE_COLOR] 색상 스케일링 적용 완료:', {
            originalField: colorAxis,
            colorRange: `${colorScaling.colorConfig.cmin} ~ ${colorScaling.colorConfig.cmax}`,
            gradientType: colorConfig.type || 'blueRed'
        });
    } catch (error) {
        console.warn('[3D_SIZE_COLOR] 색상 스케일링 실패, 기본 색상 사용:', error);
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
        [sizeAxis]: '크기',
        [colorAxis]: '색상'
    };
    
    // Plotly trace 생성 (1D 위치 + 크기 + 색상 이중 인코딩)
    const trace = {
        type: 'scatter',
        mode: 'markers',
        x: data.map(d => d[xAxis]),
        y: data.map(() => 0), // Y축은 0으로 고정
        marker: {
            size: scaledSizes,
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
        name: '3D Size Color',
        text: data.map(d => createTooltipData(d, usedAxes)),
        hovertemplate: '%{text}<extra></extra>'
    };
    
    // Plotly 레이아웃 생성
    const layout = createPlotlyLayout(
        `${xAxis} × ${sizeAxis} (크기) × ${colorAxis} (색상)`,
        xAxis,
        '값' // Y축은 의미 없으므로 일반적인 이름
    );
    
    // 3D Size Color 전용 레이아웃 조정
    layout.xaxis = { 
        title: xAxis,
        showgrid: true,
        zeroline: false
    };
    layout.yaxis = { 
        title: '값 (크기+색상으로 표현)',
        visible: false, // Y축 숨김 (의미 없음)
        showgrid: false,
        zeroline: true,
        range: [-1, 1] // Y=0 주변 작은 범위
    };
    
    // 범례 설정
    layout.showlegend = false; // 색상바와 크기 범례가 있으므로 기본 범례 숨김
    
    // 크기 범례 추가 (annotation 형태) - 색상바와 겹치지 않게 위치 조정
    layout.annotations = [{
        text: `크기: ${sizeAxis}<br>범위: ${Math.min(...scaledSizes).toFixed(1)} ~ ${Math.max(...scaledSizes).toFixed(1)}px`,
        xref: 'paper',
        yref: 'paper',
        x: 1.15, // 색상바 오른쪽에 배치
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
    
    console.log('[3D_SIZE_COLOR] 3D 크기 색상 차트 설정 생성 완료');
    console.log('[3D_SIZE_COLOR] 크기 범위:', `${Math.min(...scaledSizes)} ~ ${Math.max(...scaledSizes)}px`);
    console.log('[3D_SIZE_COLOR] 색상 범위:', `${colorScaling.colorConfig.cmin} ~ ${colorScaling.colorConfig.cmax}`);
    
    return chartConfig;
}

/**
 * 빈 데이터용 기본 3D 크기 색상 차트 생성
 * @param {string} xAxis - X축 이름
 * @param {string} sizeAxis - 크기 축 이름
 * @param {string} colorAxis - 색상 축 이름
 * @returns {Object} 빈 Plotly 차트 설정
 */
function createEmpty3DSizeColorChart(xAxis, sizeAxis, colorAxis) {
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
        layout: createPlotlyLayout(`No Data - ${xAxis} × ${sizeAxis} × ${colorAxis}`, xAxis, '값'),
        config: createPlotlyConfig()
    };
}