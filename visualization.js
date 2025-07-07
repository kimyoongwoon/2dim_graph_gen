// ============================================================================
// visualization.js - 차트 시각화 페이지 로직 (graph_complete.js 방식 완전 적용)
// ============================================================================

import { sessionStorageManager } from './shared/session_storage_manager/index.js';
import { showError } from './shared/error_handler.js';

// ✅ 현재 파일 구조에 맞는 data_pipeline 모듈들 import
import { validateUserSelectionInput } from './data_pipeline_configuration_source/data_validator/index.js';
import { calculateAvailableDimensionsFromData, getNumericFields, canSupport3D } from './data_pipeline_configuration_source/dimension_calculator/index.js';
import { buildChartConfigForGeneration } from './data_pipeline_configuration_source/config_builder/index.js';

// 3dim_chart_gen 통합 시스템 import
import { generateChart } from './3dim_chart_gen/index.js';

// 전역 변수들
let raw_data = null;
let chartConfig = null;
let currentChartWrapper = null;

// ============================================================================
// 데이터 및 설정 로드
// ============================================================================

function loadDataAndConfig() {
    updateChartInfo('데이터 및 설정 로딩 중...', 'info');

    try {
        // sessionStorage에서 데이터 로드
        const { data, meta } = sessionStorageManager.loadRawDataFromSessionStorage();
        raw_data = data;

        // sessionStorage에서 차트 설정 로드
        const configString = sessionStorage.getItem('chartConfig');
        if (!configString) {
            throw new Error('차트 설정이 없습니다. 설정 페이지로 돌아가주세요.');
        }

        chartConfig = JSON.parse(configString);
        console.log('[VISUALIZATION] 설정 로드 완료:', chartConfig);

        const fieldNames = meta.fieldNames.join(', ');
        updateChartInfo(`✅ 데이터: ${data.length}개 | 필드: ${fieldNames} | 차트: ${chartConfig.chartType}`, 'success');

        // 차트 생성
        createVisualization();

    } catch (error) {
        console.error('[VISUALIZATION] 로드 오류:', error);
        updateChartInfo(`로드 실패: ${error.message}`, 'error');
        showError(error.message);
    }
}

// ============================================================================
// ✅ graph_complete.js 방식을 완전히 복사한 차트 생성 함수
// ============================================================================

