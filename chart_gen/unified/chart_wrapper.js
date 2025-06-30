// ============================================================================
// chart_gen/unified/chart_wrapper.js - 래퍼 객체 클래스
// ============================================================================

import { ResizeManager } from './resize_manager.js';

/**
 * Chart.js 인스턴스를 감싸는 래퍼 클래스
 * 이벤트, 리사이즈, 메모리 관리 등을 담당
 */
export class ChartWrapper {
    constructor(chartInstance, containerElement, config) {
        this.chart = chartInstance;
        this.container = containerElement;
        this.config = config;
        this.callbacks = {};
        this.isDestroyed = false;

        // ResizeManager 초기화
        this.resizeManager = new ResizeManager(this.container, () => {
            this.resize();
        });

        console.log('[CHART_WRAPPER] 래퍼 객체 생성 완료');
    }

    /**
     * 이벤트 리스너 등록 (콜백 함수 방식)
     * @param {string} eventType - 이벤트 타입 ('dataUpdated', 'resized', 'error', 'destroyed')
     * @param {Function} callback - 콜백 함수
     */
    on(eventType, callback) {
        if (!this.callbacks[eventType]) {
            this.callbacks[eventType] = [];
        }
        this.callbacks[eventType].push(callback);
    }

    /**
     * 이벤트 리스너 제거
     * @param {string} eventType - 이벤트 타입
     * @param {Function} callback - 제거할 콜백 함수
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
     * 이벤트 발생시키기
     * @param {string} eventType - 이벤트 타입
     * @param {*} data - 이벤트 데이터
     */
    emit(eventType, data) {
        if (this.callbacks[eventType]) {
            this.callbacks[eventType].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`[CHART_WRAPPER] 이벤트 콜백 오류 (${eventType}):`, error);
                }
            });
        }
    }

    /**
     * 데이터 업데이트
     * @param {Array} newData - 새로운 데이터
     */
    updateData(newData) {
        if (this.isDestroyed) {
            console.warn('[CHART_WRAPPER] 파괴된 차트에 데이터 업데이트 시도');
            return;
        }

        try {
            // Chart.js 데이터 업데이트
            if (this.chart.data.datasets && this.chart.data.datasets[0]) {
                this.chart.data.datasets[0].data = newData;
                this.chart.update('none'); // 애니메이션 없이 업데이트
            }

            this.emit('dataUpdated', newData);
            console.log('[CHART_WRAPPER] 데이터 업데이트 완료:', newData.length, '개');

        } catch (error) {
            console.error('[CHART_WRAPPER] 데이터 업데이트 오류:', error);
            this.emit('error', error);
        }
    }

    /**
     * 차트 크기 조정
     */
    resize() {
        if (this.isDestroyed || !this.chart) {
            return;
        }

        try {
            // 컨테이너 크기 가져오기
            const rect = this.container.getBoundingClientRect();

            // 캔버스 크기 강제 설정
            const canvas = this.chart.canvas;
            if (canvas) {
                canvas.style.width = rect.width + 'px';
                canvas.style.height = rect.height + 'px';
                canvas.width = rect.width;
                canvas.height = rect.height;
            }

            this.emit('resized', { width: rect.width, height: rect.height });
            console.log('[CHART_WRAPPER] 크기 조정:', rect.width, 'x', rect.height);

        } catch (error) {
            console.error('[CHART_WRAPPER] 크기 조정 오류:', error);
            this.emit('error', error);
        }
    }

    /**
     * 설정 정보 반환
     */
    getConfig() {
        return { ...this.config };
    }

    /**
     * 차트 및 관련 리소스 정리
     */
    destroy() {
        if (this.isDestroyed) {
            return;
        }

        try {
            // ResizeManager 정리
            if (this.resizeManager) {
                this.resizeManager.destroy();
                this.resizeManager = null;
            }

            // Chart.js 인스턴스 정리
            if (this.chart) {
                this.chart.destroy();
                this.chart = null;
            }

            // 이벤트 리스너 모두 제거
            this.callbacks = {};

            this.isDestroyed = true;
            this.emit('destroyed', {});

            console.log('[CHART_WRAPPER] 래퍼 객체 정리 완료');

        } catch (error) {
            console.error('[CHART_WRAPPER] 정리 과정 오류:', error);
        }
    }

    // Golden Layout 연동 준비 (주석처리)
    /*
    attachToGoldenLayout(container) {
        // Golden Layout 컨테이너 이벤트 연결
        container.on('resize', () => this.resize());
        container.on('destroy', () => this.destroy());
        container.on('show', () => this.emit('show', {}));
        container.on('hide', () => this.emit('hide', {}));
    }

    detachFromGoldenLayout() {
        // Golden Layout 이벤트 연결 해제
    }
    */
}