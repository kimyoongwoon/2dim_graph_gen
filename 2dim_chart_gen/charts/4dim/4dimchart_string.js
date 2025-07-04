/**
 * 구조화된 툴팁 생성 함수 (4차원 문자열용)
 */
function createStructuredTooltip(ctx, usedAxes = {}) {
    const original = ctx.raw._fullData;
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

// 4D String 시각화
export function createGroupedScatterSizeColorChart(data, dataset) {
  const stringAxis = dataset.axes[0].name;
  const xAxis = dataset.axes[1].name;
  const yAxis = dataset.axes[2].name;
  const sizeAxis = dataset.axes[3].name;
  const colorAxis = dataset.axes.length > 4 ? dataset.axes[4].name : dataset.axes[3].name;
  
  const categories = [...new Set(data.map(d => d[stringAxis]))];
  
  const sizeValues = data.map(d => d[sizeAxis]);
  const minSize = Math.min(...sizeValues);
  const maxSize = Math.max(...sizeValues);
  
  const colorValues = data.map(d => d[colorAxis]);
  const minColor = Math.min(...colorValues);
  const maxColor = Math.max(...colorValues);
  
  return {
    type: 'scatter',
    data: {
      datasets: categories.map((cat, i) => {
        const catData = data.filter(d => d[stringAxis] === cat);
        const hue = (i / categories.length) * 360;
        
        return {
          label: cat,
          data: catData.map(d => ({
            x: d[xAxis],
            y: d[yAxis],
            size: d[sizeAxis],
            color: d[colorAxis],
            _fullData: d._fullData,
            category: cat
          })),
          backgroundColor: catData.map(d => {
            const value = d[colorAxis];
            const normalized = (value - minColor) / (maxColor - minColor);
            const colorHue = normalized * 240;
            return `hsla(${240 - colorHue}, 70%, 50%, 0.7)`;
          }),
          borderColor: `hsl(${hue}, 70%, 40%)`,
          borderWidth: 1,
          pointRadius: catData.map(d => {
            const size = d[sizeAxis];
            return 3 + (size - minSize) / (maxSize - minSize) * 12;
          })
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
          title: { display: true, text: yAxis }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: (ctx) => [
              `${stringAxis}: ${ctx.raw.category}`,
              `${xAxis}: ${ctx.parsed.x}`,
              `${yAxis}: ${ctx.parsed.y}`,
              `${sizeAxis}: ${ctx.raw.size}`,
              `${colorAxis}: ${ctx.raw.color}`
            ],
            afterLabel: (ctx) => createStructuredTooltip(ctx, { 
              [stringAxis]: '그룹', 
              [xAxis]: 'X축', 
              [yAxis]: 'Y축', 
              [sizeAxis]: '크기', 
              [colorAxis]: '색상' 
            })
          }
        }
      }
    }
  };
}