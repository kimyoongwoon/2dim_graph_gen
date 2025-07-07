// ============================================================================
// shared/session_storage_manager/index.js
// ============================================================================

import saveRawDataToSessionStorage from './save_raw_data_to_session_storage.js';
import loadRawDataFromSessionStorage from './load_raw_data_from_session_storage.js';
import clearSessionStorageData, {
    clearSpecificKey,
    clearChartDataOnly,
    clearAllSessionStorage
} from './clear_session_storage_data.js';

// ���� �Լ����� named export
export { saveRawDataToSessionStorage, loadRawDataFromSessionStorage, clearSessionStorageData, clearSpecificKey, clearChartDataOnly, clearAllSessionStorage };

// sessionStorageManager ��ü�� ��� export (���� import ��� ȣȯ)
export const sessionStorageManager = {
    saveRawDataToSessionStorage,
    loadRawDataFromSessionStorage,
    clearSessionStorageData,
    clearSpecificKey,
    clearChartDataOnly,
    clearAllSessionStorage
};