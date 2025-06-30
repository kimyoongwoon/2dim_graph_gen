import { applyScaling } from '../../scaling/size_scaling.js';
import { applyColorScaling } from '../../scaling/color_scaling.js';

// 2D 시각화
export function createSizeChart(data, dataset, scalingConfig = { type: 'default', params: {} }) {
  const xAxis = dataset.axes[0].name;
  const sizeAxis = dataset.axes[1].name;
  
  // Check for empty data FIRST, before any processing
  if (!data || data.length === 0) {
    return {
      type: 'scatter',
      data: {
        datasets: [{
          label: `${xAxis} (크기: ${sizeAxis})`,
          data: [],
          backgroundColor: 'rgba(255, 99, 132, 0.6)',
          borderColor: 'rgba(255, 99, 132, 1)',
          pointRadius: 5 // default size
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { title: { display: true, text: xAxis } },
          y: { display: true, min: -0.5, max: 0.5 }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: (ctx) => [`${xAxis}: ${ctx.parsed.x}`, `${sizeAxis}: ${ctx.raw.size}`],
              afterLabel: (ctx) => '\n' + ctx.raw.fullData
            }
          }
        }
      }
    };
  }
  
  // Only process data if we have data
  const sizeValues = data.map(d => d[sizeAxis]);
  const minSize = Math.min(...sizeValues);
  const maxSize = Math.max(...sizeValues);
  
  return {
    type: 'scatter',
    data: {
      datasets: [{
        label: `${xAxis} (크기: ${sizeAxis})`,
        data: data.map(d => ({
          x: d[xAxis],
          y: 0,
          size: d[sizeAxis],
          fullData: d._fullData
        })),
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
        borderColor: 'rgba(255, 99, 132, 1)',
        pointRadius: (ctx) => {
          // Safety check for empty data
          if (!ctx.raw || ctx.raw.size === undefined || !isFinite(minSize) || !isFinite(maxSize)) {
            return 5; // fallback size
          }
          const size = ctx.raw.size;
          return applyScaling(size, minSize, maxSize, scalingConfig);
        }
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          title: { display: true, text: xAxis }
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
              `${xAxis}: ${ctx.parsed.x}`,
              `${sizeAxis}: ${ctx.raw.size}`
            ],
            afterLabel: (ctx) => '\n' + ctx.raw.fullData
          }
        }
      }
    }
  };
}

export function createColorChart(data, dataset, colorScalingConfig = { type: 'default' }) {
  const xAxis = dataset.axes[0].name;
  const colorAxis = dataset.axes[1].name;
  
  // Check for empty data FIRST, before any processing
  if (!data || data.length === 0) {
    return {
      type: 'scatter',
      data: {
        datasets: [{
          label: `${xAxis} (색상: ${colorAxis})`,
          data: [],
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(0, 0, 0, 0.2)',
          pointRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { title: { display: true, text: xAxis } },
          y: { display: false, min: -0.5, max: 0.5 }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: (ctx) => [`${xAxis}: ${ctx.parsed.x}`, `${colorAxis}: ${ctx.raw.color}`]
            }
          }
        }
      }
    };
  }
  
  // Only process data if we have data
  const colorValues = data.map(d => d[colorAxis]);
  const minColor = Math.min(...colorValues);
  const maxColor = Math.max(...colorValues);
  
  return {
    type: 'scatter',
    data: {
      datasets: [{
        label: `${xAxis} (색상: ${colorAxis})`,
        data: data.map(d => ({
          x: d[xAxis],
          y: 0,
          color: d[colorAxis]
        })),
        backgroundColor: (ctx) => {
          const value = ctx.raw.color;
          return applyColorScaling(value, minColor, maxColor, colorScalingConfig);

        },
        borderColor: 'rgba(0, 0, 0, 0.2)',
        pointRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          title: { display: true, text: xAxis }
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
              `${xAxis}: ${ctx.parsed.x}`,
              `${colorAxis}: ${ctx.raw.color}`
            ]
          }
        }
      }
    }
  };
}

export function createScatterChart(data, dataset) {
  const xAxis = dataset.axes[0].name;
  const yAxis = dataset.axes[1].name;
  
  return {
    type: 'scatter',
    data: {
      datasets: [{
        label: `${xAxis} vs ${yAxis}`,
        data: data.map(d => ({
          x: d[xAxis],
          y: d[yAxis],
          fullData: d._fullData
        })),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        pointRadius: 5
      }]
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
              `${xAxis}: ${ctx.parsed.x}`,
              `${yAxis}: ${ctx.parsed.y}`
            ],
            afterLabel: (ctx) => '\n' + ctx.raw.fullData
          }
        }
      }
    }
  };
}