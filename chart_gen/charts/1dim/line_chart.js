// visualizations/charts/1d/line-chart.js

/**
 * 구조화된 툴팁 생성 함수
 */
function createStructuredTooltip(ctx) {
    const original = ctx.raw._fullData;
    if (!original || typeof original !== 'object') {
        return '';
    }
    
    // 선택된 축 우선 표시
    const mainField = ctx.parsed.x;
    const entries = Object.entries(original);
    
    // 사용된 필드 우선, 나머지는 그 다음
    const usedFields = [];
    const otherFields = [];
    
    entries.forEach(([key, value]) => {
        if (value === mainField) {
            usedFields.push(`${key}: ${value} ⭐`);
        } else {
            otherFields.push(`${key}: ${value}`);
        }
    });
    
    const result = [
        '\n📊 원본 데이터:',
        ...usedFields,
        ...(otherFields.length > 0 ? ['--- 기타 필드 ---', ...otherFields] : [])
    ].join('\n');
    
    return result;
}

/**
 * Creates a 1D line chart visualization
 * @param {Array} data - Prepared data points
 * @param {Object} dataset - Dataset configuration
 * @returns {Object} Chart.js configuration object
 */
export function create1DLineChart(data, dataset) {
  const axisName = dataset.axes[0].name;
  const values = data.map(d => d[axisName]).sort((a, b) => a - b);
  
  return {
    type: 'scatter',
    data: {
      datasets: [{
        label: axisName,
        data: data.map((d, i) => ({ 
          x: d[axisName], 
          y: 0,
          _fullData: d._fullData
        })),
        backgroundColor: 'rgba(54, 162, 235, 0.8)',
        borderColor: 'rgba(54, 162, 235, 1)',
        pointRadius: 5,
        pointHoverRadius: 7
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          title: { display: true, text: axisName }
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
            label: (ctx) => `${axisName}: ${ctx.parsed.x}`,
            afterLabel: createStructuredTooltip
          }
        }
      }
    }
  };
}

/**
 * Creates a category chart visualization
 * @param {Array} data - Prepared data points
 * @param {Object} dataset - Dataset configuration
 * @returns {Object} Chart.js configuration object
 */
export function createCategoryChart(data, dataset) {
  const categories = [...new Set(data.map(d => d[dataset.axes[0].name]))];
  const counts = {};
  const categoryData = {};
  
  categories.forEach(cat => {
    counts[cat] = 0;
    categoryData[cat] = [];
  });
  
  data.forEach(d => {
    const cat = d[dataset.axes[0].name];
    counts[cat]++;
    categoryData[cat].push(d);
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
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
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
              const catData = categoryData[cat];
              if (catData.length > 0 && catData[0]._fullData) {
                const original = catData[0]._fullData;
                if (typeof original === 'object') {
                  return '\n📊 첫 번째 데이터 샘플:\n' + 
                         Object.entries(original)
                               .map(([key, value]) => `${key}: ${value}`)
                               .join('\n');
                }
              }
              return '';
            }
          }
        }
      }
    }
  };
}