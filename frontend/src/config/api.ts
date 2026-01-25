/**
 * API 配置中心
 * 定义所有后端服务的路由规则
 */

/**
 * API 基础配置
 */
export const API_CONFIG = {
    // API 基础路径（通过 Nginx API Gateway）
    BASE_URL: '/api/v1',

    // 请求超时时间
    TIMEOUT: 10000,

    // 服务路由前缀（对应 Nginx 配置）
    SERVICES: {
        /**
         * System Service - 用户认证、权限管理、系统配置
         * Nginx Route: /api/v1/system/* -> http://system-service:8888/api/v1/*
         */
        SYSTEM: '/system',

        /**
         * Agent Service - AI Agent、问数、SQL生成
         * Nginx Route: /api/v1/agent/* -> http://agent-service:8891/api/v1/*
         */
        AGENT: '/agent',

        /**
         * Metadata Service - 元数据管理、数据目录（预留）
         * Nginx Route: /api/v1/metadata/* -> http://metadata-service:8889/api/v1/*
         */
        METADATA: '/metadata',

        /**
         * Data Connection Service - 数据源连接管理（预留）
         * Nginx Route: /api/v1/data/* -> http://data-connection:8890/api/v1/*
         */
        DATA: '/data',
    },

    // 向后兼容的旧路由（逐步废弃）
    LEGACY: {
        API: '/api',
        AI: '/ai',
    },
} as const;

/**
 * 环境变量配置
 */
export const ENV_CONFIG = {
    // 开发环境
    isDevelopment: import.meta.env.DEV,

    // 生产环境
    isProduction: import.meta.env.PROD,

    // 当前环境
    mode: import.meta.env.MODE,

    // 自定义 API Base URL（可覆盖默认值）
    customApiBaseUrl: import.meta.env.VITE_API_BASE_URL,
} as const;

/**
 * 获取完整的服务路由路径
 * @param service 服务名称
 * @returns 完整的服务路由路径
 */
export const getServicePath = (service: keyof typeof API_CONFIG.SERVICES): string => {
    return `${API_CONFIG.BASE_URL}${API_CONFIG.SERVICES[service]}`;
};

/**
 * 获取完整的 API 端点路径
 * @param service 服务名称
 * @param endpoint 端点路径（以 / 开头）
 * @returns 完整的 API 路径
 * @example
 * getApiPath('SYSTEM', '/user/login') => '/api/v1/system/user/login'
 */
export const getApiPath = (
    service: keyof typeof API_CONFIG.SERVICES,
    endpoint: string
): string => {
    return `${getServicePath(service)}${endpoint}`;
};

/**
 * API 端点映射（便于管理）
 */
export const API_ENDPOINTS = {
    // System Service 端点
    SYSTEM: {
        // 认证相关
        LOGIN: getApiPath('SYSTEM', '/user/login'),
        REGISTER: getApiPath('SYSTEM', '/user/register'),
        LOGOUT: getApiPath('SYSTEM', '/user/logout'),
        USER_INFO: getApiPath('SYSTEM', '/user/info'),

        // 用户管理
        USERS_LIST: getApiPath('SYSTEM', '/users'),
        USER_DETAIL: (id: string) => getApiPath('SYSTEM', `/users/${id}`),

        // SSO
        SSO_LOGIN: getApiPath('SYSTEM', '/sso/login'),
        FORGOT_PASSWORD: getApiPath('SYSTEM', '/user/forgot-password'),

        // 菜单管理
        MENUS_LIST: getApiPath('SYSTEM', '/menus'),
        MENU_CREATE: getApiPath('SYSTEM', '/menus'),
        MENU_DETAIL: (id: string) => getApiPath('SYSTEM', `/menus/${id}`),
        MENU_REORDER: getApiPath('SYSTEM', '/menus/reorder'),
        MENU_PERMISSIONS: getApiPath('SYSTEM', '/permissions'), // 获取权限列表
    },

    // Agent Service 端点
    AGENT: {
        CHAT: getApiPath('AGENT', '/chat'),
        TRAIN: getApiPath('AGENT', '/train'),
        SQL_GENERATE: getApiPath('AGENT', '/sql/generate'),
        SQL_EXPLAIN: getApiPath('AGENT', '/sql/explain'),
    },

    // Metadata Service 端点（预留）
    METADATA: {
        CATALOGS: getApiPath('METADATA', '/catalogs'),
        TABLES: getApiPath('METADATA', '/tables'),
        COLUMNS: getApiPath('METADATA', '/columns'),
    },

    // Data Service 端点（预留）
    DATA: {
        CONNECTIONS: getApiPath('DATA', '/connections'),
        CONNECTION_TEST: getApiPath('DATA', '/connections/test'),
    },
} as const;
