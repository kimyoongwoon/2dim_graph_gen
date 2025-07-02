
function generateAllCombinationsData() {
    const data = [];

    for (let t = 0; t <= 10; t++) {
        for (let p_1 = 0; p_1 <= 10; p_1++) {
            for (let p_2 = 0; p_2 <= 10; p_2++) {
                for (let p_3 = 0; p_3 <= 10; p_3++) {
                    const m_1 = t + p_1 + p_2 + p_3;
                    const m_2 = t - p_1 + p_2 - p_3;

                    data.push({ t, p_1, p_2, p_3, m_1, m_2 });
                }
            }
        }
    }

    return data;
}

const received_data = {
    data: generateAllCombinationsData(),
    dimensions: ['t', 'm_1', 'm_2', 'p_1', 'p_2', 'p_3'], // 사용할 축 목록
    labels: {
        t: 'time',
        m_1: 'profit',
        m_2: 'winrate',
        p_1: 'ma window size',
        p_2: 'ma duration',
        p_3: 'ma generalized coefficient'
    },
    title: 'Multidimensional Moving Average Backtest'
};