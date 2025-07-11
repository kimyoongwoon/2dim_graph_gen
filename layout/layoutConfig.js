// ============================================================================
// layout/layout-config.js - Golden Layout 설정 및 구성
// ============================================================================

export class LayoutConfig {
    
    // ============================================================================
    // 기본 레이아웃 설정
    // ============================================================================
    
    static getDefaultConfig() {
        return {
            settings: {
                // 기본 설정
                hasHeaders: true,
                constrainDragToContainer: true,
                reorderEnabled: true,
                selectionEnabled: false,
                popoutWholeStack: false,
                blockedPopoutsThrowError: true,
                closePopoutsOnUnload: true,
                
                // 반응형 설정
                responsiveMode: 'onload',
                tabOverlapAllowance: 0,
                reorderOnTabMenuClick: true,
                
                // Visual Studio 스타일 설정
                showPopoutIcon: true,
                showMaximiseIcon: true,
                showCloseIcon: true,
                
                // 드래그 앤 드롭
                dragProxy: {
                    content: '<div class="drag-proxy">Moving Panel</div>',
                    className: 'vs-drag-proxy'
                }
            },
            
            dimensions: {
                // 최소 크기
                borderWidth: 5,
                minItemHeight: 200,
                minItemWidth: 250,
                
                // 헤더 크기
                headerHeight: 32,
                dragProxyWidth: 300,
                dragProxyHeight: 200
            },
            
            labels: {
                close: 'Close',
                maximise: 'Maximize',
                minimise: 'Minimize',
                popout: 'Open in new window',
                popin: 'Pop in',
                tabDropdown: 'Additional tabs'
            },
            
            content: [{
                type: 'row',
                isClosable: false,
                content: [{
                    type: 'component',
                    componentName: 'chart-panel',
                    id: 'main-chart-panel',
                    title: 'Chart Display',
                    isClosable: false,
                    componentState: {
                        id: 'chart-panel',
                        type: 'chart-display'
                    }
                }]
            }]
        };
    }

    // ============================================================================
    // Visual Studio 테마 설정
    // ============================================================================
    
    static getVisualStudioTheme() {
        return {
            // 색상 팔레트
            colors: {
                background: '#1e1e1e',
                backgroundDark: '#252526',
                backgroundLight: '#2d2d30',
                border: '#3e3e42',
                textPrimary: '#cccccc',
                textSecondary: '#969696',
                textMuted: '#6a6a6a',
                accent: '#007acc',
                accentHover: '#1177bb',
                success: '#4ec9b0',
                warning: '#ffcc02',
                error: '#f44747'
            },
            
            // 헤더 스타일
            header: {
                height: '32px',
                background: '#2d2d30',
                borderBottom: '1px solid #3e3e42',
                fontSize: '12px',
                fontWeight: '500',
                color: '#cccccc'
            },
            
            // 탭 스타일
            tab: {
                background: '#2d2d30',
                backgroundActive: '#1e1e1e',
                backgroundHover: '#2a2a2a',
                border: '#3e3e42',
                borderRadius: '0',
                fontSize: '12px',
                padding: '8px 16px'
            },
            
            // 컨텐츠 영역
            content: {
                background: '#1e1e1e',
                border: '#3e3e42'
            },
            
            // 스플리터
            splitter: {
                background: '#3e3e42',
                size: '5px',
                hoverBackground: '#007acc'
            }
        };
    }

    // ============================================================================
    // 특화된 레이아웃 설정들
    // ============================================================================
    
    static getMinimalChartLayout() {
        return {
            ...this.getDefaultConfig(),
            settings: {
                ...this.getDefaultConfig().settings,
                // 차트 전용 최적화
                hasHeaders: false,
                reorderEnabled: false,
                showPopoutIcon: false,
                showMaximiseIcon: false,
                showCloseIcon: false
            },
            content: [{
                type: 'component',
                componentName: 'chart-panel',
                id: 'minimal-chart-panel',
                title: 'Chart',
                isClosable: false,
                componentState: {
                    id: 'chart-panel',
                    type: 'chart-display',
                    minimal: true
                }
            }]
        };
    }
    
    static getDebugLayout() {
        return {
            ...this.getDefaultConfig(),
            content: [{
                type: 'row',
                content: [{
                    type: 'column',
                    width: 70,
                    content: [{
                        type: 'component',
                        componentName: 'chart-panel',
                        id: 'debug-chart-panel',
                        title: 'Chart Display',
                        componentState: {
                            id: 'chart-panel',
                            type: 'chart-display',
                            debug: true
                        }
                    }]
                }, {
                    type: 'column',
                    width: 30,
                    content: [{
                        type: 'stack',
                        content: [{
                            type: 'component',
                            componentName: 'debug-panel',
                            title: 'Debug Info',
                            componentState: {
                                id: 'debug-panel',
                                type: 'debug'
                            }
                        }]
                    }]
                }]
            }]
        };
    }

