// ============================================================================
// 3dim_chart_gen/index.js - 통합 차트 시스템 메인 export (2D/3D/4D 지원)
// ============================================================================

// 메인 차트 생성 함수 (generateChart3D → generateChart로 변경)
export { generateChart, generateMultipleCharts } from './unified/chart_generator.js';

// 차트 팩토리 (3D → 통합으로 확장)
export { createVisualization, getSupportedChartTypes } from './chart_factory.js';

// 차트 래퍼 (3D → 통합으로 확장)
export { ChartWrapper } from './unified/chart_wrapper.js';

// 데이터 처리 (3D → 통합으로 확장)
export { processDataForChart, createTooltipData } from './unified/data_processor.js';

// 유틸리티 함수들 (스케일링 + UI 컨트롤 통합)
export * from './utils/index.js';

// 차트 렌더링 함수들 (모든 차원 지원)
export * from './charts/index.js';

// ============================================================================
// 하위 호환성을 위한 alias (기존 3D API 유지)
// ============================================================================

/**
 * 하위 호환성을 위한 generateChart3D alias
 * @deprecated generateChart 사용을 권장합니다
 */
export { generateChart as generateChart3D } from './unified/chart_generator.js';