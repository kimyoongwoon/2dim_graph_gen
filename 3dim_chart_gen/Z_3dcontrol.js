function register3dShowButtonBox(state) {
    const box = document.createElement('div');
    box.style.marginBottom = '4px';

    const createButton = (label, handler) => {
        const btn = document.createElement('button');
        btn.textContent = label;
        btn.style.marginRight = '5px';
        btn.addEventListener('click', handler);
        return btn;
    };

    box.appendChild(createButton('Show Both', () => {
        state.visible.surface = true;
        state.visible.points = true;
        update3dGraph(state);
    }));

    box.appendChild(createButton('Points Only', () => {
        state.visible.surface = false;
        state.visible.points = true;
        update3dGraph(state);
    }));

    box.appendChild(createButton('Surface Only', () => {
        state.visible.surface = true;
        state.visible.points = false;
        update3dGraph(state);
    }));

    return box;
}

function register3dControlBox(state) {
    const box = document.createElement('div');
    box.style.display = 'flex';
    box.style.flexWrap = 'wrap';
    box.style.gap = '10px';
    box.style.marginBottom = '5px';

    const makeNumberInput = (label, key, defaultVal) => {
        const wrap = document.createElement('div');
        wrap.innerHTML = `<label>${label}: <input type="number" value="${defaultVal}" style="width: 60px;"></label>`;
        const input = wrap.querySelector('input');
        input.addEventListener('input', () => {
            let val = parseFloat(input.value);
            if (isNaN(val)) val = 1;
            if (key === 'compress') val = Math.max(1, Math.floor(val));
            state.windowControl[key] = val;
            update3dGraph(state);
        });
        return wrap;
    };

    box.appendChild(makeNumberInput('Start X', 'start_x', state.windowControl.start_x));
    box.appendChild(makeNumberInput('Count X', 'count_x', state.windowControl.count_x));
    box.appendChild(makeNumberInput('Start Y', 'start_y', state.windowControl.start_y));
    box.appendChild(makeNumberInput('Count Y', 'count_y', state.windowControl.count_y));
    box.appendChild(makeNumberInput('Compress', 'compress', state.windowControl.compress));

    const aggBox = document.createElement('div');
    aggBox.innerHTML = `
    <label>Aggregation:
        <select>
            <option value="mean">Mean</option>
            <option value="min">Min</option>
            <option value="max">Max</option>
            <option value="median">Median</option>
            <option value="first">First</option>
            <option value="last">Last</option>
            <option value="candlestick">Candlestick</option>
        </select>
    </label>`;
    aggBox.querySelector('select').addEventListener('input', (e) => {
        state.windowControl.aggregation = e.target.value;
        update3dGraph(state);
    });
    box.appendChild(aggBox);

    return box;
}