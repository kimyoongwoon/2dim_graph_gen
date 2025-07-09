// ============================================================================
// 3dim_chart_gen/charts/index.js - 모든 차트 함수들 export (2D/3D/4D)
// ============================================================================

// 🆕 2D 차트들 (3개)
export { create2DScatter } from './2dim/2d_scatter.js';
export { create2DSize } from './2dim/2d_size.js';
export { create2DColor } from './2dim/2d_color.js';
export { create2DScatterTiled } from './2dim/2d_scatter_tiled.js';

// 🆕 3D 확장 차트들 (3개)
export { create3DScatterColor } from './3dim/3d_scatter_color.js';
export { create3DScatterSize } from './3dim/3d_scatter_size.js';
export { create3DSizeColor } from './3dim/3d_size_color.js';

// ✅ 기존 3D Surface + Scatter 차트 (1개)
export * from './3dim/3d_surface_scatter.js';

// 🆕 4D 차트들 (1개)
export { create4DScatterSizeColor } from './4dim/4d_scatter_size_color.js';