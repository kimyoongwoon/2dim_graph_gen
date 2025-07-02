// ============================================================================
// shared/error_handler.js - 에러 처리 시스템
// ============================================================================

/**
 * 일반 에러 메시지 표시 (기존 showError 함수)
 * @param {string} message - 에러 메시지
 */
export function showError(message) {
    console.error('[ERROR_HANDLER] 에러:', message);

    const errorDiv = document.getElementById('errorDisplay') || createErrorDisplay();
    errorDiv.textContent = `에러: ${message}`;
    errorDiv.style.display = 'block';

    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

/**
 * 에러 표시용 div 생성
 */
function createErrorDisplay() {
    const errorDiv = document.createElement('div');
    errorDiv.id = 'errorDisplay';
    errorDiv.className = 'error-display';
    errorDiv.style.cssText = `
        background: #f8d7da;
        color: #721c24;
        padding: 10px;
        margin: 10px 0;
        border: 1px solid #f5c6cb;
        font-weight: bold;
        display: none;
    `;
    document.body.appendChild(errorDiv);
    return errorDiv;
}

/**
 * 에러 차트 표시
 * @param {HTMLElement} containerElement - 컨테이너 엘리먼트
 * @param {string} errorMessage - 에러 메시지
 * @returns {Object} 에러 차트 객체
 */
export function showError_chart(containerElement, errorMessage = '차트 생성에 실패했습니다') {
    console.error('[ERROR_HANDLER] 차트 에러:', errorMessage);

    // 컨테이너 정리
    containerElement.innerHTML = '';

    // 캔버스 생성
    const canvas = document.createElement('canvas');
    canvas.width = containerElement.clientWidth || 400;
    canvas.height = containerElement.clientHeight || 300;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    containerElement.appendChild(canvas);

    // 캔버스에 에러 메시지 그리기
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#f8d7da';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#721c24';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(errorMessage, canvas.width / 2, canvas.height / 2);

    // 에러 차트 객체 반환
    return {
        chart: null,
        on: () => { },
        off: () => { },
        emit: () => { },
        updateData: () => { },
        resize: () => { },
        getConfig: () => ({}),
        destroy: () => {
            containerElement.innerHTML = '';
        }
    };
}

// 전역 데이터 관리
let raw_data = null;

/**
 * 전역 데이터 설정
 * @param {Array} data - 원시 데이터
 */
export function setRawData(data) {
    raw_data = data;
    console.log('[ERROR_HANDLER] 전역 데이터 설정:', data?.length, '개');
}

/**
 * 전역 데이터 가져오기
 * @returns {Array} 원시 데이터
 */
export function getRawData() {
    return raw_data;
}

/**
 * 모든 차트 데이터 정리
 */
export function clearAllChartData() {
    raw_data = null;
    console.log('[ERROR_HANDLER] 전역 데이터 정리 완료');
}