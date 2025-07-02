// ============================================================================
// chart_gen/unified/chart_wrapper.js - ���� ��ü Ŭ����
// ============================================================================

import { ResizeManager } from './resize_manager.js';

/**
 * Chart.js �ν��Ͻ��� ���δ� ���� Ŭ����
 * �̺�Ʈ, ��������, �޸� ���� ���� ���
 */
export class ChartWrapper {
    constructor(chartInstance, containerElement, config) {
        this.chart = chartInstance;
        this.container = containerElement;
        this.config = config;
        this.callbacks = {};
        this.isDestroyed = false;

        // ResizeManager �ʱ�ȭ
        this.resizeManager = new ResizeManager(this.container, () => {
            this.resize();
        });

        console.log('[CHART_WRAPPER] ���� ��ü ���� �Ϸ�');
    }

    /**
     * �̺�Ʈ ������ ��� (�ݹ� �Լ� ���)
     * @param {string} eventType - �̺�Ʈ Ÿ�� ('dataUpdated', 'resized', 'error', 'destroyed')
     * @param {Function} callback - �ݹ� �Լ�
     */
    on(eventType, callback) {
        if (!this.callbacks[eventType]) {
            this.callbacks[eventType] = [];
        }
        this.callbacks[eventType].push(callback);
    }

    /**
     * �̺�Ʈ ������ ����
     * @param {string} eventType - �̺�Ʈ Ÿ��
     * @param {Function} callback - ������ �ݹ� �Լ�
     */
    off(eventType, callback) {
        if (this.callbacks[eventType]) {
            const index = this.callbacks[eventType].indexOf(callback);
            if (index > -1) {
                this.callbacks[eventType].splice(index, 1);
            }
        }
    }

    /**
     * �̺�Ʈ �߻���Ű��
     * @param {string} eventType - �̺�Ʈ Ÿ��
     * @param {*} data - �̺�Ʈ ������
     */
    emit(eventType, data) {
        if (this.callbacks[eventType]) {
            this.callbacks[eventType].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`[CHART_WRAPPER] �̺�Ʈ �ݹ� ���� (${eventType}):`, error);
                }
            });
        }
    }

    /**
     * ������ ������Ʈ
     * @param {Array} newData - ���ο� ������
     */
    updateData(newData) {
        if (this.isDestroyed) {
            console.warn('[CHART_WRAPPER] �ı��� ��Ʈ�� ������ ������Ʈ �õ�');
            return;
        }

        try {
            // Chart.js ������ ������Ʈ
            if (this.chart.data.datasets && this.chart.data.datasets[0]) {
                this.chart.data.datasets[0].data = newData;
                this.chart.update('none'); // �ִϸ��̼� ���� ������Ʈ
            }

            this.emit('dataUpdated', newData);
            console.log('[CHART_WRAPPER] ������ ������Ʈ �Ϸ�:', newData.length, '��');

        } catch (error) {
            console.error('[CHART_WRAPPER] ������ ������Ʈ ����:', error);
            this.emit('error', error);
        }
    }

    /**
     * ��Ʈ ũ�� ����
     */
    resize() {
        if (this.isDestroyed || !this.chart) {
            return;
        }

        try {
            // �����̳� ũ�� ��������
            const rect = this.container.getBoundingClientRect();

            // ĵ���� ũ�� ���� ����
            const canvas = this.chart.canvas;
            if (canvas) {
                canvas.style.width = rect.width + 'px';
                canvas.style.height = rect.height + 'px';
                canvas.width = rect.width;
                canvas.height = rect.height;
            }

            this.emit('resized', { width: rect.width, height: rect.height });
            console.log('[CHART_WRAPPER] ũ�� ����:', rect.width, 'x', rect.height);

        } catch (error) {
            console.error('[CHART_WRAPPER] ũ�� ���� ����:', error);
            this.emit('error', error);
        }
    }

    /**
     * ���� ���� ��ȯ
     */
    getConfig() {
        return { ...this.config };
    }

    /**
     * ��Ʈ �� ���� ���ҽ� ����
     */
    destroy() {
        if (this.isDestroyed) {
            return;
        }

        try {
            // ResizeManager ����
            if (this.resizeManager) {
                this.resizeManager.destroy();
                this.resizeManager = null;
            }

            // Chart.js �ν��Ͻ� ����
            if (this.chart) {
                this.chart.destroy();
                this.chart = null;
            }

            // �̺�Ʈ ������ ��� ����
            this.callbacks = {};

            this.isDestroyed = true;
            this.emit('destroyed', {});

            console.log('[CHART_WRAPPER] ���� ��ü ���� �Ϸ�');

        } catch (error) {
            console.error('[CHART_WRAPPER] ���� ���� ����:', error);
        }
    }

    // Golden Layout ���� �غ� (�ּ�ó��)
    /*
    attachToGoldenLayout(container) {
        // Golden Layout �����̳� �̺�Ʈ ����
        container.on('resize', () => this.resize());
        container.on('destroy', () => this.destroy());
        container.on('show', () => this.emit('show', {}));
        container.on('hide', () => this.emit('hide', {}));
    }

    detachFromGoldenLayout() {
        // Golden Layout �̺�Ʈ ���� ����
    }
    */
}