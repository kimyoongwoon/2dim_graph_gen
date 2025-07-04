// ============================================================================
// chart_gen/unified/resize_manager.js - ResizeObserver 관리
// ============================================================================

/**
 * ResizeObserver를 관리하는 클래스
 */
export class ResizeManager {
    constructor(element, callback) {
        this.element = element;
        this.callback = callback;
        this.observer = null;
        this.isDestroyed = false;

        this.init();
    }

    init() {
        if (!this.element || this.isDestroyed) return;

        try {
            // ResizeObserver 생성
            this.observer = new ResizeObserver(entries => {
                if (this.isDestroyed) return;

                for (const entry of entries) {
                    if (entry.target === this.element) {
                        this.callback();
                        break;
                    }
                }
            });

            // 요소 관찰 시작
            this.observer.observe(this.element);
            console.log('[RESIZE_MANAGER] ResizeObserver 시작');

        } catch (error) {
            console.error('[RESIZE_MANAGER] 초기화 오류:', error);
        }
    }

    destroy() {
        if (this.isDestroyed) return;

        try {
            if (this.observer) {
                this.observer.disconnect();
                this.observer = null;
            }

            this.element = null;
            this.callback = null;
            this.isDestroyed = true;

            console.log('[RESIZE_MANAGER] ResizeObserver 정리 완료');

        } catch (error) {
            console.error('[RESIZE_MANAGER] 정리 오류:', error);
        }
    }
}
