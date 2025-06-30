/**
 * 구조화된 툴팁 생성 함수 (2차원 문자열용)
 */
function createStructuredTooltip(ctx, usedAxes = {}) {
    const original = ctx.raw?._fullData;
    if (!original || typeof original !== 'object') {
        return '';
    }
    
    const entries = Object.entries(original);
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
    
    const result = [
        '\n📊 원본 데이터:',
        ...usedFields,
        ...(otherFields.length > 0 ? ['--- 기타 필드 ---', ...otherFields] : [])
    ].join('\n');
    
    return result;
}

/**
 * 카테고리 데이터용 툴팁 생성 함수
 */
function createCategoryTooltip(categoryData, category) {
    if (!categoryData || categoryData.length === 0) {
        return '';
    }
    
    const sample = categoryData[0]._fullData;
    if (!sample || typeof sample !== 'object') {
        return '';
    }
    
    return '\n📊 첫 번째 데이터 샘플:\n' + 
           Object.entries(sample)
                 .map(([key, value]) => `${key}: ${value}`)
                 .join('\n');
}

// 2D String 시각화
export function createBarChart(data, dataset) {
  const stringAxis = dataset.axes[0].name;
  const valueAxis = dataset.axes[1].name;
  
  const categories = [...new Set(data.map(d => d[stringAxis]))];
  const avgValues = {};
  const categoryData = {};
  
  categories.forEach(cat => {
    const catData = data.filter(d => d[stringAxis] === cat);
    const values = catData.map(d => d[valueAxis]);
    avgValues[cat] = values.reduce((a, b) => a + b, 0) / values.length;
    categoryData[cat] = catData;
  });
  
  return {
    type: 'bar',
    data: {
      labels: categories,
      datasets: [{
        label: valueAxis,
        data: categories.map(cat => avgValues[cat]),
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
          title: { display: true, text: valueAxis }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: (ctx) => `평균 ${valueAxis}: ${ctx.parsed.y.toFixed(3)}`,
            afterLabel: (ctx) => {
              const cat = categories[ctx.dataIndex];
              const catData = categoryData[cat];
              return `\n${catData.length}개 데이터의 평균` + createCategoryTooltip(catData, cat);
            }
          }
        }
      }
    }
  };
}

export function createBarSizeChart(data, dataset) {
  const stringAxis = dataset.axes[0].name;
  const sizeAxis = dataset.axes[1].name;
  
  const categories = [...new Set(data.map(d => d[stringAxis]))];
  
  return {
    type: 'bubble',
    data: {
      datasets: [{
        label: `${stringAxis} (크기: ${sizeAxis})`,
        data: data.map((d, i) => ({
          x: categories.indexOf(d[stringAxis]),
          y: 0,
          r: Math.sqrt(d[sizeAxis]) * 5,
          _fullData: d._fullData,
          category: d[stringAxis],
          size: d[sizeAxis]
        })),
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
        borderColor: 'rgba(255, 99, 132, 1)'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          type: 'category',
          labels: categories,
          title: { display: true, text: stringAxis }
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
              `${stringAxis}: ${ctx.raw.category}`,
              `${sizeAxis}: ${ctx.raw.size}`
            ],
            afterLabel: (ctx) => createStructuredTooltip(ctx, { 
              [stringAxis]: '카테고리', 
              [sizeAxis]: '크기' 
            })
          }
        }
      }
    }
  };
}

export function createBarColorChart(data, dataset) {
  const stringAxis = dataset.axes[0].name;
  const colorAxis = dataset.axes[1].name;
  
  const categories = [...new Set(data.map(d => d[stringAxis]))];
  const colorValues = data.map(d => d[colorAxis]);
  const minColor = Math.min(...colorValues);
  const maxColor = Math.max(...colorValues);
  
  return {
    type: 'scatter',
    data: {
      datasets: data.map((d, i) => ({
        label: d[stringAxis],
        data: [{
          x: categories.indexOf(d[stringAxis]),
          y: 0,
          _fullData: d._fullData,
          category: d[stringAxis],
          colorValue: d[colorAxis]
        }],
        backgroundColor: (() => {
          const normalized = (d[colorAxis] - minColor) / (maxColor - minColor);
          const hue = normalized * 240;
          return `hsl(${240 - hue}, 70%, 50%)`;
        })(),
        pointRadius: 8,
        showLine: false
      }))
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          type: 'category',
          labels: categories,
          title: { display: true, text: stringAxis }
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
              `${stringAxis}: ${ctx.raw.category}`,
              `${colorAxis}: ${ctx.raw.colorValue}`
            ],
            afterLabel: (ctx) => createStructuredTooltip(ctx, { 
              [stringAxis]: '카테고리', 
              [colorAxis]: '색상' 
            })
          }
        }
      }
    }
  };
}