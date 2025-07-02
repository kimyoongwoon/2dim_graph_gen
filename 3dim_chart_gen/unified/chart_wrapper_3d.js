// ============================================================================
// 3dim_chart_gen/unified/chart_wrapper_3d.js - 3D 차트 래퍼 클래스 (Plotly 전용)
// ============================================================================

import { ResizeManager3D } from './resize_manager_3d.js';

/**
 * Plotly 3D 차트를 감싸는 래퍼 클래스 (2D ChartWrapper와 동일한 인터페이스)
 */
export class ChartWrapper3D {
    constructor(plotlyDiv, containerElement, config, chartData) {
        this.plotlyDiv = plotlyDiv;           // Plotly div 엘리먼트
        this.container = containerElement;    // 컨테이너 엘리먼트
        this.config = config;                 // 차트 설정
        this.chartData = chartData;           // 현재 차트 데이터
        this.callbacks = {};                  // 이벤트 콜백들
        this.isDestroyed = false;

        // ResizeManager 초기화
        this.resizeManager = new ResizeManager3D(
            this.container, 
            this.plotlyDiv,
            () => this.emit('resized', this.getCurrentSize())
        );

        console.log('[CHART_WRAPPER_3D] 3D 차트 래퍼 생성 완료');
    }

    /**
     * 이벤트 리스너 등록 (2D와 동일한 인터페이스)
     * @param {string} eventType - 이벤트 타입 ('dataUpdated', 'resized', 'error', 'destroyed')
     * @param {Function} callback - 콜백 함수
     */
    on(eventType, callback) {
        if (!this.callbacks[eventType]) {
            this.callbacks[eventType] = [];
        }
        this.callbacks[eventType].push(callback);
        console.log('[CHART_WRAPPER_3D] 이벤트 리스너 등록:', eventType);
    }

    /**
     * 이벤트 리스너 제거 (2D와 동일한 인터페이스)
     * @param {string} eventType - 이벤트 타입
     * @param {Function} callback - 제거할 콜백 함수
     */
    off(eventType, callback) {
        if (this.callbacks[eventType]) {
            const index = this.callbacks[eventType].indexOf(callback);
            if (index > -1) {
                this.callbacks[eventType].splice(index, 1);
                console.log('[CHART_WRAPPER_3D] 이벤트 리스너 제거:', eventType);
            }
        }
    }

