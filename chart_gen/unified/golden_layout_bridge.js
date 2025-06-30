// ============================================================================
// chart_gen/unified/golden_layout_bridge.js - Golden Layout 연동 (주석처리)
// ============================================================================

/*
// Golden Layout 연동을 위한 브릿지 함수들

export function attachChartToGoldenLayout(chartWrapper, container) {
    // Golden Layout 컨테이너 이벤트 연결
    container.on('resize', () => {
        chartWrapper.resize();
    });

    container.on('destroy', () => {
        chartWrapper.destroy();
    });

    container.on('show', () => {
        chartWrapper.emit('show', {});
    });

    container.on('hide', () => {
        chartWrapper.emit('hide', {});
    });

    console.log('[GOLDEN_LAYOUT_BRIDGE] 차트를 Golden Layout에 연결');
}

export function detachChartFromGoldenLayout(chartWrapper, container) {
    // 이벤트 리스너 제거
    container.off('resize');
    container.off('destroy');
    container.off('show');
    container.off('hide');

    console.log('[GOLDEN_LAYOUT_BRIDGE] Golden Layout 연결 해제');
}

export function createGoldenLayoutConfig(chartConfig) {
    // Golden Layout용 설정 생성
    return {
        type: 'component',
        componentName: 'chart',
        componentState: {
            chartConfig: chartConfig
        },
        title: chartConfig.title || 'Chart',
        isClosable: true,
        reorderEnabled: true
    };
}
*/