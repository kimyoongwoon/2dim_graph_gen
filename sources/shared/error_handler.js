// ============================================================================
// shared/error_handler.js - ���� ó�� �ý���
// ============================================================================

/**
 * �Ϲ� ���� �޽��� ǥ�� (���� showError �Լ�)
 * @param {string} message - ���� �޽���
 */
export function showError(message) {
    console.error('[ERROR_HANDLER] ����:', message);

    const errorDiv = document.getElementById('errorDisplay') || createErrorDisplay();
    errorDiv.textContent = `����: ${message}`;
    errorDiv.style.display = 'block';

    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

/**
 * ���� ǥ�ÿ� div ����
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
 * ���� ��Ʈ ǥ��
 * @param {HTMLElement} containerElement - �����̳� ������Ʈ
 * @param {string} errorMessage - ���� �޽���
 * @returns {Object} ���� ��Ʈ ��ü
 */
export function showError_chart(containerElement, errorMessage = '��Ʈ ������ �����߽��ϴ�') {
    console.error('[ERROR_HANDLER] ��Ʈ ����:', errorMessage);

    // �����̳� ����
    containerElement.innerHTML = '';

    // ĵ���� ����
    const canvas = document.createElement('canvas');
    canvas.width = containerElement.clientWidth || 400;
    canvas.height = containerElement.clientHeight || 300;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    containerElement.appendChild(canvas);

    // ĵ������ ���� �޽��� �׸���
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#f8d7da';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#721c24';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(errorMessage, canvas.width / 2, canvas.height / 2);

    // ���� ��Ʈ ��ü ��ȯ
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

// ���� ������ ����
let raw_data = null;

/**
 * ���� ������ ����
 * @param {Array} data - ���� ������
 */
export function setRawData(data) {
    raw_data = data;
    console.log('[ERROR_HANDLER] ���� ������ ����:', data?.length, '��');
}

/**
 * ���� ������ ��������
 * @returns {Array} ���� ������
 */
export function getRawData() {
    return raw_data;
}

/**
 * ��� ��Ʈ ������ ����
 */
export function clearAllChartData() {
    raw_data = null;
    console.log('[ERROR_HANDLER] ���� ������ ���� �Ϸ�');
}