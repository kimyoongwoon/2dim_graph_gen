// ============================================================================
// 2dim_chart_gen/charts/2dim/2dimchart_double.js - 경량화된 2차원 수치형 차트
// ============================================================================

/**
 * 구조화된 툴팁 생성 함수 (2차원용)
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
    
    // 사용된 축 우선 표시
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
    
    const result = [
        '\n📊 추가 정보:',
        ...usedFields,
        ...(otherFields.length > 0 ? ['--- 기타 필드 ---', ...otherFields] : [])
    ].join('\n');
    
    return result;
}

/**
 * 크기 인코딩 차트 생성 (경량화 버전)
 * @param {Object} data - 가공된 데이터 {chartData: [{x: 값, size: 정규화된값}, ...], metadata: [...]}
 * @param {Object} config - 차트 설정
 * @returns {Object} Chart.js 설정 객체
 */
export function createSizeChart(data, config) {
    const chartData = data.chartData;
    
    // 빈 데이터 체크
    if (!chartData || chartData.length === 0) {
        return createEmpty2DChart('Size Chart');
    }

    return {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'X (크기 인코딩)',
                data: chartData.map((d, i) => ({
                    x: d.x,
                    y: 0,
                    size: d.size, // 이미 정규화된 값 (예: 3~18 범위)
                    _pointIndex: i
                })),
                backgroundColor: 'rgba(255, 99, 132, 0.6)',
                borderColor: 'rgba(255, 99, 132, 1)',
                pointRadius: (ctx) => {
                    // 이미 정규화된 크기 값 직접 사용
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
                            `크기: ${ctx.raw.size}`
                        ],
                        afterLabel: (ctx) => createStructuredTooltip(ctx, { x: 'X축', size: '크기' })
                    }
                }
            }
        }
    };
}

/**
 * 색상 인코딩 차트 생성 (경량화 버전)
 * @param {Object} data - 가공된 데이터 {chartData: [{x: 값, color: 정규화된값}, ...], metadata: [...]}
 * @param {Object} config - 차트 설정
 * @returns {Object} Chart.js 설정 객체
 */
export function createColorChart(data, config) {
    const chartData = data.chartData;
    
    // 빈 데이터 체크
    if (!chartData || chartData.length === 0) {
        return createEmpty2DChart('Color Chart');
    }

    return {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'X (색상 인코딩)',
                data: chartData.map((d, i) => ({
                    x: d.x,
                    y: 0,
                    color: d.color, // 이미 정규화된 값 (0~1 범위)
                    _pointIndex: i
                })),
                backgroundColor: (ctx) => {
                    // 이미 정규화된 색상 값으로 그라디언트 생성
                    const normalizedValue = ctx.raw.color || 0;
                    return blueToRedGradient(normalizedValue);
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
                            `색상: ${ctx.raw.color}`
                        ],
                        afterLabel: (ctx) => createStructuredTooltip(ctx, { x: 'X축', color: '색상' })
                    }
                }
            }
        }
    };
}

/**
 * 기본 산점도 차트 생성 (경량화 버전)
 * @param {Object} data - 가공된 데이터 {chartData: [{x: 값, y: 값}, ...], metadata: [...]}
 * @param {Object} config - 차트 설정
 * @returns {Object} Chart.js 설정 객체
 */
export function createScatterChart(data, config) {
    const chartData = data.chartData;
    
    // 빈 데이터 체크
    if (!chartData || chartData.length === 0) {
        return createEmpty2DChart('Scatter Chart');
    }

    return {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'X vs Y',
                data: chartData.map((d, i) => ({
                    x: d.x,
                    y: d.y,
                    _pointIndex: i
                })),
                backgroundColor: 'rgba(54, 162, 235, 0.6)',
                borderColor: 'rgba(54, 162, 235, 1)',
                pointRadius: 5
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
                            `Y: ${ctx.parsed.y}`
                        ],
                        afterLabel: (ctx) => createStructuredTooltip(ctx, { x: 'X축', y: 'Y축' })
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
    // 0~1 값을 파랑→빨강 그라디언트로 변환
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
 * 빈 2D 차트 생성
 */
function createEmpty2DChart(title) {
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