// ============================================================================
// chart_gen/unified/resize_manager.js - ResizeObserver ����
// ============================================================================

/**
 * ResizeObserver�� �����ϴ� Ŭ����
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
            // ResizeObserver ����
            this.observer = new ResizeObserver(entries => {
                if (this.isDestroyed) return;

                for (const entry of entries) {
                    if (entry.target === this.element) {
                        this.callback();
                        break;
                    }
                }
            });

            // ��� ���� ����
            this.observer.observe(this.element);
            console.log('[RESIZE_MANAGER] ResizeObserver ����');

        } catch (error) {
            console.error('[RESIZE_MANAGER] �ʱ�ȭ ����:', error);
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

            console.log('[RESIZE_MANAGER] ResizeObserver ���� �Ϸ�');

        } catch (error) {
            console.error('[RESIZE_MANAGER] ���� ����:', error);
        }
    }
}
