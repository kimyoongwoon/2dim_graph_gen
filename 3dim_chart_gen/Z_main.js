var windowCounter = 0;
const config = {
    settings: {
        showPopoutIcon: false, // ⛔ 제거 방지 버튼 숨기기
        showCloseIcon: false,  // ⛔ 닫기 버튼도 숨기고 싶다면 true로 바꾸기
    },
    content: [{
        type: 'row',
        content: []
    }]
};

const container_id = "combinationButtons"; // 전역에서 사용됨
// 여기 아래에 지금까지 작성한 JavaScript 코드 삽입

const layout = new GoldenLayout(config, $('#layoutContainer'));

registerGraph(layout);

layout.on('initialised', () => {
    createGraphGenButton(received_data);  // 여기서 호출해야 root가 null이 아님
});


layout.init();

// ✅ 창 크기 변하면 layout 사이즈 업데이트
window.addEventListener('resize', () => {
    layout.updateSize();
});