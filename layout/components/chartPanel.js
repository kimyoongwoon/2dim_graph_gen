// ============================================================================
// layout/components/chart-panel.js - 고정 차트 패널 컴포넌트
// ============================================================================

import { generateChart } from '../../lib/chart_gen/unified/chart_generator.js';
import { sessionStorageManager } from '../../sources/shared/session_storage_manager/index.js';

export class ChartPanel {
    constructor(container, componentState) {
        this.container = container;
        this.componentState = componentState || {};
        this.chartWrapper = null;
        this.isInitialized = false;
        
        // UI 요소들
        this.headerElement = null;
        this.contentElement = null;
        this.emptyStateElement = null;
        
        console.log('[CHART_PANEL] ChartPanel 생성');
        
        this.initialize();
    }

    // ============================================================================
    // 초기화
    // ============================================================================

    initialize() {
        try {
            console.log('[CHART_PANEL] 초기화 시작');
            
            // 컨테이너 설정
            this.setupContainer();
            
            // UI 구조 생성
            this.createUI();
            
            // 이벤트 바인딩
            this.bindEvents();
            
            // 초기 상태 설정
            this.showEmptyState();
            
            this.isInitialized = true;
            console.log('[CHART_PANEL] 초기화 완료');
            
        } catch (error) {
            console.error('[CHART_PANEL] 초기화 오류:', error);
            this.showError('Failed to initialize chart panel: ' + error.message);
        }
    }

    setupContainer() {
        this.container.getElement().addClass('chart-panel-container');
        this.container.getElement().css({
            'display': 'flex',
            'flex-direction': 'column',
            'width': '100%',
            'height': '100%',
            'overflow': 'hidden'
        });
    }

    createUI() {
        const containerEl = this.container.getElement()[0];
        
        // 헤더 생성
        this.headerElement = document.createElement('div');
        this.headerElement.className = 'chart-panel-header';
        this.headerElement.innerHTML = `
            <div class="header-title">
                <span class="chart-icon">📊</span>
                <span class="title-text">Chart Display</span>
            </div>
            <div class="header-controls">
                <button id="chart-refresh-btn" class="header-btn" title="Refresh Chart">
                    <span>🔄</span>
                </button>
                <button id="chart-clear-btn" class="header-btn" title="Clear Chart">
                    <span>🗑️</span>
                </button>
                <button id="chart-export-btn" class="header-btn" title="Export Chart" disabled>
                    <span>💾</span>
                </button>
            </div>
        `;
        
        // 컨텐츠 영역 생성
        this.contentElement = document.createElement('div');
        this.contentElement.className = 'chart-panel-content';
        
        // 빈 상태 요소 생성
        this.emptyStateElement = document.createElement('div');
        this.emptyStateElement.className = 'chart-panel-empty';
        this.emptyStateElement.innerHTML = `
            <div class="empty-content">
                <div class="empty-icon">📈</div>
                <div class="empty-text">
                    <strong>No Chart Data</strong><br>
                    Generate data and configure chart settings<br>
                    to display your visualization here.
                </div>
                <div class="empty-actions">
                    <button id="open-data-generator" class="empty-btn">
                        📊 Generate Data
                    </button>
                </div>
            </div>
        `;
        
        // DOM에 추가
        containerEl.appendChild(this.headerElement);
        containerEl.appendChild(this.contentElement);
        this.contentElement.appendChild(this.emptyStateElement);
        
        console.log('[CHART_PANEL] UI 구조 생성 완료');
    }

    bindEvents() {
        // 헤더 버튼 이벤트
        this.headerElement.querySelector('#chart-refresh-btn').addEventListener('click', () => {
            this.refreshChart();
        });
        
        this.headerElement.querySelector('#chart-clear-btn').addEventListener('click', () => {
            this.clearChart();
        });
        
        this.headerElement.querySelector('#chart-export-btn').addEventListener('click', () => {
            this.exportChart();
        });
        
        // 빈 상태 버튼 이벤트
        this.emptyStateElement.querySelector('#open-data-generator').addEventListener('click', () => {
            this.openDataGenerator();
        });
        
        // 컨테이너 리사이즈 이벤트
        this.container.on('resize', () => {
            this.handleResize();
        });
        
        console.log('[CHART_PANEL] 이벤트 바인딩 완료');
    }

    // ============================================================================
    // 차트 로딩
    // ============================================================================

