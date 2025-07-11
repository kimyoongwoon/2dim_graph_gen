// ============================================================================
// layout/golden-layout.js - Golden Layout 매니저 클래스
// ============================================================================

import { LayoutConfig } from './layoutConfig.js';
import { ChartPanel } from './components/chartPanel.js';
import { sessionStorageManager } from '../sources/shared/session_storage_manager/index.js';

export class GoldenLayoutManager {
    constructor() {
        this.layout = null;
        this.container = null;
        this.chartPanelComponent = null;
        this.windowManager = null;
        this.isInitialized = false;
        
        // 컴포넌트 레지스트리
        this.componentRegistry = new Map();
        
        console.log('[GOLDEN_LAYOUT] GoldenLayoutManager 생성');
    }

    // ============================================================================
    // 초기화
    // ============================================================================

    async initialize(containerElement) {
        try {
            console.log('[GOLDEN_LAYOUT] 초기화 시작');
            
            this.container = containerElement;
            
            // 컴포넌트 등록
            this.registerComponents();
            
            // 레이아웃 생성
            await this.createLayout();
            
            // 이벤트 바인딩
            this.bindEvents();
            
            this.isInitialized = true;
            console.log('[GOLDEN_LAYOUT] 초기화 완료');
            
        } catch (error) {
            console.error('[GOLDEN_LAYOUT] 초기화 오류:', error);
            throw error;
        }
    }

    registerComponents() {
        console.log('[GOLDEN_LAYOUT] 컴포넌트 등록 시작');
        
        // 차트 패널 컴포넌트 등록
        const chartPanelFactory = (container, componentState) => {
            console.log('[GOLDEN_LAYOUT] 차트 패널 컴포넌트 생성');
            
            this.chartPanelComponent = new ChartPanel(container, componentState);
            this.componentRegistry.set('chart-panel', this.chartPanelComponent);
            
            return this.chartPanelComponent;
        };
        
        // Golden Layout에 컴포넌트 등록
        if (window.GoldenLayout) {
            window.GoldenLayout.registerComponent('chart-panel', chartPanelFactory);
        } else {
            console.warn('[GOLDEN_LAYOUT] GoldenLayout 라이브러리가 로드되지 않음');
        }
        
        console.log('[GOLDEN_LAYOUT] 컴포넌트 등록 완료');
    }

    async createLayout() {
        try {
            console.log('[GOLDEN_LAYOUT] 레이아웃 생성 시작');
            
            // 레이아웃 설정 가져오기
            const config = LayoutConfig.getDefaultConfig();
            
            // Golden Layout 인스턴스 생성
            this.layout = new window.GoldenLayout(config, this.container);
            
            // 레이아웃 초기화
            this.layout.init();
            
            console.log('[GOLDEN_LAYOUT] 레이아웃 생성 완료');
            
        } catch (error) {
            console.error('[GOLDEN_LAYOUT] 레이아웃 생성 오류:', error);
            throw error;
        }
    }

    bindEvents() {
        if (!this.layout) return;
        
        console.log('[GOLDEN_LAYOUT] 이벤트 바인딩 시작');
        
        // 레이아웃 이벤트
        this.layout.on('initialised', () => {
            console.log('[GOLDEN_LAYOUT] 레이아웃 초기화됨');
            this.onLayoutInitialized();
        });
        
        this.layout.on('componentCreated', (component) => {
            console.log('[GOLDEN_LAYOUT] 컴포넌트 생성됨:', component.config.type);
        });
        
        this.layout.on('stateChanged', () => {
            this.saveLayoutState();
        });
        
        this.layout.on('itemDestroyed', (item) => {
            console.log('[GOLDEN_LAYOUT] 아이템 제거됨:', item.config.type);
        });
        
        // 윈도우 리사이즈 처리
        this.layout.on('windowOpened', (window) => {
            console.log('[GOLDEN_LAYOUT] 윈도우 열림');
        });
        
        this.layout.on('windowClosed', (window) => {
            console.log('[GOLDEN_LAYOUT] 윈도우 닫힘');
        });
        
        console.log('[GOLDEN_LAYOUT] 이벤트 바인딩 완료');
    }

    // ============================================================================
    // 레이아웃 관리
    // ============================================================================

    onLayoutInitialized() {
        console.log('[GOLDEN_LAYOUT] 레이아웃 초기화 후처리 시작');
        
        try {
            // 기존 차트가 있다면 로드
            this.loadExistingChartIfAvailable();
            
            // 레이아웃 상태 복원
            this.restoreLayoutState();
            
        } catch (error) {
            console.warn('[GOLDEN_LAYOUT] 초기화 후처리 오류:', error);
        }
    }

    async loadExistingChartIfAvailable() {
        try {
            const hasData = sessionStorageManager.hasRawData();
            const hasConfig = sessionStorageManager.hasChartConfig();
            
            if (hasData && hasConfig) {
                console.log('[GOLDEN_LAYOUT] 기존 차트 로드 시도');
                await this.loadChartInPanel();
            }
        } catch (error) {
            console.warn('[GOLDEN_LAYOUT] 기존 차트 로드 실패:', error);
        }
    }

