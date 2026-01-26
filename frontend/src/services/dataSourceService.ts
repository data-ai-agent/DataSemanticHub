/**
 * 数据源管理服务
 * 与 data-connection 后端 API 集成
 */

import { dataConnectionServiceClient } from '../utils/serviceClient';

// ==================== 类型定义（基于 data-connection API）====================

/**
 * data-connection 后端模型 - 数据源配置信息
 */
export interface BinData {
    host: string;
    port: number;
    databaseName: string;
    account: string;
    password: string;
    schema?: string;
    connectProtocol?: string;
}

/**
 * data-connection 后端模型 - 数据源请求/响应体
 */
export interface DataSourceVo {
    id?: string;
    name: string;
    type: string;
    comment: string;
    binData: BinData;
    latest_task_status?: string;
    create_time?: string;
    update_time?: string;
}

/**
 * 前端模型 - 数据源
 */
export interface DataSource {
    id: string;
    name: string;
    type: string;
    host: string;
    port: number;
    dbName: string;
    status: 'connected' | 'scanning' | 'disconnected' | 'error';
    lastScan: string;
    tableCount: number;
    desc: string;
    username?: string;
    schemaName?: string;
    // Governance Fields (前端独有，不发送后端)
    system?: string;
    env?: 'prod' | 'test' | 'dev';
    owner?: string;
    scanPolicy?: {
        frequency: 'daily' | 'weekly' | 'manual';
        scopeRegex?: string;
        alertReceivers?: string[];
    };
    auth?: {
        type: 'password' | 'secret';
        secretId?: string;
    };
}

/**
 * 创建/更新数据源请求（前端模型）
 */
export interface DataSourceRequest extends Partial<DataSource> {
    password?: string;
}

/**
 * 测试连接请求
 */
export interface TestConnectionRequest {
    name: string;
    type: string;
    host: string;
    port: number;
    dbName: string;
    username?: string;
    password?: string;
    schemaName?: string;
}

/**
 * 测试连接响应
 */
export interface TestConnectionResponse {
    success: boolean;
    message: string;
    connectionTime?: number;
}

/**
 * 数据源类型配置
 */
export interface Connector {
    type: string;
    name: string;
    defaultPort: number;
    color: string;
    bgColor: string;
}

// ==================== 数据转换函数 ====================

/**
 * 前端模型 → 后端请求体
 */
export const toBackendRequest = (frontend: Partial<DataSource> & { password?: string }): DataSourceVo => {
    return {
        name: frontend.name!,
        type: frontend.type!,
        comment: frontend.desc || '',
        binData: {
            host: frontend.host!,
            port: frontend.port || 0,
            databaseName: frontend.dbName || '',
            account: frontend.username || '',
            password: frontend.password || '',
            schema: frontend.schemaName || '',
            connectProtocol: 'jdbc', // 默认协议
        }
    };
};

/**
 * 后端响应 → 前端模型
 */
export const fromBackendResponse = (backend: any): DataSource => {
    const binData = backend.bin_data || {};

    return {
        id: backend.id,
        name: backend.name,
        type: formatDataSourceType(backend.type),
        host: binData.host || '',
        port: binData.port || 0,
        dbName: binData.database_name || '',
        username: binData.account || '',
        schemaName: binData.schema || '',
        desc: backend.comment || '',
        status: mapStatus(backend.latest_task_status),
        // 治理字段 - 使用 mock 默认值
        system: '政务服务平台',
        env: 'prod',
        owner: '张三 (Data Owner)',
        scanPolicy: { frequency: 'manual', scopeRegex: '.*', alertReceivers: [] },
        auth: { type: 'password' },
        lastScan: 'Never',
        tableCount: 0,
    };
};

/**
 * 格式化数据源类型（小写转大写）
 */
