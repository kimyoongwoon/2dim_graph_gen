// ============================================================================
// 3dim_chart_gen/index.js - 3D 차트 시스템 메인 export (2D와 동일한 패턴)
// ============================================================================

// 메인 3D 차트 생성 함수 (generateChart3D)
export { generateChart3D, generateMultiple3DCharts } from './unified/index.js';

// 3D 차트 팩토리
export { createVisualization3D, isValid3DChartType, getSupportedChart3DTypes } from './chart_factory_3d.js';

// 3D 차트 래퍼와 관리자들
export { ChartWrapper3D } from './unified/chart_wrapper_3d.js';
export { ResizeManager3D, resizeAllPlotlyCharts, setPlotlyResponsive } from './unified/resize_manager_3d.js';

// 3D 데이터 처리
export { processDataForChart3D, validate3DData } from './unified/data_processor_3d.js';

// 3D UI 컴포넌트들
export * from './components/index.js';

// 3D 유틸리티 함수들
export * from './utils/index.js';

// 3D 차트 렌더링 함수들
export * from './charts/3dim/index.js';