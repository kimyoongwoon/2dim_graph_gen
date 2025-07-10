// ============================================================================
// 🔥 AREA-BASED AGGREGATION SYSTEM - Replace existing aggregation section
// ============================================================================


import { processDataForChart } from '../unified/data_processor.js';

// Global area storage
let selectedAreas = [];
let areaIdCounter = 0;
let isAreaSelectionMode = false;

/**
 * 🔥 영역 선택 기반 집계 컨테이너 생성
 * @param {HTMLElement} parentElement - 부모 엘리먼트
 * @param {Object} metadata - 차트 메타데이터
 * @param {Array} originalData - 원본 데이터
 * @param {Object} chartWrapper - 차트 래퍼 객체
 * @param {Object} areaConfig - 영역 패널 크기 설정
 * @param {Object} panelConfig - 공통 패널 크기 설정
 * @returns {HTMLElement} 생성된 영역 선택 컨테이너
 */
export function createAreaSelectionContainer(parentElement, metadata = null, originalData = null, chartWrapper = null, areaConfig = {}, panelConfig = {}) {
    console.log('[UI_CONTROLS] 영역 선택 기반 집계 컨테이너 생성');

    const container = document.createElement('div');
    container.className = 'area-selection-container-unified';
    container.style.cssText = `
        width: 100%;
        height: 100%;
        border: 1px solid #ddd;
        border-radius: ${panelConfig.borderRadius || '4px'};
        overflow: hidden;
        transition: ${panelConfig.transition || 'none'};
        background: white;
    `;

    // 🔥 헤더
    const header = document.createElement('div');
    header.className = 'area-selection-header';
    header.style.cssText = `
        width: 100%;
        height: ${areaConfig.headerHeight || 'auto'};
        background: #e8f5e8;
        padding: ${areaConfig.headerPadding || '8px 12px'};
        font-weight: bold;
        font-size: ${areaConfig.fontSize || '12px'};
        border-bottom: 1px solid #4caf50;
        cursor: pointer;
        user-select: none;
        display: flex;
        align-items: center;
        box-sizing: border-box;
    `;
    header.textContent = 'Area-Based Aggregation';

    // 🔥 컨텐츠 영역
    const contentArea = document.createElement('div');
    contentArea.className = 'area-selection-content';
    contentArea.style.cssText = `
        width: 100%;
        padding: ${areaConfig.contentPadding || '5px'};
        background: #f8f9fa;
        display: none;
        flex-direction: column;
        gap: ${areaConfig.gap || '6px'};
        min-height: ${areaConfig.minContentHeight || '85px'};
        max-height: ${areaConfig.maxContentHeight || '85px'};
        overflow: ${areaConfig.overflow || 'auto'};
        box-sizing: border-box;
    `;

    // 영역 선택 컨트롤
    const selectionControls = createAreaSelectionControls(chartWrapper, areaConfig);
    contentArea.appendChild(selectionControls);

    // 영역 관리 패널
    const areaManagementPanel = createAreaManagementPanel(chartWrapper, areaConfig);
    contentArea.appendChild(areaManagementPanel);

    container.appendChild(header);
    container.appendChild(contentArea);

    // 🔥 헤더 클릭으로 접기/펼치기
    let isCollapsed = true;
    header.addEventListener('click', () => {
        isCollapsed = !isCollapsed;

        if (isCollapsed) {
            contentArea.style.display = 'none';
            header.textContent = 'Area-Based Aggregation';
            if (parentElement && panelConfig.collapsedHeight) {
                parentElement.style.height = panelConfig.collapsedHeight;
                parentElement.style.maxHeight = panelConfig.collapsedHeight;
            }
        } else {
            contentArea.style.display = 'flex';
            header.textContent = 'Area-Based Aggregation (펼쳐짐)';
            if (parentElement && panelConfig.expandedMaxHeight) {
                parentElement.style.height = panelConfig.expandedMaxHeight;
                parentElement.style.maxHeight = panelConfig.expandedMaxHeight;
            }
        }
    });

    if (parentElement) {
        parentElement.appendChild(container);
    }

    // 차트 래퍼에 영역 관리 함수 연결
    if (chartWrapper) {
        chartWrapper._areaManager = {
            addArea: (boundaries) => addArea(boundaries, chartWrapper),
            removeArea: (areaId) => removeArea(areaId, chartWrapper),
            toggleMiniPanels: () => toggleMiniPanels(),
            getAreas: () => selectedAreas
        };
    }

    console.log('[UI_CONTROLS] 영역 선택 컨테이너 생성 완료');
    return container;
}

/**
 * 영역 선택 컨트롤 생성
 */
function createAreaSelectionControls(chartWrapper, areaConfig = {}) {
    const controlsContainer = document.createElement('div');
    controlsContainer.className = 'area-selection-controls';
    controlsContainer.style.cssText = `
        display: flex;
        gap: 8px;
        align-items: center;
        padding: 6px;
        background: #fff3cd;
        border: 1px solid #ffeaa7;
        border-radius: 4px;
        margin-bottom: 6px;
    `;

    // 선택 모드 토글 버튼
    const selectionModeBtn = document.createElement('button');
    selectionModeBtn.id = 'area-selection-mode-btn';
    selectionModeBtn.textContent = '📍 Select Area';
    selectionModeBtn.style.cssText = `
        padding: 4px 8px;
        background: #007bff;
        color: white;
        border: none;
        border-radius: 3px;
        cursor: pointer;
        font-size: ${areaConfig.fontSize || '10px'};
        font-weight: bold;
    `;

    // 미니 패널 토글 버튼
    const togglePanelsBtn = document.createElement('button');
    togglePanelsBtn.id = 'toggle-mini-panels-btn';
    togglePanelsBtn.textContent = '👁️ Show Panels';
    togglePanelsBtn.style.cssText = `
        padding: 4px 8px;
        background: #28a745;
        color: white;
        border: none;
        border-radius: 3px;
        cursor: pointer;
        font-size: ${areaConfig.fontSize || '10px'};
        font-weight: bold;
    `;

    // 모든 영역 제거 버튼
    const clearAllBtn = document.createElement('button');
    clearAllBtn.id = 'clear-all-areas-btn';
    clearAllBtn.textContent = '🗑️ Clear All';
    clearAllBtn.style.cssText = `
        padding: 4px 8px;
        background: #dc3545;
        color: white;
        border: none;
        border-radius: 3px;
        cursor: pointer;
        font-size: ${areaConfig.fontSize || '10px'};
        font-weight: bold;
    `;

    // 상태 표시
    const statusText = document.createElement('span');
    statusText.id = 'area-selection-status';
    statusText.style.cssText = `
        font-size: ${areaConfig.fontSize || '9px'};
        color: #666;
        margin-left: 10px;
    `;
    statusText.textContent = `Areas: 0`;

    // 이벤트 리스너들
    selectionModeBtn.addEventListener('click', () => {
        toggleAreaSelectionMode(chartWrapper);
    });

    togglePanelsBtn.addEventListener('click', () => {
        toggleMiniPanels();
    });

    clearAllBtn.addEventListener('click', () => {
        clearAllAreas(chartWrapper);
    });

    controlsContainer.appendChild(selectionModeBtn);
    controlsContainer.appendChild(togglePanelsBtn);
    controlsContainer.appendChild(clearAllBtn);
    controlsContainer.appendChild(statusText);

    return controlsContainer;
}

