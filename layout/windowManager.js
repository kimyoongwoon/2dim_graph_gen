// ============================================================================
// layout/window-manager.js - 플로팅 윈도우 매니저
// ============================================================================

import { LayoutConfig } from './layoutConfig.js';
import { DataGenerator } from './components/dataGenerator.js';
import { ChartConfigurator } from './components/chartConfigurator.js';

export class WindowManager {
    constructor(layoutManager) {
        this.layoutManager = layoutManager;
        this.openWindows = new Map();
        this.windowCounter = 0;
        
        // 윈도우 타입별 컴포넌트 매핑
        this.componentFactories = new Map([
            ['data-generator', DataGenerator],
            ['chart-config', ChartConfigurator]
        ]);
        
        console.log('[WINDOW_MANAGER] WindowManager 생성');
    }

    // ============================================================================
    // 윈도우 열기
    // ============================================================================

    async openDataGenerator(options = {}) {
        try {
            console.log('[WINDOW_MANAGER] 데이터 생성기 윈도우 열기');
            
            const windowId = 'data-generator';
            
            // 이미 열린 윈도우가 있다면 포커스
            if (this.openWindows.has(windowId)) {
                this.focusWindow(windowId);
                return this.openWindows.get(windowId);
            }
            
            // 윈도우 설정
            const config = LayoutConfig.getFloatingWindowConfig('data-generator', options);
            
            // 플로팅 윈도우 생성
            const window = await this.createFloatingWindow(windowId, config);
            
            // 데이터 생성기 컴포넌트 생성
            const component = new DataGenerator(window.contentContainer, {
                windowId: windowId,
                onDataGenerated: (data) => this.handleDataGenerated(data),
                onClose: () => this.closeWindow(windowId)
            });
            
            // 윈도우 정보 저장
            window.component = component;
            this.openWindows.set(windowId, window);
            
            console.log('[WINDOW_MANAGER] 데이터 생성기 윈도우 생성 완료');
            return window;
            
        } catch (error) {
            console.error('[WINDOW_MANAGER] 데이터 생성기 윈도우 열기 오류:', error);
            throw error;
        }
    }

    async openChartConfig(options = {}) {
        try {
            console.log('[WINDOW_MANAGER] 차트 설정 윈도우 열기');
            
            const windowId = 'chart-config';
            
            // 이미 열린 윈도우가 있다면 포커스
            if (this.openWindows.has(windowId)) {
                this.focusWindow(windowId);
                return this.openWindows.get(windowId);
            }
            
            // 윈도우 설정
            const config = LayoutConfig.getFloatingWindowConfig('chart-config', options);
            
            // 플로팅 윈도우 생성
            const window = await this.createFloatingWindow(windowId, config);
            
            // 차트 설정 컴포넌트 생성
            const component = new ChartConfigurator(window.contentContainer, {
                windowId: windowId,
                onConfigSaved: (config) => this.handleConfigSaved(config),
                onClose: () => this.closeWindow(windowId)
            });
            
            // 윈도우 정보 저장
            window.component = component;
            this.openWindows.set(windowId, window);
            
            console.log('[WINDOW_MANAGER] 차트 설정 윈도우 생성 완료');
            return window;
            
        } catch (error) {
            console.error('[WINDOW_MANAGER] 차트 설정 윈도우 열기 오류:', error);
            throw error;
        }
    }

    // ============================================================================
    // 플로팅 윈도우 생성 (CSS와 DOM 기반)
    // ============================================================================

