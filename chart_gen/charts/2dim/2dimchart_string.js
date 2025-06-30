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
              return `\n${catData.length}개 데이터의 평균\n첫 번째 데이터:\n${catData[0]._fullData}`;
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
          r: Math.sqrt(d[sizeAxis]) * 5
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
            label: (ctx) => {
              const cat = categories[ctx.parsed.x];
              const size = Math.pow(ctx.raw.r / 5, 2);
              return [`${stringAxis}: ${cat}`, `${sizeAxis}: ${size.toFixed(2)}`];
            }
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
          y: 0
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
            label: (ctx) => {
              const d = data[ctx.datasetIndex];
              return [`${stringAxis}: ${d[stringAxis]}`, `${colorAxis}: ${d[colorAxis]}`];
            }
          }
        }
      }
    }
  };
}