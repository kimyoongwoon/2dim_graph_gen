// ============================================================================
// 3dim_chart_gen/unified/resize_manager_3d.js - 3D 차트 리사이즈 관리 (Plotly 전용)
// ============================================================================

/**
 * Plotly 3D 차트용 ResizeObserver 관리 클래스
 */
export class ResizeManager3D {
    constructor(element, plotlyDiv, callback) {
        this.element = element;
        this.plotlyDiv = plotlyDiv;
        this.callback = callback;
        this.observer = null;
        this.isDestroyed = false;
        this.resizeTimeout = null;

        this.init();
    }

    init() {
        if (!this.element || this.isDestroyed) return;

        try {
            // ResizeObserver 생성
            this.observer = new ResizeObserver(entries => {
                if (this.isDestroyed) return;

                // 디바운스 처리로 성능 최적화
                if (this.resizeTimeout) {
                    clearTimeout(this.resizeTimeout);
                }

                this.resizeTimeout = setTimeout(() => {
                    this.handleResize();
                }, 100); // 100ms 디바운스
            });

            // 요소 관찰 시작
            this.observer.observe(this.element);
            console.log('[RESIZE_MANAGER_3D] Plotly ResizeObserver 시작');

        } catch (error) {
            console.error('[RESIZE_MANAGER_3D] 초기화 오류:', error);
        }
    }

    handleResize() {
        if (this.isDestroyed || !this.plotlyDiv) return;

        try {
            // Plotly 리사이즈 처리
            if (window.Plotly && this.plotlyDiv) {
                window.Plotly.Plots.resize(this.plotlyDiv);
                console.log('[RESIZE_MANAGER_3D] Plotly 차트 리사이즈 완료');
            }

            // 커스텀 콜백 실행
            if (this.callback && typeof this.callback === 'function') {
                this.callback();
            }

        } catch (error) {
            console.error('[RESIZE_MANAGER_3D] 리사이즈 처리 오류:', error);
        }
    }

    /**
     * 수동 리사이즈 트리거
     */
    triggerResize() {
        console.log('[RESIZE_MANAGER_3D] 수동 리사이즈 트리거');
        this.handleResize();
    }

    /**
     * 특정 크기로 리사이즈
     * @param {number} width - 너비
     * @param {number} height - 높이
     */
    resizeToSize(width, height) {
        if (this.isDestroyed || !this.plotlyDiv) return;

        try {
            // 컨테이너 크기 설정
            if (this.element) {
                this.element.style.width = width + 'px';
                this.element.style.height = height + 'px';
            }

            // Plotly 차트 크기 설정
            if (window.Plotly && this.plotlyDiv) {
                window.Plotly.relayout(this.plotlyDiv, {
                    width: width,
                    height: height
                });
                console.log('[RESIZE_MANAGER_3D] Plotly 차트 크기 설정:', { width, height });
            }

        } catch (error) {
            console.error('[RESIZE_MANAGER_3D] 크기 설정 오류:', error);
        }
    }

    /**
     * 현재 컨테이너 크기 가져오기
     * @returns {Object} { width, height }
     */
    getCurrentSize() {
        if (!this.element) {
            return { width: 0, height: 0 };
        }

        const rect = this.element.getBoundingClientRect();
        return {
            width: rect.width,
            height: rect.height
        };
    }

    /**
     * 화면 전체 크기로 리사이즈
     */
    resizeToFullscreen() {
        const { width, height } = this.getViewportSize();
        this.resizeToSize(width, height);
        console.log('[RESIZE_MANAGER_3D] 전체화면 리사이즈:', { width, height });
    }

    /**
     * 뷰포트 크기 가져오기
     * @returns {Object} { width, height }
     */
    getViewportSize() {
        return {
            width: window.innerWidth,
            height: window.innerHeight
        };
    }

    /**
     * Plotly 차트 업데이트와 함께 리사이즈
     * @param {Object} updateData - Plotly 업데이트 데이터
     */
    updateAndResize(updateData) {
        if (this.isDestroyed || !this.plotlyDiv) return;

        try {
            if (window.Plotly) {
                // 데이터 업데이트 후 리사이즈
                window.Plotly.react(this.plotlyDiv, updateData).then(() => {
                    this.triggerResize();
                });
            }
        } catch (error) {
            console.error('[RESIZE_MANAGER_3D] 업데이트&리사이즈 오류:', error);
        }
    }

    destroy() {
        if (this.isDestroyed) return;

        try {
            // 타이머 정리
            if (this.resizeTimeout) {
                clearTimeout(this.resizeTimeout);
                this.resizeTimeout = null;
            }

            // ResizeObserver 정리
            if (this.observer) {
                this.observer.disconnect();
                this.observer = null;
            }

            this.element = null;
            this.plotlyDiv = null;
            this.callback = null;
            this.isDestroyed = true;

            console.log('[RESIZE_MANAGER_3D] Plotly ResizeManager 정리 완료');

        } catch (error) {
            console.error('[RESIZE_MANAGER_3D] 정리 오류:', error);
        }
    }
}

/**
 * 전역 Plotly 리사이즈 유틸리티 함수들
 */

/**
 * 모든 Plotly 차트 리사이즈
 */
export function resizeAllPlotlyCharts() {
    if (window.Plotly) {
        const plotlyDivs = document.querySelectorAll('[id*="plotly"]');
        plotlyDivs.forEach(div => {
            try {
                window.Plotly.Plots.resize(div);
            } catch (error) {
                console.warn('[RESIZE_MANAGER_3D] 개별 차트 리사이즈 실패:', error);
            }
        });
        console.log('[RESIZE_MANAGER_3D] 전체 Plotly 차트 리사이즈 완료:', plotlyDivs.length, '개');
    }
}

/**
 * Plotly 차트 응답성 설정
 * @param {HTMLElement} plotlyDiv - Plotly 차트 div
 * @param {boolean} responsive - 응답성 여부
 */
export function setPlotlyResponsive(plotlyDiv, responsive = true) {
    if (!plotlyDiv || !window.Plotly) return;

    try {
        const update = {
            responsive: responsive,
            autosize: responsive
        };

        window.Plotly.relayout(plotlyDiv, update);
        console.log('[RESIZE_MANAGER_3D] Plotly 응답성 설정:', responsive);

    } catch (error) {
        console.error('[RESIZE_MANAGER_3D] 응답성 설정 오류:', error);
    }
}