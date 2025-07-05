// ============================================================================
// data_pipeline/container_creator/create_chart_container_element.js
// ============================================================================

/**
 * 🆕 2D/3D 통합 차트 컨테이너 생성 (분기 처리)
 * @param {HTMLElement} parentElement - 부모 엘리먼트
 * @param {boolean} is3D - 3D 차트 여부
 * @param {Object} containerOptions - { width, height, className, style, id }
 * @returns {HTMLElement} containerElement - 생성된 컨테이너
 * @throws {Error} DOM 생성 실패시
 */
export function createUnifiedChartContainer(parentElement, is3D, containerOptions = {}) {
    console.log('[CONTAINER_CREATOR] 통합 차트 컨테이너 생성 시작');
    console.log('[CONTAINER_CREATOR] 옵션:', { is3D, containerOptions });

    // 입력 검증
    if (!parentElement) {
        throw new Error('부모 엘리먼트가 필요합니다');
    }

    if (!(parentElement instanceof HTMLElement)) {
        throw new Error('parentElement는 유효한 HTML 엘리먼트여야 합니다');
    }

    if (typeof is3D !== 'boolean') {
        throw new Error('is3D는 boolean이어야 합니다');
    }

    if (containerOptions && typeof containerOptions !== 'object') {
        throw new Error('containerOptions는 객체여야 합니다');
    }

    try {
        // 3D인 경우
        if (is3D) {
            console.log('[CONTAINER_CREATOR] 3D Plotly 컨테이너 생성');
            return create3DPlotlyContainer(parentElement, containerOptions);
        } 
        // 2D인 경우
        else {
            console.log('[CONTAINER_CREATOR] 2D Canvas 컨테이너 생성');
            return create2DCanvasContainer(parentElement, containerOptions);
        }

    } catch (error) {
        console.error('[CONTAINER_CREATOR] 통합 컨테이너 생성 중 오류:', error);
        throw new Error(`차트 컨테이너 생성 실패: ${error.message}`);
    }
}

/**
 * 🆕 2D Canvas 차트용 컨테이너 생성
 * @param {HTMLElement} parentElement - 부모 엘리먼트
 * @param {Object} containerOptions - 컨테이너 옵션
 * @returns {HTMLElement} Canvas 컨테이너
 */
