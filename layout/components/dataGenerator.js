// ============================================================================
// layout/components/data-generator.js - 데이터 생성기 컴포넌트
// ============================================================================

import { sessionStorageManager } from '../../sources/shared/session_storage_manager/index.js';

export class DataGenerator {
    constructor(container, options = {}) {
        this.container = container;
        this.options = options;
        this.windowId = options.windowId || 'dataGenerator';
        
        // 콜백 함수들
        this.onDataGenerated = options.onDataGenerated || (() => {});
        this.onClose = options.onClose || (() => {});
        
        // 상태
        this.rawData = null;
        this.isGenerating = false;
        
        // UI 요소들
        this.formElement = null;
        this.previewElement = null;
        this.statusElement = null;
        
        console.log('[DATA_GENERATOR] DataGenerator 생성:', this.windowId);
        
        this.initialize();
    }

    // ============================================================================
    // 초기화
    // ============================================================================

    initialize() {
        try {
            console.log('[DATA_GENERATOR] 초기화 시작');
            
            // 컨테이너 설정
            this.setupContainer();
            
            // UI 생성
            this.createUI();
            
            // 이벤트 바인딩
            this.bindEvents();
            
            // 초기 상태 설정
            this.updateStatus('Ready to generate data', 'ready');
            
            console.log('[DATA_GENERATOR] 초기화 완료');
            
        } catch (error) {
            console.error('[DATA_GENERATOR] 초기화 오류:', error);
            this.showError('Failed to initialize data generator: ' + error.message);
        }
    }

    setupContainer() {
        this.container.style.cssText = `
            width: 100%;
            height: 100%;
            background: #1e1e1e;
            color: #cccccc;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 14px;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        `;
    }

