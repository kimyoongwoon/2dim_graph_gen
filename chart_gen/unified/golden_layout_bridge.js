// ============================================================================
// chart_gen/unified/golden_layout_bridge.js - Golden Layout ���� (�ּ�ó��)
// ============================================================================

/*
// Golden Layout ������ ���� �긴�� �Լ���

export function attachChartToGoldenLayout(chartWrapper, container) {
    // Golden Layout �����̳� �̺�Ʈ ����
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

    console.log('[GOLDEN_LAYOUT_BRIDGE] ��Ʈ�� Golden Layout�� ����');
}

export function detachChartFromGoldenLayout(chartWrapper, container) {
    // �̺�Ʈ ������ ����
    container.off('resize');
    container.off('destroy');
    container.off('show');
    container.off('hide');

    console.log('[GOLDEN_LAYOUT_BRIDGE] Golden Layout ���� ����');
}

export function createGoldenLayoutConfig(chartConfig) {
    // Golden Layout�� ���� ����
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