// sources/shared/session_storage_manager/index.js
import saveRawDataToSessionStorage from './save_raw_data_to_session_storage.js';
import loadRawDataFromSessionStorage from './load_raw_data_from_session_storage.js';
import { hasRawData } from './raw_data_checker.js';  // 새로 추가
import { 
    saveChartConfig, 
    loadChartConfig, 
    clearAllChartData, 
    clearSpecificStorage, 
    getStorageInfo,
    hasChartConfig     // 추가
} from './config_storage.js';

export const sessionStorageManager = {
    // Raw Data 관련
    saveRawDataToSessionStorage,
    loadRawDataFromSessionStorage,
    hasRawData,        // 추가
    
    // Config 관련
    saveChartConfig,
    loadChartConfig,
    hasChartConfig,    // 추가
    
    // 기타
    clearAllChartData,
    clearSpecificStorage,
    getStorageInfo
};