    // ============================================================================
    // 반응형 레이아웃 설정
    // ============================================================================
    
    static getResponsiveBreakpoints() {
        return {
            mobile: {
                maxWidth: 768,
                config: {
                    ...this.getMinimalChartLayout(),
                    dimensions: {
                        headerHeight: 40,
                        minItemHeight: 150,
                        minItemWidth: 200,
                        borderWidth: 3
                    }
                }
            },
            tablet: {
                maxWidth: 1024,
                config: {
                    ...this.getDefaultConfig(),
                    dimensions: {
                        headerHeight: 28,
                        minItemHeight: 180,
                        minItemWidth: 220,
                        borderWidth: 4
                    }
                }
            },
            desktop: {
                minWidth: 1025,
                config: this.getDefaultConfig()
            }
        };
    }

    // ============================================================================
    // 플로팅 윈도우 설정
    // ============================================================================
    
    static getFloatingWindowConfig(type, options = {}) {
        const baseConfig = {
            width: 800,
            height: 600,
            minWidth: 400,
            minHeight: 300,
            resizable: true,
            maximizable: true,
            minimizable: false,
            modal: false,
            alwaysOnTop: false,
            frame: true,
            center: true,
            backgroundColor: '#1e1e1e',
            titleBarStyle: 'default',
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true
            }
        };
        
        const configs = {
            'data-generator': {
                ...baseConfig,
                width: 900,
                height: 700,
                title: 'Data Generator',
                icon: '📊'
            },
            
            'chart-config': {
                ...baseConfig,
                width: 1000,
                height: 800,
                title: 'Chart Configuration',
                icon: '⚙️'
            },
            
            'chart-preview': {
                ...baseConfig,
                width: 600,
                height: 500,
                title: 'Chart Preview',
                icon: '📈',
                resizable: true
            },
            
            'data-preview': {
                ...baseConfig,
                width: 700,
                height: 500,
                title: 'Data Preview',
                icon: '📋'
            }
        };
        
        return {
            ...configs[type] || baseConfig,
            ...options
        };
    }

    // ============================================================================
    // 테마 적용 유틸리티
    // ============================================================================
    
    static applyVisualStudioTheme(layout) {
        const theme = this.getVisualStudioTheme();
        
        // CSS 변수로 테마 적용
        const root = document.documentElement;
        Object.entries(theme.colors).forEach(([key, value]) => {
            root.style.setProperty(`--vs-${key}`, value);
        });
        
        // 레이아웃에 테마 클래스 추가
        if (layout && layout.container) {
            layout.container.classList.add('vs-theme');
        }
        
        return theme;
    }

    // ============================================================================
    // 동적 설정 생성
    // ============================================================================
    
    static createCustomLayout(components = []) {
        const content = components.map(component => ({
            type: 'component',
            componentName: component.type,
            id: component.id || `component-${Date.now()}`,
            title: component.title || component.type,
            isClosable: component.closable !== false,
            componentState: component.state || {}
        }));
        
        return {
            ...this.getDefaultConfig(),
            content: content.length > 1 ? [{
                type: 'row',
                content: content
            }] : content
        };
    }
    
    static createStackLayout(components = []) {
        return {
            ...this.getDefaultConfig(),
            content: [{
                type: 'stack',
                content: components.map(component => ({
                    type: 'component',
                    componentName: component.type,
                    id: component.id || `stack-${Date.now()}`,
                    title: component.title || component.type,
                    componentState: component.state || {}
                }))
            }]
        };
    }

    // ============================================================================
    // 설정 검증
    // ============================================================================
    
    static validateConfig(config) {
        const required = ['content'];
        const missing = required.filter(key => !config[key]);
        
        if (missing.length > 0) {
            throw new Error(`Missing required config properties: ${missing.join(', ')}`);
        }
        
        // 컨텐츠 검증
        if (!Array.isArray(config.content) || config.content.length === 0) {
            throw new Error('Config content must be a non-empty array');
        }
        
        return true;
    }

    // ============================================================================
    // 사전 정의된 레이아웃들
    // ============================================================================
    
    static getPredefinedLayouts() {
        return {
            'default': this.getDefaultConfig(),
            'minimal': this.getMinimalChartLayout(),
            'debug': this.getDebugLayout(),
            'chart-only': this.getMinimalChartLayout()
        };
    }
    
    static getLayoutByName(name) {
        const layouts = this.getPredefinedLayouts();
        return layouts[name] || layouts['default'];
    }
}