/**
 * 영역 관리 패널 생성
 */
function createAreaManagementPanel(chartWrapper, areaConfig = {}) {
    const managementPanel = document.createElement('div');
    managementPanel.id = 'area-management-panel';
    managementPanel.className = 'area-management-panel';
    managementPanel.style.cssText = `
        background: #f0f0f0;
        border: 1px solid #ccc;
        border-radius: 4px;
        padding: 6px;
        min-height: 40px;
        max-height: 60px;
        overflow-y: auto;
    `;

    const emptyMessage = document.createElement('div');
    emptyMessage.id = 'area-empty-message';
    emptyMessage.style.cssText = `
        color: #666;
        font-style: italic;
        font-size: ${areaConfig.fontSize || '9px'};
        text-align: center;
        padding: 10px;
    `;
    emptyMessage.textContent = 'No areas selected. Click "Select Area" to start.';

    managementPanel.appendChild(emptyMessage);

    return managementPanel;
}

/**
 * 영역 선택 모드 토글 (안전한 버전)
 */
function toggleAreaSelectionMode(chartWrapper) {
    // 🔥 차트 준비 상태 확인
    if (!chartWrapper || !chartWrapper.plotlyDiv || !chartWrapper.plotlyDiv._fullLayout) {
        alert('Please wait for the chart to fully load before selecting areas.');
        return;
    }

    isAreaSelectionMode = !isAreaSelectionMode;

    const btn = document.getElementById('area-selection-mode-btn');
    const plotlyDiv = chartWrapper.plotlyDiv;

    if (isAreaSelectionMode) {
        btn.textContent = '❌ Cancel Selection';
        btn.style.background = '#dc3545';

        // 차트 커서 변경
        plotlyDiv.style.cursor = 'crosshair';

        // 영역 선택 모드 활성화
        enableAreaSelectionMode(chartWrapper);

        console.log('[UI_CONTROLS] 영역 선택 모드 활성화');
    } else {
        btn.textContent = '📍 Select Area';
        btn.style.background = '#007bff';

        // 차트 커서 복원
        plotlyDiv.style.cursor = 'default';

        // 영역 선택 모드 비활성화
        disableAreaSelectionMode(chartWrapper);

        console.log('[UI_CONTROLS] 영역 선택 모드 비활성화');
    }
}

/**
 * 영역 선택 모드 활성화
 */
function enableAreaSelectionMode(chartWrapper) {
    if (!chartWrapper || !chartWrapper.plotlyDiv) return;

    const plotlyDiv = chartWrapper.plotlyDiv;

    // 🔥 차트가 완전히 로드되었는지 확인
    if (!plotlyDiv._fullLayout) {
        console.warn('[UI_CONTROLS] 차트가 아직 완전히 로드되지 않았습니다');
        // 잠시 후 다시 시도
        setTimeout(() => {
            if (isAreaSelectionMode) {
                enableAreaSelectionMode(chartWrapper);
            }
        }, 500);
        return;
    }

    // Plotly 드래그 이벤트 오버라이드
    plotlyDiv.addEventListener('mousedown', handleAreaSelectionStart, true);
    plotlyDiv.addEventListener('mousemove', handleAreaSelectionMove, true);
    plotlyDiv.addEventListener('mouseup', handleAreaSelectionEnd, true);

    // 현재 차트 래퍼 저장
    plotlyDiv._areaSelectionChartWrapper = chartWrapper;

    // Plotly 기본 드래그 동작 비활성화
    try {
        if (window.Plotly) {
            window.Plotly.relayout(plotlyDiv, {
                dragmode: false
            });
        }
    } catch (error) {
        console.warn('[UI_CONTROLS] Plotly 드래그 모드 변경 실패:', error);
    }
}

/**
 * 영역 선택 모드 비활성화
 */
function disableAreaSelectionMode(chartWrapper) {
    if (!chartWrapper || !chartWrapper.plotlyDiv) return;

    const plotlyDiv = chartWrapper.plotlyDiv;

    // 이벤트 리스너 제거
    plotlyDiv.removeEventListener('mousedown', handleAreaSelectionStart, true);
    plotlyDiv.removeEventListener('mousemove', handleAreaSelectionMove, true);
    plotlyDiv.removeEventListener('mouseup', handleAreaSelectionEnd, true);

    // Plotly 기본 드래그 동작 복원
    if (window.Plotly) {
        window.Plotly.relayout(plotlyDiv, {
            dragmode: 'zoom'
        });
    }

    // 임시 사각형 제거
    removeTemporaryRectangle(plotlyDiv);
}

// 드래그 상태 변수들
let isDragging = false;
let dragStart = null;
let dragCurrent = null;

/**
 * 영역 선택 시작 (수정된 버전)
 */
function handleAreaSelectionStart(event) {
    if (!isAreaSelectionMode) return;

    // 🔥 event.currentTarget 사용 (event.target 아님)
    const plotlyDiv = event.currentTarget;
    if (!plotlyDiv || !plotlyDiv._fullLayout) {
        console.warn('[UI_CONTROLS] 차트가 준비되지 않았습니다');
        return;
    }

    isDragging = true;
    const rect = plotlyDiv.getBoundingClientRect();
    dragStart = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    };

    console.log('[UI_CONTROLS] 영역 선택 시작:', dragStart);

    event.preventDefault();
    event.stopPropagation();
}

/**
 * 영역 선택 이동 (수정된 버전)
 */
function handleAreaSelectionMove(event) {
    if (!isAreaSelectionMode || !isDragging || !dragStart) return;

    // 🔥 event.currentTarget 사용 (event.target 아님)
    const plotlyDiv = event.currentTarget;
    if (!plotlyDiv || !plotlyDiv._fullLayout) {
        return;
    }

    const rect = plotlyDiv.getBoundingClientRect();
    dragCurrent = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    };

    // 최소 크기 확인
    const minDrag = 5;
    if (Math.abs(dragCurrent.x - dragStart.x) < minDrag ||
        Math.abs(dragCurrent.y - dragStart.y) < minDrag) {
        return;
    }

    // 실시간 사각형 그리기
    drawTemporaryRectangle(plotlyDiv, dragStart, dragCurrent);

    event.preventDefault();
    event.stopPropagation();
}

/**
 * 영역 선택 완료 (수정된 버전)
 */
