// ============================================================================
// 2dim_chart_gen/charts/3dim/3dimchart_string.js - 경량화된 3차원 문자열 차트
// ============================================================================

/**
 * 구조화된 툴팁 생성 함수 (3차원 문자열용)
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
 * 그룹 바 차트 생성 (경량화 버전)
 * @param {Object} data - 가공된 데이터 {chartData: [{category: '값', x: 값, y: 값}, ...], metadata: [...]}
 * @param {Object} config - 차트 설정
 * @returns {Object} Chart.js 설정 객체
 */
export function createGroupedBarChart(data, config) {
    const chartData = data.chartData;
    
    if (!chartData || chartData.length === 0) {
        return createEmpty3DStringChart('Grouped Bar Chart');
    }
    
    const categories = [...new Set(chartData.map(d => d.category).filter(c => c !== undefined))];
    const xValues = [...new Set(chartData.map(d => d.x).filter(x => x !== undefined))].sort((a, b) => a - b);
    
    const datasets = categories.map((cat, i) => {
        const catData = chartData.filter(d => d.category === cat);
        const hue = (i / categories.length) * 360;
        
        return {
            label: cat,
            data: xValues.map(x => {
                const point = catData.find(d => d.x === x);
                return point ? point.y : null;
            }),
            backgroundColor: `hsla(${hue}, 70%, 50%, 0.8)`,
            borderColor: `hsl(${hue}, 70%, 50%)`,
            borderWidth: 1,
            _categoryData: catData
        };
    });
    
    return {
        type: 'bar',
        data: {
            labels: xValues,
            datasets: datasets,
            _metadata: data.metadata,
            _originalData: chartData
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
                            `카테고리: ${ctx.dataset.label}`,
                            `X: ${ctx.label}`,
                            `Y: ${ctx.parsed.y}`
                        ],
                        afterLabel: (ctx) => {
                            const category = ctx.dataset.label;
                            const xValue = ctx.label;
                            const originalData = ctx.chart.data._originalData;
                            const pointIndex = originalData.findIndex(d => d.category === category && d.x == xValue);
                            
                            if (pointIndex >= 0) {
                                return createStructuredTooltip(
                                    { chart: ctx.chart }, 
                                    pointIndex, 
                                    { category: '그룹', x: 'X축', y: 'Y축' }
                                );
                            }
                            return '';
                        }
                    }
                }
            }
        }
    };
}

/**
 * 그룹 바 크기 차트 생성 (경량화 버전)
 * @param {Object} data - 가공된 데이터 {chartData: [{category: '값', x: 값, size: 정규화값}, ...], metadata: [...]}
 * @param {Object} config - 차트 설정
 * @returns {Object} Chart.js 설정 객체
 */
export function createGroupedBarSizeChart(data, config) {
    const chartData = data.chartData;
    
    if (!chartData || chartData.length === 0) {
        return createEmpty3DStringChart('Grouped Bar Size Chart');
    }
    
    const categories = [...new Set(chartData.map(d => d.category).filter(c => c !== undefined))];
    
    return {
        type: 'bubble',
        data: {
            datasets: categories.map((cat, i) => {
                const catData = chartData.filter(d => d.category === cat);
                const hue = (i / categories.length) * 360;
                
                return {
                    label: cat,
                    data: catData.map((d, j) => {
                        const originalIndex = chartData.indexOf(d);
                        return {
                            x: d.x,
                            y: i,
                            r: d.size || 5, // 이미 정규화된 크기 값
                            category: cat,
                            _pointIndex: originalIndex
                        };
                    }),
                    backgroundColor: `hsla(${hue}, 70%, 50%, 0.6)`,
                    borderColor: `hsl(${hue}, 70%, 50%)`
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
                    type: 'category',
                    labels: categories,
                    title: { display: true, text: '카테고리' }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: (ctx) => [
                            `카테고리: ${ctx.raw.category}`,
                            `X: ${ctx.parsed.x}`,
                            `크기: ${ctx.raw.r}`
                        ],
                        afterLabel: (ctx) => createStructuredTooltip(ctx, ctx.raw._pointIndex, { 
                            category: '그룹', 
                            x: 'X축', 
                            size: '크기' 
                        })
                    }
                }
            }
        }
    };
}

/**
 * 그룹 바 색상 차트 생성 (경량화 버전)
 * @param {Object} data - 가공된 데이터 {chartData: [{category: '값', x: 값, color: 정규화값}, ...], metadata: [...]}
 * @param {Object} config - 차트 설정
 * @returns {Object} Chart.js 설정 객체
 */
export function createGroupedBarColorChart(data, config) {
    const chartData = data.chartData;
    
    if (!chartData || chartData.length === 0) {
        return createEmpty3DStringChart('Grouped Bar Color Chart');
    }
    
    const categories = [...new Set(chartData.map(d => d.category).filter(c => c !== undefined))];
    
    return {
        type: 'scatter',
        data: {
            datasets: categories.map((cat, i) => {
                const catData = chartData.filter(d => d.category === cat);
                
                return {
                    label: cat,
                    data: catData.map(d => {
                        const originalIndex = chartData.indexOf(d);
                        return {
                            x: d.x,
                            y: i,
                            color: d.color || 0, // 이미 정규화된 색상 값
                            category: cat,
                            _pointIndex: originalIndex
                        };
                    }),
                    backgroundColor: catData.map(d => blueToRedGradient(d.color || 0)),
                    borderColor: 'rgba(0, 0, 0, 0.2)',
                    pointRadius: 8
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
                    type: 'category',
                    labels: categories,
                    title: { display: true, text: '카테고리' }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: (ctx) => [
                            `카테고리: ${ctx.raw.category}`,
                            `X: ${ctx.parsed.x}`,
                            `색상: ${ctx.raw.color}`
                        ],
                        afterLabel: (ctx) => createStructuredTooltip(ctx, ctx.raw._pointIndex, { 
                            category: '그룹', 
                            x: 'X축', 
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
 * 빈 3D 문자열 차트 생성
 */
function createEmpty3DStringChart(title) {
    return {
        type: 'bar',
        data: {
            labels: ['데이터 없음'],
            datasets: [{
                label: '데이터 없음',
                data: [0],
                backgroundColor: 'rgba(200, 200, 200, 0.3)',
                borderColor: 'rgba(200, 200, 200, 0.6)'
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
                y: { beginAtZero: true }
            }
        }
    };
}