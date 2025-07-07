// ============================================================================
// data_pipeline/chart_type_provider/get_compatible_chart_types_for_data.js (경량화)
// ============================================================================

/**
 * 경량화된 호환 차트 타입 반환 (8개 타입 하드코딩)
 * @param {Array<Object>} rawData - 원시 데이터 (사용하지 않음, 호환성 유지)
 * @param {number} dimension - 선택된 차원수 (1-4)
 * @returns {Array<Object>} chartTypes - 8개 차트 타입 중 해당 차원 타입들
 */
export default function getCompatibleChartTypesForData(rawData, dimension) {
    console.log(`[CHART_TYPE_PROVIDER] ${dimension}차원 차트 타입 조회`);

    // 8개 차트 타입 하드코딩 (가이드라인 기준)
    const allChartTypes = {
        // 2D 차트 (3개)
        2: [
            { value: '2d_scatter', label: '2D Scatter Plot', description: 'X-Y 산점도' },
            { value: '2d_size', label: '2D Size Chart', description: 'X축 + 크기 인코딩' },
            { value: '2d_color', label: '2D Color Chart', description: 'X축 + 색상 인코딩' }
        ],
        // 3D 차트 (4개)  
        3: [
            { value: '3d_surface_scatter', label: '3D Surface + Scatter', description: '실제 3D (X,Y,Z)' },
            { value: '3d_scatter_color', label: '3D Scatter + Color', description: '2D 산점도 + 색상' },
            { value: '3d_scatter_size', label: '3D Scatter + Size', description: '2D 산점도 + 크기' },
            { value: '3d_size_color', label: '3D Size + Color', description: '1D 위치 + 크기 + 색상' }
        ],
        // 4D 차트 (1개)
        4: [
            { value: '4d_scatter_size_color', label: '4D Scatter + Size + Color', description: '2D 산점도 + 크기 + 색상' }
        ]
    };

    // 1차원은 기본 2D 타입 사용
    if (dimension === 1) {
        return [
            { value: 'line1d', label: '1D Line Chart', description: '선형 차트' },
            { value: 'category', label: 'Category Chart', description: '카테고리 차트' }
        ];
    }

    const chartTypes = allChartTypes[dimension] || [];

    console.log(`[CHART_TYPE_PROVIDER] ${dimension}차원 타입 ${chartTypes.length}개 반환`);
    return chartTypes;
}