function handleAreaSelectionEnd(event) {
    if (!isAreaSelectionMode || !isDragging || !dragStart) return;

    // 🔥 event.currentTarget 사용 (event.target 아님)
    const plotlyDiv = event.currentTarget;
    const chartWrapper = plotlyDiv._areaSelectionChartWrapper;

    if (!chartWrapper) {
        console.warn('[UI_CONTROLS] 차트 래퍼를 찾을 수 없습니다');
        console.log('[UI_CONTROLS] plotlyDiv:', plotlyDiv);
        console.log('[UI_CONTROLS] _areaSelectionChartWrapper:', plotlyDiv._areaSelectionChartWrapper);
        return;
    }

    const rect = plotlyDiv.getBoundingClientRect();
    const dragEnd = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    };

    console.log('[UI_CONTROLS] 영역 선택 완료:', { dragStart, dragEnd });

    // 픽셀 좌표를 데이터 좌표로 변환
    const boundaries = convertPixelsToDataCoordinates(plotlyDiv, dragStart, dragEnd);

    if (boundaries) {
        console.log('[UI_CONTROLS] 변환된 경계:', boundaries);

        // 겹침 검사
        if (checkAreaOverlap(boundaries)) {
            alert('Selected area overlaps with existing area. Please select a different area.');
        } else {
            // 새 영역 추가
            addArea(boundaries, chartWrapper);
        }
    } else {
        console.warn('[UI_CONTROLS] 좌표 변환 실패');
    }

    // 임시 사각형 제거
    removeTemporaryRectangle(plotlyDiv);

    // 선택 모드 자동 비활성화
    isAreaSelectionMode = false;
    toggleAreaSelectionMode(chartWrapper);

    // 상태 초기화
    isDragging = false;
    dragStart = null;
    dragCurrent = null;

    event.preventDefault();
    event.stopPropagation();
}
/**
 * 픽셀 좌표를 데이터 좌표로 변환
 */
function convertPixelsToDataCoordinates(plotlyDiv, startPixel, endPixel) {
    if (!window.Plotly || !plotlyDiv._fullLayout) {
        console.warn('[UI_CONTROLS] Plotly 레이아웃 정보를 찾을 수 없습니다');
        return null;
    }

    try {
        const layout = plotlyDiv._fullLayout;
        const xaxis = layout.xaxis;
        const yaxis = layout.yaxis;

        if (!xaxis || !yaxis) {
            console.warn('[UI_CONTROLS] 축 정보를 찾을 수 없습니다');
            return null;
        }

        // 픽셀을 데이터 좌표로 변환
        const xMin = xaxis.p2d(Math.min(startPixel.x, endPixel.x));
        const xMax = xaxis.p2d(Math.max(startPixel.x, endPixel.x));
        const yMin = yaxis.p2d(Math.max(startPixel.y, endPixel.y)); // Y축은 반전
        const yMax = yaxis.p2d(Math.min(startPixel.y, endPixel.y));

        return {
            xMin: xMin,
            xMax: xMax,
            yMin: yMin,
            yMax: yMax
        };
    } catch (error) {
        console.error('[UI_CONTROLS] 좌표 변환 실패:', error);
        return null;
    }
}

/**
 * 임시 사각형 그리기
 */
function drawTemporaryRectangle(plotlyDiv, start, current) {
    if (!window.Plotly || !plotlyDiv) return;

    // 🔥 안전한 레이아웃 접근
    const layout = plotlyDiv._fullLayout || plotlyDiv.layout;
    if (!layout) {
        console.warn('[UI_CONTROLS] Plotly 레이아웃이 아직 준비되지 않았습니다');
        return;
    }

    const xMin = Math.min(start.x, current.x);
    const xMax = Math.max(start.x, current.x);
    const yMin = Math.min(start.y, current.y);
    const yMax = Math.max(start.y, current.y);

    const shape = {
        type: 'rect',
        xref: 'paper',
        yref: 'paper',
        x0: xMin / plotlyDiv.clientWidth,
        y0: 1 - (yMax / plotlyDiv.clientHeight),
        x1: xMax / plotlyDiv.clientWidth,
        y1: 1 - (yMin / plotlyDiv.clientHeight),
        line: {
            color: '#ff0000',
            width: 2,
            dash: 'dash'
        },
        fillcolor: 'rgba(255, 0, 0, 0.1)',
        layer: 'above'
    };

    // 🔥 안전한 shapes 접근
    const currentShapes = (plotlyDiv.layout && plotlyDiv.layout.shapes) || [];
    const filteredShapes = currentShapes.filter(s => s.name !== 'temp-selection');

    // 🔥 안전한 relayout 호출
    try {
        window.Plotly.relayout(plotlyDiv, {
            shapes: [...filteredShapes, { ...shape, name: 'temp-selection' }]
        });
    } catch (error) {
        console.warn('[UI_CONTROLS] 임시 사각형 그리기 실패:', error);
    }
}

/**
 * 임시 사각형 제거 (안전한 버전)
 */
function removeTemporaryRectangle(plotlyDiv) {
    if (!window.Plotly || !plotlyDiv) return;

    // 🔥 안전한 shapes 접근
    const currentShapes = (plotlyDiv.layout && plotlyDiv.layout.shapes) || [];
    const filteredShapes = currentShapes.filter(s => s.name !== 'temp-selection');

    try {
        window.Plotly.relayout(plotlyDiv, {
            shapes: filteredShapes
        });
    } catch (error) {
        console.warn('[UI_CONTROLS] 임시 사각형 제거 실패:', error);
    }
}

/**
 * 영역 겹침 검사
 */
function checkAreaOverlap(newBoundaries) {
    return selectedAreas.some(area => {
        const existing = area.boundaries;
        return !(
            newBoundaries.xMax < existing.xMin ||
            newBoundaries.xMin > existing.xMax ||
            newBoundaries.yMax < existing.yMin ||
            newBoundaries.yMin > existing.yMax
        );
    });
}

/**
 * 🔧 UPDATED: 새 영역 추가 (with data state tracking)
 */
function addArea(boundaries, chartWrapper) {
    const areaId = `area-${++areaIdCounter}`;
    const color = getAreaColor(areaIdCounter);

    // 🔧 Filter area data once and store both original and current
    const areaData = filterDataByArea(chartWrapper._originalData, boundaries, chartWrapper);

    const area = {
        id: areaId,
        boundaries: boundaries,
        color: color,
        miniPanel: null,
        originalData: [...areaData],    // 🔧 Never changes
        currentData: [...areaData],     // 🔧 Changes with operations
        settings: {
            x: { enabled: false, binSize: 5, statistic: 'mean' },
            y: { enabled: false, binSize: 5, statistic: 'mean' }
        }
    };

    selectedAreas.push(area);

    // 차트에 영역 표시
    drawAreaRectangle(chartWrapper.plotlyDiv, area);

    // 미니 패널 생성
    createMiniPanel(area, chartWrapper);

    // UI 업데이트
    updateAreaManagementPanel();
    updateAreaStatus();

    console.log('[UI_CONTROLS] 새 영역 추가:', areaId, '원본 데이터:', area.originalData.length, '개');
}

/**
 * 🔧 FIXED: 영역 제거 (원본 데이터 복원)
 * @param {string} areaId - 제거할 영역 ID
 * @param {Object} chartWrapper - 차트 래퍼 객체
 */
