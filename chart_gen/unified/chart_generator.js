// ============================================================================
// chart_gen/unified/chart_generator.js - ���� ��Ʈ ���� �Լ�
// ============================================================================

import { processDataForChart } from './data_processor_unified.js';
import { ChartWrapper } from './chart_wrapper.js';
import { createVisualization } from '../chart_factory.js';
import { prepareDataForChart } from '../data_processor.js';
import { showError_chart } from './error_handler.js';

/**
 * ���� ��Ʈ ���� �Լ�
 * @param {Array} rawData - ���� ������
 * @param {Object} config - ��Ʈ ���� {type, dataMapping, options}
 * @param {HTMLElement} containerElement - �����̳� ������Ʈ
 * @returns {ChartWrapper} ��Ʈ ���� ��ü
 */
export function generateChart(rawData, config, containerElement) {
    console.log('[CHART_GENERATOR] ��Ʈ ���� ����');
    console.log('[CHART_GENERATOR] ����:', config);

    try {
        // �Է� ����
        if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
            throw new Error('��ȿ�� �����Ͱ� �����ϴ�');
        }

        if (!config || !config.type || !config.dataMapping) {
            throw new Error('��Ʈ ������ �ùٸ��� �ʽ��ϴ�');
        }

        if (!containerElement) {
            throw new Error('�����̳� ������Ʈ�� �ʿ��մϴ�');
        }

        // 1�ܰ�: ������ ó�� (������)
        const processedResult = processDataForChart(rawData, config.dataMapping);
        const { data: chartData, metadata } = processedResult;

        // 2�ܰ�: ���� �ý��ۿ� ������ �غ�
        const dataset = {
            name: `${config.type} Chart`,
            dimension: metadata.dim,
            axes: metadata.axes,
            dataType: `${metadata.dim}D`
        };

        const vizType = {
            name: config.type,
            type: config.type
        };

        // ���� prepareDataForChart �Լ� ���
        const preparedData = prepareDataForChart(
            chartData.map(point => [
                metadata.axes.map(axis => point[axis.name] || 0),
                point[metadata.axes[0]?.name] || 0
            ]),
            metadata.axes
        );

        // 3�ܰ�: ĵ���� ���� �� ����
        const canvas = document.createElement('canvas');
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';

        // �����̳� ��Ÿ�� ����
        containerElement.style.position = 'relative';
        containerElement.style.overflow = 'hidden';
        containerElement.appendChild(canvas);

        // 4�ܰ�: Chart.js ���� �غ�
        const chartConfig = createVisualization(
            dataset,
            vizType,
            preparedData,
            {}, // scalingConfig
            {}, // colorScalingConfig
            {}  // vizOptions
        );

        // ���� Chart.js �ɼ� ����
        chartConfig.options = {
            ...chartConfig.options,
            responsive: false,
            maintainAspectRatio: false,
            resizeDelay: 0,
            animation: { duration: 300 },
            ...config.options // ����� �ɼ� ����
        };

        // 5�ܰ�: Chart.js �ν��Ͻ� ����
        const chartInstance = new Chart(canvas, chartConfig);

        // 6�ܰ�: ���� ��ü ����
        const chartWrapper = new ChartWrapper(chartInstance, containerElement, config);

        console.log('[CHART_GENERATOR] ��Ʈ ���� �Ϸ�');
        return chartWrapper;

    } catch (error) {
        console.error('[CHART_GENERATOR] ��Ʈ ���� ����:', error);

        // ���� ��Ʈ ǥ��
        return showError_chart(containerElement, error.message);
    }
}