    createUI() {
        this.container.innerHTML = `
            <div class="data-generator-container">
                <!-- 헤더 -->
                <div class="dg-header">
                    <h2>📊 Data Generator</h2>
                    <p>Generate multi-dimensional sample data for visualization</p>
                </div>

                <!-- 상태 표시 -->
                <div id="status-bar" class="dg-status-bar">
                    <span class="status-indicator"></span>
                    <span class="status-text">Ready</span>
                </div>

                <!-- 메인 컨텐츠 -->
                <div class="dg-content">
                    <!-- 데이터 생성 폼 -->
                    <div class="dg-section">
                        <h3>🎛️ Data Configuration</h3>
                        <div class="dg-form-grid">
                            <div class="form-group">
                                <label for="dataCount">Number of Records:</label>
                                <input type="number" id="dataCount" min="10" max="50000" value="1000" />
                                <small>Range: 10 - 50,000 records</small>
                            </div>
                            
                            <div class="form-group">
                                <label for="dimensionCount">Dimensions:</label>
                                <select id="dimensionCount">
                                    <option value="2">2D (X, Y)</option>
                                    <option value="3" selected>3D (X, Y, Z)</option>
                                    <option value="4">4D (X, Y, Z, W)</option>
                                    <option value="5">5D (X, Y, Z, W, V)</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="dataPattern">Data Pattern:</label>
                                <select id="dataPattern">
                                    <option value="random">Random Distribution</option>
                                    <option value="clustered" selected>Clustered Groups</option>
                                    <option value="linear">Linear Correlation</option>
                                    <option value="spiral">Spiral Pattern</option>
                                    <option value="grid">Grid Pattern</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="noiseLevel">Noise Level:</label>
                                <input type="range" id="noiseLevel" min="0" max="100" value="20" />
                                <span id="noiseValue">20%</span>
                            </div>
                        </div>
                        
                        <div class="form-actions">
                            <button id="generateBtn" class="btn btn-primary">
                                🎲 Generate Data
                            </button>
                            <button id="clearBtn" class="btn btn-secondary" disabled>
                                🗑️ Clear Data
                            </button>
                        </div>
                    </div>

                    <!-- 데이터 미리보기 -->
                    <div id="previewSection" class="dg-section" style="display: none;">
                        <h3>📋 Data Preview</h3>
                        <div class="preview-info">
                            <span id="recordCount">0</span> records generated
                            <button id="showAllData" class="btn btn-link">View All Data</button>
                        </div>
                        <div class="table-container">
                            <table id="dataTable" class="data-table">
                                <thead id="tableHeader"></thead>
                                <tbody id="tableBody"></tbody>
                            </table>
                        </div>
                        <div class="preview-actions">
                            <button id="saveDataBtn" class="btn btn-success">
                                💾 Save & Continue to Chart Config
                            </button>
                            <button id="exportDataBtn" class="btn btn-secondary">
                                📤 Export Data (CSV)
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // CSS 스타일 추가
        this.addStyles();
        
        console.log('[DATA_GENERATOR] UI 생성 완료');
    }

    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .data-generator-container {
                width: 100%;
                height: 100%;
                display: flex;
                flex-direction: column;
                overflow: hidden;
            }
            
            .dg-header {
                padding: 20px;
                background: #2d2d30;
                border-bottom: 1px solid #3e3e42;
                flex-shrink: 0;
            }
            
            .dg-header h2 {
                margin: 0 0 8px 0;
                color: #cccccc;
                font-size: 18px;
                font-weight: 600;
            }
            
            .dg-header p {
                margin: 0;
                color: #969696;
                font-size: 13px;
            }
            
            .dg-status-bar {
                padding: 8px 20px;
                background: #252526;
                border-bottom: 1px solid #3e3e42;
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 12px;
                flex-shrink: 0;
            }
            
            .status-indicator {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #4ec9b0;
            }
            
            .status-indicator.loading {
                background: #ffcc02;
                animation: pulse 1.5s ease-in-out infinite;
            }
            
            .status-indicator.error {
                background: #f44747;
            }
            
            .dg-content {
                flex: 1;
                overflow-y: auto;
                padding: 20px;
            }
            
            .dg-section {
                background: #252526;
                border: 1px solid #3e3e42;
                border-radius: 4px;
                padding: 20px;
                margin-bottom: 20px;
            }
            
            .dg-section h3 {
                margin: 0 0 16px 0;
                color: #cccccc;
                font-size: 16px;
                font-weight: 600;
            }
            
            .dg-form-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 16px;
                margin-bottom: 24px;
            }
            
            .form-group {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }
            
            .form-group label {
                font-size: 12px;
                font-weight: 500;
                color: #cccccc;
            }
            
            .form-group input,
            .form-group select {
                padding: 8px 12px;
                background: #1e1e1e;
                border: 1px solid #3e3e42;
                border-radius: 4px;
                color: #cccccc;
                font-size: 14px;
            }
            
            .form-group input:focus,
            .form-group select:focus {
                outline: none;
                border-color: #007acc;
            }
            
            .form-group small {
                font-size: 11px;
                color: #969696;
            }
            
            .form-actions {
                display: flex;
                gap: 12px;
                flex-wrap: wrap;
            }
            
            .btn {
                padding: 10px 20px;
                border: none;
                border-radius: 4px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            
            .btn-primary {
                background: #007acc;
                color: white;
            }
            
            .btn-primary:hover:not(:disabled) {
                background: #1177bb;
            }
            
            .btn-secondary {
                background: #3e3e42;
                color: #cccccc;
            }
            
            .btn-secondary:hover:not(:disabled) {
                background: #4a4a4e;
            }
            
            .btn-success {
                background: #4ec9b0;
                color: white;
            }
            
            .btn-success:hover:not(:disabled) {
                background: #5dd4c1;
            }
            
            .btn-link {
                background: transparent;
                color: #007acc;
                border: 1px solid transparent;
                padding: 4px 8px;
                font-size: 12px;
            }
            
            .btn-link:hover {
                background: #007acc20;
                border-color: #007acc;
            }
            
            .preview-info {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 16px;
                font-size: 13px;
                color: #969696;
            }
            
            .table-container {
                max-height: 300px;
                overflow: auto;
                border: 1px solid #3e3e42;
                border-radius: 4px;
                margin-bottom: 16px;
            }
            
            .data-table {
                width: 100%;
                border-collapse: collapse;
                font-size: 12px;
            }
            
            .data-table th,
            .data-table td {
                padding: 8px 12px;
                text-align: left;
                border-bottom: 1px solid #3e3e42;
            }
            
            .data-table th {
                background: #2d2d30;
                font-weight: 600;
                position: sticky;
                top: 0;
                z-index: 1;
            }
            
            .data-table tr:hover {
                background: #2a2a2a;
            }
            
            .preview-actions {
                display: flex;
                gap: 12px;
                flex-wrap: wrap;
            }
            
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }
        `;
        
        document.head.appendChild(style);
    }