    async createFloatingWindow(windowId, config) {
        try {
            console.log('[WINDOW_MANAGER] 플로팅 윈도우 생성:', windowId);
            
            // 윈도우 컨테이너 생성
            const windowElement = document.createElement('div');
            windowElement.className = 'floating-window';
            windowElement.id = `window-${windowId}`;
            windowElement.style.cssText = `
                position: fixed;
                width: ${config.width}px;
                height: ${config.height}px;
                min-width: ${config.minWidth}px;
                min-height: ${config.minHeight}px;
                background: ${config.backgroundColor};
                border: 1px solid var(--vs-border);
                border-radius: 6px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
                z-index: 1000;
                display: flex;
                flex-direction: column;
                overflow: hidden;
            `;
            
            // 중앙 정렬
            if (config.center) {
                windowElement.style.left = `${(window.innerWidth - config.width) / 2}px`;
                windowElement.style.top = `${(window.innerHeight - config.height) / 2}px`;
            }
            
            // 타이틀바 생성
            const titleBar = this.createTitleBar(windowId, config);
            windowElement.appendChild(titleBar);
            
            // 컨텐츠 영역 생성
            const contentContainer = document.createElement('div');
            contentContainer.className = 'window-content';
            contentContainer.style.cssText = `
                flex: 1;
                overflow: auto;
                background: #1e1e1e;
                position: relative;
            `;
            windowElement.appendChild(contentContainer);
            
            // 리사이즈 핸들러 (필요시)
            if (config.resizable) {
                this.addResizeHandles(windowElement);
            }
            
            // DOM에 추가
            document.body.appendChild(windowElement);
            
            // 드래그 가능하게 설정
            this.makeDraggable(windowElement, titleBar);
            
            // 윈도우 객체 생성
            const window = {
                id: windowId,
                element: windowElement,
                titleBar: titleBar,
                contentContainer: contentContainer,
                config: config,
                isVisible: true,
                isMaximized: false,
                originalBounds: null,
                component: null
            };
            
            // 포커스 이벤트
            windowElement.addEventListener('mousedown', () => {
                this.bringToFront(windowId);
            });
            
            console.log('[WINDOW_MANAGER] 플로팅 윈도우 생성 완료:', windowId);
            return window;
            
        } catch (error) {
            console.error('[WINDOW_MANAGER] 플로팅 윈도우 생성 오류:', error);
            throw error;
        }
    }

    createTitleBar(windowId, config) {
        const titleBar = document.createElement('div');
        titleBar.className = 'window-titlebar';
        titleBar.style.cssText = `
            height: 32px;
            background: #2d2d30;
            border-bottom: 1px solid #3e3e42;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 12px;
            cursor: move;
            user-select: none;
        `;
        
        // 타이틀 영역
        const titleSection = document.createElement('div');
        titleSection.style.cssText = `
            display: flex;
            align-items: center;
            gap: 8px;
            color: #cccccc;
            font-size: 12px;
            font-weight: 500;
        `;
        
        // 아이콘
        if (config.icon) {
            const icon = document.createElement('span');
            icon.textContent = config.icon;
            icon.style.fontSize = '14px';
            titleSection.appendChild(icon);
        }
        
        // 타이틀 텍스트
        const title = document.createElement('span');
        title.textContent = config.title || windowId;
        titleSection.appendChild(title);
        
        titleBar.appendChild(titleSection);
        
        // 컨트롤 버튼들
        const controls = document.createElement('div');
        controls.style.cssText = `
            display: flex;
            gap: 4px;
        `;
        
        // 최소화 버튼
        if (config.minimizable) {
            const minimizeBtn = this.createControlButton('−', () => {
                this.minimizeWindow(windowId);
            });
            controls.appendChild(minimizeBtn);
        }
        
        // 최대화 버튼
        if (config.maximizable) {
            const maximizeBtn = this.createControlButton('□', () => {
                this.toggleMaximize(windowId);
            });
            controls.appendChild(maximizeBtn);
        }
        
        // 닫기 버튼
        const closeBtn = this.createControlButton('×', () => {
            this.closeWindow(windowId);
        });
        controls.appendChild(closeBtn);
        
        titleBar.appendChild(controls);
        
        return titleBar;
    }

