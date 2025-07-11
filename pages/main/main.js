// ============================================================================
// pages/main/main.js - 메인 페이지 초기화 및 이벤트 관리
// ============================================================================

import { GoldenLayoutManager } from '../../layout/golden-layout.js';
import { WindowManager } from '../../layout/window-manager.js';
import { sessionStorageManager } from '../../sources/shared/session_storage_manager/index.js';

// 전역 매니저 인스턴스
let layoutManager = null;
let windowManager = null;

// 앱 상태
const appState = {
    isInitialized: false,
    hasData: false,
    hasConfig: false,
    currentStatus: 'ready'
};

// ============================================================================
// 초기화
// ============================================================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('[MAIN] 애플리케이션 초기화 시작');
    
    try {
        showLoading('Initializing application...');
        
        // 매니저 초기화
        await initializeManagers();
        
        // UI 이벤트 바인딩
        setupEventListeners();
        
        // 기존 데이터 확인
        checkExistingData();
        
        // 초기화 완료
        appState.isInitialized = true;
        updateStatus('ready', 'Application ready');
        
        console.log('[MAIN] 애플리케이션 초기화 완료');
        
    } catch (error) {
        console.error('[MAIN] 초기화 오류:', error);
        showError('Failed to initialize application: ' + error.message);
    } finally {
        hideLoading();
    }
});

// ============================================================================
// 매니저 초기화
// ============================================================================

async function initializeManagers() {
    try {
        // Golden Layout 매니저 초기화
        layoutManager = new GoldenLayoutManager();
        await layoutManager.initialize(document.getElementById('golden-layout-container'));
        
        // Window 매니저 초기화
        windowManager = new WindowManager(layoutManager);
        
        // 매니저 간 연결
        layoutManager.setWindowManager(windowManager);
        
        console.log('[MAIN] 매니저 초기화 완료');
        
    } catch (error) {
        console.error('[MAIN] 매니저 초기화 오류:', error);
        throw error;
    }
}

// ============================================================================
// 이벤트 리스너 설정
// ============================================================================

function setupEventListeners() {
    // 데이터 생성기 버튼
    document.getElementById('btn-data-generator').addEventListener('click', () => {
        openDataGenerator();
    });
    
    // 차트 설정 버튼
    document.getElementById('btn-chart-config').addEventListener('click', () => {
        openChartConfig();
    });
    
    // 레이아웃 리셋 버튼
    document.getElementById('btn-reset-layout').addEventListener('click', () => {
        resetLayout();
    });
    
    // 에러 모달 닫기
    document.querySelector('.modal-close').addEventListener('click', hideError);
    document.getElementById('error-ok-btn').addEventListener('click', hideError);
    
    // 키보드 단축키
    document.addEventListener('keydown', handleKeyboardShortcuts);
    
    // 윈도우 리사이즈
    window.addEventListener('resize', handleWindowResize);
    
    // 브라우저 종료 전 정리
    window.addEventListener('beforeunload', cleanup);
    
    console.log('[MAIN] 이벤트 리스너 설정 완료');
}

// ============================================================================
// 창 열기 함수들
// ============================================================================

function openDataGenerator() {
    try {
        updateStatus('opening', 'Opening Data Generator...');
        windowManager.openDataGenerator();
        updateStatus('ready', 'Data Generator opened');
    } catch (error) {
        console.error('[MAIN] 데이터 생성기 열기 오류:', error);
        showError('Failed to open Data Generator: ' + error.message);
        updateStatus('error', 'Failed to open Data Generator');
    }
}

function openChartConfig() {
    try {
        // 데이터가 있는지 확인
        if (!appState.hasData) {
            showError('Please generate data first using the Data Generator.');
            return;
        }
        
        updateStatus('opening', 'Opening Chart Config...');
        windowManager.openChartConfig();
        updateStatus('ready', 'Chart Config opened');
    } catch (error) {
        console.error('[MAIN] 차트 설정 열기 오류:', error);
        showError('Failed to open Chart Config: ' + error.message);
        updateStatus('error', 'Failed to open Chart Config');
    }
}

function resetLayout() {
    if (confirm('⚠️ This will close all floating windows and reset the layout. Continue?')) {
        try {
            updateStatus('resetting', 'Resetting layout...');
            
            // 윈도우 매니저 리셋
            windowManager.closeAllWindows();
            
            // 레이아웃 매니저 리셋
            layoutManager.resetLayout();
            
            updateStatus('ready', 'Layout reset complete');
            console.log('[MAIN] 레이아웃 리셋 완료');
            
        } catch (error) {
            console.error('[MAIN] 레이아웃 리셋 오류:', error);
            showError('Failed to reset layout: ' + error.message);
            updateStatus('error', 'Layout reset failed');
        }
    }
}

// ============================================================================
// 데이터 상태 관리
// ============================================================================