function removeArea(areaId, chartWrapper) {
    console.log('[UI_CONTROLS] 🔧 영역 제거 시작:', areaId);

    const areaIndex = selectedAreas.findIndex(area => area.id === areaId);
    if (areaIndex === -1) {
        console.warn('[UI_CONTROLS] 제거할 영역을 찾을 수 없습니다:', areaId);
        return;
    }

    const area = selectedAreas[areaIndex];

    try {
        // 🔧 STEP 1: 미니 패널 제거
        if (area.miniPanel) {
            area.miniPanel.remove();
            console.log('[UI_CONTROLS] 미니 패널 제거 완료:', areaId);
        }

        // 🔧 STEP 2: 차트에서 영역 사각형 제거
        removeAreaRectangle(chartWrapper.plotlyDiv, areaId);
        console.log('[UI_CONTROLS] 영역 사각형 제거 완료:', areaId);

        // 🔧 STEP 3: CRITICAL - 배열에서 영역 제거 BEFORE 데이터 재구성
        selectedAreas.splice(areaIndex, 1);
        console.log('[UI_CONTROLS] 영역 배열에서 제거 완료. 남은 영역:', selectedAreas.length, '개');

        // 🔧 STEP 4: 전체 데이터 재구성 (제거된 영역의 원본 데이터 복원)
        const reconstructedData = reconstructFullDataAfterRemoval(chartWrapper);
        console.log('[UI_CONTROLS] 데이터 재구성 완료:', reconstructedData.length, '개');

        // 🔧 STEP 5: 차트 업데이트
        const processedResult = processDataForChart(
            reconstructedData,
            chartWrapper.config.dataMapping,
            chartWrapper.config.type
        );

        chartWrapper.updateData(processedResult.data);
        console.log('[UI_CONTROLS] 차트 업데이트 완료');

        // 🔧 STEP 6: UI 업데이트
        updateAreaManagementPanel();
        updateAreaStatus();

        console.log('[UI_CONTROLS] ✅ 영역 제거 완료:', areaId);

    } catch (error) {
        console.error('[UI_CONTROLS] 영역 제거 중 오류:', error);

        // 🔧 Error recovery: 영역을 배열에 다시 추가
        if (areaIndex !== -1 && !selectedAreas.find(a => a.id === areaId)) {
            selectedAreas.splice(areaIndex, 0, area);
            console.log('[UI_CONTROLS] 오류 복구: 영역 복원');
        }

        alert(`영역 ${areaId} 제거 중 오류가 발생했습니다: ${error.message}`);
    }
}

/**
 * 🔧 NEW: 영역 제거 후 전체 데이터 재구성 (원본 데이터 복원)
 * @param {Object} chartWrapper - 차트 래퍼 객체
 * @returns {Array} 재구성된 전체 데이터
 */
function reconstructFullDataAfterRemoval(chartWrapper) {
    console.log('[UI_CONTROLS] 🔧 영역 제거 후 데이터 재구성 시작');

    if (!chartWrapper._originalData) {
        console.warn('[UI_CONTROLS] 원본 데이터가 없습니다');
        return [];
    }

    // 🔧 Start with complete original data
    const originalData = chartWrapper._originalData;
    let reconstructedData = [...originalData];

    console.log('[UI_CONTROLS] 원본 데이터로 시작:', reconstructedData.length, '개');

    // 🔧 For each REMAINING area (after removal), apply its modifications
    selectedAreas.forEach((area, index) => {
        console.log(`[UI_CONTROLS] 영역 ${index + 1}/${selectedAreas.length} 처리: ${area.id}`);

        if (!area.originalData || !area.currentData) {
            console.warn(`[UI_CONTROLS] 영역 ${area.id}에 데이터가 없습니다`);
            return;
        }

        // 🔧 Only replace if the area has been modified (binned)
        const hasBeenModified = area.currentData !== area.originalData &&
            !arraysEqual(area.currentData, area.originalData);

        if (hasBeenModified) {
            console.log(`[UI_CONTROLS] 영역 ${area.id}가 수정됨, 데이터 교체`);

            // Remove area's original data points from global data
            reconstructedData = reconstructedData.filter(item => {
                const dataMapping = chartWrapper.config.dataMapping;
                const x = Number(item[dataMapping.x]);
                const y = Number(item[dataMapping.y]);

                const isInArea = (x >= area.boundaries.xMin && x <= area.boundaries.xMax &&
                    y >= area.boundaries.yMin && y <= area.boundaries.yMax);

                return !isInArea; // Keep points NOT in this area
            });

            // Add area's current (modified) data
            reconstructedData = reconstructedData.concat(area.currentData);

            console.log(`[UI_CONTROLS] 영역 ${area.id} 데이터 교체 완료:`, {
                제거된원본: area.originalData.length,
                추가된현재: area.currentData.length
            });
        } else {
            console.log(`[UI_CONTROLS] 영역 ${area.id}가 수정되지 않음, 원본 데이터 유지`);
        }
    });

    console.log('[UI_CONTROLS] 🔧 데이터 재구성 완료:', {
        최종데이터: reconstructedData.length,
        남은영역: selectedAreas.length
    });

    return reconstructedData;
}

/**
 * 🔧 HELPER: 배열 동등성 검사
 * @param {Array} arr1 - 첫 번째 배열
 * @param {Array} arr2 - 두 번째 배열
 * @returns {boolean} 배열이 같은지 여부
 */
function arraysEqual(arr1, arr2) {
    if (!arr1 || !arr2) return false;
    if (arr1.length !== arr2.length) return false;

    // 🔧 Simple reference equality check (works for our use case)
    return arr1 === arr2;
}

/**
 * 영역 색상 가져오기
 */
function getAreaColor(index) {
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
    return colors[(index - 1) % colors.length];
}

/**
 * 차트에 영역 사각형 그리기
 */
function drawAreaRectangle(plotlyDiv, area) {
    if (!window.Plotly || !plotlyDiv) return;

    const shape = {
        type: 'rect',
        xref: 'x',
        yref: 'y',
        x0: area.boundaries.xMin,
        y0: area.boundaries.yMin,
        x1: area.boundaries.xMax,
        y1: area.boundaries.yMax,
        line: {
            color: area.color,
            width: 2
        },
        fillcolor: 'rgba(0, 0, 0, 0)',
        layer: 'above',
        name: area.id
    };

    // 🔥 안전한 shapes 접근
    const currentShapes = (plotlyDiv.layout && plotlyDiv.layout.shapes) || [];

    try {
        window.Plotly.relayout(plotlyDiv, {
            shapes: [...currentShapes, shape]
        });
    } catch (error) {
        console.warn('[UI_CONTROLS] 영역 사각형 그리기 실패:', error);
    }
}

/**
 * 차트에서 영역 사각형 제거 (안전한 버전)
 */
function removeAreaRectangle(plotlyDiv, areaId) {
    if (!window.Plotly || !plotlyDiv) return;

    // 🔥 안전한 shapes 접근
    const currentShapes = (plotlyDiv.layout && plotlyDiv.layout.shapes) || [];
    const filteredShapes = currentShapes.filter(s => s.name !== areaId);

    try {
        window.Plotly.relayout(plotlyDiv, {
            shapes: filteredShapes
        });
    } catch (error) {
        console.warn('[UI_CONTROLS] 영역 사각형 제거 실패:', error);
    }
}