function createVisualization() {
    if (!raw_data || !chartConfig) {
        showError('데이터 또는 설정이 없습니다');
        return;
    }

    // ✅ graph_complete.js와 동일한 변수 추출
    const { chartType, selectedFields, dimension, is3D } = chartConfig;

    console.log('[VISUALIZATION] 차트 생성 시작:', { chartType, selectedFields, dimension, is3D });

    try {
        updateChartInfo('차트 생성 중...', 'info');

        // ✅ 1. graph_complete.js와 완전히 동일한 검증 과정
        const validationResult = validateUserSelectionInput(
            { dimension, chartType, selectedFields, is3D },
            raw_data
        );

        if (!validationResult.isValid) {
            showError(`입력 검증 오류: ${validationResult.errors.join(', ')}`);
            return;
        }

        if (validationResult.warnings && validationResult.warnings.length > 0) {
            console.warn('[VISUALIZATION] 검증 경고:', validationResult.warnings);
        }

        // ✅ 2. 스케일링 설정 (기본값)
        const scalingConfig = chartConfig.scalingConfig || { type: 'default' };

        // ✅ 3. graph_complete.js와 완전히 동일한 data_pipeline config 생성
        const dataPhaseConfig = buildChartConfigForGeneration(
            chartType,
            selectedFields,
            dimension,
            {},
            is3D
        );

        console.log('[VISUALIZATION] data_pipeline config 생성:', dataPhaseConfig);

        // ✅ 4. graph_complete.js와 완전히 동일한 통합 시스템용 config 변환
        const unifiedConfig = convertToUnifiedConfig(dataPhaseConfig, scalingConfig);

        console.log('[VISUALIZATION] 통합 config 변환 완료:', unifiedConfig);

        // 기존 차트 정리
        if (currentChartWrapper) {
            currentChartWrapper.destroy();
            currentChartWrapper = null;
        }

        const canvasWrapper = document.getElementById('chartCanvasWrapper');
        if (!canvasWrapper) {
            throw new Error('차트 컨테이너를 찾을 수 없습니다');
        }

        // 컨테이너 초기화
        canvasWrapper.innerHTML = '';
        canvasWrapper.style.width = '100%';
        canvasWrapper.style.height = '600px';

        // ✅ 5. graph_complete.js와 완전히 동일한 차트 생성
        currentChartWrapper = generateChart(raw_data, unifiedConfig, canvasWrapper);

        console.log('[VISUALIZATION] 통합 시스템 차트 생성 완료');

        // ✅ 6. graph_complete.js와 동일한 이벤트 리스너 등록
        currentChartWrapper.on('error', (error) => {
            console.error('[VISUALIZATION] 차트 에러:', error);
            showError('차트 오류: ' + error.message);
        });

        currentChartWrapper.on('dataUpdated', (data) => {
            console.log('[VISUALIZATION] 데이터 업데이트:', data.length, '개');
        });

        currentChartWrapper.on('dataLimited', (info) => {
            console.warn('[VISUALIZATION] 데이터 제한:', info);
            updateChartInfo(`⚠️ 성능상 ${info.total}개 데이터 중 ${info.displayed}개만 표시됩니다`, 'info');
        });

        // ✅ 7. 성공 메시지 (기술적 차트 타입 표시)
        updateChartInfo(`✅ 차트 생성 완료: ${unifiedConfig.type} (${selectedFields.join(' → ')})`, 'success');

    } catch (error) {
        console.error('[VISUALIZATION] 차트 생성 오류:', error);
        updateChartInfo('차트 생성 실패', 'error');
        showError('차트 생성 실패: ' + error.message);
    }
}

// ============================================================================
// ✅ graph_complete.js에서 복사한 config 변환 함수들 (완전 동일)
// ============================================================================

/**
 * ✅ graph_complete.js와 완전히 동일한 변환 함수
 */
function convertToUnifiedConfig(dataPhaseConfig, scalingConfig) {
    return {
        type: mapChartType(dataPhaseConfig.type, dataPhaseConfig.is3D),
        dataMapping: dataPhaseConfig.dataMapping,  // ← 핵심: 이미 올바르게 생성된 매핑 사용!
        scalingConfig: scalingConfig,
        colorConfig: { type: 'blueRed' }
    };
}

/**
 * ✅ graph_complete.js와 완전히 동일한 타입 매핑 함수
 */
function mapChartType(oldType, is3D) {
    if (is3D) {
        return '3d_surface_scatter'; // 모든 3D 타입은 통합
    }

    const mapping = {
        'scatter': '2d_scatter',
        'size': '2d_size',
        'color': '2d_color',
        'scatter_size': '3d_scatter_size',
        'scatter_color': '3d_scatter_color',
        'size_color': '3d_size_color',
        'scatter_size_color': '4d_scatter_size_color'
    };

    return mapping[oldType] || oldType;
}

// ============================================================================
// UI 업데이트 함수들
// ============================================================================

function updateChartInfo(message, type = 'info') {
    const chartInfo = document.getElementById('chartInfo');
    if (chartInfo) {
        chartInfo.innerHTML = `<strong>${message}</strong>`;
        chartInfo.className = `chart-info ${type}`;
    }
}

// ============================================================================
// 페이지 초기화 (불필요한 네비게이션 기능들 제거됨)
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('[VISUALIZATION] 시각화 페이지 초기화');

    // 데이터 및 설정 로드
    loadDataAndConfig();
});

// 페이지 언로드 시 정리
window.addEventListener('beforeunload', () => {
    if (currentChartWrapper) {
        currentChartWrapper.destroy();
    }
});