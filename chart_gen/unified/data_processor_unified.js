// ============================================================================
// chart_gen/unified/data_processor_unified.js - ������ ������ ��ȯ �Լ�
// ============================================================================

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

    // ���� �ʵ� ���� ���� Ȯ�� (��ȭ�� �����)
    const availableFields = Object.keys(fieldTypes);
    console.log('[DATA_PROCESSOR_UNIFIED] === ���� ���� ���� ===');
    console.log('[DATA_PROCESSOR_UNIFIED] dataMapping ��ü:', dataMapping);
    console.log('[DATA_PROCESSOR_UNIFIED] Object.keys(dataMapping):', Object.keys(dataMapping));
    console.log('[DATA_PROCESSOR_UNIFIED] Object.values(dataMapping):', Object.values(dataMapping));

    const rawMappedFields = Object.values(dataMapping);
    console.log('[DATA_PROCESSOR_UNIFIED] rawMappedFields:', rawMappedFields);

    rawMappedFields.forEach((field, index) => {
        console.log(`[DATA_PROCESSOR_UNIFIED] ���� ���ΰ� ${index}:`, {
            value: field,
            type: typeof field,
            length: field?.length,
            isEmpty: !field || (typeof field === 'string' && field.trim() === '')
        });
    });

    const mappedFields = Object.values(dataMapping).filter(field => {
        const isValid = field && typeof field === 'string' && field.trim() !== '';
        console.log(`[DATA_PROCESSOR_UNIFIED] �ʵ� ����:`, {
            field: field,
            isValid: isValid
        });
        return isValid;
    });

    console.log('[DATA_PROCESSOR_UNIFIED] ���͸��� mappedFields:', mappedFields);
    console.log('[DATA_PROCESSOR_UNIFIED] ��� ������ �ʵ��:', availableFields);

    const missingFields = mappedFields.filter(field => {
        const exists = availableFields.includes(field);
        console.log(`[DATA_PROCESSOR_UNIFIED] �ʵ� ���� Ȯ��: "${field}" �� ${exists}`);
        return !exists;
    });

    console.log('[DATA_PROCESSOR_UNIFIED] missingFields:', missingFields);
    console.log('[DATA_PROCESSOR_UNIFIED] missingFields.join(", "):', missingFields.join(', '));

    if (missingFields.length > 0) {
        throw new Error(`���ε� �ʵ尡 �����Ϳ� �����ϴ�: ${missingFields.join(', ')}`);
    }

    if (mappedFields.length === 0) {
        throw new Error('��ȿ�� ���� �ʵ尡 �����ϴ�');
    }

    console.log('[DATA_PROCESSOR_UNIFIED] === ���� ���� �Ϸ� ===');

    // ������ ������ ���� (������ �� ������ ��ŵ)
    console.log('[DATA_PROCESSOR_UNIFIED] �⺻ ���� �Ϸ�');

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