    async loadChartInPanel() {
        try {
            if (!this.chartPanelComponent) {
                console.warn('[GOLDEN_LAYOUT] 차트 패널 컴포넌트가 없음');
                return;
            }
            
            console.log('[GOLDEN_LAYOUT] 차트 패널에 차트 로드 시작');
            
            // 세션 스토리지에서 데이터와 설정 로드
            const { data: rawData } = sessionStorageManager.loadRawDataFromSessionStorage();
            const chartConfig = sessionStorageManager.loadChartConfig();
            
            // 차트 패널에 차트 생성
            await this.chartPanelComponent.loadChart(rawData, chartConfig);
            
            console.log('[GOLDEN_LAYOUT] 차트 패널에 차트 로드 완료');
            
        } catch (error) {
            console.error('[GOLDEN_LAYOUT] 차트 로드 오류:', error);
            throw error;
        }
    }

    resetLayout() {
        try {
            console.log('[GOLDEN_LAYOUT] 레이아웃 리셋 시작');
            
            if (this.layout) {
                // 기존 레이아웃 정리
                this.layout.destroy();
            }
            
            // 컴포넌트 레지스트리 정리
            this.componentRegistry.clear();
            this.chartPanelComponent = null;
            
            // 레이아웃 재생성
            this.createLayout().then(() => {
                console.log('[GOLDEN_LAYOUT] 레이아웃 리셋 완료');
            });
            
        } catch (error) {
            console.error('[GOLDEN_LAYOUT] 레이아웃 리셋 오류:', error);
            throw error;
        }
    }

    // ============================================================================
    // 상태 관리
    // ============================================================================

    saveLayoutState() {
        try {
            if (!this.layout) return;
            
            const state = JSON.stringify(this.layout.toConfig());
            localStorage.setItem('golden-layout-state', state);
            
        } catch (error) {
            console.warn('[GOLDEN_LAYOUT] 레이아웃 상태 저장 실패:', error);
        }
    }

    restoreLayoutState() {
        try {
            const savedState = localStorage.getItem('golden-layout-state');
            if (savedState) {
                console.log('[GOLDEN_LAYOUT] 저장된 레이아웃 상태 복원');
                // 필요시 레이아웃 상태 복원 로직 구현
            }
        } catch (error) {
            console.warn('[GOLDEN_LAYOUT] 레이아웃 상태 복원 실패:', error);
        }
    }

    // ============================================================================
    // 외부 API
    // ============================================================================

    setWindowManager(windowManager) {
        this.windowManager = windowManager;
        console.log('[GOLDEN_LAYOUT] WindowManager 연결됨');
    }

    getChartPanel() {
        return this.chartPanelComponent;
    }

    addComponent(type, config, target = null) {
        try {
            if (!this.layout) {
                throw new Error('Layout not initialized');
            }
            
            const componentConfig = {
                type: 'component',
                componentName: type,
                componentState: config || {}
            };
            
            if (target) {
                target.addChild(componentConfig);
            } else {
                this.layout.root.getItemsById('main-content')[0]?.addChild(componentConfig);
            }
            
            console.log('[GOLDEN_LAYOUT] 컴포넌트 추가됨:', type);
            
        } catch (error) {
            console.error('[GOLDEN_LAYOUT] 컴포넌트 추가 오류:', error);
            throw error;
        }
    }

    removeComponent(componentId) {
        try {
            const component = this.componentRegistry.get(componentId);
            if (component && component.container && component.container.parent) {
                component.container.parent.remove();
                this.componentRegistry.delete(componentId);
                console.log('[GOLDEN_LAYOUT] 컴포넌트 제거됨:', componentId);
            }
        } catch (error) {
            console.error('[GOLDEN_LAYOUT] 컴포넌트 제거 오류:', error);
        }
    }

    handleResize() {
        try {
            if (this.layout) {
                this.layout.updateSize();
            }
        } catch (error) {
            console.warn('[GOLDEN_LAYOUT] 리사이즈 처리 오류:', error);
        }
    }

    // ============================================================================
    // 정리
    // ============================================================================

    cleanup() {
        console.log('[GOLDEN_LAYOUT] 정리 시작');
        
        try {
            // 레이아웃 상태 저장
            this.saveLayoutState();
            
            // 컴포넌트들 정리
            this.componentRegistry.forEach(component => {
                if (component.cleanup) {
                    component.cleanup();
                }
            });
            this.componentRegistry.clear();
            
            // 레이아웃 정리
            if (this.layout) {
                this.layout.destroy();
                this.layout = null;
            }
            
            this.isInitialized = false;
            console.log('[GOLDEN_LAYOUT] 정리 완료');
            
        } catch (error) {
            console.error('[GOLDEN_LAYOUT] 정리 중 오류:', error);
        }
    }

    // ============================================================================
    // 유틸리티
    // ============================================================================

    isReady() {
        return this.isInitialized && this.layout && this.layout.isInitialised;
    }

    getLayout() {
        return this.layout;
    }

    getContainer() {
        return this.container;
    }
}