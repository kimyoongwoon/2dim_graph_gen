/**
 * 구조화된 툴팁 생성 함수 (3차원 문자열용)
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

// 3D String 시각화
export function createGroupedBarChart(data, dataset) {
  const stringAxis = dataset.axes[0].name;
  const xAxis = dataset.axes[1].name;
  const yAxis = dataset.axes[2].name;
  
  const categories = [...new Set(data.map(d => d[stringAxis]))];
  const xValues = [...new Set(data.map(d => d[xAxis]))].sort((a, b) => a - b);
  
  const datasets = categories.map((cat, i) => {
    const catData = data.filter(d => d[stringAxis] === cat);
    const hue = (i / categories.length) * 360;
    
    return {
      label: cat,
      data: xValues.map(x => {
        const point = catData.find(d => d[xAxis] === x);
        return point ? point[yAxis] : null;
      }),
      backgroundColor: `hsla(${hue}, 70%, 50%, 0.8)`,
      borderColor: `hsl(${hue}, 70%, 50%)`,
      borderWidth: 1,
      _fullData: catData // 카테고리별 전체 데이터 저장
    };
  });
  
  return {
    type: 'bar',
    data: {
      labels: xValues,
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          title: { display: true, text: xAxis }
        },
        y: {
          title: { display: true, text: yAxis }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: (ctx) => [
              `${stringAxis}: ${ctx.dataset.label}`,
              `${xAxis}: ${ctx.label}`,
              `${yAxis}: ${ctx.parsed.y}`
            ],
            afterLabel: (ctx) => {
              // 해당 카테고리의 해당 X값에 대한 실제 데이터 포인트 찾기
              const category = ctx.dataset.label;
              const xValue = ctx.label;
              const point = data.find(d => d[stringAxis] === category && d[xAxis] == xValue);
              
              if (point && point._fullData) {
                return createStructuredTooltip({ raw: point }, { 
                  [stringAxis]: '그룹', 
                  [xAxis]: 'X축', 
                  [yAxis]: 'Y축' 
                });
              }
              return '';
            }
          }
        }
      }
    }
  };
}

export function createGroupedBarSizeChart(data, dataset) {
  const stringAxis = dataset.axes[0].name;
  const xAxis = dataset.axes[1].name;
  const sizeAxis = dataset.axes[2].name;
  
  const categories = [...new Set(data.map(d => d[stringAxis]))];
  
  return {
    type: 'bubble',
    data: {
      datasets: categories.map((cat, i) => {
        const catData = data.filter(d => d[stringAxis] === cat);
        const hue = (i / categories.length) * 360;
        
        return {
          label: cat,
          data: catData.map(d => ({
            x: d[xAxis],
            y: i,
            r: Math.sqrt(d[sizeAxis]) * 5,
            _fullData: d._fullData,
            category: cat,
            size: d[sizeAxis]
          })),
          backgroundColor: `hsla(${hue}, 70%, 50%, 0.6)`,
          borderColor: `hsl(${hue}, 70%, 50%)`
        };
      })
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          title: { display: true, text: xAxis }
        },
        y: {
          type: 'category',
          labels: categories,
          title: { display: true, text: stringAxis }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: (ctx) => [
              `${stringAxis}: ${ctx.raw.category}`,
              `${xAxis}: ${ctx.parsed.x}`,
              `${sizeAxis}: ${ctx.raw.size}`
            ],
            afterLabel: (ctx) => createStructuredTooltip(ctx, { 
              [stringAxis]: '그룹', 
              [xAxis]: 'X축', 
              [sizeAxis]: '크기' 
            })
          }
        }
      }
    }
  };
}

export function createGroupedBarColorChart(data, dataset) {
  const stringAxis = dataset.axes[0].name;
  const xAxis = dataset.axes[1].name;
  const colorAxis = dataset.axes[2].name;
  
  const categories = [...new Set(data.map(d => d[stringAxis]))];
  const colorValues = data.map(d => d[colorAxis]);
  const minColor = Math.min(...colorValues);
  const maxColor = Math.max(...colorValues);
  
  return {
    type: 'scatter',
    data: {
      datasets: categories.map((cat, i) => {
        const catData = data.filter(d => d[stringAxis] === cat);
        
        return {
          label: cat,
          data: catData.map(d => ({
            x: d[xAxis],
            y: i,
            color: d[colorAxis],
            _fullData: d._fullData,
            category: cat
          })),
          backgroundColor: (ctx) => {
            const value = ctx.raw.color;
            const normalized = (value - minColor) / (maxColor - minColor);
            const hue = normalized * 240;
            return `hsl(${240 - hue}, 70%, 50%)`;
          },
          borderColor: 'rgba(0, 0, 0, 0.2)',
          pointRadius: 8
        };
      })
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          title: { display: true, text: xAxis }
        },
        y: {
          type: 'category',
          labels: categories,
          title: { display: true, text: stringAxis }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: (ctx) => [
              `${stringAxis}: ${ctx.raw.category}`,
              `${xAxis}: ${ctx.parsed.x}`,
              `${colorAxis}: ${ctx.raw.color}`
            ],
            afterLabel: (ctx) => createStructuredTooltip(ctx, { 
              [stringAxis]: '그룹', 
              [xAxis]: 'X축', 
              [colorAxis]: '색상' 
            })
          }
        }
      }
    }
  };
}