    createControlButton(text, onClick) {
        const button = document.createElement('button');
        button.textContent = text;
        button.style.cssText = `
            width: 24px;
            height: 24px;
            background: transparent;
            border: none;
            color: #cccccc;
            cursor: pointer;
            font-size: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 2px;
            transition: background-color 0.2s;
        `;
        
        button.addEventListener('mouseenter', () => {
            if (text === '×') {
                button.style.backgroundColor = '#f44747';
            } else {
                button.style.backgroundColor = '#3e3e42';
            }
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.backgroundColor = 'transparent';
        });
        
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            onClick();
        });
        
        return button;
    }

    // ============================================================================
    // 드래그 앤 드롭
    // ============================================================================

    makeDraggable(windowElement, titleBar) {
        let isDragging = false;
        let dragOffset = { x: 0, y: 0 };
        
        titleBar.addEventListener('mousedown', (e) => {
            if (e.target.tagName === 'BUTTON') return;
            
            isDragging = true;
            const rect = windowElement.getBoundingClientRect();
            dragOffset.x = e.clientX - rect.left;
            dragOffset.y = e.clientY - rect.top;
            
            titleBar.style.cursor = 'grabbing';
            
            document.addEventListener('mousemove', onDrag);
            document.addEventListener('mouseup', onDragEnd);
        });
        
        const onDrag = (e) => {
            if (!isDragging) return;
            
            const x = e.clientX - dragOffset.x;
            const y = e.clientY - dragOffset.y;
            
            // 화면 경계 체크
            const maxX = window.innerWidth - windowElement.offsetWidth;
            const maxY = window.innerHeight - windowElement.offsetHeight;
            
            windowElement.style.left = `${Math.max(0, Math.min(x, maxX))}px`;
            windowElement.style.top = `${Math.max(0, Math.min(y, maxY))}px`;
        };
        
        const onDragEnd = () => {
            isDragging = false;
            titleBar.style.cursor = 'move';
            
            document.removeEventListener('mousemove', onDrag);
            document.removeEventListener('mouseup', onDragEnd);
        };
    }

    // ============================================================================
    // 윈도우 제어
    // ============================================================================

    closeWindow(windowId) {
        try {
            console.log('[WINDOW_MANAGER] 윈도우 닫기:', windowId);
            
            const window = this.openWindows.get(windowId);
            if (!window) return;
            
            // 컴포넌트 정리
            if (window.component && window.component.cleanup) {
                window.component.cleanup();
            }
            
            // DOM에서 제거
            if (window.element && window.element.parentNode) {
                window.element.parentNode.removeChild(window.element);
            }
            
            // 윈도우 목록에서 제거
            this.openWindows.delete(windowId);
            
            console.log('[WINDOW_MANAGER] 윈도우 닫기 완료:', windowId);
            
        } catch (error) {
            console.error('[WINDOW_MANAGER] 윈도우 닫기 오류:', error);
        }
    }

    focusWindow(windowId) {
        const window = this.openWindows.get(windowId);
        if (window && window.element) {
            this.bringToFront(windowId);
        }
    }

    bringToFront(windowId) {
        const window = this.openWindows.get(windowId);
        if (window && window.element) {
            // 최상위 z-index 찾기
            let maxZIndex = 1000;
            this.openWindows.forEach(w => {
                if (w.element && w.id !== windowId) {
                    const zIndex = parseInt(w.element.style.zIndex) || 1000;
                    maxZIndex = Math.max(maxZIndex, zIndex);
                }
            });
            
            window.element.style.zIndex = maxZIndex + 1;
        }
    }

    minimizeWindow(windowId) {
        const window = this.openWindows.get(windowId);
        if (window && window.element) {
            window.element.style.display = 'none';
            window.isVisible = false;
        }
    }

    toggleMaximize(windowId) {
        const window = this.openWindows.get(windowId);
        if (!window || !window.element) return;
        
        if (window.isMaximized) {
            // 원래 크기로 복원
            if (window.originalBounds) {
                window.element.style.left = window.originalBounds.left;
                window.element.style.top = window.originalBounds.top;
                window.element.style.width = window.originalBounds.width;
                window.element.style.height = window.originalBounds.height;
            }
            window.isMaximized = false;
        } else {
            // 현재 위치/크기 저장
            window.originalBounds = {
                left: window.element.style.left,
                top: window.element.style.top,
                width: window.element.style.width,
                height: window.element.style.height
            };
            
            // 최대화
            window.element.style.left = '0px';
            window.element.style.top = '48px'; // 탑 메뉴바 높이만큼
            window.element.style.width = '100vw';
            window.element.style.height = 'calc(100vh - 48px)';
            window.isMaximized = true;
        }
    }

    // ============================================================================
    // 이벤트 핸들러
    // ============================================================================

    handleDataGenerated(data) {
        console.log('[WINDOW_MANAGER] 데이터 생성됨:', data.length, '개');
        
        // 메인 앱에 알림
        if (window.MainApp) {
            window.MainApp.updateDataState(true);
        }
        
        // 차트 패널 업데이트 (필요시)
        const chartPanel = this.layoutManager.getChartPanel();
        if (chartPanel) {
            chartPanel.notifyDataUpdate();
        }
    }

    handleConfigSaved(config) {
        console.log('[WINDOW_MANAGER] 차트 설정 저장됨:', config);
        
        // 메인 앱에 알림
        if (window.MainApp) {
            window.MainApp.updateConfigState(true);
            window.MainApp.loadChart();
        }
    }

    // ============================================================================
    // 유틸리티
    // ============================================================================

    closeAllWindows() {
        console.log('[WINDOW_MANAGER] 모든 윈도우 닫기');
        
        const windowIds = Array.from(this.openWindows.keys());
        windowIds.forEach(windowId => {
            this.closeWindow(windowId);
        });
    }

    getOpenWindows() {
        return Array.from(this.openWindows.keys());
    }

    isWindowOpen(windowId) {
        return this.openWindows.has(windowId);
    }

    cleanup() {
        console.log('[WINDOW_MANAGER] 정리 시작');
        this.closeAllWindows();
    }
}