/**
 * Services 索引文件
 * 统一导出所有服务模块
 */

// ==================== System Service ====================
export * from './auth';
export * from './profile';
export * from './userManagement';

// ==================== Agent Service ====================
export * from './agent/agentService';

// ==================== Service Clients ====================
export {
    systemServiceClient,
    agentServiceClient,
    metadataServiceClient,
    dataServiceClient,
    createServiceClient,
    createServiceJsonClient,
    batchRequest,
} from '../utils/serviceClient';

// ==================== API Configuration ====================
export { API_CONFIG, API_ENDPOINTS, getApiPath, getServicePath } from '../config/api';
