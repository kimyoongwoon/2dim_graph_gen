// ============================================================================
// data_pipeline/data_validator/validate_complete_config.js
// ============================================================================

import {
    isValidChartType,
    getChartTypeRequirements,
    SCALING_CONFIG_SCHEMA,
    COLOR_CONFIG_SCHEMA
} from '../config_schema/config_requirements.js';

/**
 * 완성된 config 객체 종합 검증
 * @param {Object} config - 검증할 config 객체
 * @param {Array<Object>} rawData - 원시 데이터 (필드 존재 여부 확인용)
 * @returns {Object} { isValid: boolean, errors: string[], warnings: string[], suggestions: string[] }
 */
export default function validateCompleteConfig(config, rawData = null) {
    console.log('[CONFIG_VALIDATOR] 완성된 config 종합 검증 시작');

    const errors = [];
    const warnings = [];
    const suggestions = [];

    try {
        // 1. 기본 구조 검증
        const basicResult = validateBasicStructure(config);
        errors.push(...basicResult.errors);
        warnings.push(...basicResult.warnings);

        // 기본 구조에 오류가 있으면 중단
        if (basicResult.errors.length > 0) {
            return { isValid: false, errors, warnings, suggestions };
        }

        // 2. 차트 타입별 요구사항 검증
        const typeResult = validateChartTypeRequirements(config.type, config.dataMapping);
        errors.push(...typeResult.errors);
        warnings.push(...typeResult.warnings);

        // 3. 데이터 필드 존재 여부 검증
        if (rawData && Array.isArray(rawData) && rawData.length > 0) {
            const fieldResult = validateFieldsExistInData(config.dataMapping, rawData);
            errors.push(...fieldResult.errors);
            warnings.push(...fieldResult.warnings);
            suggestions.push(...fieldResult.suggestions);
        }

        // 4. scalingConfig 검증
        if (config.scalingConfig) {
            const scalingResult = validateScalingConfig(config.scalingConfig);
            errors.push(...scalingResult.errors);
            warnings.push(...scalingResult.warnings);
        }

        // 5. colorConfig 검증
        if (config.colorConfig) {
            const colorResult = validateColorConfig(config.colorConfig);
            errors.push(...colorResult.errors);
            warnings.push(...colorResult.warnings);
        }

        // 6. 추가 제안사항
        const additionalSuggestions = generateSuggestions(config, rawData);
        suggestions.push(...additionalSuggestions);

        const isValid = errors.length === 0;

        console.log('[CONFIG_VALIDATOR] 검증 완료:', {
            isValid,
            errorCount: errors.length,
            warningCount: warnings.length,
            suggestionCount: suggestions.length
        });

        return {
            isValid,
            errors,
            warnings,
            suggestions
        };

    } catch (error) {
        console.error('[CONFIG_VALIDATOR] 검증 중 오류:', error);
        return {
            isValid: false,
            errors: [`검증 과정에서 오류 발생: ${error.message}`],
            warnings,
            suggestions
        };
    }
}

/**
 * 1. 기본 구조 검증
 */
function validateBasicStructure(config) {
    const errors = [];
    const warnings = [];

    // config 자체가 객체인지 확인
    if (!config || typeof config !== 'object') {
        errors.push('config는 객체여야 합니다');
        return { errors, warnings };
    }

    // 필수 필드: type, dataMapping
    if (!config.type || typeof config.type !== 'string') {
        errors.push('config.type이 누락되었거나 문자열이 아닙니다');
    }

    if (!config.dataMapping || typeof config.dataMapping !== 'object') {
        errors.push('config.dataMapping이 누락되었거나 객체가 아닙니다');
    }

    // 차트 타입 유효성
    if (config.type && !isValidChartType(config.type)) {
        errors.push(`지원하지 않는 차트 타입입니다: ${config.type}`);
        warnings.push('지원하는 타입: 2d_scatter, 2d_size, 2d_color, 3d_surface_scatter, 3d_scatter_color, 3d_scatter_size, 3d_size_color, 4d_scatter_size_color');
    }

    return { errors, warnings };
}

/**
 * 2. 차트 타입별 요구사항 검증
 */
function validateChartTypeRequirements(chartType, dataMapping) {
    const errors = [];
    const warnings = [];

    const requirements = getChartTypeRequirements(chartType);
    if (!requirements) {
        errors.push(`차트 타입 '${chartType}'의 요구사항을 찾을 수 없습니다`);
        return { errors, warnings };
    }

    const mappingKeys = Object.keys(dataMapping || {});

    // 필수 필드 확인
    const missingRequired = requirements.required.filter(field => !mappingKeys.includes(field));
    if (missingRequired.length > 0) {
        errors.push(`'${chartType}'에 필요한 필드가 누락되었습니다: ${missingRequired.join(', ')}`);
    }

    // 금지된 필드 확인
    const forbiddenPresent = requirements.forbidden.filter(field => mappingKeys.includes(field));
    if (forbiddenPresent.length > 0) {
        errors.push(`'${chartType}'에서 사용할 수 없는 필드가 포함되었습니다: ${forbiddenPresent.join(', ')}`);
    }

    // 빈 필드값 확인
    const emptyFields = mappingKeys.filter(key => !dataMapping[key] || dataMapping[key].trim() === '');
    if (emptyFields.length > 0) {
        errors.push(`dataMapping에 빈 필드값이 있습니다: ${emptyFields.join(', ')}`);
    }

    return { errors, warnings };
}

