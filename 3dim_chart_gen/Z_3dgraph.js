

// 3차원 그래프에 대한 내용 생성
function create3dGraph(received_data, axis_pair) {

    const { x, y, z } = axis_pair;
    // t - m1 Graph 와 같은 형식으로 이름을 짓고 싶을때
    const graph_title = `${x} - ${y} - ${z} Graph`;
    // 개별적인 이름을 backend에서 정해서 넘기고 싶을때
    //const graph_title = received_data.title_graph;

    /*
    에러 메시지 Cannot read properties of undefined (reading 'addChild')는 layout.root.contentItems[0]이 존재하지 않아서 addChild를 호출할 수 없는 경우. 
    즉 그래프를 모두 닫아 contentItems가 비어 있는 상태에서 다시 새 그래프를 생성하려고 하면
    contentItems[0]이 undefined가 되면서 에러가 발생하는 것
    ✅ 해결 방법: contentItems가 비어 있는 경우 기본 row를 만들어줘야 함
    ✅ contentItems[0]이 없으면 row를 먼저 추가
    */

    if (layout.root.contentItems.length === 0) {
        layout.root.addChild({
            type: 'row',
            content: []
        });
    }

    layout.root.contentItems[0].addChild({
        type: 'component',
        componentName: '3dGraph',
        title: graph_title,
        componentState: {
            data: received_data.data,
            dimensions: received_data.dimensions,
            axes: [x, y, z],    // 등록될시 어떤 축을 3d로 시각화할 것인가에 대한 정보: 결국 같은 데이터에 대해서도 서로다른 그래프는 서로다른 객체로 취급하기 위함
            labels: received_data.labels,
            graph_title: graph_title,
        }
    });



}


function filterSliderData(data, slider_values) {
    return data.filter(d =>
        Object.entries(slider_values).every(([axis, config]) => {
            const val = config.value;
            const mode = config.mode;
            if (mode === 1) return d[axis] >= val;
            if (mode === 2) return d[axis] <= val;
            return d[axis] === val;
        })
    );
}

function createPointMap(data, ax1, ax2, ax3) {
    const map = new Map();
    for (const p of data) {
        map.set(`${p[ax1]}_${p[ax2]}`, p[ax3]);
    }
    return map;
}

function aggregateCandlestick(block) {
    const sorted = [...block];
    return {
        open: block[0],
        close: block[block.length - 1],
        high: Math.max(...block),
        low: Math.min(...block)
    };
}

function aggregateArray(arr, type) {
    if (!arr.length) return null;
    switch (type) {
        case 'mean': return arr.reduce((a, b) => a + b, 0) / arr.length;
        case 'min': return Math.min(...arr);
        case 'max': return Math.max(...arr);
        case 'median': {
            const sorted = [...arr].sort((a, b) => a - b);
            const mid = Math.floor(sorted.length / 2);
            return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
        }
        case 'first': return arr[0];
        case 'last': return arr[arr.length - 1];
        default: return null;
    }
}

function update3dGraph(state) {
    const [ax1, ax2, ax3] = state.axes;
    const { start_x, count_x, start_y, count_y, compress, aggregation } = state.windowControl;

    const filtered = filterSliderData(state.data, state.slider_values);
    const x_vals = [...new Set(filtered.map(p => p[ax1]))].sort((a, b) => a - b);
    const y_vals = [...new Set(filtered.map(p => p[ax2]))].sort((a, b) => a - b);

    const x_start_idx = Math.max(0, x_vals.findIndex(v => v >= start_x));
    const y_start_idx = Math.max(0, y_vals.findIndex(v => v >= start_y));
    const x_win = x_vals.slice(x_start_idx, x_start_idx + count_x);
    const y_win = y_vals.slice(y_start_idx, y_start_idx + count_y);

    if (x_win.length === 0 || y_win.length === 0) {
        console.warn('⚠️ No data in selected window');
        Plotly.react(state.plot_id, [], state.layout, { responsive: true });
        return;
    }

    const pointMap = createPointMap(filtered, ax1, ax2, ax3);

    if (aggregation === 'candlestick') {
        return renderCandlestick3D(state, x_win, y_win, compress, pointMap);
    }

    return renderSurfaceAndScatter3D(state, x_win, y_win, compress, pointMap, aggregation);
}