function create2DCanvasContainer(parentElement, containerOptions = {}) {
    console.log('[CONTAINER_CREATOR] 2D Canvas 컨테이너 생성');

    // 기본 옵션 설정 (2D용)
    const defaultOptions = {
        width: '100%',
        height: '400px',
        className: 'chart-container-2d',
        style: {},
        id: `chart-2d-container-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        position: 'relative',
        overflow: 'hidden'
    };

    const options = { ...defaultOptions, ...containerOptions };

    // 메인 컨테이너 생성
    const containerElement = document.createElement('div');
    
    // 기본 속성 설정
    if (options.id) {
        containerElement.id = options.id;
    }

    if (options.className) {
        containerElement.className = options.className;
    }

    // 2D Canvas용 스타일 적용
    const canvas2DStyle = {
        position: options.position,
        width: options.width,
        height: options.height,
        overflow: options.overflow,
        backgroundColor: options.backgroundColor || 'transparent',
        border: options.border || 'none',
        borderRadius: options.borderRadius || '0',
        boxSizing: 'border-box',
        padding: options.padding || '0',
        margin: options.margin || '0'
    };

    // 사용자 정의 스타일 병합
    const finalStyle = { ...canvas2DStyle, ...options.style };

    // 스타일 적용
    Object.assign(containerElement.style, finalStyle);

    // 접근성 속성 추가
    containerElement.setAttribute('role', 'img');
    containerElement.setAttribute('aria-label', '2D 차트 컨테이너');

    // 데이터 속성 추가 (디버깅용)
    containerElement.setAttribute('data-chart-container', '2d');
    containerElement.setAttribute('data-created-at', new Date().toISOString());

    // 부모 엘리먼트에 추가
    parentElement.appendChild(containerElement);

    // 2D 컨테이너 유틸리티 메서드 추가
    add2DContainerUtilities(containerElement);

    console.log('[CONTAINER_CREATOR] 2D Canvas 컨테이너 생성 완료:', {
        id: containerElement.id,
        className: containerElement.className
    });

    return containerElement;
}

/**
 * 🆕 3D Plotly 차트용 컨테이너 생성
 * @param {HTMLElement} parentElement - 부모 엘리먼트
 * @param {Object} containerOptions - 컨테이너 옵션
 * @returns {HTMLElement} Plotly 컨테이너
 */
function create3DPlotlyContainer(parentElement, containerOptions = {}) {
    console.log('[CONTAINER_CREATOR] 3D Plotly 컨테이너 생성');

    // 기본 옵션 설정 (3D용)
    const defaultOptions = {
        width: '100%',
        height: '400px',
        className: 'chart-container-3d',
        style: {},
        id: `chart-3d-container-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        position: 'relative',
        overflow: 'hidden'
    };

    const options = { ...defaultOptions, ...containerOptions };

    // 메인 컨테이너 생성
    const containerElement = document.createElement('div');
    
    // 기본 속성 설정
    if (options.id) {
        containerElement.id = options.id;
    }

    if (options.className) {
        containerElement.className = options.className;
    }

    // 3D Plotly용 스타일 적용
    const plotly3DStyle = {
        position: options.position,
        width: options.width,
        height: options.height,
        overflow: options.overflow,
        backgroundColor: options.backgroundColor || 'transparent',
        border: options.border || 'none',
        borderRadius: options.borderRadius || '0',
        boxSizing: 'border-box',
        padding: options.padding || '0',
        margin: options.margin || '0',
        // 3D 특화 스타일
        minHeight: '400px'
    };

    // 사용자 정의 스타일 병합
    const finalStyle = { ...plotly3DStyle, ...options.style };

    // 스타일 적용
    Object.assign(containerElement.style, finalStyle);

    // 접근성 속성 추가
    containerElement.setAttribute('role', 'img');
    containerElement.setAttribute('aria-label', '3D 차트 컨테이너');

    // 데이터 속성 추가 (디버깅용)
    containerElement.setAttribute('data-chart-container', '3d');
    containerElement.setAttribute('data-created-at', new Date().toISOString());

    // 부모 엘리먼트에 추가
    parentElement.appendChild(containerElement);

    // 3D 컨테이너 유틸리티 메서드 추가
    add3DContainerUtilities(containerElement);

    console.log('[CONTAINER_CREATOR] 3D Plotly 컨테이너 생성 완료:', {
        id: containerElement.id,
        className: containerElement.className
    });

    return containerElement;
}

/**
 * 2D 컨테이너에 유틸리티 메서드 추가
 * @param {HTMLElement} containerElement - 2D 컨테이너 엘리먼트
 */
function add2DContainerUtilities(containerElement) {
    // 컨테이너 크기 조회 메서드
    containerElement.getContainerSize = function () {
        const rect = this.getBoundingClientRect();
        return {
            width: rect.width,
            height: rect.height,
            left: rect.left,
            top: rect.top
        };
    };

    // Canvas 엘리먼트 조회 메서드
    containerElement.getCanvas = function () {
        return this.querySelector('canvas');
    };

    // Chart.js 인스턴스 조회 메서드
    containerElement.getChartInstance = function () {
        const canvas = this.getCanvas();
        return canvas ? Chart.getChart(canvas) : null;
    };

    // 2D 컨테이너 정리 메서드
    containerElement.cleanup = function () {
        // Chart.js 인스턴스 정리
        const chartInstance = this.getChartInstance();
        if (chartInstance) {
            chartInstance.destroy();
        }

        // Canvas 제거
        const canvas = this.getCanvas();
        if (canvas) {
            canvas.remove();
        }

        // 데이터 속성 정리
        this.removeAttribute('data-chart-container');
        this.removeAttribute('data-created-at');

        console.log('[CONTAINER_CREATOR] 2D 컨테이너 정리 완료:', this.id);
    };

    // 2D 컨테이너 리사이즈 메서드
    containerElement.resizeContainer = function (width, height) {
        if (width) this.style.width = typeof width === 'number' ? width + 'px' : width;
        if (height) this.style.height = typeof height === 'number' ? height + 'px' : height;

        // Chart.js 리사이즈
        const chartInstance = this.getChartInstance();
        if (chartInstance) {
            chartInstance.resize();
        }

        console.log('[CONTAINER_CREATOR] 2D 컨테이너 리사이즈:', { width, height });
    };

    console.log('[CONTAINER_CREATOR] 2D 유틸리티 메서드 추가 완료');
}

