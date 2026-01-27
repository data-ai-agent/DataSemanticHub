/**
 * 服务客户端工具
 * 为不同的后端服务创建专用的 HTTP 客户端
 */

import { httpClient, type ErrorResponse } from './httpClient';
import { API_CONFIG } from '../config/api';

/**
 * 服务客户端配置
 */
interface ServiceClientConfig {
    baseUrl: string;
    timeout?: number;
    headers?: Record<string, string>;
}

/**
 * 创建服务专用的 HTTP 客户端
 * @param service 服务名称
 * @param customConfig 自定义配置
 * @returns HTTP 客户端函数
 * 
 * @example
 * const systemClient = createServiceClient('SYSTEM');
 * const response = await systemClient('/user/login', { method: 'POST', body: {...} });
 */
export const createServiceClient = (
    service: keyof typeof API_CONFIG.SERVICES,
    customConfig?: Partial<ServiceClientConfig>
) => {
    // httpClient 已经添加了 BASE_URL (/api/v1)，这里只需要添加服务前缀
    const servicePath = `${API_CONFIG.SERVICES[service]}`;

    return async (endpoint: string, options?: RequestInit): Promise<Response> => {
        // 确保 endpoint 以 / 开头
        const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        const fullPath = `${servicePath}${normalizedEndpoint}`;

        // 合并自定义配置
        const mergedOptions: RequestInit = {
            ...options,
            headers: {
                ...options?.headers,
                ...customConfig?.headers,
            },
        };

        // 如果配置了超时，添加 AbortSignal
        if (customConfig?.timeout) {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), customConfig.timeout);
            mergedOptions.signal = controller.signal;

            try {
                const response = await httpClient(fullPath, mergedOptions);
                clearTimeout(timeoutId);
                return response;
            } catch (error) {
                clearTimeout(timeoutId);
                throw error;
            }
        }

        return httpClient(fullPath, mergedOptions);
    };
};

/**
 * 创建带自动 JSON 解析的服务客户端
 * @param service 服务名称
 * @param customConfig 自定义配置
 * @returns 自动解析 JSON 的 HTTP 客户端
 * 
 * @example
 * const systemClient = createServiceJsonClient('SYSTEM');
 * const data = await systemClient<LoginResp>('/user/login', { method: 'POST', body: {...} });
 */
export const createServiceJsonClient = <T = any>(
    service: keyof typeof API_CONFIG.SERVICES,
    customConfig?: Partial<ServiceClientConfig>
) => {
    const client = createServiceClient(service, customConfig);

    return async (endpoint: string, options?: RequestInit): Promise<T> => {
        const response = await client(endpoint, options);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return response.json();
    };
};

/**
 * 预定义的服务客户端
 */

/**
 * System Service 客户端
 * 用于用户认证、权限管理、系统配置
 */
export const systemServiceClient = createServiceClient('SYSTEM', {
    timeout: API_CONFIG.TIMEOUT,
});

/**
 * Agent Service 客户端
 * 用于 AI Agent、问数、SQL生成
 */
export const agentServiceClient = createServiceClient('AGENT', {
    timeout: 15000, // AI 服务可能需要更长的超时时间
});

/**
 * Metadata Service 客户端（预留）
 * 用于元数据管理、数据目录
 */
export const metadataServiceClient = createServiceClient('METADATA', {
    timeout: API_CONFIG.TIMEOUT,
});

/**
 * Data Service 客户端（预留）
 * 用于数据源连接管理
 */
export const dataServiceClient = createServiceClient('DATA', {
    timeout: API_CONFIG.TIMEOUT,
});

/**
 * Data Connection Service 客户端
 * 用于数据源连接管理（独立路由，不使用 BASE_URL）
 * Nginx Route: /api/data-connection/v1/* -> http://data-connection-service:8890/api/data-connection/v1/*
 */
export const dataConnectionServiceClient = async (
    endpoint: string,
    options?: RequestInit
): Promise<Response> => {
    // 使用自定义基础路径：/api/data-connection/v1（不经过 httpClient，避免重复添加 /api/v1）
    const basePath = '/api/data-connection/v1';
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const fullPath = `${basePath}${normalizedEndpoint}`;

    // 获取存储的 token（需要复用 httpClient 的认证逻辑）
    const token = localStorage.getItem('auth_token');

    const headers = new Headers({
        'Content-Type': 'application/json',
        ...(options?.headers as Record<string, string>),
    });

    // 如果有 token，添加到 Authorization 头
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(fullPath, {
        ...options,
        headers,
    });

    return response;
};

/**
 * 批量请求工具（跨服务聚合）
 * @param requests 请求数组
 * @returns Promise 数组
 * 
 * @example
 * const [userInfo, catalog] = await batchRequest([
 *   () => systemServiceClient('/user/info'),
 *   () => metadataServiceClient('/catalogs'),
 * ]);
 */
export const batchRequest = async <T extends any[]>(
    requests: Array<() => Promise<any>>
): Promise<T> => {
    return Promise.all(requests.map(req => req())) as Promise<T>;
};

/**
 * 导出类型
 */
export type { ServiceClientConfig, ErrorResponse };