/**
 * 미니 패널 생성
 */
function createMiniPanel(area, chartWrapper) {
    const panel = document.createElement('div');
    panel.className = 'area-mini-panel';
    panel.id = `mini-panel-${area.id}`;
    panel.style.cssText = `
        position: absolute;
        z-index: 1000;
        background: white;
        border: 2px solid ${area.color};
        border-radius: 6px;
        padding: 8px;
        font-size: 10px;
        min-width: 200px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        cursor: move;
        display: block;
    `;

    // 패널 헤더
    const header = document.createElement('div');
    header.style.cssText = `
        background: ${area.color};
        color: white;
        padding: 4px 8px;
        margin: -8px -8px 8px -8px;
        font-weight: bold;
        font-size: 9px;
        display: flex;
        justify-content: space-between;
        align-items: center;
    `;

    const title = document.createElement('span');
    title.textContent = area.id;

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '×';
    deleteBtn.style.cssText = `
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        font-size: 12px;
        font-weight: bold;
        padding: 0;
        width: 16px;
        height: 16px;
    `;

    deleteBtn.addEventListener('click', () => {
        if (confirm(`Delete ${area.id}?`)) {
            removeArea(area.id, chartWrapper);
        }
    });

    header.appendChild(title);
    header.appendChild(deleteBtn);

    // X축 컨트롤
    const xAxisControl = createAxisControl('x', area, chartWrapper);

    // Y축 컨트롤
    const yAxisControl = createAxisControl('y', area, chartWrapper);

    panel.appendChild(header);
    panel.appendChild(xAxisControl);
    panel.appendChild(yAxisControl);

    // 드래그 가능하게 만들기
    makeDraggable(panel);

    // 🔥 차트 컨테이너에 추가 (plotlyDiv의 부모)
    const chartContainer = chartWrapper.plotlyDiv.parentElement;
    chartContainer.appendChild(panel);

    // 🔥 위치 설정 (display: block 포함)
    positionMiniPanel(panel, area, chartWrapper);

    // 영역 객체에 저장
    area.miniPanel = panel;

    console.log('[UI_CONTROLS] 미니 패널 생성 완료:', area.id);
}

/**
 * 축 컨트롤 생성
 */
function createAxisControl(axis, area, chartWrapper) {
    const container = document.createElement('div');
    container.style.cssText = `
        margin-bottom: 8px;
        padding: 6px;
        background: #f8f9fa;
        border-radius: 4px;
    `;

    const axisLabel = document.createElement('div');
    axisLabel.textContent = `${axis.toUpperCase()}-Axis`;
    axisLabel.style.cssText = `
        font-weight: bold;
        margin-bottom: 4px;
        color: #333;
    `;

    const controlRow = document.createElement('div');
    controlRow.style.cssText = `
        display: flex;
        gap: 4px;
        align-items: center;
        margin-bottom: 4px;
    `;

    // 빈 폭 입력 (bin WIDTH, not count)
    const binSizeInput = document.createElement('input');
    binSizeInput.type = 'number';
    binSizeInput.placeholder = 'Width';
    binSizeInput.value = area.settings[axis].enabled ? area.settings[axis].binSize : '';
    binSizeInput.min = '0.1';
    binSizeInput.step = '0.1';
    binSizeInput.style.cssText = `
        width: 50px;
        padding: 2px;
        font-size: 9px;
        border: 1px solid #ccc;
        border-radius: 2px;
        flex: 1;
    `;

    // 통계 선택
    const statSelect = document.createElement('select');
    statSelect.style.cssText = `
        padding: 2px;
        font-size: 9px;
        border: 1px solid #ccc;
        border-radius: 2px;
        flex: 1;
    `;
    statSelect.innerHTML = `
        <option value="mean">Mean</option>
        <option value="median">Median</option>
        <option value="min">Min</option>
        <option value="max">Max</option>
        <option value="sum">Sum</option>
        <option value="count">Count</option>
    `;
    statSelect.value = area.settings[axis].statistic;

    // Apply 버튼
    const applyBtn = document.createElement('button');
    applyBtn.textContent = 'Apply';
    applyBtn.style.cssText = `
        padding: 2px 6px;
        background: #007bff;
        color: white;
        border: none;
        border-radius: 2px;
        cursor: pointer;
        font-size: 9px;
        min-width: 40px;
    `;

    // 빈 폭 입력 변경 이벤트
    binSizeInput.addEventListener('input', () => {
        const value = parseFloat(binSizeInput.value);
        if (value && value > 0) {
            area.settings[axis].enabled = true;
            area.settings[axis].binSize = value;
        } else {
            area.settings[axis].enabled = false;
        }

        // 🔧 Check for reset condition
        checkForReset(area, chartWrapper);
    });

    // 통계 변경 이벤트
    statSelect.addEventListener('change', () => {
        area.settings[axis].statistic = statSelect.value;
    });

    // 🔧 FIXED: Apply 버튼 이벤트 (Sequential processing)
    applyBtn.addEventListener('click', () => {
        // 설정 업데이트
        const binSize = parseFloat(binSizeInput.value);
        if (binSize && binSize > 0) {
            area.settings[axis].enabled = true;
            area.settings[axis].binSize = binSize;
            area.settings[axis].statistic = statSelect.value;
        } else {
            area.settings[axis].enabled = false;
        }

        // 🔧 Sequential binning: Apply only this axis to current data
        applySequentialBinning(area, axis, chartWrapper);
    });

    controlRow.appendChild(binSizeInput);
    controlRow.appendChild(statSelect);

    container.appendChild(axisLabel);
    container.appendChild(controlRow);
    container.appendChild(applyBtn);

    return container;
}


/**
 * 🔧 FIXED: 순차적 빈 집계 적용 (다른 축 보존)
 * @param {Object} area - 영역 객체
 * @param {string} targetAxis - 적용할 축 ('x' or 'y')
 * @param {Object} chartWrapper - 차트 래퍼 객체
 */