function renderCandlestick3D(state, x_win, y_win, compress, pointMap) {
    const xs = [], ys = [], lowz = [], highz = [], openz = [], closez = [];

    for (let yi = 0; yi < y_win.length; yi += compress) {
        for (let xi = 0; xi < x_win.length; xi += compress) {
            const block = [];
            for (let dy = 0; dy < compress; dy++) {
                for (let dx = 0; dx < compress; dx++) {
                    const x = x_win[xi + dx];
                    const y = y_win[yi + dy];
                    const val = pointMap.get(`${x}_${y}`);
                    if (val !== undefined && Number.isFinite(val)) block.push(val);
                }
            }
            if (block.length === 0) continue;
            const { open, high, low, close } = aggregateCandlestick(block);
            const cx = x_win[xi + Math.floor(compress / 2)];
            const cy = y_win[yi + Math.floor(compress / 2)];
            xs.push(cx); ys.push(cy);
            openz.push(open); closez.push(close);
            lowz.push(low); highz.push(high);
        }
    }

    const lineX = [], lineY = [], lineZ = [];
    for (let i = 0; i < xs.length; i++) {
        lineX.push(xs[i], xs[i], null);
        lineY.push(ys[i], ys[i], null);
        lineZ.push(lowz[i], highz[i], null);
    }

    const traces = [
        { type: 'scatter3d', mode: 'lines', x: lineX, y: lineY, z: lineZ, line: { color: '#333', width: 2 }, showlegend: false },
        { type: 'scatter3d', mode: 'markers', x: xs, y: ys, z: openz, marker: { color: 'blue', size: 4, symbol: 'diamond' }, name: 'Open' },
        { type: 'scatter3d', mode: 'markers', x: xs, y: ys, z: closez, marker: { color: 'red', size: 4, symbol: 'circle' }, name: 'Close' }
    ];

    Plotly.react(state.plot_id, traces, state.layout, { responsive: true });
}

function renderSurfaceAndScatter3D(state, x_win, y_win, compress, pointMap, aggregation) {
    const x_grid = [], y_grid = [], z_grid = [];
    const scatter_xs = [], scatter_ys = [], scatter_zs = [];
    let max_cols = 0;

    for (let yi = 0; yi < y_win.length; yi += compress) {
        const x_row = [], y_row = [], z_row = [];

        for (let xi = 0; xi < x_win.length; xi += compress) {
            const block = [];
            for (let dy = 0; dy < compress; dy++) {
                for (let dx = 0; dx < compress; dx++) {
                    const x = x_win[xi + dx];
                    const y = y_win[yi + dy];
                    const val = pointMap.get(`${x}_${y}`);
                    if (val !== undefined && Number.isFinite(val)) block.push(val);
                }
            }
            const cx = x_win[xi + Math.floor(compress / 2)];
            const cy = y_win[yi + Math.floor(compress / 2)];
            const z_val = block.length > 0 ? aggregateArray(block, aggregation) : null;
            const z_safe = Number.isFinite(z_val) ? z_val : null;

            x_row.push(cx); y_row.push(cy); z_row.push(z_safe);

            if (z_safe !== null) {
                scatter_xs.push(cx);
                scatter_ys.push(cy);
                scatter_zs.push(z_safe);
            }
        }

        if (x_row.length > 0) {
            x_grid.push(x_row);
            y_grid.push(y_row);
            z_grid.push(z_row);
            max_cols = Math.max(max_cols, x_row.length);
        }
    }

    for (let i = 0; i < z_grid.length; i++) {
        while (z_grid[i].length < max_cols) {
            z_grid[i].push(null);
            x_grid[i].push(x_grid[i][x_grid[i].length - 1] ?? 0);
            y_grid[i].push(y_grid[i][y_grid[i].length - 1] ?? 0);
        }
    }

    if (z_grid.length === 0 || z_grid[0].length === 0) {
        console.warn('⚠️ Z grid empty — cannot render surface.');
        Plotly.react(state.plot_id, [], state.layout, { responsive: true });
        return;
    }

    const surface = {
        type: 'surface',
        x: x_grid,
        y: y_grid,
        z: z_grid,
        colorscale: 'Viridis',
        opacity: 0.8,
        visible: state.visible.surface
    };

    const scatter = {
        type: 'scatter3d',
        mode: 'markers',
        x: scatter_xs,
        y: scatter_ys,
        z: scatter_zs,
        marker: {
            size: 4,
            color: scatter_zs,
            opacity: 0.8,
            colorscale: 'Viridis'
        },
        visible: state.visible.points
    };

    Plotly.react(state.plot_id, [surface, scatter], state.layout, { responsive: true });
}
