
function createGraphGenButton(received_data) {
    // 축조합 생성
    const combinations_3d = generate3DGraphCombinations(received_data.dimensions);
    // combination 예시: [[x, y, z], [x, y, t], ...]
    create3dAxisPairButtons(combinations_3d, received_data, container_id);
}

function create3dAxisPairButtons(axis_pairs, received_data, container_id) {
    const container = document.getElementById(container_id);

    axis_pairs.forEach(({ x, y, z }) => {
        const button = document.createElement('button');
        //const label = `${x} - ${y} - ${z}`;
        button.textContent = `${x}, ${y}, ${z} Graph`;    // 버튼 이름
        //button.textContent = `${received_data.labels[x]} · ${received_data.labels[y]} · ${received_data.labels[z]}`;
        button.className = '3d-axis-button'; // 스타일링용 클래스

        // 클릭 시 실행할 콜백 (예: plot 생성)
        button.addEventListener('click', () => {
            // 버튼 실행시 그래프 생성, 그래프 생성시, 슬라이더도 자동으로 생성 (registerComponent에서 그렇게 처리함)
            create3dGraph(received_data, { x, y, z });
        });

        container.appendChild(button);
    });
}

function registerGraph(layout) {
    layout.registerComponent('3dGraph', function (container, state) {
        const wrapper = document.createElement('div');
        wrapper.className = 'area';
        container.getElement().append(wrapper);

        // 상태 초기화
        state.visible = { surface: true, points: true };
        state.windowControl = {
            start_x: -100, count_x: 100,
            start_y: -100, count_y: 100,
            compress: 1,
            aggregation: 'mean'
        };

        // 그래프 ID 설정
        const plot_id = `plot3d_${state.axes.join('_')}`;
        state.plot_id = plot_id;

        // 버튼 영역 생성 및 추가
        const buttonBox = register3dShowButtonBox(state);
        wrapper.appendChild(buttonBox);

        // 컨트롤 입력 박스 생성 및 추가
        const controlBox = register3dControlBox(state);
        wrapper.appendChild(controlBox);

        // 슬라이더 영역 생성 및 추가
        const slider_box = document.createElement('div');
        slider_box.className = 'slider-area';
        slider_box.style.height = '10%';
        slider_box.style.overflowX = 'auto';
        slider_box.style.whiteSpace = 'nowrap';
        wrapper.appendChild(slider_box);

        state.slider_box = slider_box;
        state.slider_box_id = `slider_area_${state.axes.join('_')}`;
        state.slider_values = {};

        // 그래프 영역 생성 및 추가
        const plot_div = document.createElement('div');
        plot_div.className = 'plot-area';
        plot_div.style.width = '100%';
        plot_div.style.height = '90%';
        plot_div.id = plot_id;
        wrapper.appendChild(plot_div);

        // 슬라이더 등록
        registerSliderContainer(state);

        // 레이아웃 정보 설정
        state.layout = {
            title: {
                text: `${state.labels[state.axes[0]]} · ${state.labels[state.axes[1]]} · ${state.labels[state.axes[2]]}`,
                font: { family: 'Arial, sans-serif', size: 20, color: '#000' },
                xref: 'paper', x: 0.5, xanchor: 'center'
            },
            margin: { t: 40 },
            scene: {
                xaxis: { title: { text: state.labels[state.axes[0]] } },
                yaxis: { title: { text: state.labels[state.axes[1]] } },
                zaxis: { title: { text: state.labels[state.axes[2]] } }
            }
        };

        // 그래프 최초 렌더링 및 리사이즈 처리
        requestAnimationFrame(() => {
            update3dGraph(state);

            const resizePlot = () => {
                const el = document.getElementById(state.plot_id);
                if (el) {
                    requestAnimationFrame(() => Plotly.Plots.resize(el));
                }
            };

            window.addEventListener('resize', resizePlot);
            container.on('resize', resizePlot);
            container.on('destroy', () => {
                window.removeEventListener('resize', resizePlot);
            });
        });
    });
}









function createWindowCount() {


}