    bindEvents() {
        // 노이즈 레벨 슬라이더
        const noiseSlider = document.getElementById('noiseLevel');
        const noiseValue = document.getElementById('noiseValue');
        noiseSlider.addEventListener('input', () => {
            noiseValue.textContent = noiseSlider.value + '%';
        });

        // 생성 버튼
        document.getElementById('generateBtn').addEventListener('click', () => {
            this.generateData();
        });

        // 클리어 버튼
        document.getElementById('clearBtn').addEventListener('click', () => {
            this.clearData();
        });

        // 저장 버튼
        document.getElementById('saveDataBtn').addEventListener('click', () => {
            this.saveAndContinue();
        });

        // 내보내기 버튼
        document.getElementById('exportDataBtn').addEventListener('click', () => {
            this.exportData();
        });

        // 모든 데이터 보기 버튼
        document.getElementById('showAllData').addEventListener('click', () => {
            this.showAllData();
        });

        console.log('[DATA_GENERATOR] 이벤트 바인딩 완료');
    }

    // ============================================================================
    // 데이터 생성
    // ============================================================================

    async generateData() {
        if (this.isGenerating) return;

        try {
            this.isGenerating = true;
            this.updateStatus('Generating data...', 'loading');
            
            // 폼 값 읽기
            const config = this.getFormConfig();
            
            console.log('[DATA_GENERATOR] 데이터 생성 시작:', config);
            
            // 데이터 생성 (기존 로직 활용)
            this.rawData = await this.createSampleData(config);
            
            // 미리보기 표시
            this.displayDataPreview();
            
            // UI 업데이트
            this.updateStatus(`Generated ${this.rawData.length} records`, 'ready');
            document.getElementById('clearBtn').disabled = false;
            
            console.log('[DATA_GENERATOR] 데이터 생성 완료:', this.rawData.length, '개');
            
        } catch (error) {
            console.error('[DATA_GENERATOR] 데이터 생성 오류:', error);
            this.updateStatus('Data generation failed', 'error');
            this.showError('Failed to generate data: ' + error.message);
        } finally {
            this.isGenerating = false;
        }
    }

    getFormConfig() {
        return {
            count: parseInt(document.getElementById('dataCount').value),
            dimensions: parseInt(document.getElementById('dimensionCount').value),
            pattern: document.getElementById('dataPattern').value,
            noise: parseInt(document.getElementById('noiseLevel').value) / 100
        };
    }

    async createSampleData(config) {
        // 기존 데이터 생성 로직을 여기에 구현
        // 간단한 예시 구현
        const data = [];
        const { count, dimensions, pattern, noise } = config;
        
        for (let i = 0; i < count; i++) {
            const record = { id: i + 1 };
            
            // 기본 좌표 생성
            switch (pattern) {
                case 'random':
                    record.x = Math.random() * 100;
                    record.y = Math.random() * 100;
                    if (dimensions >= 3) record.z = Math.random() * 100;
                    if (dimensions >= 4) record.w = Math.random() * 100;
                    if (dimensions >= 5) record.v = Math.random() * 100;
                    break;
                    
                case 'clustered':
                    const cluster = Math.floor(Math.random() * 3);
                    const centerX = [25, 50, 75][cluster];
                    const centerY = [25, 50, 75][cluster];
                    record.x = centerX + (Math.random() - 0.5) * 20;
                    record.y = centerY + (Math.random() - 0.5) * 20;
                    if (dimensions >= 3) record.z = centerX + (Math.random() - 0.5) * 20;
                    if (dimensions >= 4) record.w = Math.random() * 100;
                    if (dimensions >= 5) record.v = Math.random() * 100;
                    break;
                    
                case 'linear':
                    record.x = i / count * 100;
                    record.y = record.x + (Math.random() - 0.5) * 20;
                    if (dimensions >= 3) record.z = record.x * 0.5 + (Math.random() - 0.5) * 10;
                    if (dimensions >= 4) record.w = Math.random() * 100;
                    if (dimensions >= 5) record.v = Math.random() * 100;
                    break;
                    
                default:
                    record.x = Math.random() * 100;
                    record.y = Math.random() * 100;
                    if (dimensions >= 3) record.z = Math.random() * 100;
                    if (dimensions >= 4) record.w = Math.random() * 100;
                    if (dimensions >= 5) record.v = Math.random() * 100;
            }
            
            // 노이즈 추가
            Object.keys(record).forEach(key => {
                if (key !== 'id' && typeof record[key] === 'number') {
                    record[key] += (Math.random() - 0.5) * noise * 20;
                    record[key] = Math.round(record[key] * 100) / 100; // 소수점 2자리
                }
            });
            
            data.push(record);
        }
        
        return data;
    }

    displayDataPreview() {
        if (!this.rawData || this.rawData.length === 0) return;

        console.log('[DATA_GENERATOR] 데이터 미리보기 표시');

        // 미리보기 섹션 표시
        document.getElementById('previewSection').style.display = 'block';
        document.getElementById('recordCount').textContent = this.rawData.length;

        // 테이블 생성
        this.createDataTable();
    }

