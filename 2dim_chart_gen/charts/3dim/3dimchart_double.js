// ============================================================================
// 2dim_chart_gen/charts/3dim/3dimchart_double.js - 경량화된 3차원 수치형 차트
// ============================================================================

/**
 * 구조화된 툴팁 생성 함수 (3차원용)
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
 * 크기+색상 차트 생성 (경량화 버전)
 * @param {Object} data - 가공된 데이터 {chartData: [{x: 값, size: 정규화값, color: 정규화값}, ...], metadata: [...]}
 * @param {Object} config - 차트 설정
 * @returns {Object} Chart.js 설정 객체
 */
export function createSizeColorChart(data, config) {
    const chartData = data.chartData;
    
    if (!chartData || chartData.length === 0) {
        return createEmpty3DChart('Size Color Chart');
    }

    return {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'X (크기+색상 인코딩)',
                data: chartData.map((d, i) => ({
                    x: d.x,
                    y: 0,
                    size: d.size,     // 이미 정규화된 크기 값
                    color: d.color,   // 이미 정규화된 색상 값
                    _pointIndex: i
                })),
                backgroundColor: (ctx) => {
                    return blueToRedGradient(ctx.raw.color || 0);
                },
                borderColor: 'rgba(0, 0, 0, 0.2)',
                pointRadius: (ctx) => {
                    return ctx.raw.size || 5;
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
                    display: false,
                    min: -0.5,
                    max: 0.5
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: (ctx) => [
                            `X: ${ctx.parsed.x}`,
                            `크기: ${ctx.raw.size}`,
                            `색상: ${ctx.raw.color}`
                        ],
                        afterLabel: (ctx) => createStructuredTooltip(ctx, { 
                            x: 'X축', 
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
 * 산점도+크기 차트 생성 (경량화 버전)
 * @param {Object} data - 가공된 데이터 {chartData: [{x: 값, y: 값, size: 정규화값}, ...], metadata: [...]}
 * @param {Object} config - 차트 설정
 * @returns {Object} Chart.js 설정 객체
 */
export function createScatterSizeChart(data, config) {
    const chartData = data.chartData;
    
    if (!chartData || chartData.length === 0) {
        return createEmpty3DChart('Scatter Size Chart');
    }

    return {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'X vs Y (크기 인코딩)',
                data: chartData.map((d, i) => ({
                    x: d.x,
                    y: d.y,
                    size: d.size,     // 이미 정규화된 크기 값
                    _pointIndex: i
                })),
                backgroundColor: 'rgba(54, 162, 235, 0.6)',
                borderColor: 'rgba(54, 162, 235, 1)',
                pointRadius: (ctx) => {
                    return ctx.raw.size || 5;
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
                            `크기: ${ctx.raw.size}`
                        ],
                        afterLabel: (ctx) => createStructuredTooltip(ctx, { 
                            x: 'X축', 
                            y: 'Y축', 
                            size: '크기' 
                        })
                    }
                }
            }
        }
    };
}

/**
 * 산점도+색상 차트 생성 (경량화 버전)
 * @param {Object} data - 가공된 데이터 {chartData: [{x: 값, y: 값, color: 정규화값}, ...], metadata: [...]}
 * @param {Object} config - 차트 설정
 * @returns {Object} Chart.js 설정 객체
 */
export function createScatterColorChart(data, config) {
    const chartData = data.chartData;
    
    if (!chartData || chartData.length === 0) {
        return createEmpty3DChart('Scatter Color Chart');
    }

    return {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'X vs Y (색상 인코딩)',
                data: chartData.map((d, i) => ({
                    x: d.x,
                    y: d.y,
                    color: d.color,   // 이미 정규화된 색상 값
                    _pointIndex: i
                })),
                backgroundColor: (ctx) => {
                    return blueToRedGradient(ctx.raw.color || 0);
                },
                borderColor: 'rgba(0, 0, 0, 0.2)',
                pointRadius: 6
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
                            `색상: ${ctx.raw.color}`
                        ],
                        afterLabel: (ctx) => createStructuredTooltip(ctx, { 
                            x: 'X축', 
                            y: 'Y축', 
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
    const darkBlue = { r: 0, g: 0, b: 139 };
    const lightBlue = { r: 173, g: 216, b: 230 };
    const lightRed = { r: 255, g: 182, b: 193 };
    const strongRed = { r: 220, g: 20, b: 60 };
    
    let r, g, b;
    
    if (normalizedValue <= 0.33) {
        const t = normalizedValue / 0.33;
        r = Math.round(darkBlue.r + (lightBlue.r - darkBlue.r) * t);
        g = Math.round(darkBlue.g + (lightBlue.g - darkBlue.g) * t);
        b = Math.round(darkBlue.b + (lightBlue.b - darkBlue.b) * t);
    } else if (normalizedValue <= 0.67) {
        const t = (normalizedValue - 0.33) / 0.34;
        r = Math.round(lightBlue.r + (lightRed.r - lightBlue.r) * t);
        g = Math.round(lightBlue.g + (lightRed.g - lightBlue.g) * t);
        b = Math.round(lightBlue.b + (lightRed.b - lightBlue.b) * t);
    } else {
        const t = (normalizedValue - 0.67) / 0.33;
        r = Math.round(lightRed.r + (strongRed.r - lightRed.r) * t);
        g = Math.round(lightRed.g + (strongRed.g - lightRed.g) * t);
        b = Math.round(lightRed.b + (strongRed.b - lightRed.b) * t);
    }
    
    return `rgb(${r}, ${g}, ${b})`;
}

/**
 * 빈 3D 차트 생성
 */
function createEmpty3DChart(title) {
    return {
        type: 'scatter',
        data: {
            datasets: [{
                label: '데이터 없음',
                data: [],
                backgroundColor: 'rgba(200, 200, 200, 0.3)',
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