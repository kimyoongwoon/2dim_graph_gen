import { applyScaling } from '../../scaling/size_scaling.js';
import { applyColorScaling } from '../../scaling/color_scaling.js';


// 3D 시각화
export function createSizeColorChart(data, dataset, scalingConfig = { type: 'default', params: {} }, colorScalingConfig = { type: 'default' }) {
  const xAxis = dataset.axes[0].name;
  const sizeAxis = dataset.axes[1].name;
  const colorAxis = dataset.axes[2].name;
  
  // Check for empty data FIRST, before any processing
  if (!data || data.length === 0) {
    return {
      type: 'scatter',
      data: {
        datasets: [{
          label: `${xAxis} (크기: ${sizeAxis}, 색상: ${colorAxis})`,
          data: [],
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(0, 0, 0, 0.2)',
          pointRadius: 5 // default size
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
              label: (ctx) => [
                `${xAxis}: ${ctx.parsed.x}`,
                `${sizeAxis}: ${ctx.raw.size}`,
                `${colorAxis}: ${ctx.raw.color}`
              ]
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
  
  const colorValues = data.map(d => d[colorAxis]);
  const minColor = Math.min(...colorValues);
  const maxColor = Math.max(...colorValues);
  
  return {
    type: 'scatter',
    data: {
      datasets: [{
        label: `${xAxis} (크기: ${sizeAxis}, 색상: ${colorAxis})`,
        data: data.map(d => ({
          x: d[xAxis],
          y: 0,
          size: d[sizeAxis],
          color: d[colorAxis]
        })),
        backgroundColor: (ctx) => {
          // Safety check for empty data
          if (!ctx.raw || ctx.raw.color === undefined || !isFinite(minColor) || !isFinite(maxColor)) {
            return 'rgba(54, 162, 235, 0.6)'; // fallback color
          }
          const value = ctx.raw.color;
          return applyColorScaling(value, minColor, maxColor, colorScalingConfig);

        },
        borderColor: 'rgba(0, 0, 0, 0.2)',
        pointRadius: (ctx) => {
          // Safety check for empty data
          if (!ctx.raw || ctx.raw.size === undefined || !isFinite(minSize) || !isFinite(maxSize)) {
            return 5; // fallback size
          }
          const size = ctx.raw.size;
          // CHANGED: Use applyScaling instead of hardcoded formula
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
              `${sizeAxis}: ${ctx.raw.size}`,
              `${colorAxis}: ${ctx.raw.color}`
            ]
          }
        }
      }
    }
  };
}

export function createScatterSizeChart(data, dataset, scalingConfig = { type: 'default', params: {} }) {
  const xAxis = dataset.axes[0].name;
  const yAxis = dataset.axes[1].name;
  const sizeAxis = dataset.axes[2].name;
  
  // Check for empty data FIRST, before any processing
  if (!data || data.length === 0) {
    return {
      type: 'scatter',
      data: {
        datasets: [{
          label: `${xAxis} vs ${yAxis} (크기: ${sizeAxis})`,
          data: [],
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          pointRadius: 5 // default size
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { title: { display: true, text: xAxis } },
          y: { title: { display: true, text: yAxis } }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: (ctx) => [
                `${xAxis}: ${ctx.parsed.x}`,
                `${yAxis}: ${ctx.parsed.y}`,
                `${sizeAxis}: ${ctx.raw.size}`
              ]
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
        label: `${xAxis} vs ${yAxis} (크기: ${sizeAxis})`,
        data: data.map(d => ({
          x: d[xAxis],
          y: d[yAxis],
          size: d[sizeAxis]
        })),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
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
          title: { display: true, text: yAxis }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: (ctx) => [
              `${xAxis}: ${ctx.parsed.x}`,
              `${yAxis}: ${ctx.parsed.y}`,
              `${sizeAxis}: ${ctx.raw.size}`
            ]
          }
        }
      }
    }
  };
}

export function createScatterColorChart(data, dataset, colorScalingConfig = { type: 'default' }) {
  const xAxis = dataset.axes[0].name;
  const yAxis = dataset.axes[1].name;
  const colorAxis = dataset.axes[2].name;
  
  // Check for empty data FIRST, before any processing
  if (!data || data.length === 0) {
    return {
      type: 'scatter',
      data: {
        datasets: [{
          label: `${xAxis} vs ${yAxis} (색상: ${colorAxis})`,
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
          y: { title: { display: true, text: yAxis } }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: (ctx) => [
                `${xAxis}: ${ctx.parsed.x}`,
                `${yAxis}: ${ctx.parsed.y}`,
                `${colorAxis}: ${ctx.raw.color}`
              ]
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
        label: `${xAxis} vs ${yAxis} (색상: ${colorAxis})`,
        data: data.map(d => ({
          x: d[xAxis],
          y: d[yAxis],
          color: d[colorAxis]
        })),
        backgroundColor: (ctx) => {
          // Safety check for empty data
          if (!ctx.raw || ctx.raw.color === undefined || !isFinite(minColor) || !isFinite(maxColor)) {
            return 'rgba(54, 162, 235, 0.6)'; // fallback color
          }
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
          title: { display: true, text: yAxis }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: (ctx) => [
              `${xAxis}: ${ctx.parsed.x}`,
              `${yAxis}: ${ctx.parsed.y}`,
              `${colorAxis}: ${ctx.raw.color}`
            ]
          }
        }
      }
    }
  };
}