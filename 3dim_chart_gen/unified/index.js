// ============================================================================
// 3dim_chart_gen/unified/index.js - 통합 시스템 export
// ============================================================================

// 메인 3D 차트 생성기
export { generateChart3D, generateMultiple3DCharts } from './chart_generator_3d.js';

// 3D 차트 래퍼
export { ChartWrapper3D } from './chart_wrapper_3d.js';

// 3D 데이터 처리
export { processDataForChart3D, validate3DData } from './data_processor_3d.js';

// 3D 리사이즈 관리
export { ResizeManager3D, resizeAllPlotlyCharts, setPlotlyResponsive } from './resize_manager_3d.js';