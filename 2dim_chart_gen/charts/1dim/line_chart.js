// ============================================================================
// 2dim_chart_gen/charts/1dim/line_chart.js - 경량화된 1차원 차트
// ============================================================================

/**
 * 구조화된 툴팁 생성 함수
 */
function createStructuredTooltip(ctx, pointIndex) {
    // metadata가 있으면 사용, 없으면 chartData만 표시
    const metadata = ctx.chart?.data?._metadata?.[pointIndex];
    if (!metadata) {
        return '';
    }
    
    const entries = Object.entries(metadata);
    if (entries.length === 0) {
        return '';
    }
    
    const result = [
        '\n📊 추가 정보:',
        ...entries.map(([key, value]) => `${key}: ${value}`)
    ].join('\n');
    
    return result;
}

/**
 * 1차원 라인 차트 생성 (경량화 버전)
 * @param {Object} data - 가공된 데이터 {chartData: [{x: 값}, ...], metadata: [...]}
 * @param {Object} config - 차트 설정 {type: 'line1d', style: {...}}
 * @returns {Object} Chart.js 설정 객체
 */
export function create1DLineChart(data, config) {
    const chartData = data.chartData;
    
    // 데이터 검증
    if (!chartData || chartData.length === 0) {
        return createEmpty1DChart('1D Line Chart');
    }

    // x 값 추출 및 정렬
    const values = chartData.map(d => d.x).filter(v => v !== undefined);
    if (values.length === 0) {
        return createEmpty1DChart('1D Line Chart - X 값 없음');
    }

    return {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'X 축 데이터',
                data: chartData.map((d, i) => ({ 
                    x: d.x, 
                    y: 0,
                    _pointIndex: i
                })),
                backgroundColor: 'rgba(54, 162, 235, 0.8)',
                borderColor: 'rgba(54, 162, 235, 1)',
                pointRadius: 5,
                pointHoverRadius: 7,
                showLine: false
            }],
            _metadata: data.metadata // 메타데이터 저장
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: { display: true, text: 'X 값' },
                    type: 'linear'
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
                        label: (ctx) => `X: ${ctx.parsed.x}`,
                        afterLabel: (ctx) => createStructuredTooltip(ctx, ctx.raw._pointIndex)
                    }
                },
                legend: {
                    display: true
                }
            }
        }
    };
}

/**
 * 카테고리 차트 생성 (경량화 버전)
 * @param {Object} data - 가공된 데이터 {chartData: [{category: '값'}, ...], metadata: [...]}
 * @param {Object} config - 차트 설정
 * @returns {Object} Chart.js 설정 객체
 */
export function createCategoryChart(data, config) {
    const chartData = data.chartData;
    
    // 데이터 검증
    if (!chartData || chartData.length === 0) {
        return createEmpty1DChart('Category Chart');
    }

    // 카테고리 추출 및 개수 계산
    const categories = [...new Set(chartData.map(d => d.category).filter(c => c !== undefined))];
    if (categories.length === 0) {
        return createEmpty1DChart('Category Chart - 카테고리 없음');
    }

    const counts = {};
    const categoryData = {};
    
    categories.forEach(cat => {
        counts[cat] = 0;
        categoryData[cat] = [];
    });
    
    chartData.forEach((d, i) => {
        const cat = d.category;
        if (cat && categories.includes(cat)) {
            counts[cat]++;
            categoryData[cat].push({
                index: i,
                data: d,
                metadata: data.metadata?.[i]
            });
        }
    });

    return {
        type: 'bar',
        data: {
            labels: categories,
            datasets: [{
                label: '개수',
                data: categories.map(cat => counts[cat]),
                backgroundColor: 'rgba(75, 192, 192, 0.8)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }],
            _categoryData: categoryData // 카테고리별 데이터 저장
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
                    title: { display: true, text: '개수' }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: (ctx) => `개수: ${ctx.parsed.y}`,
                        afterLabel: (ctx) => {
                            const cat = categories[ctx.dataIndex];
                            const catData = ctx.chart.data._categoryData[cat];
                            if (catData && catData.length > 0) {
                                const sample = catData[0];
                                let result = `\n${catData.length}개 데이터 포함`;
                                
                                if (sample.metadata && Object.keys(sample.metadata).length > 0) {
                                    result += '\n📊 첫 번째 데이터 샘플:';
                                    Object.entries(sample.metadata).forEach(([key, value]) => {
                                        result += `\n${key}: ${value}`;
                                    });
                                }
                                
                                return result;
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
 * 빈 1D 차트 생성
 */
function createEmpty1DChart(title) {
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
                y: { display: false }
            }
        }
    };
}