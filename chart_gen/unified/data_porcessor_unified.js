// ============================================================================
// chart_gen/unified/data_processor_unified.js - ������ ������ ��ȯ �Լ�
// ============================================================================

import { validateDataIntegrity, validateAxisAssignment } from '../data_validate.js';
import { analyzeFieldTypes } from '../data_processor.js';

/**
 * ���� �����͸� ��Ʈ������ ��ȯ�ϴ� ������ �Լ�
 * @param {Array} rawData - ���� ������ �迭 [{field1: val1, field2: val2}, ...]
 * @param {Object} dataMapping - ������ ���� {x: 'field1', y: 'field2', size: 'field3', color: 'field4'}
 * @returns {Object} ��ȯ�� �����Ϳ� ��Ÿ����
 */
export function processDataForChart(rawData, dataMapping) {
    console.log('[DATA_PROCESSOR_UNIFIED] ������ ��ȯ ����');
    console.log('[DATA_PROCESSOR_UNIFIED] ���� ������:', rawData?.length, '��');
    console.log('[DATA_PROCESSOR_UNIFIED] ����:', dataMapping);

    // �Է� ����
    if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
        throw new Error('��ȿ�� �����Ͱ� �����ϴ�');
    }

    if (!dataMapping || typeof dataMapping !== 'object') {
        throw new Error('������ ������ �ʿ��մϴ�');
    }

    // �ʵ� Ÿ�� �м�
    const fieldTypes = analyzeFieldTypes(rawData);
    console.log('[DATA_PROCESSOR_UNIFIED] �ʵ� Ÿ��:', fieldTypes);

    // ���� �ʵ� ���� ���� Ȯ��
    const availableFields = Object.keys(fieldTypes);
    const mappedFields = Object.values(dataMapping).filter(field => field);
    const missingFields = mappedFields.filter(field => !availableFields.includes(field));
    
    if (missingFields.length > 0) {
        throw new Error(`���ε� �ʵ尡 �����Ϳ� �����ϴ�: ${missingFields.join(', ')}`);
    }

    // �� Ÿ�� ���� (���� �Լ� ����)
    const axisMapping = {
        x: dataMapping.x,
        y: dataMapping.y,
        z: dataMapping.size || dataMapping.color,
        w: (dataMapping.size && dataMapping.color) ? dataMapping.color : undefined
    };

    const axisValidation = validateAxisAssignment(axisMapping, fieldTypes);
    if (!axisValidation.isValid) {
        throw new Error(`�� ���� ����: ${axisValidation.errors.join('; ')}`);
    }

    // ������ ���Ἲ ���� (���� �Լ� ����)
    const firstMappedField = Object.values(dataMapping)[0];
    const dataValidation = validateDataIntegrity(rawData, axisMapping, firstMappedField);
    if (!dataValidation.isValid) {
        throw new Error(`������ ���Ἲ ����: ${dataValidation.error}`);
    }

    // �� ���� ����
    const axes = [];
    const axisOrder = ['x', 'y', 'size', 'color'];
    
    axisOrder.forEach(axisType => {
        const fieldName = dataMapping[axisType];
        if (fieldName) {
            axes.push({
                name: fieldName,
                type: fieldTypes[fieldName] || 'double',
                allow_dup: calculateAllowDuplicates(rawData, fieldName)
            });
        }
    });

    // ��Ÿ������ ����
    const metadata = {
        dim: axes.length,
        axes: axes,
        dataMapping: dataMapping,
        fieldTypes: fieldTypes,
        recordCount: rawData.length
    };

    // ��Ʈ�� ������ ��ȯ
    const chartData = rawData.map((row, index) => {
        const dataPoint = {
            _originalIndex: index,
            _fullData: `Point ${index}: ${JSON.stringify(row)}`
        };

        // ���ε� �ʵ���� �� �̸����� ����
        Object.entries(dataMapping).forEach(([axisType, fieldName]) => {
            if (fieldName && row[fieldName] !== undefined) {
                dataPoint[fieldName] = row[fieldName];
            }
        });

        return dataPoint;
    });

    const result = {
        data: chartData,
        metadata: metadata,
        originalData: rawData
    };

    console.log('[DATA_PROCESSOR_UNIFIED] ��ȯ �Ϸ�:', chartData.length, '�� ����Ʈ');
    return result;
}

/**
 * �ߺ��� ���� ���� ��� (���� �Լ����� ����)
 */
function calculateAllowDuplicates(data, fieldName) {
    if (!data || data.length === 0) return false;
    
    const values = data.map(item => item[fieldName]);
    const uniqueValues = [...new Set(values)];
    return uniqueValues.length < values.length;
}