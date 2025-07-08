// shared/session_storage_manager/index.js
import saveRawDataToSessionStorage from './save_raw_data_to_session_storage.js';
import loadRawDataFromSessionStorage from './load_raw_data_from_session_storage.js';
import { 
    saveChartConfig, 
    loadChartConfig, 
    clearAllChartData, 
    clearSpecificStorage, 
    getStorageInfo 
} from './config_storage.js';

export const sessionStorageManager = {
    saveRawDataToSessionStorage,
    loadRawDataFromSessionStorage,
    saveChartConfig,
    loadChartConfig,
    clearAllChartData,
    clearSpecificStorage,
    getStorageInfo
};