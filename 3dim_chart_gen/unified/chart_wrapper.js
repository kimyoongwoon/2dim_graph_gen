// ============================================================================
// 3dim_chart_gen/unified/chart_wrapper.js - 통합 차트 래퍼 (2D/3D/4D)
// ============================================================================

/**
 * Plotly 차트를 감싸는 통합 래퍼 클래스 (2D/3D/4D 지원)
 * 🔥 경량화: ResizeManager 제거, Plotly responsive만 사용
 */
import { convertDataToTraces } from '../utils/plotly_helpers.js';

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
                // Convert data points back to Plotly traces
                const updatedTraces = convertDataToTraces(processedData, this.config);
                window.Plotly.react(this.plotlyDiv, updatedTraces, this.plotlyDiv.layout, this.plotlyDiv.config);

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

// ============================================================================
// 🆕 ChartWrapperEnhanced - 스페이스 키 + 드래그 기능 추가 (충돌 해결)
// ============================================================================

/**
 * 향상된 차트 래퍼 클래스 - 스페이스 키 + 마우스 드래그 기능 추가
 */
export class ChartWrapperEnhanced extends ChartWrapper {
    constructor(plotlyDiv, containerElement, config, chartData) {
        super(plotlyDiv, containerElement, config, chartData);

        // 🔥 Plotly 원본 설정 저장 (복구용)
        this.originalPlotlyConfig = null;

        // 스페이스 키 + 드래그 기능 설정
        this.setupSpaceDragInteraction();

        console.log('[CHART_WRAPPER_ENHANCED] 향상된 차트 래퍼 생성 완료 (스페이스 드래그 포함)');
    }

    /**
     * 🔥 스페이스 키 + 마우스 드래그로 차트 이동 기능 (충돌 해결)
     */
    setupSpaceDragInteraction() {
        if (!this.plotlyDiv) {
            console.warn('[CHART_WRAPPER_ENHANCED] plotlyDiv가 없어 드래그 기능을 설정할 수 없습니다');
            return;
        }

        let isSpacePressed = false;
        let isDragging = false;
        let lastMousePos = { x: 0, y: 0 };

        // 🔥 Plotly 원본 설정 저장
        this.saveOriginalPlotlyConfig();

        // 스페이스 키 감지
        const handleKeyDown = (e) => {
            if (e.code === 'Space' && !isSpacePressed && e.target.tagName !== 'INPUT' && e.target.tagName !== 'SELECT') {
                isSpacePressed = true;

                // Prevent button from being focused/activated
                const createChartBtn = document.getElementById('createChartBtn');
                if (createChartBtn) {
                    createChartBtn.blur(); // Remove focus
                }

                // 🔥 Plotly 인터랙션 비활성화
                this.disablePlotlyInteractions();

                this.plotlyDiv.style.cursor = 'grab';
                e.preventDefault();
                e.stopPropagation();
                console.log('[CHART_WRAPPER_ENHANCED] 스페이스 키 활성화 - Plotly 인터랙션 비활성화');
            }
        };

        const handleKeyUp = (e) => {
            if (e.code === 'Space') {
                isSpacePressed = false;
                isDragging = false;

                // 🔥 Plotly 인터랙션 복구
                this.restorePlotlyInteractions();

                this.plotlyDiv.style.cursor = 'default';
                console.log('[CHART_WRAPPER_ENHANCED] 스페이스 키 비활성화 - Plotly 인터랙션 복구');
            }
        };

        // 마우스 드래그 감지
        const handleMouseDown = (e) => {
            if (isSpacePressed) {
                isDragging = true;
                lastMousePos = { x: e.clientX, y: e.clientY };
                this.plotlyDiv.style.cursor = 'grabbing';

                // 🔥 이벤트 전파 완전 차단
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();

                console.log('[CHART_WRAPPER_ENHANCED] 드래그 시작 - 이벤트 차단');
            }
        };

        const handleMouseMove = (e) => {
            if (isSpacePressed && isDragging) {
                const deltaX = e.clientX - lastMousePos.x;
                const deltaY = e.clientY - lastMousePos.y;

                // Plotly 차트 이동 (relayout 사용)
                this.panChart(deltaX, deltaY);

                lastMousePos = { x: e.clientX, y: e.clientY };

                // 🔥 이벤트 전파 완전 차단
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
            }
        };

        const handleMouseUp = (e) => {
            if (isSpacePressed) {
                isDragging = false;
                this.plotlyDiv.style.cursor = 'grab';

                // 🔥 이벤트 전파 완전 차단
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();

                console.log('[CHART_WRAPPER_ENHANCED] 드래그 종료');
            }
        };

        // 🔥 휠 이벤트 차단 (스페이스 누를 때)
        const handleWheel = (e) => {
            if (isSpacePressed) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                console.log('[CHART_WRAPPER_ENHANCED] 휠 이벤트 차단');
            }
        };