function applySequentialBinning(area, targetAxis, chartWrapper) {
    console.log('[UI_CONTROLS] 🔧 고정된 순차적 빈 집계:', area.id, targetAxis);

    if (!chartWrapper || !area.originalData) {
        console.warn('[UI_CONTROLS] 원본 데이터가 없습니다');
        return;
    }

    try {
        // 🔧 ALWAYS start from originalData (allows changing bin sizes freely)
        let workingData = [...area.originalData];

        console.log('[UI_CONTROLS] 원본 데이터에서 시작:', workingData.length, '개');

        // 🔧 Check for reset condition FIRST
        if (!area.settings.x.enabled && !area.settings.y.enabled) {
            console.log('[UI_CONTROLS] 모든 축이 비활성화됨, 원본 데이터로 리셋');
            area.currentData = [...area.originalData];
            updateChartWithAreaData(area, area.currentData, chartWrapper);
            return;
        }

        // 🔧 STEP 1: Apply OTHER axis first (if enabled) to preserve its binning
        const otherAxis = targetAxis === 'x' ? 'y' : 'x';

        if (area.settings[otherAxis].enabled) {
            console.log(`[UI_CONTROLS] 🔧 다른 축(${otherAxis}) 먼저 적용하여 보존`);
            workingData = applySingleAxisBinning(workingData, otherAxis, area.settings[otherAxis], chartWrapper);
            console.log(`[UI_CONTROLS] ${otherAxis}축 적용 후:`, workingData.length, '개');
        }

        // 🔧 STEP 2: Apply target axis to the working data
        if (area.settings[targetAxis].enabled) {
            console.log(`[UI_CONTROLS] 🔧 타겟 축(${targetAxis}) 적용`);
            workingData = applySingleAxisBinning(workingData, targetAxis, area.settings[targetAxis], chartWrapper);
            console.log(`[UI_CONTROLS] ${targetAxis}축 적용 후:`, workingData.length, '개');
        }

        // 🔧 Update area current data
        area.currentData = workingData;

        console.log('[UI_CONTROLS] 🔧 고정된 순차적 빈 집계 완료:', {
            영역: area.id,
            타겟축: targetAxis,
            최종데이터: workingData.length,
            X활성화: area.settings.x.enabled,
            Y활성화: area.settings.y.enabled
        });

        // 전체 데이터 업데이트
        updateChartWithAreaData(area, area.currentData, chartWrapper);

    } catch (error) {
        console.error('[UI_CONTROLS] 고정된 순차적 빈 집계 실패:', error);
        alert(`영역 ${area.id} 집계 중 오류가 발생했습니다: ${error.message}`);
    }
}

/**
 * 🔧 NEW: 단일 축 빈 적용 (헬퍼 함수)
 * @param {Array} data - 입력 데이터
 * @param {string} axis - 축 ('x' or 'y')
 * @param {Object} axisSettings - 축 설정 {enabled, binSize, statistic}
 * @param {Object} chartWrapper - 차트 래퍼 객체
 * @returns {Array} 해당 축이 빈된 데이터
 */
function applySingleAxisBinning(data, axis, axisSettings, chartWrapper) {
    console.log(`[UI_CONTROLS] 🔧 단일 축 빈 적용: ${axis}`, axisSettings);

    if (!axisSettings.enabled || !data || data.length === 0) {
        return data;
    }

    // 축별 필드명 가져오기
    const fieldName = getFieldNameByRole(axis, data[0], chartWrapper);
    if (!fieldName) {
        console.warn(`[UI_CONTROLS] ${axis}축 필드명을 찾을 수 없습니다`);
        return data;
    }

    // 🔧 FIXED: 빈 정보 계산 with debugging
    const binInfo = calculateBinInfoByWidth(data, fieldName, axisSettings.binSize);
    if (!binInfo) {
        console.warn(`[UI_CONTROLS] ${axis}축 빈 정보 계산 실패`);
        return data;
    }

    // 🔧 Enhanced debugging for bin size = 1 issue
    console.log(`[UI_CONTROLS] 🔧 ${axis}축 빈 정보:`, {
        필드: fieldName,
        빈크기: axisSettings.binSize,
        최소값: binInfo.min,
        최대값: binInfo.max,
        범위: binInfo.range,
        빈폭: binInfo.binWidth,
        빈개수: binInfo.binCount
    });

    // 데이터 포인트들을 빈별로 그룹화 (모든 포인트 유지)
    const binGroups = groupDataBySingleAxisKeepAll(data, fieldName, binInfo);

    // 🔧 Enhanced debugging for grouping
    const groupSummary = Object.entries(binGroups).map(([bin, points]) => ({
        빈: bin,
        개수: points.length,
        샘플값: points.length > 0 ? points[0][fieldName] : 'N/A'
    }));
    console.log(`[UI_CONTROLS] 🔧 ${axis}축 그룹핑 결과:`, groupSummary);

    // 각 빈 그룹의 축 값을 통계값으로 변경 (모든 포인트 유지)
    const alignedData = [];

    Object.entries(binGroups).forEach(([binIndex, groupData]) => {
        if (groupData.length === 0) return;

        // 유효하지 않은 값 처리
        if (binIndex === 'invalid') {
            console.warn(`[UI_CONTROLS] ${axis}축에 유효하지 않은 값 ${groupData.length}개 발견, 원본 유지`);
            alignedData.push(...groupData);
            return;
        }

        // 해당 축의 통계값 계산
        const axisValues = groupData.map(item => Number(item[fieldName])).filter(v => !isNaN(v));
        if (axisValues.length === 0) {
            console.warn(`[UI_CONTROLS] 빈 ${binIndex}에 유효한 ${axis}축 값이 없음, 원본 유지`);
            alignedData.push(...groupData);
            return;
        }

        const alignedAxisValue = calculateStatistic(axisValues, axisSettings.statistic);

        console.log(`[UI_CONTROLS] 🔧 빈 ${binIndex}: ${groupData.length}개 → ${axis}=${alignedAxisValue} (${axisSettings.statistic})`);

        // 모든 포인트의 해당 축 값을 통계값으로 변경
        const alignedGroupData = groupData.map(originalPoint => {
            const alignedPoint = { ...originalPoint };
            alignedPoint[fieldName] = alignedAxisValue; // 해당 축만 변경

            // 디버깅용 메타데이터 추가
            alignedPoint._binIndex = parseInt(binIndex);
            alignedPoint._alignedAxis = axis;
            alignedPoint._originalValue = originalPoint[fieldName];

            return alignedPoint;
        });

        alignedData.push(...alignedGroupData);
    });

    console.log(`[UI_CONTROLS] 🔧 ${axis}축 정렬 완료:`, {
        입력: data.length,
        출력: alignedData.length,
        통계: axisSettings.statistic
    });

    return alignedData;
}

/**
 * 🔧 ENHANCED: 빈 정보 계산 with better debugging
 */
function calculateBinInfoByWidth(data, fieldName, binWidth) {
    const values = data.map(item => Number(item[fieldName])).filter(v => !isNaN(v));

    if (values.length === 0) {
        console.warn('[UI_CONTROLS] 🔧 빈 계산: 유효한 값이 없음');
        return null;
    }

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;

    // 🔧 Handle edge cases
    if (range === 0) {
        console.warn('[UI_CONTROLS] 🔧 빈 계산: 범위가 0 (모든 값이 동일)');
        return {
            min,
            max,
            range: 0,
            binWidth,
            binCount: 1 // Only one bin needed
        };
    }

    if (binWidth <= 0) {
        console.warn('[UI_CONTROLS] 🔧 빈 계산: 빈 폭이 0 이하');
        return null;
    }

    // Calculate bin count from bin width
    const binCount = Math.ceil(range / binWidth);

    const result = {
        min,
        max,
        range,
        binWidth,      // User-specified width
        binCount       // Calculated count
    };

    // 🔧 Enhanced debugging
    console.log('[UI_CONTROLS] 🔧 빈 정보 계산 상세:', {
        ...result,
        값개수: values.length,
        샘플값: values.slice(0, 5),
        계산: `ceil(${range.toFixed(3)} / ${binWidth}) = ${binCount}`
    });

    return result;
}