    /**
     * 이벤트 발생시키기 (2D와 동일한 인터페이스)
     * @param {string} eventType - 이벤트 타입
     * @param {*} data - 이벤트 데이터
     */
    emit(eventType, data) {
        if (this.callbacks[eventType]) {
            this.callbacks[eventType].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`[CHART_WRAPPER_3D] 이벤트 콜백 오류 (${eventType}):`, error);
                }
            });
        }
    }

    /**
     * 데이터 업데이트 (2D와 동일한 인터페이스)
     * @param {Array} newData - 새로운 데이터
     */
    updateData(newData) {
        if (this.isDestroyed) {
            console.warn('[CHART_WRAPPER_3D] 파괴된 차트에 데이터 업데이트 시도');
            return;
        }

        try {
            // 3D 데이터 제한 적용 (16개)
            const limitedData = Array.isArray(newData) ? newData.slice(0, 16) : newData;
            
            console.log('[CHART_WRAPPER_3D] 데이터 업데이트:', 
                Array.isArray(newData) ? `${newData.length}개 → ${limitedData.length}개` : '새 데이터');

            // Plotly 차트 업데이트
            if (window.Plotly && this.plotlyDiv) {
                // 새 데이터로 차트 재생성 (react 사용)
                window.Plotly.react(this.plotlyDiv, limitedData);
                
                this.chartData = limitedData;
                this.emit('dataUpdated', limitedData);
                
                console.log('[CHART_WRAPPER_3D] Plotly 차트 데이터 업데이트 완료');
            }

        } catch (error) {
            console.error('[CHART_WRAPPER_3D] 데이터 업데이트 오류:', error);
            this.emit('error', error);
        }
    }

    /**
     * 차트 크기 조정 (2D와 동일한 인터페이스)
     */
    resize() {
        if (this.isDestroyed || !this.plotlyDiv) {
            return;
        }

        try {
            // ResizeManager를 통한 리사이즈
            this.resizeManager.triggerResize();
            
            const size = this.getCurrentSize();
            console.log('[CHART_WRAPPER_3D] 차트 크기 조정:', size);

        } catch (error) {
            console.error('[CHART_WRAPPER_3D] 크기 조정 오류:', error);
            this.emit('error', error);
        }
    }

    /**
     * 현재 차트 크기 가져오기
     * @returns {Object} { width, height }
     */
    getCurrentSize() {
        if (this.resizeManager) {
            return this.resizeManager.getCurrentSize();
        }
        return { width: 0, height: 0 };
    }

    /**
     * 설정 정보 반환 (2D와 동일한 인터페이스)
     */
    getConfig() {
        return { ...this.config };
    }

    /**
     * 현재 데이터 반환
     */
    getData() {
        return this.chartData;
    }

    /**
     * Plotly 특정 기능들
     */

    /**
     * 차트 표시/숨김 토글
     * @param {string} traceType - 'surface' 또는 'scatter3d'
     * @param {boolean} visible - 표시 여부
     */
    toggleTrace(traceType, visible) {
        if (this.isDestroyed || !this.plotlyDiv || !window.Plotly) {
            return;
        }

        try {
            // Plotly의 restyle을 사용하여 trace 가시성 변경
            const traceIndices = [];
            
            if (this.chartData && this.chartData.data) {
                this.chartData.data.forEach((trace, index) => {
                    if (trace.type === traceType) {
                        traceIndices.push(index);
                    }
                });
            }

            if (traceIndices.length > 0) {
                window.Plotly.restyle(this.plotlyDiv, { visible: visible }, traceIndices);
                console.log('[CHART_WRAPPER_3D] Trace 가시성 변경:', { traceType, visible, indices: traceIndices });
            }

        } catch (error) {
            console.error('[CHART_WRAPPER_3D] Trace 토글 오류:', error);
            this.emit('error', error);
        }
    }

    /**
     * 차트 투명도 조정
     * @param {number} surfaceOpacity - Surface 투명도
     * @param {number} scatterOpacity - Scatter 투명도
     */
    adjustOpacity(surfaceOpacity = 0.7, scatterOpacity = 0.8) {
        if (this.isDestroyed || !this.plotlyDiv || !window.Plotly) {
            return;
        }

        try {
            if (this.chartData && this.chartData.data) {
                this.chartData.data.forEach((trace, index) => {
                    if (trace.type === 'surface') {
                        window.Plotly.restyle(this.plotlyDiv, { opacity: surfaceOpacity }, [index]);
                    } else if (trace.type === 'scatter3d') {
                        window.Plotly.restyle(this.plotlyDiv, { 'marker.opacity': scatterOpacity }, [index]);
                    }
                });
            }

            console.log('[CHART_WRAPPER_3D] 투명도 조정:', { surfaceOpacity, scatterOpacity });

        } catch (error) {
            console.error('[CHART_WRAPPER_3D] 투명도 조정 오류:', error);
            this.emit('error', error);
        }
    }

    /**
     * 카메라 시점 설정
     * @param {Object} cameraPosition - { eye: {x, y, z}, center: {x, y, z} }
     */
    setCameraPosition(cameraPosition) {
        if (this.isDestroyed || !this.plotlyDiv || !window.Plotly) {
            return;
        }

        try {
            window.Plotly.relayout(this.plotlyDiv, {
                'scene.camera': cameraPosition
            });

            console.log('[CHART_WRAPPER_3D] 카메라 위치 설정:', cameraPosition);

        } catch (error) {
            console.error('[CHART_WRAPPER_3D] 카메라 설정 오류:', error);
            this.emit('error', error);
        }
    }

    /**
     * 차트 및 관련 리소스 정리 (2D와 동일한 인터페이스)
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

            // Plotly 차트 정리
            if (window.Plotly && this.plotlyDiv) {
                window.Plotly.purge(this.plotlyDiv);
            }

            // 이벤트 리스너 모두 제거
            this.callbacks = {};

            this.plotlyDiv = null;
            this.container = null;
            this.chartData = null;
            this.isDestroyed = true;

            this.emit('destroyed', {});

            console.log('[CHART_WRAPPER_3D] 3D 차트 래퍼 정리 완료');

        } catch (error) {
            console.error('[CHART_WRAPPER_3D] 정리 과정 오류:', error);
        }
    }
}