    async loadChart(rawData, config) {
        try {
            console.log('[CHART_PANEL] 차트 로드 시작:', { 
                dataCount: rawData?.length, 
                chartType: config?.type 
            });
            
            this.showLoading('Loading chart...');
            
            // 기존 차트 정리
            this.clearChart();
            
            // 차트 컨테이너 준비
            const chartContainer = document.createElement('div');
            chartContainer.id = 'chart-container';
            chartContainer.style.cssText = `
                width: 100%;
                height: 100%;
                position: relative;
            `;
            
            this.contentElement.appendChild(chartContainer);
            
            // 차트 생성 (골든 레이아웃 최적화 모드)
            this.chartWrapper = generateChart(rawData, config, chartContainer, 'golden');
            
            // 차트 로드 완료 처리
            this.hideLoading();
            this.hideEmptyState();
            this.updateHeaderState(true);
            
            // 헤더 타이틀 업데이트
            this.updateHeaderTitle(config);
            
            console.log('[CHART_PANEL] 차트 로드 완료');
            
        } catch (error) {
            console.error('[CHART_PANEL] 차트 로드 오류:', error);
            this.hideLoading();
            this.showError('Failed to load chart: ' + error.message);
        }
    }

    async refreshChart() {
        try {
            console.log('[CHART_PANEL] 차트 새로고침 시작');
            
            // 세션 스토리지에서 최신 데이터 로드
            const hasData = sessionStorageManager.hasRawData();
            const hasConfig = sessionStorageManager.hasChartConfig();
            
            if (!hasData || !hasConfig) {
                this.showError('No data or configuration found. Please generate data and configure chart first.');
                return;
            }
            
            const { data: rawData } = sessionStorageManager.loadRawDataFromSessionStorage();
            const chartConfig = sessionStorageManager.loadChartConfig();
            
            await this.loadChart(rawData, chartConfig);
            
        } catch (error) {
            console.error('[CHART_PANEL] 차트 새로고침 오류:', error);
            this.showError('Failed to refresh chart: ' + error.message);
        }
    }

    clearChart() {
        console.log('[CHART_PANEL] 차트 정리');
        
        try {
            // 차트 래퍼 정리
            if (this.chartWrapper) {
                if (this.chartWrapper.destroy) {
                    this.chartWrapper.destroy();
                }
                this.chartWrapper = null;
            }
            
            // 차트 컨테이너 제거
            const existingChart = this.contentElement.querySelector('#chart-container');
            if (existingChart) {
                existingChart.remove();
            }
            
            // UI 상태 업데이트
            this.updateHeaderState(false);
            this.showEmptyState();
            
        } catch (error) {
            console.warn('[CHART_PANEL] 차트 정리 중 오류:', error);
        }
    }

    async exportChart() {
        try {
            if (!this.chartWrapper) {
                this.showError('No chart to export');
                return;
            }
            
            console.log('[CHART_PANEL] 차트 내보내기 시작');
            
            // Plotly 차트 내보내기
            if (this.chartWrapper.plotlyDiv && window.Plotly) {
                const filename = `chart-${new Date().toISOString().slice(0, 10)}.png`;
                
                await window.Plotly.downloadImage(this.chartWrapper.plotlyDiv, {
                    format: 'png',
                    width: 1200,
                    height: 800,
                    filename: filename
                });
                
                console.log('[CHART_PANEL] 차트 내보내기 완료:', filename);
            } else {
                throw new Error('Chart export not available');
            }
            
        } catch (error) {
            console.error('[CHART_PANEL] 차트 내보내기 오류:', error);
            this.showError('Failed to export chart: ' + error.message);
        }
    }

    // ============================================================================
    // UI 상태 관리
    // ============================================================================

    showLoading(message = 'Loading...') {
        this.hideEmptyState();
        
        const loadingElement = document.createElement('div');
        loadingElement.id = 'chart-loading';
        loadingElement.className = 'chart-loading';
        loadingElement.innerHTML = `
            <div class="spinner"></div>
            <div class="loading-text">${message}</div>
        `;
        
        this.contentElement.appendChild(loadingElement);
    }

    hideLoading() {
        const loadingElement = this.contentElement.querySelector('#chart-loading');
        if (loadingElement) {
            loadingElement.remove();
        }
    }

    showEmptyState() {
        this.emptyStateElement.style.display = 'flex';
    }

    hideEmptyState() {
        this.emptyStateElement.style.display = 'none';
    }

