// ============================================================================
// 2dim_chart_gen/unified/chart_wrapper.js - 단순화된 차트 래퍼
// ============================================================================

/**
 * 단순화된 차트 래퍼 클래스
 * 업데이트 기능 제거, 기본적인 관리 기능만 제공
 */
export class ChartWrapper {
    constructor(chartInstance, containerElement) {
        this.chart = chartInstance;
        this.container = containerElement;
        this.isDestroyed = false;

        // Chart.js 인스턴스에 래퍼 참조 연결 (정리 시 사용)
        if (this.chart && this.chart.canvas) {
            this.chart.canvas.chart = this.chart;
        }

        console.log('[CHART_WRAPPER] 래퍼 객체 생성 완료');
    }

    /**
     * Chart.js 인스턴스 반환
     * @returns {Chart|null} Chart.js 인스턴스
     */
    getChart() {
        if (this.isDestroyed) {
            console.warn('[CHART_WRAPPER] 이미 정리된 차트에 접근 시도');
            return null;
        }
        return this.chart;
    }

    /**
     * 차트 수동 리사이즈
     * 외부에서 컨테이너 크기가 변경된 경우 호출
     */
    resize() {
        if (this.isDestroyed || !this.chart) {
            console.warn('[CHART_WRAPPER] 정리된 차트 리사이즈 시도');
            return;
        }

        try {
            // Chart.js 내장 리사이즈 사용
            this.chart.resize();
            console.log('[CHART_WRAPPER] 차트 리사이즈 완료');
            
        } catch (error) {
            console.error('[CHART_WRAPPER] 리사이즈 실패:', error);
        }
    }

    /**
     * 차트 정리 및 메모리 해제
     */
    destroy() {
        if (this.isDestroyed) {
            console.warn('[CHART_WRAPPER] 이미 정리된 차트 정리 시도');
            return;
        }

        try {
            // Chart.js 인스턴스 정리
            if (this.chart) {
                this.chart.destroy();
                this.chart = null;
            }

            // 컨테이너 정리 (선택적)
            if (this.container) {
                const canvas = this.container.querySelector('canvas');
                if (canvas) {
                    canvas.remove();
                }
            }

            // 상태 업데이트
            this.container = null;
            this.isDestroyed = true;

            console.log('[CHART_WRAPPER] 차트 정리 완료');

        } catch (error) {
            console.error('[CHART_WRAPPER] 정리 과정 오류:', error);
        }
    }

    /**
     * 차트 상태 확인
     * @returns {boolean} 차트가 유효한지 여부
     */
    isValid() {
        return !this.isDestroyed && this.chart !== null;
    }

    /**
     * 컨테이너 요소 반환
     * @returns {HTMLElement|null} 컨테이너 요소
     */
    getContainer() {
        return this.isDestroyed ? null : this.container;
    }

    /**
     * 차트 기본 정보 반환
     * @returns {Object} 차트 정보
     */
    getInfo() {
        if (this.isDestroyed) {
            return { status: 'destroyed' };
        }

        return {
            status: 'active',
            type: this.chart?.config?.type || 'unknown',
            datasetCount: this.chart?.data?.datasets?.length || 0,
            pointCount: this.chart?.data?.datasets?.[0]?.data?.length || 0
        };
    }
}