const formatDataSourceType = (type: string): string => {
    const typeMapping: Record<string, string> = {
        'mysql': 'MySQL',
        'oracle': 'Oracle',
        'postgresql': 'PostgreSQL',
        'sqlserver': 'SQL Server',
        'redis': 'Redis',
        'mongodb': 'MongoDB',
        'clickhouse': 'ClickHouse',
        'starrocks': 'StarRocks',
        'hive': 'Hive',
        'elasticsearch': 'Elasticsearch',
        'kafka': 'Kafka',
    };
    return typeMapping[type?.toLowerCase()] || type;
};

/**
 * 状态映射
 */
const mapStatus = (status?: string): DataSource['status'] => {
    if (!status) return 'disconnected';

    const statusMapping: Record<string, DataSource['status']> = {
        'success': 'connected',
        'running': 'scanning',
        'failed': 'error',
        'idle': 'disconnected',
        'pending': 'scanning',
    };

    return statusMapping[status.toLowerCase()] || 'disconnected';
};

// ==================== API 端点定义 ====================

const DATASOURCE_ENDPOINTS = {
    DATASOURCES: '/datasource',
    DATASOURCE_DETAIL: (id: string) => `/datasource/${id}`,
    TEST_CONNECTION: '/datasource/test',
    CONNECTORS: '/datasource/connectors',
};

// ==================== 错误处理 ====================

/**
 * 解析数据源错误响应
 */
const parseDataSourceError = async (response: Response): Promise<Error> => {
    const data = await response.json().catch(() => ({}));

    // 尝试解析增强格式
    if (data.description) {
        return Object.assign(new Error(data.description), {
            title: '操作失败',
            message: data.description,
            solution: data.solution,
            cause: data.cause,
            code: data.code,
            httpStatus: response.status,
        });
    }

    // 尝试解析简单格式
    if (data.msg) {
        return Object.assign(new Error(data.msg), {
            title: '操作失败',
            message: data.msg,
            code: data.code,
            httpStatus: response.status,
        });
    }

    // 默认错误
    return Object.assign(new Error('请求失败'), {
        title: '操作失败',
        message: `服务器返回 ${response.status}`,
        httpStatus: response.status,
    });
};

// ==================== Data Source Service ====================