/**
 * 3. 데이터 필드 존재 여부 검증
 */
function validateFieldsExistInData(dataMapping, rawData) {
    const errors = [];
    const warnings = [];
    const suggestions = [];

    const firstRecord = rawData[0];
    if (!firstRecord || typeof firstRecord !== 'object') {
        warnings.push('데이터의 첫 번째 레코드를 확인할 수 없습니다');
        return { errors, warnings, suggestions };
    }

    const availableFields = Object.keys(firstRecord);
    const mappingValues = Object.values(dataMapping).filter(field => field && field.trim() !== '');

    // 존재하지 않는 필드 확인
    const missingFields = mappingValues.filter(field => !availableFields.includes(field));
    if (missingFields.length > 0) {
        errors.push(`다음 필드가 데이터에 존재하지 않습니다: ${missingFields.join(', ')}`);
    }

    // 사용 가능한 필드 제안
    if (availableFields.length > 0) {
        suggestions.push(`사용 가능한 필드: ${availableFields.join(', ')}`);
    }

    // 필드 타입 확인 (간단히)
    mappingValues.forEach(fieldName => {
        if (availableFields.includes(fieldName)) {
            const value = firstRecord[fieldName];
            const fieldType = typeof value;

            if (fieldType !== 'number' && fieldType !== 'string') {
                warnings.push(`필드 '${fieldName}'의 타입이 예상과 다릅니다: ${fieldType}`);
            }
        }
    });

    return { errors, warnings, suggestions };
}

/**
 * 4. scalingConfig 검증
 */
function validateScalingConfig(scalingConfig) {
    const errors = [];
    const warnings = [];

    if (!scalingConfig.type) {
        errors.push('scalingConfig.type이 필요합니다');
        return { errors, warnings };
    }

    const allowedTypes = SCALING_CONFIG_SCHEMA.type.allowedValues;
    if (!allowedTypes.includes(scalingConfig.type)) {
        errors.push(`scalingConfig.type이 유효하지 않습니다: ${scalingConfig.type} (허용값: ${allowedTypes.join(', ')})`);
    }

    // params 검증
    if (scalingConfig.params) {
        if (scalingConfig.type === 'linear') {
            const { a, b } = scalingConfig.params;
            if (typeof a !== 'number' || typeof b !== 'number') {
                warnings.push('linear scaling의 params는 숫자여야 합니다 (a, b)');
            }
        } else if (scalingConfig.type === 'sigmoid') {
            const { k } = scalingConfig.params;
            if (typeof k !== 'number' || k <= 0) {
                warnings.push('sigmoid scaling의 k는 양수여야 합니다');
            }
        }
    }

    return { errors, warnings };
}

/**
 * 5. colorConfig 검증
 */
function validateColorConfig(colorConfig) {
    const errors = [];
    const warnings = [];

    if (!colorConfig.type) {
        errors.push('colorConfig.type이 필요합니다');
        return { errors, warnings };
    }

    const allowedTypes = COLOR_CONFIG_SCHEMA.type.allowedValues;
    if (!allowedTypes.includes(colorConfig.type)) {
        errors.push(`colorConfig.type이 유효하지 않습니다: ${colorConfig.type} (허용값: ${allowedTypes.join(', ')})`);
    }

    return { errors, warnings };
}

/**
 * 6. 추가 제안사항 생성
 */
function generateSuggestions(config, rawData) {
    const suggestions = [];

    // 3D Surface 차트 성능 경고
    if (config.type === '3d_surface_scatter' && rawData && rawData.length > 50) {
        suggestions.push('3D Surface 차트는 성능을 위해 16개 데이터로 자동 제한됩니다');
    }

    // 대용량 데이터 경고
    if (rawData && rawData.length > 5000) {
        suggestions.push('대용량 데이터입니다. 렌더링 성능이 저하될 수 있습니다');
    }

    // scalingConfig 기본값 제안
    if (!config.scalingConfig) {
        suggestions.push('scalingConfig가 설정되지 않아 기본값을 사용합니다');
    }

    // colorConfig 기본값 제안
    if (!config.colorConfig) {
        suggestions.push('colorConfig가 설정되지 않아 기본값을 사용합니다');
    }

    return suggestions;
}