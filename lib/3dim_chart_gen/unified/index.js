// ============================================================================
// 3dim_chart_gen/unified/index.js - 통합 시스템 export (2D/3D/4D)
// ============================================================================

// 메인 차트 생성기 (3D → 통합으로 확장)
export { generateChart, generateMultipleCharts } from './chart_generator.js';

// 차트 래퍼 (3D → 통합으로 확장) - 🔥 ChartWrapperEnhanced 추가
export { ChartWrapper, ChartWrapperEnhanced } from './chart_wrapper.js';

// 데이터 처리 (3D → 통합으로 확장)
export { processDataForChart, createTooltipData } from './data_processor.js';

// ============================================================================
// 하위 호환성을 위한 3D aliases
// ============================================================================

/**
 * 하위 호환성을 위한 3D 함수 aliases
 * @deprecated 새로운 통합 함수 사용을 권장합니다
 */
export { generateChart as generateChart3D } from './chart_generator.js';
export { ChartWrapper as ChartWrapper3D } from './chart_wrapper.js';
export { processDataForChart as processDataForChart3D } from './data_processor.js';