export const dataSourceService = {
    /**
     * 查询数据源列表
     */
    async getDataSources(): Promise<DataSource[]> {
        try {
            const response = await dataConnectionServiceClient(DATASOURCE_ENDPOINTS.DATASOURCES, {
                method: 'GET',
            });

            if (!response.ok) {
                throw await parseDataSourceError(response);
            }

            const result = await response.json();

            // 检查业务状态码
            if (result.code && result.code !== 0 && result.code !== 200) {
                const errorMsg = result.msg || result.description || '获取数据源列表失败';
                throw new Error(errorMsg);
            }

            const data = result.data || result.items || result;
            const list = Array.isArray(data) ? data : [];

            return list.map(fromBackendResponse);
        } catch (error) {
            console.error('Failed to fetch data sources:', error);
            // 开发环境返回空列表，避免页面崩溃
            if (import.meta.env.DEV) {
                return [];
            }
            throw error;
        }
    },

    /**
     * 查询数据源详情
     */
    async getDataSource(id: string): Promise<DataSource> {
        try {
            const response = await dataConnectionServiceClient(DATASOURCE_ENDPOINTS.DATASOURCE_DETAIL(id), {
                method: 'GET',
            });

            if (!response.ok) {
                throw await parseDataSourceError(response);
            }

            const result = await response.json();

            // 检查业务状态码
            if (result.code && result.code !== 0 && result.code !== 200) {
                const errorMsg = result.msg || result.description || '获取数据源详情失败';
                throw new Error(errorMsg);
            }

            return fromBackendResponse(result.data || result);
        } catch (error) {
            console.error('Failed to fetch data source:', error);
            throw error;
        }
    },

    /**
     * 创建数据源
     */
    async createDataSource(data: DataSourceRequest): Promise<DataSource> {
        try {
            const response = await dataConnectionServiceClient(DATASOURCE_ENDPOINTS.DATASOURCES, {
                method: 'POST',
                body: JSON.stringify(toBackendRequest(data)),
            });

            if (!response.ok) {
                throw await parseDataSourceError(response);
            }

            const result = await response.json();

            // 检查业务状态码
            if (result.code && result.code !== 0 && result.code !== 200) {
                const errorMsg = result.msg || result.description || '创建数据源失败';
                throw new Error(errorMsg);
            }

            return fromBackendResponse(result.data || result);
        } catch (error) {
            console.error('Failed to create data source:', error);
            throw error;
        }
    },

    /**
     * 更新数据源
     */
    async updateDataSource(id: string, data: Partial<DataSourceRequest>): Promise<DataSource> {
        try {
            const response = await dataConnectionServiceClient(DATASOURCE_ENDPOINTS.DATASOURCE_DETAIL(id), {
                method: 'PUT',
                body: JSON.stringify(toBackendRequest(data)),
            });

            if (!response.ok) {
                throw await parseDataSourceError(response);
            }

            const result = await response.json();

            // 检查业务状态码
            if (result.code && result.code !== 0 && result.code !== 200) {
                const errorMsg = result.msg || result.description || '更新数据源失败';
                throw new Error(errorMsg);
            }

            return fromBackendResponse(result.data || result);
        } catch (error) {
            console.error('Failed to update data source:', error);
            throw error;
        }
    },

    /**
     * 删除数据源
     */
    async deleteDataSource(id: string): Promise<void> {
        try {
            const response = await dataConnectionServiceClient(DATASOURCE_ENDPOINTS.DATASOURCE_DETAIL(id), {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw await parseDataSourceError(response);
            }

            const result = await response.json();

            // 检查业务状态码
            if (result.code && result.code !== 0 && result.code !== 200) {
                const errorMsg = result.msg || result.description || '删除数据源失败';
                throw new Error(errorMsg);
            }
        } catch (error) {
            console.error('Failed to delete data source:', error);
            throw error;
        }
    },

    /**
     * 测试连接
     */
    async testConnection(data: TestConnectionRequest): Promise<TestConnectionResponse> {
        try {
            const response = await dataConnectionServiceClient(DATASOURCE_ENDPOINTS.TEST_CONNECTION, {
                method: 'POST',
                body: JSON.stringify(toBackendRequest(data)),
            });

            if (!response.ok) {
                throw await parseDataSourceError(response);
            }

            const result = await response.json();

            // 检查业务状态码
            if (result.code && result.code !== 0 && result.code !== 200) {
                return {
                    success: false,
                    message: result.msg || result.description || '连接测试失败',
                };
            }

            return {
                success: true,
                message: result.message || '连接成功',
                connectionTime: result.connectionTime,
            };
        } catch (error) {
            console.error('Failed to test connection:', error);
            return {
                success: false,
                message: (error as Error).message || '连接测试失败',
            };
        }
    },

    /**
     * 获取支持的数据源类型
     */
    async getConnectors(): Promise<Connector[]> {
        try {
            const response = await dataConnectionServiceClient(DATASOURCE_ENDPOINTS.CONNECTORS, {
                method: 'GET',
            });

            if (!response.ok) {
                throw await parseDataSourceError(response);
            }

            const result = await response.json();

            // 检查业务状态码
            if (result.code && result.code !== 0 && result.code !== 200) {
                const errorMsg = result.msg || result.description || '获取数据源类型失败';
                throw new Error(errorMsg);
            }

            const data = result.data || result.items || result;
            const list = Array.isArray(data) ? data : [];

            // 格式化返回的连接器类型
            const typeConfigs: Record<string, { color: string; bgColor: string; defaultPort: number }> = {
                MySQL: { color: 'text-blue-700', bgColor: 'bg-blue-100', defaultPort: 3306 },
                Oracle: { color: 'text-orange-700', bgColor: 'bg-orange-100', defaultPort: 1521 },
                PostgreSQL: { color: 'text-emerald-700', bgColor: 'bg-emerald-100', defaultPort: 5432 },
                'SQL Server': { color: 'text-purple-700', bgColor: 'bg-purple-100', defaultPort: 1433 },
                Redis: { color: 'text-red-700', bgColor: 'bg-red-100', defaultPort: 6379 },
                MongoDB: { color: 'text-green-700', bgColor: 'bg-green-100', defaultPort: 27017 },
                ClickHouse: { color: 'text-yellow-700', bgColor: 'bg-yellow-100', defaultPort: 8123 },
                StarRocks: { color: 'text-blue-700', bgColor: 'bg-blue-100', defaultPort: 9030 },
                Hive: { color: 'text-amber-700', bgColor: 'bg-amber-100', defaultPort: 10000 },
                Elasticsearch: { color: 'text-pink-700', bgColor: 'bg-pink-100', defaultPort: 9200 },
                Kafka: { color: 'text-slate-700', bgColor: 'bg-slate-100', defaultPort: 9092 },
            };

            // 返回默认连接器列表（如果后端未提供）
            if (list.length === 0) {
                return Object.keys(typeConfigs).map(type => ({
                    type,
                    name: type,
                    defaultPort: typeConfigs[type].defaultPort,
                    color: typeConfigs[type].color,
                    bgColor: typeConfigs[type].bgColor,
                }));
            }

            return list.map((item: any) => ({
                type: formatDataSourceType(item.type || item.name),
                name: formatDataSourceType(item.type || item.name),
                defaultPort: item.defaultPort || typeConfigs[formatDataSourceType(item.type || item.name)]?.defaultPort || 3306,
                color: typeConfigs[formatDataSourceType(item.type || item.name)]?.color || 'text-slate-700',
                bgColor: typeConfigs[formatDataSourceType(item.type || item.name)]?.bgColor || 'bg-slate-100',
            }));
        } catch (error) {
            console.error('Failed to fetch connectors:', error);
            // 开发环境返回默认连接器列表
            if (import.meta.env.DEV) {
                const typeConfigs: Record<string, { color: string; bgColor: string; defaultPort: number }> = {
                    MySQL: { color: 'text-blue-700', bgColor: 'bg-blue-100', defaultPort: 3306 },
                    Oracle: { color: 'text-orange-700', bgColor: 'bg-orange-100', defaultPort: 1521 },
                    PostgreSQL: { color: 'text-emerald-700', bgColor: 'bg-emerald-100', defaultPort: 5432 },
                    'SQL Server': { color: 'text-purple-700', bgColor: 'bg-purple-100', defaultPort: 1433 },
                    Redis: { color: 'text-red-700', bgColor: 'bg-red-100', defaultPort: 6379 },
                    MongoDB: { color: 'text-green-700', bgColor: 'bg-green-100', defaultPort: 27017 },
                    ClickHouse: { color: 'text-yellow-700', bgColor: 'bg-yellow-100', defaultPort: 8123 },
                    StarRocks: { color: 'text-blue-700', bgColor: 'bg-blue-100', defaultPort: 9030 },
                    Hive: { color: 'text-amber-700', bgColor: 'bg-amber-100', defaultPort: 10000 },
                    Elasticsearch: { color: 'text-pink-700', bgColor: 'bg-pink-100', defaultPort: 9200 },
                    Kafka: { color: 'text-slate-700', bgColor: 'bg-slate-100', defaultPort: 9092 },
                };
                return Object.keys(typeConfigs).map(type => ({
                    type,
                    name: type,
                    defaultPort: typeConfigs[type].defaultPort,
                    color: typeConfigs[type].color,
                    bgColor: typeConfigs[type].bgColor,
                }));
            }
            throw error;
        }
    },
};
