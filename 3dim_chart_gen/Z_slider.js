function registerSliderContainer(state) {
    state.slider_axes = state.dimensions.filter(d => !state.axes.includes(d));
    state.slider_axes.forEach(axis => {
        const values = state.data.map(p => p[axis]);
        const min = Math.min(...values);
        const max = Math.max(...values);
        const init = min;
        state.slider_values[axis] = init;
        registerSlider(state, axis, min, max, init);
    });
}

function registerSlider(state, axis, min, max, initial_value) {
    const parent = state.slider_box; // registerGraph 에서 저장해둔 slider_box DOM
    // 고유 ID 생성
    const slider_id = `slider_${axis}_${state.plot_id}`;

    const is_m_axis = axis.startsWith('m_'); // m_i 인지 확인

    // 1) 슬라이더의 레이블
    const label = document.createElement('label');
    label.setAttribute('for', slider_id);  // input과 연결
    label.innerHTML = `
    ${state.labels[axis]} = 
    <span id="val_${axis}_${state.plot_id}">${initial_value}</span>
  `;

    // 2) 실제 슬라이더 input[type=range]
    const input = document.createElement('input');
    input.id = slider_id;
    input.type = 'range';
    input.min = min;
    input.max = max;
    input.step = 1;                    // 필요하면 (max-min)/100 같은 비율로 바꿔도 된다.
    input.value = initial_value;


    // 슬라이더 값 및 모드 초기화
    // ✅ 기본 mode 설정: m_이면 1 (≥), 아니면 3 (=)
    const default_mode = is_m_axis ? 1 : 3;
    state.slider_values[axis] = { value: initial_value, mode: default_mode };


    // 3) 이벤트: 값 바뀔 때마다 state 업데이트 + 그래프 갱신
    input.addEventListener('input', () => {
        const val = Number(input.value);
        // DOM 업데이트
        document.getElementById(`val_${axis}_${state.plot_id}`).innerText = val;
        // state 에도 저장
        state.slider_values[axis].value = val;
        // Plotly 다시 그리기
        update3dGraph(state);
    });

    // 4) DOM에 붙이기
    parent.appendChild(label);
    parent.appendChild(input);

    // perfomance metric slider에 대한 추가 기능
    // ✅ m_i 슬라이더라면 추가 버튼 UI 생성
    if (is_m_axis) {
        const modeBox = document.createElement('div');
        modeBox.style.marginTop = '2px';

        const modes = [
            { label: '≥', mode: 1 },
            { label: '≤', mode: 2 },
            { label: '=', mode: 3 }
        ];

        modes.forEach(({ label, mode }) => {
            const btn = document.createElement('button');
            btn.textContent = label;
            btn.style.marginRight = '4px';
            btn.style.fontSize = '0.8em';

            btn.addEventListener('click', () => {
                state.slider_values[axis].mode = mode;
                update3dGraph(state);
            });

            modeBox.appendChild(btn);
        });

        parent.appendChild(modeBox);
    }
}