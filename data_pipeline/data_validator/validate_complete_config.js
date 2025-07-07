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
 * �ϼ��� config ��ü ���� ����
 * @param {Object} config - ������ config ��ü
 * @param {Array<Object>} rawData - ���� ������ (�ʵ� ���� ���� Ȯ�ο�)
 * @returns {Object} { isValid: boolean, errors: string[], warnings: string[], suggestions: string[] }
 */
export default function validateCompleteConfig(config, rawData = null) {
    console.log('[CONFIG_VALIDATOR] �ϼ��� config ���� ���� ����');

    const errors = [];
    const warnings = [];
    const suggestions = [];

    try {
        // 1. �⺻ ���� ����
        const basicResult = validateBasicStructure(config);
        errors.push(...basicResult.errors);
        warnings.push(...basicResult.warnings);

        // �⺻ ������ ������ ������ �ߴ�
        if (basicResult.errors.length > 0) {
            return { isValid: false, errors, warnings, suggestions };
        }

        // 2. ��Ʈ Ÿ�Ժ� �䱸���� ����
        const typeResult = validateChartTypeRequirements(config.type, config.dataMapping);
        errors.push(...typeResult.errors);
        warnings.push(...typeResult.warnings);

        // 3. ������ �ʵ� ���� ���� ����
        if (rawData && Array.isArray(rawData) && rawData.length > 0) {
            const fieldResult = validateFieldsExistInData(config.dataMapping, rawData);
            errors.push(...fieldResult.errors);
            warnings.push(...fieldResult.warnings);
            suggestions.push(...fieldResult.suggestions);
        }

        // 4. scalingConfig ����
        if (config.scalingConfig) {
            const scalingResult = validateScalingConfig(config.scalingConfig);
            errors.push(...scalingResult.errors);
            warnings.push(...scalingResult.warnings);
        }

        // 5. colorConfig ����
        if (config.colorConfig) {
            const colorResult = validateColorConfig(config.colorConfig);
            errors.push(...colorResult.errors);
            warnings.push(...colorResult.warnings);
        }

        // 6. �߰� ���Ȼ���
        const additionalSuggestions = generateSuggestions(config, rawData);
        suggestions.push(...additionalSuggestions);

        const isValid = errors.length === 0;

        console.log('[CONFIG_VALIDATOR] ���� �Ϸ�:', {
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
        console.error('[CONFIG_VALIDATOR] ���� �� ����:', error);
        return {
            isValid: false,
            errors: [`���� �������� ���� �߻�: ${error.message}`],
            warnings,
            suggestions
        };
    }
}

/**
 * 1. �⺻ ���� ����
 */
function validateBasicStructure(config) {
    const errors = [];
    const warnings = [];

    // config ��ü�� ��ü���� Ȯ��
    if (!config || typeof config !== 'object') {
        errors.push('config�� ��ü���� �մϴ�');
        return { errors, warnings };
    }

    // �ʼ� �ʵ�: type, dataMapping
    if (!config.type || typeof config.type !== 'string') {
        errors.push('config.type�� �����Ǿ��ų� ���ڿ��� �ƴմϴ�');
    }

    if (!config.dataMapping || typeof config.dataMapping !== 'object') {
        errors.push('config.dataMapping�� �����Ǿ��ų� ��ü�� �ƴմϴ�');
    }

    // ��Ʈ Ÿ�� ��ȿ��
    if (config.type && !isValidChartType(config.type)) {
        errors.push(`�������� �ʴ� ��Ʈ Ÿ���Դϴ�: ${config.type}`);
        warnings.push('�����ϴ� Ÿ��: 2d_scatter, 2d_size, 2d_color, 3d_surface_scatter, 3d_scatter_color, 3d_scatter_size, 3d_size_color, 4d_scatter_size_color');
    }

    return { errors, warnings };
}

/**
 * 2. ��Ʈ Ÿ�Ժ� �䱸���� ����
 */
function validateChartTypeRequirements(chartType, dataMapping) {
    const errors = [];
    const warnings = [];

    const requirements = getChartTypeRequirements(chartType);
    if (!requirements) {
        errors.push(`��Ʈ Ÿ�� '${chartType}'�� �䱸������ ã�� �� �����ϴ�`);
        return { errors, warnings };
    }

    const mappingKeys = Object.keys(dataMapping || {});

    // �ʼ� �ʵ� Ȯ��
    const missingRequired = requirements.required.filter(field => !mappingKeys.includes(field));
    if (missingRequired.length > 0) {
        errors.push(`'${chartType}'�� �ʿ��� �ʵ尡 �����Ǿ����ϴ�: ${missingRequired.join(', ')}`);
    }

    // ������ �ʵ� Ȯ��
    const forbiddenPresent = requirements.forbidden.filter(field => mappingKeys.includes(field));
    if (forbiddenPresent.length > 0) {
        errors.push(`'${chartType}'���� ����� �� ���� �ʵ尡 ���ԵǾ����ϴ�: ${forbiddenPresent.join(', ')}`);
    }

    // �� �ʵ尪 Ȯ��
    const emptyFields = mappingKeys.filter(key => !dataMapping[key] || dataMapping[key].trim() === '');
    if (emptyFields.length > 0) {
        errors.push(`dataMapping�� �� �ʵ尪�� �ֽ��ϴ�: ${emptyFields.join(', ')}`);
    }

    return { errors, warnings };
}

/**
 * 3. ������ �ʵ� ���� ���� ����
 */
function validateFieldsExistInData(dataMapping, rawData) {
    const errors = [];
    const warnings = [];
    const suggestions = [];

    const firstRecord = rawData[0];
    if (!firstRecord || typeof firstRecord !== 'object') {
        warnings.push('�������� ù ��° ���ڵ带 Ȯ���� �� �����ϴ�');
        return { errors, warnings, suggestions };
    }

    const availableFields = Object.keys(firstRecord);
    const mappingValues = Object.values(dataMapping).filter(field => field && field.trim() !== '');

    // �������� �ʴ� �ʵ� Ȯ��
    const missingFields = mappingValues.filter(field => !availableFields.includes(field));
    if (missingFields.length > 0) {
        errors.push(`���� �ʵ尡 �����Ϳ� �������� �ʽ��ϴ�: ${missingFields.join(', ')}`);
    }

    // ��� ������ �ʵ� ����
    if (availableFields.length > 0) {
        suggestions.push(`��� ������ �ʵ�: ${availableFields.join(', ')}`);
    }

    // �ʵ� Ÿ�� Ȯ�� (������)
    mappingValues.forEach(fieldName => {
        if (availableFields.includes(fieldName)) {
            const value = firstRecord[fieldName];
            const fieldType = typeof value;

            if (fieldType !== 'number' && fieldType !== 'string') {
                warnings.push(`�ʵ� '${fieldName}'�� Ÿ���� ����� �ٸ��ϴ�: ${fieldType}`);
            }
        }
    });

    return { errors, warnings, suggestions };
}

/**
 * 4. scalingConfig ����
 */
function validateScalingConfig(scalingConfig) {
    const errors = [];
    const warnings = [];

    if (!scalingConfig.type) {
        errors.push('scalingConfig.type�� �ʿ��մϴ�');
        return { errors, warnings };
    }

    const allowedTypes = SCALING_CONFIG_SCHEMA.type.allowedValues;
    if (!allowedTypes.includes(scalingConfig.type)) {
        errors.push(`scalingConfig.type�� ��ȿ���� �ʽ��ϴ�: ${scalingConfig.type} (��밪: ${allowedTypes.join(', ')})`);
    }

    // params ����
    if (scalingConfig.params) {
        if (scalingConfig.type === 'linear') {
            const { a, b } = scalingConfig.params;
            if (typeof a !== 'number' || typeof b !== 'number') {
                warnings.push('linear scaling�� params�� ���ڿ��� �մϴ� (a, b)');
            }
        } else if (scalingConfig.type === 'sigmoid') {
            const { k } = scalingConfig.params;
            if (typeof k !== 'number' || k <= 0) {
                warnings.push('sigmoid scaling�� k�� ������� �մϴ�');
            }
        }
    }

    return { errors, warnings };
}

/**
 * 5. colorConfig ����
 */
function validateColorConfig(colorConfig) {
    const errors = [];
    const warnings = [];

    if (!colorConfig.type) {
        errors.push('colorConfig.type�� �ʿ��մϴ�');
        return { errors, warnings };
    }

    const allowedTypes = COLOR_CONFIG_SCHEMA.type.allowedValues;
    if (!allowedTypes.includes(colorConfig.type)) {
        errors.push(`colorConfig.type�� ��ȿ���� �ʽ��ϴ�: ${colorConfig.type} (��밪: ${allowedTypes.join(', ')})`);
    }

    return { errors, warnings };
}

/**
 * 6. �߰� ���Ȼ��� ����
 */
function generateSuggestions(config, rawData) {
    const suggestions = [];

    // 3D Surface ��Ʈ ���� ���
    if (config.type === '3d_surface_scatter' && rawData && rawData.length > 50) {
        suggestions.push('3D Surface ��Ʈ�� ������ ���� 16�� �����ͷ� �ڵ� ���ѵ˴ϴ�');
    }

    // ��뷮 ������ ���
    if (rawData && rawData.length > 5000) {
        suggestions.push('��뷮 �������Դϴ�. ������ ������ ���ϵ� �� �ֽ��ϴ�');
    }

    // scalingConfig �⺻�� ����
    if (!config.scalingConfig) {
        suggestions.push('scalingConfig�� �������� �ʾ� �⺻���� ����մϴ�');
    }

    // colorConfig �⺻�� ����
    if (!config.colorConfig) {
        suggestions.push('colorConfig�� �������� �ʾ� �⺻���� ����մϴ�');
    }

    return suggestions;
}