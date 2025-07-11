// ============================================================================
// layout/components/chart-configurator.js - 차트 설정 컴포넌트
// ============================================================================

import { sessionStorageManager } from '../../sources/shared/session_storage_manager/index.js';
import { buildChartConfigForGeneration } from '../../sources/chart_config_source/config_builder/index.js';

export class ChartConfigurator {
    constructor(container, options = {}) {
        this.container = container;
        this.options = options;
        this.windowId = options.windowId || 'chartConfig';
        
        // 콜백 함수들
        this.onConfigSaved = options.onConfigSaved || (() => {});
        this.onClose = options.onClose || (() => {});
        
        // 상태
        this.rawData = null;
        this.fieldNames = [];
        this.currentConfig = null;
        
        // UI 요소들
        this.formElement = null;
        this.previewElement = null;
        
        console.log('[CHART_CONFIG] ChartConfigurator 생성:', this.windowId);
        
        this.initialize();
    }

    // ============================================================================
    // 초기화
    // ============================================================================

    async initialize() {
        try {
            console.log('[CHART_CONFIG] 초기화 시작');
            
            // 컨테이너 설정
            this.setupContainer();
            
            // 데이터 로드
            await this.loadData();
            
            // UI 생성
            this.createUI();
            
            // 이벤트 바인딩
            this.bindEvents();
            
            // 초기 폼 상태 설정
            this.updateFormVisibility();
            
            console.log('[CHART_CONFIG] 초기화 완료');
            
        } catch (error) {
            console.error('[CHART_CONFIG] 초기화 오류:', error);
            this.showError('Failed to initialize chart configurator: ' + error.message);
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

    async loadData() {
        try {
            console.log('[CHART_CONFIG] 데이터 로드 시작');
            
            // 세션 스토리지에서 데이터 확인
            if (!sessionStorageManager.hasRawData()) {
                throw new Error('No data found. Please generate data first.');
            }
            
            // 데이터 로드
            const { data, meta } = sessionStorageManager.loadRawDataFromSessionStorage();
            this.rawData = data;
            this.fieldNames = meta.fieldNames;
            
            console.log('[CHART_CONFIG] 데이터 로드 완료:', {
                records: this.rawData.length,
                fields: this.fieldNames
            });
            
        } catch (error) {
            console.error('[CHART_CONFIG] 데이터 로드 오류:', error);
            throw error;
        }
    }

    createUI() {
        this.container.innerHTML = `
            <div class="chart-config-container">
                <!-- 헤더 -->
                <div class="cc-header">
                    <h2>⚙️ Chart Configuration</h2>
                    <p>Configure visualization settings for your data</p>
                </div>

                <!-- 데이터 정보 -->
                <div class="cc-data-info">
                    <strong>📊 Data:</strong> ${this.rawData.length} records, 
                    <strong>📋 Fields:</strong> ${this.fieldNames.join(', ')}
                </div>

                <!-- 메인 컨텐츠 -->
                <div class="cc-content">
                    <!-- 차트 타입 선택 -->
                    <div class="cc-section">
                        <h3>1. Chart Type</h3>
                        <div class="chart-type-grid">
                            <label class="chart-type-option">
                                <input type="radio" name="chartType" value="2d_scatter" checked>
                                <div class="chart-type-card">
                                    <div class="chart-icon">📊</div>
                                    <div class="chart-name">2D Scatter</div>
                                    <div class="chart-desc">X-Y coordinate plot</div>
                                </div>
                            </label>
                            <label class="chart-type-option">
                                <input type="radio" name="chartType" value="3d_scatter">
                                <div class="chart-type-card">
                                    <div class="chart-icon">🎯</div>
                                    <div class="chart-name">3D Scatter</div>
                                    <div class="chart-desc">X-Y-Z coordinate plot</div>
                                </div>
                            </label>
                            <label class="chart-type-option">
                                <input type="radio" name="chartType" value="3d_surface">
                                <div class="chart-type-card">
                                    <div class="chart-icon">🏔️</div>
                                    <div class="chart-name">3D Surface</div>
                                    <div class="chart-desc">Surface mesh plot</div>
                                </div>
                            </label>
                            <label class="chart-type-option">
                                <input type="radio" name="chartType" value="2d_scatter_tiled">
                                <div class="chart-type-card">
                                    <div class="chart-icon">🔳</div>
                                    <div class="chart-name">2D Tiled</div>
                                    <div class="chart-desc">Level-of-detail view</div>
                                </div>
                            </label>
                        </div>
                    </div>

                    <!-- 필드 매핑 -->
                    <div class="cc-section">
                        <h3>2. Field Mapping</h3>
                        <div class="field-mapping-grid">
                            <div class="mapping-group">
                                <label>X Axis:</label>
                                <select id="xAxisField" class="field-selector">
                                    ${this.createFieldOptions()}
                                </select>
                            </div>
                            <div class="mapping-group">
                                <label>Y Axis:</label>
                                <select id="yAxisField" class="field-selector">
                                    ${this.createFieldOptions()}
                                </select>
                            </div>
                            <div class="mapping-group" id="zAxisGroup" style="display: none;">
                                <label>Z Axis:</label>
                                <select id="zAxisField" class="field-selector">
                                    <option value="">None</option>
                                    ${this.createFieldOptions()}
                                </select>
                            </div>
                            <div class="mapping-group" id="colorGroup">
                                <label>Color (Optional):</label>
                                <select id="colorField" class="field-selector">
                                    <option value="">None</option>
                                    ${this.createFieldOptions()}
                                </select>
                            </div>
                            <div class="mapping-group" id="sizeGroup">
                                <label>Size (Optional):</label>
                                <select id="sizeField" class="field-selector">
                                    <option value="">None</option>
                                    ${this.createFieldOptions()}
                                </select>
                            </div>
                        </div>
                    </div>

                    <!-- 시각화 설정 -->
                    <div class="cc-section">
                        <h3>3. Visual Settings</h3>
                        <div class="settings-grid">
                            <!-- 색상 설정 -->
                            <div class="setting-group">
                                <h4>Color Settings</h4>
                                <div class="setting-row">
                                    <label>Color Scheme:</label>
                                    <select id="colorScheme">
                                        <option value="viridis">Viridis</option>
                                        <option value="plasma">Plasma</option>
                                        <option value="blues">Blues</option>
                                        <option value="reds">Reds</option>
                                        <option value="rainbow">Rainbow</option>
                                    </select>
                                </div>
                                <div class="setting-row">
                                    <label>Opacity:</label>
                                    <input type="range" id="opacity" min="0.1" max="1" step="0.1" value="0.8">
                                    <span id="opacityValue">0.8</span>
                                </div>
                            </div>

                            <!-- 크기 설정 -->
                            <div class="setting-group">
                                <h4>Size Settings</h4>
                                <div class="setting-row">
                                    <label>Size Scaling:</label>
                                    <select id="sizeScaling">
                                        <option value="linear">Linear</option>
                                        <option value="log">Logarithmic</option>
                                        <option value="sqrt">Square Root</option>
                                        <option value="sigmoid">Sigmoid</option>
                                    </select>
                                </div>
                                <div class="setting-row">
                                    <label>Base Size:</label>
                                    <input type="range" id="baseSize" min="2" max="20" value="8">
                                    <span id="baseSizeValue">8</span>
                                </div>
                                <div class="setting-row" id="sigmoidKContainer" style="display: none;">
                                    <label>Sigmoid K:</label>
                                    <input type="range" id="sigmoidK" min="0.1" max="2" step="0.1" value="1">
                                    <span id="sigmoidKValue">1</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 고급 설정 -->
                    <div class="cc-section">
                        <h3>4. Advanced Settings</h3>
                        <div class="advanced-settings">
                            <div class="setting-row">
                                <label>
                                    <input type="checkbox" id="showTooltips" checked>
                                    Show tooltips on hover
                                </label>
                            </div>
                            <div class="setting-row">
                                <label>
                                    <input type="checkbox" id="enableZoom" checked>
                                    Enable zoom and pan
                                </label>
                            </div>
                            <div class="setting-row">
                                <label>
                                    <input type="checkbox" id="showLegend" checked>
                                    Show legend
                                </label>
                            </div>
                            <div class="setting-row" id="performanceMode">
                                <label>
                                    <input type="checkbox" id="limitData">
                                    Limit data for performance (max 5000 points)
                                </label>
                            </div>
                        </div>
                    </div>

                    <!-- 액션 버튼 -->
                    <div class="cc-actions">
                        <button id="previewBtn" class="btn btn-secondary">
                            👁️ Preview Configuration
                        </button>
                        <button id="saveConfigBtn" class="btn btn-primary">
                            💾 Save & Generate Chart
                        </button>
                        <button id="resetBtn" class="btn btn-outline">
                            🔄 Reset Settings
                        </button>
                    </div>
                </div>
            </div>
        `;

        // CSS 스타일 추가
        this.addStyles();
        
        console.log('[CHART_CONFIG] UI 생성 완료');
    }

    createFieldOptions() {
        return this.fieldNames.map(field => 
            `<option value="${field}">${field}</option>`
        ).join('');
    }

    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .chart-config-container {
                width: 100%;
                height: 100%;
                display: flex;
                flex-direction: column;
                overflow: hidden;
            }
            
            .cc-header {
                padding: 20px;
                background: #2d2d30;
                border-bottom: 1px solid #3e3e42;
                flex-shrink: 0;
            }
            
            .cc-header h2 {
                margin: 0 0 8px 0;
                color: #cccccc;
                font-size: 18px;
                font-weight: 600;
            }
            
            .cc-header p {
                margin: 0;
                color: #969696;
                font-size: 13px;
            }
            
            .cc-data-info {
                padding: 12px 20px;
                background: #252526;
                border-bottom: 1px solid #3e3e42;
                font-size: 13px;
                color: #969696;
                flex-shrink: 0;
            }
            
            .cc-content {
                flex: 1;
                overflow-y: auto;
                padding: 20px;
            }
            
            .cc-section {
                background: #252526;
                border: 1px solid #3e3e42;
                border-radius: 4px;
                padding: 20px;
                margin-bottom: 20px;
            }
            
            .cc-section h3 {
                margin: 0 0 16px 0;
                color: #cccccc;
                font-size: 16px;
                font-weight: 600;
            }
            
            .cc-section h4 {
                margin: 0 0 12px 0;
                color: #cccccc;
                font-size: 14px;
                font-weight: 500;
            }
            
            .chart-type-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 16px;
            }
            
            .chart-type-option {
                cursor: pointer;
            }
            
            .chart-type-option input[type="radio"] {
                display: none;
            }
            
            .chart-type-card {
                background: #1e1e1e;
                border: 2px solid #3e3e42;
                border-radius: 6px;
                padding: 16px;
                text-align: center;
                transition: all 0.2s ease;
            }
            
            .chart-type-option:hover .chart-type-card {
                border-color: #007acc;
            }
            
            .chart-type-option input:checked + .chart-type-card {
                border-color: #007acc;
                background: #007acc20;
            }
            
            .chart-icon {
                font-size: 24px;
                margin-bottom: 8px;
            }
            
            .chart-name {
                font-weight: 600;
                margin-bottom: 4px;
                color: #cccccc;
            }
            
            .chart-desc {
                font-size: 12px;
                color: #969696;
            }
            
            .field-mapping-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 16px;
            }
            