/**
 * 3D 컨테이너에 유틸리티 메서드 추가
 * @param {HTMLElement} containerElement - 3D 컨테이너 엘리먼트
 */
function add3DContainerUtilities(containerElement) {
    // 컨테이너 크기 조회 메서드
    containerElement.getContainerSize = function () {
        const rect = this.getBoundingClientRect();
        return {
            width: rect.width,
            height: rect.height,
            left: rect.left,
            top: rect.top
        };
    };

    // Plotly div 조회 메서드
    containerElement.getPlotlyDiv = function () {
        return this.querySelector('[id*="plotly"]') || this;
    };

    // 3D 컨테이너 정리 메서드
    containerElement.cleanup = function () {
        // Plotly 차트 정리
        const plotlyDiv = this.getPlotlyDiv();
        if (window.Plotly && plotlyDiv) {
            window.Plotly.purge(plotlyDiv);
        }

        // 내용 초기화
        this.innerHTML = '';

        // 데이터 속성 정리
        this.removeAttribute('data-chart-container');
        this.removeAttribute('data-created-at');

        console.log('[CONTAINER_CREATOR] 3D 컨테이너 정리 완료:', this.id);
    };

    // 3D 컨테이너 리사이즈 메서드
    containerElement.resizeContainer = function (width, height) {
        if (width) this.style.width = typeof width === 'number' ? width + 'px' : width;
        if (height) this.style.height = typeof height === 'number' ? height + 'px' : height;

        // Plotly 리사이즈
        const plotlyDiv = this.getPlotlyDiv();
        if (window.Plotly && plotlyDiv) {
            window.Plotly.Plots.resize(plotlyDiv);
        }

        console.log('[CONTAINER_CREATOR] 3D 컨테이너 리사이즈:', { width, height });
    };

    console.log('[CONTAINER_CREATOR] 3D 유틸리티 메서드 추가 완료');
}

/**
 * 기존 함수 (generateChart용 containerElement 생성) - 3D 전용으로 유지
 * @param {HTMLElement} parentElement - 부모 엘리먼트
 * @param {Object} containerOptions - { width, height, className, style, id }
 * @returns {HTMLElement} containerElement - 생성된 컨테이너
 * @throws {Error} DOM 생성 실패시
 */