    createDataTable() {
        const table = document.getElementById('dataTable');
        const header = document.getElementById('tableHeader');
        const body = document.getElementById('tableBody');

        // 헤더 생성
        const fields = Object.keys(this.rawData[0]);
        header.innerHTML = '<tr>' + fields.map(field => `<th>${field}</th>`).join('') + '</tr>';

        // 데이터 행 생성 (최대 10개만 표시)
        const displayData = this.rawData.slice(0, 10);
        body.innerHTML = displayData.map(row => 
            '<tr>' + fields.map(field => {
                let value = row[field];
                if (typeof value === 'number' && !Number.isInteger(value)) {
                    value = value.toFixed(2);
                }
                return `<td>${value}</td>`;
            }).join('') + '</tr>'
        ).join('');
    }

    // ============================================================================
    // 데이터 관리
    // ============================================================================

    saveAndContinue() {
        try {
            if (!this.rawData || this.rawData.length === 0) {
                this.showError('No data to save');
                return;
            }

            console.log('[DATA_GENERATOR] 데이터 저장 및 계속');

            // 세션 스토리지에 저장
            sessionStorageManager.saveRawDataToSessionStorage(this.rawData);

            // 콜백 호출
            this.onDataGenerated(this.rawData);

            // 상태 업데이트
            this.updateStatus('Data saved successfully', 'ready');

            // 차트 설정 창 열기
            this.openChartConfig();

        } catch (error) {
            console.error('[DATA_GENERATOR] 데이터 저장 오류:', error);
            this.showError('Failed to save data: ' + error.message);
        }
    }

    clearData() {
        console.log('[DATA_GENERATOR] 데이터 클리어');

        this.rawData = null;
        document.getElementById('previewSection').style.display = 'none';
        document.getElementById('clearBtn').disabled = true;
        this.updateStatus('Data cleared', 'ready');
    }

    exportData() {
        try {
            if (!this.rawData || this.rawData.length === 0) {
                this.showError('No data to export');
                return;
            }

            console.log('[DATA_GENERATOR] 데이터 내보내기');

            // CSV 변환
            const csv = this.convertToCSV(this.rawData);
            
            // 다운로드
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `generated-data-${new Date().toISOString().slice(0, 10)}.csv`;
            a.click();
            URL.revokeObjectURL(url);

            this.updateStatus('Data exported successfully', 'ready');

        } catch (error) {
            console.error('[DATA_GENERATOR] 데이터 내보내기 오류:', error);
            this.showError('Failed to export data: ' + error.message);
        }
    }

    convertToCSV(data) {
        const fields = Object.keys(data[0]);
        const header = fields.join(',');
        const rows = data.map(row => fields.map(field => row[field]).join(','));
        return [header, ...rows].join('\n');
    }

    showAllData() {
        // 새 창에서 전체 데이터 표시 (간단 구현)
        const newWindow = window.open('', '_blank', 'width=800,height=600');
        const html = `
            <html>
            <head><title>Full Data View</title></head>
            <body style="font-family: monospace; font-size: 12px;">
                <h3>Generated Data (${this.rawData.length} records)</h3>
                <pre>${JSON.stringify(this.rawData, null, 2)}</pre>
            </body>
            </html>
        `;
        newWindow.document.write(html);
    }

    // ============================================================================
    // UI 헬퍼
    // ============================================================================

    updateStatus(message, type = 'ready') {
        const indicator = document.querySelector('.status-indicator');
        const text = document.querySelector('.status-text');
        
        indicator.className = `status-indicator ${type}`;
        text.textContent = message;
    }

    showError(message) {
        console.error('[DATA_GENERATOR] 에러 표시:', message);
        alert(message); // 간단한 구현, 나중에 모달로 개선 가능
    }

    openChartConfig() {
        try {
            // WindowManager를 통해 차트 설정 창 열기
            if (window.MainApp && window.MainApp.getWindowManager) {
                const windowManager = window.MainApp.getWindowManager();
                windowManager.openChartConfig();
            }
        } catch (error) {
            console.error('[DATA_GENERATOR] 차트 설정 창 열기 오류:', error);
        }
    }

    // ============================================================================
    // 정리
    // ============================================================================

    cleanup() {
        console.log('[DATA_GENERATOR] 정리 시작');
        
        try {
            // 상태 초기화
            this.rawData = null;
            this.isGenerating = false;
            
            console.log('[DATA_GENERATOR] 정리 완료');
            
        } catch (error) {
            console.error('[DATA_GENERATOR] 정리 중 오류:', error);
        }
    }
}