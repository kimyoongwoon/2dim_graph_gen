// ============================================================================
// 2dim_chart_gen/charts/4dim/4dimchart_string.js - 경량화된 4차원 문자열 차트
// ============================================================================

/**
 * 구조화된 툴팁 생성 함수 (4차원 문자열용)
 */
function createStructuredTooltip(ctx, pointIndex, usedAxes = {}) {
    const metadata = ctx.chart?.data?._metadata?.[pointIndex];
    if (!metadata || typeof metadata !== 'object') {
        return '';
    }
    
    const entries = Object.entries(metadata);
    const usedFields = [];
    const otherFields = [];
    
    entries.forEach(([key, value]) => {
        if (usedAxes[key]) {
            usedFields.push(`${key}: ${value} ⭐ (${usedAxes[key]})`);
        } else {
            otherFields.push(`${key}: ${value}`);
        }
    });
    
    if (usedFields.length === 0 && otherFields.length === 0) {
        return '';
    }
    
    return [
        '\n📊 추가 정보:',
        ...usedFields,
        ...(otherFields.length > 0 ? ['--- 기타 필드 ---', ...otherFields] : [])
    ].join('\n');
}

/**
 * 그룹 산점도+크기+색상 차트 생성 (경량화 버전)
 * @param {Object} data - 가공된 데이터 {chartData: [{category: '값', x: 값, y: 값, size: 정규화값, color: 정규화값}, ...], metadata: [...]}
 * @param {Object} config - 차트 설정
 * @returns {Object} Chart.js 설정 객체
 */
export function createGroupedScatterSizeColorChart(data, config) {
    const chartData = data.chartData;
    
    // 빈 데이터 체크
    if (!chartData || chartData.length === 0) {
        return createEmpty4DStringChart('Grouped Scatter Size Color Chart');
    }
    
    // 카테고리 추출
    const categories = [...new Set(chartData.map(d => d.category).filter(c => c !== undefined))];
    
    if (categories.length === 0) {
        return createEmpty4DStringChart('Grouped Scatter Size Color Chart - 카테고리 없음');
    }
    
    return {
        type: 'scatter',
        data: {
            datasets: categories.map((cat, i) => {
                const catData = chartData.filter(d => d.category === cat);
                const hue = (i / categories.length) * 360;
                
                return {
                    label: cat,
                    data: catData.map(d => {
                        const originalIndex = chartData.indexOf(d);
                        return {
                            x: d.x,
                            y: d.y,
                            size: d.size || 5,     // 이미 정규화된 크기 값
                            color: d.color || 0,   // 이미 정규화된 색상 값
                            category: cat,
                            _pointIndex: originalIndex
                        };
                    }),
                    backgroundColor: catData.map(d => {
                        // 카테고리별 색상과 데이터별 색상을 혼합
                        const dataColor = blueToRedGradient(d.color || 0);
                        return dataColor;
                    }),
                    borderColor: `hsl(${hue}, 70%, 40%)`,
                    borderWidth: 1,
                    pointRadius: catData.map(d => d.size || 5) // 이미 정규화된 크기
                };
            }),
            _metadata: data.metadata
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: { display: true, text: 'X 값' }
                },
                y: {
                    title: { display: true, text: 'Y 값' }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: (ctx) => [
                            `카테고리: ${ctx.raw.category}`,
                            `X: ${ctx.parsed.x}`,
                            `Y: ${ctx.parsed.y}`,
                            `크기: ${ctx.raw.size}`,
                            `색상: ${ctx.raw.color}`
                        ],
                        afterLabel: (ctx) => createStructuredTooltip(ctx, ctx.raw._pointIndex, { 
                            category: '그룹', 
                            x: 'X축', 
                            y: 'Y축', 
                            size: '크기', 
                            color: '색상' 
                        })
                    }
                },
                legend: {
                    display: true,
                    position: 'top'
                }
            }
        }
    };
}

/**
 * 파랑→빨강 그라디언트 생성 (내장 함수)
 */
function blueToRedGradient(normalizedValue) {
    // 입력값 정규화 (안전성 체크)
    const value = Math.max(0, Math.min(1, normalizedValue || 0));
    
    const darkBlue = { r: 0, g: 0, b: 139 };      // #00008B
    const lightBlue = { r: 173, g: 216, b: 230 }; // #ADD8E6
    const lightRed = { r: 255, g: 182, b: 193 };  // #FFB6C1
    const strongRed = { r: 220, g: 20, b: 60 };   // #DC143C
    
    let r, g, b;
    
    if (value <= 0.33) {
        // 진한 파랑 → 연한 파랑
        const t = value / 0.33;
        r = Math.round(darkBlue.r + (lightBlue.r - darkBlue.r) * t);
        g = Math.round(darkBlue.g + (lightBlue.g - darkBlue.g) * t);
        b = Math.round(darkBlue.b + (lightBlue.b - darkBlue.b) * t);
    } else if (value <= 0.67) {
        // 연한 파랑 → 연한 빨강
        const t = (value - 0.33) / 0.34;
        r = Math.round(lightBlue.r + (lightRed.r - lightBlue.r) * t);
        g = Math.round(lightBlue.g + (lightRed.g - lightBlue.g) * t);
        b = Math.round(lightBlue.b + (lightRed.b - lightBlue.b) * t);
    } else {
        // 연한 빨강 → 진한 빨강
        const t = (value - 0.67) / 0.33;
        r = Math.round(lightRed.r + (strongRed.r - lightRed.r) * t);
        g = Math.round(lightRed.g + (strongRed.g - lightRed.g) * t);
        b = Math.round(lightRed.b + (strongRed.b - lightRed.b) * t);
    }
    
    return `rgba(${r}, ${g}, ${b}, 0.7)`; // 약간의 투명도 추가
}

/**
 * 빈 4D 문자열 차트 생성
 */
function createEmpty4DStringChart(title) {
    return {
        type: 'scatter',
        data: {
            datasets: [{
                label: '데이터 없음',
                data: [],
                backgroundColor: 'rgba(200, 200, 200, 0.3)',
                borderColor: 'rgba(200, 200, 200, 0.6)',
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: title
                }
            },
            scales: {
                x: { title: { display: true, text: 'X' } },
                y: { title: { display: true, text: 'Y' } }
            }
        }
    };
}