export default function createChartContainerElement(parentElement, containerOptions = {}) {
    console.log('[CONTAINER_CREATOR] 차트 컨테이너 생성 시작');
    console.log('[CONTAINER_CREATOR] 옵션:', containerOptions);

    // 입력 검증
    if (!parentElement) {
        throw new Error('부모 엘리먼트가 필요합니다');
    }

    if (!(parentElement instanceof HTMLElement)) {
        throw new Error('parentElement는 유효한 HTML 엘리먼트여야 합니다');
    }

    if (containerOptions && typeof containerOptions !== 'object') {
        throw new Error('containerOptions는 객체여야 합니다');
    }

    try {
        // 부모 엘리먼트 상태 확인
        if (!document.contains(parentElement)) {
            throw new Error('부모 엘리먼트가 DOM에 연결되어 있지 않습니다');
        }

        // 기본 옵션 설정
        const defaultOptions = {
            width: '100%',
            height: '400px',
            className: 'chart-container',
            style: {},
            id: `chart-container-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            position: 'relative',
            overflow: 'hidden'
        };

        const options = { ...defaultOptions, ...containerOptions };

        console.log('[CONTAINER_CREATOR] 적용될 옵션:', options);

        // 컨테이너 엘리먼트 생성
        const containerElement = document.createElement('div');

        // 기본 속성 설정
        if (options.id) {
            containerElement.id = options.id;
        }

        if (options.className) {
            containerElement.className = options.className;
        }

        // 기본 스타일 적용
        const baseStyle = {
            position: options.position,
            width: options.width,
            height: options.height,
            overflow: options.overflow,
            backgroundColor: options.backgroundColor || 'transparent',
            border: options.border || 'none',
            borderRadius: options.borderRadius || '0',
            boxSizing: 'border-box',
            padding: options.padding || '0',
            margin: options.margin || '0'
        };

        // 사용자 정의 스타일 병합
        const finalStyle = { ...baseStyle, ...options.style };

        // 스타일 적용
        Object.assign(containerElement.style, finalStyle);

        // 접근성 속성 추가
        containerElement.setAttribute('role', 'img');
        containerElement.setAttribute('aria-label', '차트 컨테이너');

        // 데이터 속성 추가 (디버깅용)
        containerElement.setAttribute('data-chart-container', 'true');
        containerElement.setAttribute('data-created-at', new Date().toISOString());

        // 부모 엘리먼트에 추가
        parentElement.appendChild(containerElement);

        // 컨테이너 크기 확인
        const rect = containerElement.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
            console.warn('[CONTAINER_CREATOR] 컨테이너 크기가 0입니다:', { width: rect.width, height: rect.height });
            console.warn('[CONTAINER_CREATOR] 부모 엘리먼트 크기:', parentElement.getBoundingClientRect());
        }

        // 성공 로깅
        console.log('[CONTAINER_CREATOR] 컨테이너 생성 완료:', {
            id: containerElement.id,
            className: containerElement.className,
            width: rect.width,
            height: rect.height,
            parentTagName: parentElement.tagName,
            parentId: parentElement.id || 'no-id'
        });

        // 컨테이너에 유틸리티 메서드 추가
        addContainerUtilities(containerElement);

        return containerElement;

    } catch (error) {
        console.error('[CONTAINER_CREATOR] 컨테이너 생성 중 오류:', error);
        throw new Error(`차트 컨테이너 생성 실패: ${error.message}`);
    }
}

/**
 * 컨테이너에 유틸리티 메서드 추가 (기존 함수 유지)
 * @param {HTMLElement} containerElement - 컨테이너 엘리먼트
 */
function addContainerUtilities(containerElement) {
    // 컨테이너 크기 조회 메서드
    containerElement.getContainerSize = function () {
        const rect = this.getBoundingClientRect();
        return {
            width: rect.width,
            height: rect.height,
            left: rect.left,
            top: rect.top
        };
    };

    // 컨테이너 정리 메서드
    containerElement.cleanup = function () {
        // 이벤트 리스너 제거 (필요시)
        this.innerHTML = '';

        // 데이터 속성 정리
        this.removeAttribute('data-chart-container');
        this.removeAttribute('data-created-at');

        console.log('[CONTAINER_CREATOR] 컨테이너 정리 완료:', this.id);
    };

    // 컨테이너 리사이즈 메서드
    containerElement.resizeContainer = function (width, height) {
        if (width) this.style.width = typeof width === 'number' ? width + 'px' : width;
        if (height) this.style.height = typeof height === 'number' ? height + 'px' : height;

        console.log('[CONTAINER_CREATOR] 컨테이너 리사이즈:', { width, height });

        // 리사이즈 이벤트 발생 (차트가 감지할 수 있도록)
        const resizeEvent = new CustomEvent('containerResize', {
            detail: { width, height }
        });
        this.dispatchEvent(resizeEvent);
    };

    // 컨테이너 상태 확인 메서드
    containerElement.getStatus = function () {
        const rect = this.getBoundingClientRect();
        return {
            id: this.id,
            isVisible: rect.width > 0 && rect.height > 0,
            isInDOM: document.contains(this),
            hasParent: !!this.parentElement,
            childCount: this.children.length,
            createdAt: this.getAttribute('data-created-at')
        };
    };

    console.log('[CONTAINER_CREATOR] 유틸리티 메서드 추가 완료');
}