// ============================================================================
// 2dim_chart_gen/charts/2dim/2dimchart_string.js - 경량화된 2차원 문자열 차트
// ============================================================================

/**
 * 구조화된 툴팁 생성 함수 (2차원 문자열용)
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
 * 바 차트 생성 (경량화 버전)
 * @param {Object} data - 가공된 데이터 {chartData: [{category: '값', value: 값}, ...], metadata: [...]}
 * @param {Object} config - 차트 설정
 * @returns {Object} Chart.js 설정 객체
 */
export function createBarChart(data, config) {
    const chartData = data.chartData;
    
    if (!chartData || chartData.length === 0) {
        return createEmptyBarChart('Bar Chart');
    }
    
    // 카테고리별 평균값 계산
    const categories = [...new Set(chartData.map(d => d.category).filter(c => c !== undefined))];
    const categoryStats = {};
    const categoryIndices = {};
    
    categories.forEach(cat => {
        const catData = chartData.filter((d, i) => d.category === cat);
        const values = catData.map(d => d.value).filter(v => v !== undefined);
        
        categoryStats[cat] = {
            average: values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0,
            count: catData.length
        };
        
        // 해당 카테고리의 첫 번째 항목 인덱스 저장 (툴팁용)
        categoryIndices[cat] = chartData.findIndex(d => d.category === cat);
    });
    
    return {
        type: 'bar',
        data: {
            labels: categories,
            datasets: [{
                label: '평균값',
                data: categories.map(cat => categoryStats[cat].average),
                backgroundColor: 'rgba(75, 192, 192, 0.8)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }],
            _metadata: data.metadata,
            _categoryStats: categoryStats,
            _categoryIndices: categoryIndices
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: { display: true, text: '카테고리' }
                },
                y: {
                    beginAtZero: true,
                    title: { display: true, text: '평균값' }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: (ctx) => `평균값: ${ctx.parsed.y.toFixed(3)}`,
                        afterLabel: (ctx) => {
                            const cat = categories[ctx.dataIndex];
                            const stats = ctx.chart.data._categoryStats[cat];
                            const firstIndex = ctx.chart.data._categoryIndices[cat];
                            
                            let result = `\n${stats.count}개 데이터의 평균`;
                            
                            if (firstIndex >= 0 && ctx.chart.data._metadata) {
                                result += createStructuredTooltip(
                                    { chart: ctx.chart }, 
                                    firstIndex, 
                                    { category: '카테고리', value: '값' }
                                );
                            }
                            
                            return result;
                        }
                    }
                }
            }
        }
    };
}

/**
 * 바 크기 차트 생성 (경량화 버전)
 * @param {Object} data - 가공된 데이터 {chartData: [{category: '값', size: 정규화된값}, ...], metadata: [...]}
 * @param {Object} config - 차트 설정
 * @returns {Object} Chart.js 설정 객체
 */
export function createBarSizeChart(data, config) {
    const chartData = data.chartData;
    
    if (!chartData || chartData.length === 0) {
        return createEmptyBarChart('Bar Size Chart');
    }
    
    const categories = [...new Set(chartData.map(d => d.category).filter(c => c !== undefined))];
    
    return {
        type: 'bubble',
        data: {
            datasets: [{
                label: '카테고리 (크기 인코딩)',
                data: chartData.map((d, i) => ({
                    x: categories.indexOf(d.category),
                    y: 0,
                    r: d.size || 5, // 이미 정규화된 크기 값
                    category: d.category,
                    _pointIndex: i
                })),
                backgroundColor: 'rgba(255, 99, 132, 0.6)',
                borderColor: 'rgba(255, 99, 132, 1)'
            }],
            _metadata: data.metadata
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'category',
                    labels: categories,
                    title: { display: true, text: '카테고리' }
                },
                y: {
                    display: false,
                    min: -1,
                    max: 1
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: (ctx) => [
                            `카테고리: ${ctx.raw.category}`,
                            `크기: ${ctx.raw.r}`
                        ],
                        afterLabel: (ctx) => createStructuredTooltip(ctx, ctx.raw._pointIndex, { 
                            category: '카테고리', 
                            size: '크기' 
                        })
                    }
                }
            }
        }
    };
}

/**
 * 바 색상 차트 생성 (경량화 버전)
 * @param {Object} data - 가공된 데이터 {chartData: [{category: '값', color: 정규화된값}, ...], metadata: [...]}
 * @param {Object} config - 차트 설정
 * @returns {Object} Chart.js 설정 객체
 */
export function createBarColorChart(data, config) {
    const chartData = data.chartData;
    
    if (!chartData || chartData.length === 0) {
        return createEmptyBarChart('Bar Color Chart');
    }
    
    const categories = [...new Set(chartData.map(d => d.category).filter(c => c !== undefined))];
    
    return {
        type: 'scatter',
        data: {
            datasets: chartData.map((d, i) => ({
                label: d.category,
                data: [{
                    x: categories.indexOf(d.category),
                    y: 0,
                    _pointIndex: i
                }],
                backgroundColor: blueToRedGradient(d.color || 0), // 이미 정규화된 색상 값
                pointRadius: 8,
                showLine: false
            })),
            _metadata: data.metadata
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'category',
                    labels: categories,
                    title: { display: true, text: '카테고리' }
                },
                y: {
                    display: false,
                    min: -0.5,
                    max: 0.5
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (ctx) => [
                            `카테고리: ${ctx.dataset.label}`,
                            `색상값: ${chartData[ctx.raw._pointIndex]?.color || 0}`
                        ],
                        afterLabel: (ctx) => createStructuredTooltip(ctx, ctx.raw._pointIndex, { 
                            category: '카테고리', 
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
 * 빈 바 차트 생성
 */
function createEmptyBarChart(title) {
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