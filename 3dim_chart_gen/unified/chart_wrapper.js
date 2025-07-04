// ============================================================================
// 3dim_chart_gen/unified/chart_wrapper.js - 통합 차트 래퍼 (2D/3D/4D)
// ============================================================================

/**
 * Plotly 차트를 감싸는 통합 래퍼 클래스 (2D/3D/4D 지원)
 * 🔥 경량화: ResizeManager 제거, Plotly responsive만 사용
 */
export class ChartWrapper {
    constructor(plotlyDiv, containerElement, config, chartData) {
        this.plotlyDiv = plotlyDiv;           // Plotly div 엘리먼트
        this.container = containerElement;    // 컨테이너 엘리먼트
        this.config = config;                 // 차트 설정
        this.chartData = chartData;           // 현재 차트 데이터
        this.callbacks = {};                  // 이벤트 콜백들
        this.isDestroyed = false;
        this.chartType = config.type || 'unknown';

        // 🔥 경량화: Plotly responsive 설정만 사용
        this.setupResponsive();

        console.log('[CHART_WRAPPER] 통합 차트 래퍼 생성 완료 (responsive):', this.chartType);
    }

    /**
     * Plotly responsive 설정 (ResizeManager 대체)
     */
    setupResponsive() {
        if (this.plotlyDiv && window.Plotly) {
            // Plotly 자체 responsive 기능 활성화
            window.Plotly.relayout(this.plotlyDiv, {
                responsive: true,
                autosize: true
            });
            console.log('[CHART_WRAPPER] Plotly responsive 설정 완료');
        }
    }

    /**
     * 이벤트 리스너 등록
     * @param {string} eventType - 이벤트 타입 ('dataUpdated', 'resized', 'error', 'destroyed', 'dataLimited')
     * @param {Function} callback - 콜백 함수
     */
    on(eventType, callback) {
        if (!this.callbacks[eventType]) {
            this.callbacks[eventType] = [];
        }
        this.callbacks[eventType].push(callback);
        console.log('[CHART_WRAPPER] 이벤트 리스너 등록:', eventType);
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
                console.log('[CHART_WRAPPER] 이벤트 리스너 제거:', eventType);
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
            // 조건부 데이터 제한 적용 (3d_surface_scatter만)
            let processedData = newData;
            if (this.chartType === '3d_surface_scatter' && Array.isArray(newData)) {
                processedData = newData.slice(0, 16);
                console.log('[CHART_WRAPPER] 3D Surface 데이터 제한:', 
                    `${newData.length}개 → ${processedData.length}개`);
            }
            
            console.log('[CHART_WRAPPER] 데이터 업데이트:', 
                Array.isArray(newData) ? `${newData.length}개 데이터` : '새 데이터');

            // Plotly 차트 업데이트
            if (window.Plotly && this.plotlyDiv) {
                // 새 데이터로 차트 재생성 (react 사용)
                window.Plotly.react(this.plotlyDiv, processedData);
                
                this.chartData = processedData;
                this.emit('dataUpdated', processedData);
                
                console.log('[CHART_WRAPPER] Plotly 차트 데이터 업데이트 완료');
            }

        } catch (error) {
            console.error('[CHART_WRAPPER] 데이터 업데이트 오류:', error);
            this.emit('error', error);
        }
    }

    /**
     * 차트 크기 조정 (🔥 경량화: responsive가 자동 처리)
     */
    resize() {
        if (this.isDestroyed || !this.plotlyDiv) {
            return;
        }

        try {
            // 🔥 경량화: Plotly responsive가 자동 처리하므로 수동 resize는 특별한 경우만
            if (window.Plotly) {
                window.Plotly.Plots.resize(this.plotlyDiv);
            }
            
            console.log('[CHART_WRAPPER] 수동 리사이즈 실행 (보통은 responsive 자동 처리)');

        } catch (error) {
            console.error('[CHART_WRAPPER] 크기 조정 오류:', error);
            this.emit('error', error);
        }
    }

    /**
     * 현재 차트 크기 가져오기
     * @returns {Object} { width, height }
     */
    getCurrentSize() {
        if (this.container) {
            const rect = this.container.getBoundingClientRect();
            return {
                width: rect.width,
                height: rect.height
            };
        }
        return { width: 0, height: 0 };
    }

    /**
     * 설정 정보 반환
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
     * 차트 타입 반환
     */
    getChartType() {
        return this.chartType;
    }

    /**
     * 차트별 특수 기능들 (2D/3D/4D 공통)
     */

    /**
     * 차트 표시/숨김 토글 (3D 차트용)
     * @param {string} traceType - 'surface' 또는 'scatter3d'
     * @param {boolean} visible - 표시 여부
     */
    toggleTrace(traceType, visible) {
        if (this.isDestroyed || !this.plotlyDiv || !window.Plotly) {
            return;
        }

        // 3D 차트에서만 동작
        if (!this.chartType.startsWith('3d_')) {
            console.warn('[CHART_WRAPPER] toggleTrace는 3D 차트에서만 지원됩니다');
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
                console.log('[CHART_WRAPPER] Trace 가시성 변경:', { traceType, visible, indices: traceIndices });
            }

        } catch (error) {
            console.error('[CHART_WRAPPER] Trace 토글 오류:', error);
            this.emit('error', error);
        }
    }

    /**
     * 차트 투명도 조정 (3D 차트용)
     * @param {number} surfaceOpacity - Surface 투명도
     * @param {number} scatterOpacity - Scatter 투명도
     */
    adjustOpacity(surfaceOpacity = 0.7, scatterOpacity = 0.8) {
        if (this.isDestroyed || !this.plotlyDiv || !window.Plotly) {
            return;
        }

        // 3D 차트에서만 동작
        if (!this.chartType.startsWith('3d_')) {
            console.warn('[CHART_WRAPPER] adjustOpacity는 3D 차트에서만 지원됩니다');
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

            console.log('[CHART_WRAPPER] 투명도 조정:', { surfaceOpacity, scatterOpacity });

        } catch (error) {
            console.error('[CHART_WRAPPER] 투명도 조정 오류:', error);
            this.emit('error', error);
        }
    }

    /**
     * 카메라 시점 설정 (3D 차트용)
     * @param {Object} cameraPosition - { eye: {x, y, z}, center: {x, y, z} }
     */
    setCameraPosition(cameraPosition) {
        if (this.isDestroyed || !this.plotlyDiv || !window.Plotly) {
            return;
        }

        // 3D 차트에서만 동작
        if (!this.chartType.startsWith('3d_')) {
            console.warn('[CHART_WRAPPER] setCameraPosition은 3D 차트에서만 지원됩니다');
            return;
        }

        try {
            window.Plotly.relayout(this.plotlyDiv, {
                'scene.camera': cameraPosition
            });

            console.log('[CHART_WRAPPER] 카메라 위치 설정:', cameraPosition);

        } catch (error) {
            console.error('[CHART_WRAPPER] 카메라 설정 오류:', error);
            this.emit('error', error);
        }
    }

    /**
     * 차트 및 관련 리소스 정리
     */
    destroy() {
        if (this.isDestroyed) {
            return;
        }

        try {
            // 🔥 경량화: ResizeManager 없음, Plotly만 정리

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

            console.log('[CHART_WRAPPER] 차트 래퍼 정리 완료 (경량화)');

        } catch (error) {
            console.error('[CHART_WRAPPER] 정리 과정 오류:', error);
        }
    }
}