/**
 * 🔧 ENHANCED: 그룹화 with better boundary handling
 */
function groupDataBySingleAxisKeepAll(data, fieldName, binInfo) {
    const groups = {};

    data.forEach((item, index) => {
        const value = Number(item[fieldName]);

        if (isNaN(value)) {
            // 유효하지 않은 값은 특별한 그룹에 넣기
            if (!groups['invalid']) {
                groups['invalid'] = [];
            }
            groups['invalid'].push(item);
            return;
        }

        // 🔧 Handle edge case: all values are the same
        if (binInfo.range === 0) {
            if (!groups[0]) {
                groups[0] = [];
            }
            groups[0].push(item);
            return;
        }

        // 빈 인덱스 계산 (based on bin width)
        let binIndex = Math.floor((value - binInfo.min) / binInfo.binWidth);

        // 🔧 Enhanced boundary handling
        if (binIndex >= binInfo.binCount) {
            binIndex = binInfo.binCount - 1;
        }

        if (binIndex < 0) {
            binIndex = 0;
        }

        // 🔧 Debug individual point assignment (only for first few points or problematic cases)
        if (index < 3 || binInfo.binWidth === 1) {
            console.log(`[UI_CONTROLS] 🔧 포인트 ${index}: ${fieldName}=${value} → 빈 ${binIndex}`, {
                계산: `floor((${value} - ${binInfo.min}) / ${binInfo.binWidth}) = ${Math.floor((value - binInfo.min) / binInfo.binWidth)}`,
                조정후: binIndex
            });
        }

        if (!groups[binIndex]) {
            groups[binIndex] = [];
        }
        groups[binIndex].push(item);
    });

    return groups;
}


/**
 * 🔧 UPDATED: 리셋 조건 확인 (동일한 로직, 개선된 로깅)
 */
function checkForReset(area, chartWrapper) {
    // Reset when both axes are disabled (empty input)
    if (!area.settings.x.enabled && !area.settings.y.enabled) {
        console.log('[UI_CONTROLS] 🔧 자동 리셋: 모든 축 비활성화');
        area.currentData = [...area.originalData];
        updateChartWithAreaData(area, area.currentData, chartWrapper);
    }
}


/**
 * 🔥 NEW: 통계 계산 함수 (provided implementation)
 * @param {Array} values - 숫자 배열
 * @param {string} statistic - 통계 타입
 * @returns {number} 계산된 통계값
 */
function calculateStatistic(values, statistic) {
    if (values.length === 0) return 0;

    switch (statistic) {
        case 'mean':
            return values.reduce((sum, val) => sum + val, 0) / values.length;
        case 'median':
            const sorted = values.sort((a, b) => a - b);
            const mid = Math.floor(sorted.length / 2);
            return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
        case 'mode':
            const frequency = {};
            values.forEach(val => frequency[val] = (frequency[val] || 0) + 1);
            return Object.keys(frequency).reduce((a, b) => frequency[a] > frequency[b] ? a : b);
        case 'min':
            return Math.min(...values);
        case 'max':
            return Math.max(...values);
        case 'sum':
            return values.reduce((sum, val) => sum + val, 0);
        case 'count':
            return values.length;
        default:
            return values.reduce((sum, val) => sum + val, 0) / values.length; // 기본값: mean
    }
}

/**
 * 🔥 NEW: getFieldNameByRole 함수 (provided implementation)
 */
function getFieldNameByRole(axisRole, dataItem, chartWrapper) {
    if (!chartWrapper || !chartWrapper.config || !chartWrapper.config.dataMapping) {
        console.warn(`[UI_CONTROLS] chartWrapper 또는 dataMapping이 없습니다`);
        return null;
    }
    const dataMapping = chartWrapper.config.dataMapping;
    const fieldName = dataMapping[axisRole];
    if (!fieldName) {
        console.warn(`[UI_CONTROLS] ${axisRole} 역할에 해당하는 필드명을 찾을 수 없습니다`);
        return null;
    }
    console.log(`[UI_CONTROLS] ${axisRole} 역할 → ${fieldName} 필드명`);
    return fieldName;
}


/**
 * 미니 패널 위치 설정
 */
// Add this to positionMiniPanel function for debugging
function positionMiniPanel(panel, area, chartWrapper) {
    const plotlyDiv = chartWrapper.plotlyDiv;
    const chartContainer = plotlyDiv.parentElement;

    // 🔥 간단한 고정 위치 사용 (차트 컨테이너 내부)
    const x = 20; // 왼쪽에서 20px
    const y = 20 + (selectedAreas.length - 1) * 150; // 각 패널을 150px씩 아래로

    panel.style.left = `${x}px`;
    panel.style.top = `${y}px`;
    panel.style.display = 'block'; // 🔥 명시적으로 block 설정

    console.log('[DEBUG] Panel positioned at:', { x, y, display: panel.style.display });
}

/**
 * 요소를 드래그 가능하게 만들기
 */
function makeDraggable(element) {
    let isDragging = false;
    let dragOffset = { x: 0, y: 0 };

    element.addEventListener('mousedown', (e) => {
        if (e.target.tagName === 'BUTTON' || e.target.tagName === 'SELECT' || e.target.tagName === 'INPUT') {
            return;
        }

        isDragging = true;
        const rect = element.getBoundingClientRect();
        dragOffset.x = e.clientX - rect.left;
        dragOffset.y = e.clientY - rect.top;

        element.style.cursor = 'grabbing';
        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;

        const container = element.parentElement;
        const containerRect = container.getBoundingClientRect();

        const x = e.clientX - containerRect.left - dragOffset.x;
        const y = e.clientY - containerRect.top - dragOffset.y;

        element.style.left = `${Math.max(0, Math.min(x, containerRect.width - element.offsetWidth))}px`;
        element.style.top = `${Math.max(0, Math.min(y, containerRect.height - element.offsetHeight))}px`;
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            element.style.cursor = 'move';
        }
    });
}

/**
 * 영역 내 데이터 필터링
 */
function filterDataByArea(data, boundaries, chartWrapper) {
    const dataMapping = chartWrapper.config.dataMapping;
    const xField = dataMapping.x;
    const yField = dataMapping.y;

    return data.filter(item => {
        const x = Number(item[xField]);
        const y = Number(item[yField]);

        return !isNaN(x) && !isNaN(y) &&
            x >= boundaries.xMin && x <= boundaries.xMax &&
            y >= boundaries.yMin && y <= boundaries.yMax;
    });
}

/**
 * 영역별 집계 처리
 */
function processAreaAggregation(data, settings, chartWrapper) {
    let processedData = [...data];

    // X축 처리
    if (settings.x.mode === 'bin') {
        processedData = createBinnedData(processedData, { x: settings.x }, chartWrapper);
    }

    // Y축 처리
    if (settings.y.mode === 'bin') {
        processedData = createBinnedData(processedData, { y: settings.y }, chartWrapper);
    }

    // 집계 처리
    const aggregateFields = {};
    if (settings.x.mode === 'aggregate') {
        aggregateFields.x = settings.x;
    }
    if (settings.y.mode === 'aggregate') {
        aggregateFields.y = settings.y;
    }

    if (Object.keys(aggregateFields).length > 0) {
        const binFields = {};
        if (settings.x.mode === 'bin') binFields.x = settings.x;
        if (settings.y.mode === 'bin') binFields.y = settings.y;

        processedData = aggregateByBins(processedData, aggregateFields, binFields, chartWrapper);
    }

    return processedData;
}