            .mapping-group {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }
            
            .mapping-group label {
                font-size: 12px;
                font-weight: 500;
                color: #cccccc;
            }
            
            .field-selector {
                padding: 8px 12px;
                background: #1e1e1e;
                border: 1px solid #3e3e42;
                border-radius: 4px;
                color: #cccccc;
                font-size: 14px;
            }
            
            .field-selector:focus {
                outline: none;
                border-color: #007acc;
            }
            
            .settings-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 20px;
            }
            
            .setting-group {
                background: #1e1e1e;
                border: 1px solid #3e3e42;
                border-radius: 4px;
                padding: 16px;
            }
            
            .setting-row {
                display: flex;
                align-items: center;
                gap: 12px;
                margin-bottom: 12px;
            }
            
            .setting-row:last-child {
                margin-bottom: 0;
            }
            
            .setting-row label {
                flex: 1;
                font-size: 12px;
                color: #cccccc;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .setting-row input,
            .setting-row select {
                background: #1e1e1e;
                border: 1px solid #3e3e42;
                border-radius: 4px;
                color: #cccccc;
                padding: 6px 10px;
                font-size: 12px;
            }
            
            .setting-row input[type="range"] {
                width: 80px;
            }
            
            .setting-row input[type="checkbox"] {
                width: auto;
                margin: 0;
            }
            
            .advanced-settings {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }
            
            .cc-actions {
                display: flex;
                gap: 16px;
                flex-wrap: wrap;
                padding-top: 20px;
                border-top: 1px solid #3e3e42;
            }
            
            .btn {
                padding: 12px 24px;
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
            
            .btn-outline {
                background: transparent;
                color: #cccccc;
                border: 1px solid #3e3e42;
            }
            
            .btn-outline:hover:not(:disabled) {
                background: #3e3e42;
            }
        `;
        
        document.head.appendChild(style);
    }

    bindEvents() {
        // 차트 타입 변경
        document.querySelectorAll('input[name="chartType"]').forEach(radio => {
            radio.addEventListener('change', () => {
                this.updateFormVisibility();
            });
        });

        // 슬라이더 값 업데이트
        this.bindSliderEvents();

        // 사이즈 스케일링 변경
        document.getElementById('sizeScaling').addEventListener('change', (e) => {
            const sigmoidContainer = document.getElementById('sigmoidKContainer');
            sigmoidContainer.style.display = e.target.value === 'sigmoid' ? 'flex' : 'none';
        });

        // 액션 버튼들
        document.getElementById('previewBtn').addEventListener('click', () => {
            this.previewConfiguration();
        });

        document.getElementById('saveConfigBtn').addEventListener('click', () => {
            this.saveConfiguration();
        });

        document.getElementById('resetBtn').addEventListener('click', () => {
            this.resetSettings();
        });

        console.log('[CHART_CONFIG] 이벤트 바인딩 완료');
    }

    bindSliderEvents() {
        // 투명도 슬라이더
        const opacitySlider = document.getElementById('opacity');
        const opacityValue = document.getElementById('opacityValue');
        opacitySlider.addEventListener('input', () => {
            opacityValue.textContent = opacitySlider.value;
        });

        // 기본 크기 슬라이더
        const baseSizeSlider = document.getElementById('baseSize');
        const baseSizeValue = document.getElementById('baseSizeValue');
        baseSizeSlider.addEventListener('input', () => {
            baseSizeValue.textContent = baseSizeSlider.value;
        });

        // Sigmoid K 슬라이더
        const sigmoidKSlider = document.getElementById('sigmoidK');
        const sigmoidKValue = document.getElementById('sigmoidKValue');
        sigmoidKSlider.addEventListener('input', () => {
            sigmoidKValue.textContent = sigmoidKSlider.value;
        });
    }

    // ============================================================================
    // 폼 관리
    // ============================================================================

    updateFormVisibility() {
        const chartType = document.querySelector('input[name="chartType"]:checked').value;
        
        // Z축 필드 표시/숨김
        const zAxisGroup = document.getElementById('zAxisGroup');
        const needs3D = chartType.includes('3d');
        zAxisGroup.style.display = needs3D ? 'flex' : 'none';

        // 기본 필드 값 설정
        this.setDefaultFieldMappings();

        console.log('[CHART_CONFIG] 폼 가시성 업데이트:', chartType);
    }

    setDefaultFieldMappings() {
        if (this.fieldNames.length >= 2) {
            document.getElementById('xAxisField').value = this.fieldNames[0] || '';
            document.getElementById('yAxisField').value = this.fieldNames[1] || '';
        }
        if (this.fieldNames.length >= 3) {
            document.getElementById('zAxisField').value = this.fieldNames[2] || '';
        }
    }

    getCurrentConfiguration() {
        const chartType = document.querySelector('input[name="chartType"]:checked').value;
        
        const config = {
            type: chartType,
            dataMapping: {
                x: document.getElementById('xAxisField').value,
                y: document.getElementById('yAxisField').value
            },
            colorConfig: {
                scheme: document.getElementById('colorScheme').value,
                opacity: parseFloat(document.getElementById('opacity').value)
            },
            scalingConfig: {
                sizeScaling: document.getElementById('sizeScaling').value,
                baseSize: parseInt(document.getElementById('baseSize').value),
                sigmoidK: parseFloat(document.getElementById('sigmoidK').value)
            },
            options: {
                showTooltips: document.getElementById('showTooltips').checked,
                enableZoom: document.getElementById('enableZoom').checked,
                showLegend: document.getElementById('showLegend').checked,
                limitData: document.getElementById('limitData').checked
            }
        };

        // Z축 (3D 차트용)
        if (chartType.includes('3d')) {
            config.dataMapping.z = document.getElementById('zAxisField').value;
        }

        // 색상 필드 (선택사항)
        const colorField = document.getElementById('colorField').value;
        if (colorField) {
            config.dataMapping.color = colorField;
        }

        // 크기 필드 (선택사항)
        const sizeField = document.getElementById('sizeField').value;
        if (sizeField) {
            config.dataMapping.size = sizeField;
        }

        return config;
    }

    // ============================================================================
    // 액션 처리
    // ============================================================================

    previewConfiguration() {
        try {
            console.log('[CHART_CONFIG] 설정 미리보기');
            
            const config = this.getCurrentConfiguration();
            console.log('미리보기 설정:', config);
            
            // 간단한 설정 검증
            if (!config.dataMapping.x || !config.dataMapping.y) {
                this.showError('Please select X and Y axis fields');
                return;
            }
            
            // 미리보기 알림
            this.showSuccess('Configuration preview: ' + JSON.stringify(config, null, 2));
            
        } catch (error) {
            console.error('[CHART_CONFIG] 미리보기 오류:', error);
            this.showError('Failed to preview configuration: ' + error.message);
        }
    }

    async saveConfiguration() {
        try {
            console.log('[CHART_CONFIG] 설정 저장 시작');
            
            const config = this.getCurrentConfiguration();
            
            // 설정 검증
            this.validateConfiguration(config);
            
            // 통합 설정 빌드
            const finalConfig = buildChartConfigForGeneration(config);
            
            // 세션 스토리지에 저장
            sessionStorageManager.saveChartConfig(finalConfig);
            
            // 콜백 호출
            this.onConfigSaved(finalConfig);
            
            console.log('[CHART_CONFIG] 설정 저장 완료:', finalConfig);
            this.showSuccess('Chart configuration saved successfully!');
            
        } catch (error) {
            console.error('[CHART_CONFIG] 설정 저장 오류:', error);
            this.showError('Failed to save configuration: ' + error.message);
        }
    }

    validateConfiguration(config) {
        // 필수 필드 검증
        if (!config.dataMapping.x) {
            throw new Error('X axis field is required');
        }
        if (!config.dataMapping.y) {
            throw new Error('Y axis field is required');
        }
        
        // 3D 차트의 경우 Z축 검증
        if (config.type.includes('3d') && !config.dataMapping.z) {
            throw new Error('Z axis field is required for 3D charts');
        }
        
        // 필드 존재 확인
        const requiredFields = [config.dataMapping.x, config.dataMapping.y];
        if (config.dataMapping.z) requiredFields.push(config.dataMapping.z);
        
        requiredFields.forEach(field => {
            if (!this.fieldNames.includes(field)) {
                throw new Error(`Field '${field}' not found in data`);
            }
        });
        
        console.log('[CHART_CONFIG] 설정 검증 통과');
    }

    resetSettings() {
        if (confirm('Reset all settings to default values?')) {
            console.log('[CHART_CONFIG] 설정 리셋');
            
            // 폼 리셋
            document.querySelector('input[name="chartType"][value="2d_scatter"]').checked = true;
            this.setDefaultFieldMappings();
            
            // 슬라이더 리셋
            document.getElementById('opacity').value = '0.8';
            document.getElementById('opacityValue').textContent = '0.8';
            document.getElementById('baseSize').value = '8';
            document.getElementById('baseSizeValue').textContent = '8';
            document.getElementById('sigmoidK').value = '1';
            document.getElementById('sigmoidKValue').textContent = '1';
            
            // 체크박스 리셋
            document.getElementById('showTooltips').checked = true;
            document.getElementById('enableZoom').checked = true;
            document.getElementById('showLegend').checked = true;
            document.getElementById('limitData').checked = false;
            
            // 선택박스 리셋
            document.getElementById('colorScheme').value = 'viridis';
            document.getElementById('sizeScaling').value = 'linear';
            document.getElementById('colorField').value = '';
            document.getElementById('sizeField').value = '';
            
            this.updateFormVisibility();
        }
    }

    // ============================================================================
    // UI 헬퍼
    // ============================================================================

    showSuccess(message) {
        console.log('[CHART_CONFIG] 성공 메시지:', message);
        alert('✅ ' + message); // 간단한 구현
    }

    showError(message) {
        console.error('[CHART_CONFIG] 에러 메시지:', message);
        alert('❌ ' + message); // 간단한 구현
    }

    // ============================================================================
    // 정리
    // ============================================================================

    cleanup() {
        console.log('[CHART_CONFIG] 정리 시작');
        
        try {
            // 상태 초기화
            this.rawData = null;
            this.fieldNames = [];
            this.currentConfig = null;
            
            console.log('[CHART_CONFIG] 정리 완료');
            
        } catch (error) {
            console.error('[CHART_CONFIG] 정리 중 오류:', error);
        }
    }
}