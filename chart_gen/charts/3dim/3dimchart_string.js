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
      borderWidth: 1
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
            r: Math.sqrt(d[sizeAxis]) * 5
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
            color: d[colorAxis]
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
      }
    }
  };
}