        // 이벤트 리스너 등록
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);
        this.plotlyDiv.addEventListener('mousedown', handleMouseDown, true); // capture 단계에서 처리
        this.plotlyDiv.addEventListener('mousemove', handleMouseMove, true);
        this.plotlyDiv.addEventListener('mouseup', handleMouseUp, true);
        this.plotlyDiv.addEventListener('wheel', handleWheel, true);

        // 정리 시 이벤트 리스너 제거를 위해 저장
        this._dragEventListeners = {
            handleKeyDown,
            handleKeyUp,
            handleMouseDown,
            handleMouseMove,
            handleMouseUp,
            handleWheel
        };

        console.log('[CHART_WRAPPER_ENHANCED] 스페이스 키 + 드래그 기능 활성화 (충돌 해결)');
    }

    /**
     * 🔥 Plotly 원본 설정 저장
     */
    saveOriginalPlotlyConfig() {
        if (!this.plotlyDiv || !window.Plotly) return;

        try {
            const layout = this.plotlyDiv.layout || {};

            this.originalPlotlyConfig = {
                dragmode: layout.dragmode || 'zoom',
                scrollZoom: layout.scrollZoom !== false, // 기본값 true
                showTips: layout.showTips !== false
            };

            console.log('[CHART_WRAPPER_ENHANCED] Plotly 원본 설정 저장:', JSON.stringify(this.originalPlotlyConfig, null, 2));

        } catch (error) {
            console.warn('[CHART_WRAPPER_ENHANCED] 원본 설정 저장 실패:', error);
            this.originalPlotlyConfig = {
                dragmode: 'zoom',
                scrollZoom: true,
                showTips: true
            };
        }
    }

    /**
     * 🔥 Plotly 인터랙션 비활성화 (스페이스 키 누를 때)
     */
    disablePlotlyInteractions() {
        if (!this.plotlyDiv || !window.Plotly) return;

        try {
            window.Plotly.relayout(this.plotlyDiv, {
                dragmode: false,
                'xaxis.fixedrange': true,
                'yaxis.fixedrange': true
            });

            // config도 업데이트
            if (this.plotlyDiv._config) {
                this.plotlyDiv._config.scrollZoom = false;
                this.plotlyDiv._config.doubleClick = false;
            }

            console.log('[CHART_WRAPPER_ENHANCED] Plotly 인터랙션 비활성화');

        } catch (error) {
            console.warn('[CHART_WRAPPER_ENHANCED] 인터랙션 비활성화 실패:', error);
        }
    }

    /**
     * 🔥 Plotly 인터랙션 복구 (스페이스 키 뗄 때)
     */
    restorePlotlyInteractions() {
        console.log('=== RESTORE CONFIG DEBUG ===');
        console.log('About to restore:', this.originalPlotlyConfig);
        console.log('Current layout before restore:', this.plotlyDiv.layout?.dragmode);
        console.log('Current _fullLayout before restore:', this.plotlyDiv._fullLayout?.dragmode);

        if (!this.plotlyDiv || !window.Plotly || !this.originalPlotlyConfig) return;

        try {
            window.Plotly.relayout(this.plotlyDiv, {
                dragmode: this.originalPlotlyConfig.dragmode,
                'xaxis.fixedrange': false,
                'yaxis.fixedrange': false
            });

            // config도 복구
            if (this.plotlyDiv._config) {
                this.plotlyDiv._config.scrollZoom = this.originalPlotlyConfig.scrollZoom;
                this.plotlyDiv._config.doubleClick = 'reset+autosize';
            }

            console.log('[CHART_WRAPPER_ENHANCED] Plotly 인터랙션 복구:', this.originalPlotlyConfig);

        } catch (error) {
            console.warn('[CHART_WRAPPER_ENHANCED] 인터랙션 복구 실패:', error);
        }
    }

    /**
     * 차트 이동 처리
     * @param {number} deltaX - X축 이동량
     * @param {number} deltaY - Y축 이동량
     */
    panChart(deltaX, deltaY) {
        if (!window.Plotly || !this.plotlyDiv) {
            return;
        }

        try {
            // 현재 축 범위 가져오기
            const layout = this.plotlyDiv.layout;

            if (this.chartType.startsWith('3d_') && layout.scene) {
                // 3D 차트의 경우 카메라 이동
                const camera = layout.scene.camera || {
                    eye: { x: 1.5, y: 1.5, z: 1.5 },
                    center: { x: 0, y: 0, z: 0 }
                };

                const sensitivity = 0.01;
                window.Plotly.relayout(this.plotlyDiv, {
                    'scene.camera.center.x': camera.center.x - deltaX * sensitivity,
                    'scene.camera.center.y': camera.center.y + deltaY * sensitivity
                });

            } else {
                // 2D 차트의 경우 축 범위 이동
                const xRange = layout.xaxis?.range;
                const yRange = layout.yaxis?.range;

                if (xRange && yRange) {
                    const xSpan = xRange[1] - xRange[0];
                    const ySpan = yRange[1] - yRange[0];
                    const sensitivity = 0.01;

                    const xShift = -deltaX * xSpan * sensitivity;
                    const yShift = deltaY * ySpan * sensitivity;

                    window.Plotly.relayout(this.plotlyDiv, {
                        'xaxis.range': [xRange[0] + xShift, xRange[1] + xShift],
                        'yaxis.range': [yRange[0] + yShift, yRange[1] + yShift]
                    });
                }
            }

        } catch (error) {
            console.warn('[CHART_WRAPPER_ENHANCED] 차트 이동 실패:', error);
        }
    }

    /**
     * X/Y 범위 설정 (데이터 필터링용)
     * @param {Array} xRange - [xMin, xMax]
     * @param {Array} yRange - [yMin, yMax]
     */
    setAxisRange(xRange, yRange) {
        if (!window.Plotly || !this.plotlyDiv) {
            console.warn('[CHART_WRAPPER_ENHANCED] Plotly 또는 plotlyDiv가 없습니다');
            return;
        }

        try {
            const updateObj = {};

            if (xRange && Array.isArray(xRange) && xRange.length === 2) {
                updateObj['xaxis.range'] = xRange;
            }

            if (yRange && Array.isArray(yRange) && yRange.length === 2) {
                updateObj['yaxis.range'] = yRange;
            }

            if (Object.keys(updateObj).length > 0) {
                window.Plotly.relayout(this.plotlyDiv, updateObj);
                console.log('[CHART_WRAPPER_ENHANCED] 축 범위 설정:', { xRange, yRange });
            }

        } catch (error) {
            console.error('[CHART_WRAPPER_ENHANCED] 축 범위 설정 실패:', error);
        }
    }

    /**
     * 향상된 정리 함수 - 드래그 이벤트 리스너도 제거
     */
    destroy() {
        // 부모 클래스의 정리 먼저 실행
        super.destroy();

        try {
            // 드래그 관련 이벤트 리스너 제거
            if (this._dragEventListeners) {
                document.removeEventListener('keydown', this._dragEventListeners.handleKeyDown);
                document.removeEventListener('keyup', this._dragEventListeners.handleKeyUp);

                if (this.plotlyDiv) {
                    this.plotlyDiv.removeEventListener('mousedown', this._dragEventListeners.handleMouseDown, true);
                    this.plotlyDiv.removeEventListener('mousemove', this._dragEventListeners.handleMouseMove, true);
                    this.plotlyDiv.removeEventListener('mouseup', this._dragEventListeners.handleMouseUp, true);
                    this.plotlyDiv.removeEventListener('wheel', this._dragEventListeners.handleWheel, true);
                }

                this._dragEventListeners = null;
            }

            // 원본 설정 정리
            this.originalPlotlyConfig = null;

            console.log('[CHART_WRAPPER_ENHANCED] 향상된 정리 완료 (드래그 이벤트 제거)');

        } catch (error) {
            console.error('[CHART_WRAPPER_ENHANCED] 정리 과정 오류:', error);
        }
    }
}