/**
 * 🔧 UPDATED: 차트를 영역 데이터로 업데이트 (use currentData)
 */
function updateChartWithAreaData(area, areaData, chartWrapper) {
    // 🔧 Store current aggregated data
    area.currentData = areaData;

    // 전체 데이터 재구성
    const allData = reconstructFullData(chartWrapper);

    // 차트 업데이트
    const processedResult = processDataForChart(
        allData,
        chartWrapper.config.dataMapping,
        chartWrapper.config.type
    );

    chartWrapper.updateData(processedResult.data);
}


/**
 * 🔧 UPDATED: 전체 데이터 재구성 (use currentData)
 */
function reconstructFullData(chartWrapper) {
    const originalData = chartWrapper._originalData;
    let reconstructedData = [...originalData];

    // 각 영역에 대해 처리
    selectedAreas.forEach(area => {
        if (area.currentData && area.currentData !== area.originalData) {
            // 영역 내 원본 데이터 제거
            reconstructedData = reconstructedData.filter(item => {
                const dataMapping = chartWrapper.config.dataMapping;
                const x = Number(item[dataMapping.x]);
                const y = Number(item[dataMapping.y]);

                return !(x >= area.boundaries.xMin && x <= area.boundaries.xMax &&
                    y >= area.boundaries.yMin && y <= area.boundaries.yMax);
            });

            // 🔧 현재 데이터 추가 (not aggregatedData)
            reconstructedData = reconstructedData.concat(area.currentData);
        }
    });

    return reconstructedData;
}

/**
 * 특정 영역을 원본 데이터로 복원
 */
function revertAreaToOriginal(area, chartWrapper) {
    // 영역 집계 데이터 제거
    area.aggregatedData = null;

    // 전체 데이터 재구성
    const allData = reconstructFullData(chartWrapper);

    // 차트 업데이트
    const processedResult = processDataForChart(
        allData,
        chartWrapper.config.dataMapping,
        chartWrapper.config.type
    );

    chartWrapper.updateData(processedResult.data);
}

/**
 * 🔧 UPDATED: 모든 영역 제거 (개선된 로직)
 * @param {Object} chartWrapper - 차트 래퍼 객체
 */
function clearAllAreas(chartWrapper) {
    if (selectedAreas.length === 0) return;

    if (confirm('Are you sure you want to clear all areas?')) {
        console.log('[UI_CONTROLS] 🔧 모든 영역 제거 시작:', selectedAreas.length, '개');

        try {
            // 🔧 STEP 1: 모든 미니 패널 제거
            selectedAreas.forEach(area => {
                if (area.miniPanel) {
                    area.miniPanel.remove();
                }
            });

            // 🔧 STEP 2: 모든 사각형 제거
            if (chartWrapper.plotlyDiv && window.Plotly) {
                window.Plotly.relayout(chartWrapper.plotlyDiv, {
                    shapes: []
                });
            }

            // 🔧 STEP 3: 영역 배열 초기화
            selectedAreas.length = 0; // Clear array
            console.log('[UI_CONTROLS] 모든 영역 배열 초기화 완료');

            // 🔧 STEP 4: 완전한 원본 데이터로 복원
            if (chartWrapper._originalData) {
                const processedResult = processDataForChart(
                    chartWrapper._originalData,
                    chartWrapper.config.dataMapping,
                    chartWrapper.config.type
                );

                chartWrapper.updateData(processedResult.data);
                console.log('[UI_CONTROLS] 완전한 원본 데이터로 복원 완료:', chartWrapper._originalData.length, '개');
            }

            // 🔧 STEP 5: UI 업데이트
            updateAreaManagementPanel();
            updateAreaStatus();

            console.log('[UI_CONTROLS] ✅ 모든 영역 제거 완료');

        } catch (error) {
            console.error('[UI_CONTROLS] 모든 영역 제거 중 오류:', error);
            alert('모든 영역 제거 중 오류가 발생했습니다: ' + error.message);
        }
    }
}

/**
 * 미니 패널 표시/숨김 토글
 */
function toggleMiniPanels() {
    const btn = document.getElementById('toggle-mini-panels-btn');
    const panels = document.querySelectorAll('.area-mini-panel');

    console.log('[DEBUG] Found panels for toggle:', panels.length);

    let isVisible = false;
    if (panels.length > 0) {
        // 첫 번째 패널의 display 상태 확인
        const firstPanel = panels[0];
        isVisible = firstPanel.style.display === 'block';
        console.log('[DEBUG] First panel display:', firstPanel.style.display, 'isVisible:', isVisible);
    }

    panels.forEach((panel, index) => {
        const newDisplay = isVisible ? 'none' : 'block';
        panel.style.display = newDisplay;
        console.log(`[DEBUG] Panel ${index} display changed to:`, newDisplay);
    });

    btn.textContent = isVisible ? '👁️ Show Panels' : '👁️ Hide Panels';

    console.log('[UI_CONTROLS] 미니 패널 토글:', isVisible ? '숨김' : '표시');
}

/**
 * 영역 관리 패널 업데이트
 */
function updateAreaManagementPanel() {
    const panel = document.getElementById('area-management-panel');
    const emptyMessage = document.getElementById('area-empty-message');

    if (!panel) return;

    if (selectedAreas.length === 0) {
        if (emptyMessage) {
            emptyMessage.style.display = 'block';
        }
        // 기타 영역 정보 제거
        const areaInfos = panel.querySelectorAll('.area-info');
        areaInfos.forEach(info => info.remove());
    } else {
        if (emptyMessage) {
            emptyMessage.style.display = 'none';
        }

        // 영역 정보 업데이트
        // 여기서는 간단히 생략 (필요시 구현)
    }
}

/**
 * 영역 상태 업데이트
 */
function updateAreaStatus() {
    const statusText = document.getElementById('area-selection-status');
    if (statusText) {
        statusText.textContent = `Areas: ${selectedAreas.length}`;
    }
}

/**
 * 영역 선택 연동 설정
 */
export function connectAreaSelection(chartWrapper, originalData) {
    console.log('[UI_CONTROLS] 영역 선택 연동 설정');

    if (!chartWrapper || !originalData) {
        console.warn('[UI_CONTROLS] chartWrapper 또는 originalData가 없습니다');
        return null;
    }

    // 원본 데이터 저장
    if (!chartWrapper._originalData) {
        chartWrapper._originalData = originalData;
    }

    console.log('[UI_CONTROLS] 영역 선택 연동 설정 완료');

    return {
        addArea: (boundaries) => addArea(boundaries, chartWrapper),
        removeArea: (areaId) => removeArea(areaId, chartWrapper),
        clearAll: () => clearAllAreas(chartWrapper),
        getAreas: () => selectedAreas
    };
}