function checkExistingData() {
    try {
        // 세션 스토리지에서 기존 데이터 확인
        const hasRawData = sessionStorageManager.hasRawData();
        const hasChartConfig = sessionStorageManager.hasChartConfig();
        
        appState.hasData = hasRawData;
        appState.hasConfig = hasChartConfig;
        
        // UI 상태 업데이트
        updateButtonStates();
        
        if (hasRawData) {
            console.log('[MAIN] 기존 데이터 발견');
            updateStatus('data-loaded', 'Existing data found');
        }
        
        if (hasChartConfig) {
            console.log('[MAIN] 기존 차트 설정 발견');
            // 자동으로 차트 패널에 차트 로드
            loadExistingChart();
        }
        
    } catch (error) {
        console.warn('[MAIN] 기존 데이터 확인 중 오류:', error);
    }
}

function updateButtonStates() {
    const configBtn = document.getElementById('btn-chart-config');
    
    if (appState.hasData) {
        configBtn.disabled = false;
        configBtn.classList.remove('disabled');
    } else {
        configBtn.disabled = true;
        configBtn.classList.add('disabled');
    }
}

async function loadExistingChart() {
    try {
        if (appState.hasData && appState.hasConfig) {
            updateStatus('loading-chart', 'Loading existing chart...');
            
            // 차트 패널에 기존 차트 로드
            await layoutManager.loadChartInPanel();
            
            updateStatus('chart-loaded', 'Chart loaded');
        }
    } catch (error) {
        console.error('[MAIN] 기존 차트 로드 오류:', error);
        updateStatus('error', 'Failed to load existing chart');
    }
}

// ============================================================================
// 상태 및 UI 관리
// ============================================================================

function updateStatus(status, message) {
    appState.currentStatus = status;
    
    const indicator = document.getElementById('status-indicator');
    const statusDot = indicator.querySelector('.status-dot');
    const statusText = indicator.querySelector('.status-text');
    
    // 기존 클래스 제거
    statusDot.className = 'status-dot';
    
    // 새 상태 클래스 추가
    switch (status) {
        case 'ready':
            statusDot.classList.add('ready');
            break;
        case 'loading':
        case 'opening':
        case 'resetting':
            statusDot.classList.add('loading');
            break;
        case 'data-loaded':
        case 'chart-loaded':
            statusDot.classList.add('success');
            break;
        case 'error':
            statusDot.classList.add('error');
            break;
        default:
            statusDot.classList.add('ready');
    }
    
    statusText.textContent = message || status;
    
    console.log(`[MAIN] 상태 업데이트: ${status} - ${message}`);
}

function showLoading(message = 'Loading...') {
    const overlay = document.getElementById('loading-overlay');
    const text = overlay.querySelector('.loading-text');
    text.textContent = message;
    overlay.classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loading-overlay').classList.add('hidden');
}

function showError(message) {
    const modal = document.getElementById('error-modal');
    const messageEl = document.getElementById('error-message');
    messageEl.textContent = message;
    modal.classList.remove('hidden');
    
    console.error('[MAIN] 에러 표시:', message);
}

function hideError() {
    document.getElementById('error-modal').classList.add('hidden');
}

// ============================================================================
// 이벤트 핸들러들
// ============================================================================

function handleKeyboardShortcuts(event) {
    // Ctrl/Cmd + 키 조합들
    if (event.ctrlKey || event.metaKey) {
        switch (event.key.toLowerCase()) {
            case 'd':
                event.preventDefault();
                openDataGenerator();
                break;
            case 'c':
                event.preventDefault();
                openChartConfig();
                break;
            case 'r':
                event.preventDefault();
                resetLayout();
                break;
        }
    }
    
    // ESC 키
    if (event.key === 'Escape') {
        hideError();
    }
}

function handleWindowResize() {
    if (layoutManager) {
        layoutManager.handleResize();
    }
}

function cleanup() {
    console.log('[MAIN] 애플리케이션 정리 시작');
    
    try {
        if (windowManager) {
            windowManager.cleanup();
        }
        
        if (layoutManager) {
            layoutManager.cleanup();
        }
        
    } catch (error) {
        console.warn('[MAIN] 정리 중 오류:', error);
    }
}

// ============================================================================
// 전역 API (다른 컴포넌트에서 사용)
// ============================================================================

window.MainApp = {
    // 상태 관리
    updateDataState: (hasData) => {
        appState.hasData = hasData;
        updateButtonStates();
        if (hasData) {
            updateStatus('data-loaded', 'Data generated');
        }
    },
    
    updateConfigState: (hasConfig) => {
        appState.hasConfig = hasConfig;
        if (hasConfig) {
            updateStatus('config-saved', 'Chart configuration saved');
        }
    },
    
    // 차트 로드
    loadChart: async () => {
        await loadExistingChart();
    },
    
    // 상태 조회
    getState: () => ({ ...appState }),
    
    // 매니저 접근
    getLayoutManager: () => layoutManager,
    getWindowManager: () => windowManager
};