    showError(message) {
        console.error('[CHART_PANEL] 에러 표시:', message);
        
        this.hideLoading();
        this.hideEmptyState();
        
        const errorElement = document.createElement('div');
        errorElement.className = 'chart-error';
        errorElement.innerHTML = `
            <div class="error-icon">⚠️</div>
            <div class="error-message">
                <strong>Chart Error</strong><br>
                ${message}
            </div>
            <button class="error-retry-btn" onclick="this.parentElement.remove()">
                Dismiss
            </button>
        `;
        
        this.contentElement.appendChild(errorElement);
        
        // 5초 후 자동 제거
        setTimeout(() => {
            if (errorElement.parentNode) {
                errorElement.remove();
                this.showEmptyState();
            }
        }, 5000);
    }

    updateHeaderState(hasChart) {
        const refreshBtn = this.headerElement.querySelector('#chart-refresh-btn');
        const clearBtn = this.headerElement.querySelector('#chart-clear-btn');
        const exportBtn = this.headerElement.querySelector('#chart-export-btn');
        
        if (hasChart) {
            refreshBtn.disabled = false;
            clearBtn.disabled = false;
            exportBtn.disabled = false;
            clearBtn.style.display = 'block';
            exportBtn.style.display = 'block';
        } else {
            refreshBtn.disabled = false; // 새로고침은 항상 가능
            clearBtn.disabled = true;
            exportBtn.disabled = true;
            clearBtn.style.display = 'none';
            exportBtn.style.display = 'none';
        }
    }

    updateHeaderTitle(config) {
        const titleText = this.headerElement.querySelector('.title-text');
        if (config && config.type) {
            titleText.textContent = `Chart Display - ${config.type.toUpperCase()}`;
        } else {
            titleText.textContent = 'Chart Display';
        }
    }

    // ============================================================================
    // 이벤트 핸들러
    // ============================================================================

    openDataGenerator() {
        try {
            // WindowManager를 통해 데이터 생성기 열기
            if (window.MainApp && window.MainApp.getWindowManager) {
                const windowManager = window.MainApp.getWindowManager();
                windowManager.openDataGenerator();
            } else {
                console.warn('[CHART_PANEL] WindowManager를 찾을 수 없음');
            }
        } catch (error) {
            console.error('[CHART_PANEL] 데이터 생성기 열기 오류:', error);
        }
    }

    handleResize() {
        try {
            if (this.chartWrapper && this.chartWrapper.resize) {
                this.chartWrapper.resize();
            }
        } catch (error) {
            console.warn('[CHART_PANEL] 리사이즈 처리 오류:', error);
        }
    }

    notifyDataUpdate() {
        console.log('[CHART_PANEL] 데이터 업데이트 알림 받음');
        
        // 데이터가 업데이트되었음을 사용자에게 알림
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            background: var(--gl-vs-success);
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 12px;
            z-index: 1000;
            animation: fadeInOut 3s ease-in-out;
        `;
        notification.textContent = 'Data updated! Configure chart to display.';
        
        this.contentElement.appendChild(notification);
        
        // 3초 후 제거
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }

    // ============================================================================
    // 외부 API
    // ============================================================================

    getChartWrapper() {
        return this.chartWrapper;
    }

    hasChart() {
        return this.chartWrapper !== null;
    }

    getChartConfig() {
        if (this.chartWrapper && this.chartWrapper.getConfig) {
            return this.chartWrapper.getConfig();
        }
        return null;
    }

    getChartData() {
        if (this.chartWrapper && this.chartWrapper.getData) {
            return this.chartWrapper.getData();
        }
        return null;
    }

    // ============================================================================
    // 정리
    // ============================================================================

    cleanup() {
        console.log('[CHART_PANEL] 정리 시작');
        
        try {
            // 차트 정리
            this.clearChart();
            
            // 이벤트 리스너 정리 (Golden Layout이 처리)
            
            // 상태 초기화
            this.isInitialized = false;
            
            console.log('[CHART_PANEL] 정리 완료');
            
        } catch (error) {
            console.error('[CHART_PANEL] 정리 중 오류:', error);
        }
    }

    // ============================================================================
    // Golden Layout 인터페이스
    // ============================================================================

    // Golden Layout에서 호출하는 메서드들
    _$destroy() {
        this.cleanup();
    }

    _$hide() {
        // 패널이 숨겨질 때 처리
    }

    _$show() {
        // 패널이 표시될 때 처리
        this.handleResize();
    }
}