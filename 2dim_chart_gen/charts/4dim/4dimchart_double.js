// ============================================================================
// 2dim_chart_gen/charts/4dim/4dimchart_double.js - 경량화된 4차원 수치형 차트
// ============================================================================

/**
 * 구조화된 툴팁 생성 함수 (4차원용)
 */
function createStructuredTooltip(ctx, usedAxes = {}) {
    const pointIndex = ctx.raw._pointIndex;
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
 * 산점도+크기+색상 차트 생성 (경량화 버전)
 * @param {Object} data - 가공된 데이터 {chartData: [{x: 값, y: 값, size: 정규화값, color: 정규화값}, ...], metadata: [...]}
 * @param {Object} config - 차트 설정
 * @returns {Object} Chart.js 설정 객체
 */
export function createScatterSizeColorChart(data, config) {
    const chartData = data.chartData;
    
    // 빈 데이터 체크
    if (!chartData || chartData.length === 0) {
        return createEmpty4DChart('Scatter Size Color Chart');
    }
    
    return {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'X vs Y (크기+색상 인코딩)',
                data: chartData.map((d, i) => ({
                    x: d.x,
                    y: d.y,
                    size: d.size,     // 이미 정규화된 크기 값
                    color: d.color,   // 이미 정규화된 색상 값
                    _pointIndex: i
                })),
                backgroundColor: (ctx) => {
                    // 안전성 체크
                    if (!ctx.raw || ctx.raw.color === undefined) {
                        return 'rgba(54, 162, 235, 0.6)'; // 기본 색상
                    }
                    return blueToRedGradient(ctx.raw.color);
                },
                borderColor: 'rgba(0, 0, 0, 0.2)',
                pointRadius: (ctx) => {
                    // 안전성 체크
                    if (!ctx.raw || ctx.raw.size === undefined) {
                        return 5; // 기본 크기
                    }
                    return ctx.raw.size;
                }
            }],
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
                            `X: ${ctx.parsed.x}`,
                            `Y: ${ctx.parsed.y}`,
                            `크기: ${ctx.raw.size}`,
                            `색상: ${ctx.raw.color}`
                        ],
                        afterLabel: (ctx) => createStructuredTooltip(ctx, { 
                            x: 'X축', 
                            y: 'Y축', 
                            size: '크기', 
                            color: '색상' 
                        })
                    }
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
    
    return `rgb(${r}, ${g}, ${b})`;
}

/**
 * 빈 4D 차트 생성
 */
function createEmpty4DChart(title) {
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