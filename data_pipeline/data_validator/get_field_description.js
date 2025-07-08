// ============================================================================
// data_pipeline/data_validator/get_field_description.js
// ============================================================================

/**
 * 차원과 인덱스에 따른 필드 설명 반환
 * @param {number} fieldIndex - 필드 인덱스 (0부터 시작)
 * @param {number} dimension - 차원수 (1-4)
 * @returns {string} 필드 설명 문자열
 * @throws {Error} 유효하지 않은 매개변수일 때
 */
export default function getFieldDescription(fieldIndex, dimension) {
    console.log(`[DATA_VALIDATOR] 필드 설명 조회: index=${fieldIndex}, dimension=${dimension}`);
    
    // 입력 검증
    if (typeof fieldIndex !== 'number' || fieldIndex < 0) {
        throw new Error('fieldIndex는 0 이상의 숫자여야 합니다');
    }
    
    if (typeof dimension !== 'number' || dimension < 1 || dimension > 4) {
        throw new Error('dimension은 1-4 사이의 숫자여야 합니다');
    }
    
    if (fieldIndex >= dimension) {
        throw new Error(`fieldIndex(${fieldIndex})가 dimension(${dimension})보다 크거나 같습니다`);
    }

    try {
        // 차원별 필드 설명 정의
        const descriptions = {
            1: [
                '데이터 값 (모든 타입)'
            ],
            2: [
                'X축 (모든 타입 허용)', 
                'Y축 (숫자만 허용)'
            ],
            3: [
                'X축 (모든 타입 허용)', 
                'Y축 (숫자만 허용)', 
                '크기/색상 (숫자만 허용)'
            ],
            4: [
                'X축 (모든 타입 허용)', 
                'Y축 (숫자만 허용)', 
                '크기 (숫자만 허용)', 
                '색상 (숫자만 허용)'
            ]
        };

        // 상세 설명 정의 (추가 정보)
        const detailedDescriptions = {
            1: [
                '1차원 시각화에서 사용할 데이터 값입니다. 문자열은 카테고리 차트로, 숫자는 선형 차트로 표시됩니다.'
            ],
            2: [
                'X축(가로축)에 표시될 값입니다. 문자열과 숫자 모두 사용 가능합니다.',
                'Y축(세로축)에 표시될 값입니다. 산점도와 막대 차트에 사용되며, 반드시 숫자여야 합니다.'
            ],
            3: [
                'X축(가로축)에 표시될 값입니다. 문자열은 그룹 차트로, 숫자는 산점도로 표시됩니다.',
                'Y축(세로축)에 표시될 값입니다. 반드시 숫자여야 합니다.',
                '세 번째 차원으로 크기나 색상 인코딩에 사용됩니다. 반드시 숫자여야 합니다.'
            ],
            4: [
                'X축(가로축)에 표시될 값입니다. 문자열은 그룹 차트로, 숫자는 산점도로 표시됩니다.',
                'Y축(세로축)에 표시될 값입니다. 반드시 숫자여야 합니다.',
                '세 번째 차원으로 크기 인코딩에 사용됩니다. 반드시 숫자여야 합니다.',
                '네 번째 차원으로 색상 인코딩에 사용됩니다. 반드시 숫자여야 합니다.'
            ]
        };

        const dimDescriptions = descriptions[dimension];
        const dimDetailedDescriptions = detailedDescriptions[dimension];
        
        if (!dimDescriptions || fieldIndex >= dimDescriptions.length) {
            console.warn(`[DATA_VALIDATOR] 설명을 찾을 수 없음: index=${fieldIndex}, dimension=${dimension}`);
            return '설명 없음';
        }

        const basicDescription = dimDescriptions[fieldIndex];
        const detailedDescription = dimDetailedDescriptions[fieldIndex];

        console.log(`[DATA_VALIDATOR] 필드 설명 반환: "${basicDescription}"`);

        return basicDescription;

    } catch (error) {
        console.error('[DATA_VALIDATOR] 필드 설명 조회 중 오류:', error);
        throw new Error(`필드 설명 조회 실패: ${error.message}`);
    }
}

/**
 * 차원별 모든 필드 설명을 배열로 반환 (추가 유틸리티 함수)
 * @param {number} dimension - 차원수 (1-4)
 * @returns {string[]} 필드 설명 배열
 * @throws {Error} 유효하지 않은 차원수일 때
 */
export function getAllFieldDescriptions(dimension) {
    if (typeof dimension !== 'number' || dimension < 1 || dimension > 4) {
        throw new Error('dimension은 1-4 사이의 숫자여야 합니다');
    }

    const descriptions = [];
    for (let i = 0; i < dimension; i++) {
        descriptions.push(getFieldDescription(i, dimension));
    }
    
    return descriptions;
}

/**
 * 축 이름을 반환하는 유틸리티 함수
 * @param {number} fieldIndex - 필드 인덱스 (0부터 시작)
 * @returns {string} 축 이름 ('X', 'Y', 'Z', 'W')
 * @throws {Error} 유효하지 않은 인덱스일 때
 */
export function getAxisName(fieldIndex) {
    if (typeof fieldIndex !== 'number' || fieldIndex < 0 || fieldIndex > 3) {
        throw new Error('fieldIndex는 0-3 사이의 숫자여야 합니다');
    }
    
    const axisNames = ['X', 'Y', 'Z', 'W'];
    return axisNames[fieldIndex];
}

/**
 * 차원별 축 이름들을 배열로 반환
 * @param {number} dimension - 차원수 (1-4)
 * @returns {string[]} 축 이름 배열
 * @throws {Error} 유효하지 않은 차원수일 때
 */
export function getAxisNames(dimension) {
    if (typeof dimension !== 'number' || dimension < 1 || dimension > 4) {
        throw new Error('dimension은 1-4 사이의 숫자여야 합니다');
    }
    
    const axisNames = [];
    for (let i = 0; i < dimension; i++) {
        axisNames.push(getAxisName(i));
    }
    
    return axisNames;
}