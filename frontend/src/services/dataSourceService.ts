/**
 * 数据源管理服务
 * 与 data-connection 后端 API 集成
 */

import { dataConnectionServiceClient } from '../utils/serviceClient';
import { encryptRSA } from '../utils/rsaUtil';

// ==================== 类型定义（基于 data-connection API）====================

/**
 * data-connection 后端模型 - 数据源配置信息
 */
export interface BinData {
    host: string;
    port: number;
    database_name: string;
    account: string;
    password: string;
    schema?: string;
    connect_protocol?: string;
}

/**
 * data-connection 后端模型 - 数据源请求/响应体
 */
export interface DataSourceVo {
    id?: string;
    name: string;
    type: string;
    comment: string;
    bin_data: BinData;
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
    password?: string;
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

/**
 * 数据源统计信息（后端返回）
 */
export interface DataSourceStatisticsVo {
    data_source_id?: string;
    data_source_name?: string;
    dataSourceId?: string;
    dataSourceName?: string;
    table_count?: number;
    tableCount?: number;
    field_count?: number;
    fieldCount?: number;
    scanned_table_count?: number;
    scannedTableCount?: number;
    scanning_table_count?: number;
    scanningTableCount?: number;
    unscanned_table_count?: number;
    unscannedTableCount?: number;
    // 存储统计
    total_rows?: number;
    totalRows?: number;
    total_data_size?: number;
    totalDataSize?: number;
    total_data_size_formatted?: string;
    totalDataSizeFormatted?: string;
    total_index_size?: number;
    totalIndexSize?: number;
    total_index_size_formatted?: string;
    totalIndexSizeFormatted?: string;
    total_size?: number;
    totalSize?: number;
    total_size_formatted?: string;
    totalSizeFormatted?: string;
    // 质量统计
    tables_with_comment?: number;
    tablesWithComment?: number;
    fields_with_comment?: number;
    fieldsWithComment?: number;
    tables_with_primary_key?: number;
    tablesWithPrimaryKey?: number;
    tables_with_index?: number;
    tablesWithIndex?: number;
    total_index_count?: number;
    totalIndexCount?: number;

    // 字段级别统计汇总
    avg_null_ratio?: number;
    avgNullRatio?: number;
    max_null_ratio?: number;
    maxNullRatio?: number;
    high_null_ratio_field_count?: number;
    highNullRatioFieldCount?: number;
    avg_unique_ratio?: number;
    avgUniqueRatio?: number;
    unique_field_count?: number;
    uniqueFieldCount?: number;
    fields_with_distribution_count?: number;
    fieldsWithDistributionCount?: number;
    analyzed_field_count?: number;
    analyzedFieldCount?: number;
}

/**
 * 后端返回的连接器数据结构
 */
interface BackendConnector {
    type: string;
    olk_connector_name: string;
    show_connector_name: string;
    connect_protocol: string;
}

// ==================== 类型映射缓存 ====================

// 前端显示名 -> 后端类型名
let displayToBackendMap: Record<string, string> = {};

// 后端类型名 -> 前端显示名
let backendToDisplayMap: Record<string, string> = {};

// 缓存的连接器列表
let cachedConnectors: Connector[] = [];

/**
 * 默认颜色配置
 */
const defaultTypeConfigs: Record<string, { color: string; bgColor: string; defaultPort: number }> = {
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

/**
 * 将前端显示类型转换为后端 API 需求的类型
 */
const toBackendType = (frontendType: string): string => {
    if (!frontendType) {
        console.warn('[DataSource] toBackendType: frontendType is empty, returning "mysql" as default');
        return 'mysql';
    }
    return displayToBackendMap[frontendType] || frontendType.toLowerCase();
};

/**
 * 前端模型 → 后端请求体
 * 注意：密码会自动使用RSA加密
 */
export const toBackendRequest = (frontend: Partial<DataSource> & { password?: string }): DataSourceVo => {
    console.log('[DataSource] toBackendRequest - 输入数据:', {
        name: frontend.name,
        type: frontend.type,
        displayName: frontend.type
    });

    // 对密码进行RSA加密
    const encryptedPassword = frontend.password
        ? encryptRSA(frontend.password)
        : '';

    if (frontend.password && frontend.password !== encryptedPassword) {
        console.log('[DataSource] 密码已加密');
    }

    const backendType = toBackendType(frontend.type!);
    console.log('[DataSource] toBackendRequest - 类型转换:', {
        frontendType: frontend.type,
        displayToBackendMap,
        backendType
    });

    const result = {
        name: frontend.name!,
        type: backendType,
        comment: frontend.desc || '',
        bin_data: {
            host: frontend.host!,
            port: frontend.port || 0,
            database_name: frontend.dbName || '',
            account: frontend.username || '',
            password: encryptedPassword,  // 使用加密后的密码
            schema: frontend.schemaName || '',
            connect_protocol: 'jdbc', // 默认协议
        }
    };

    console.log('[DataSource] toBackendRequest - 最终请求数据:', JSON.stringify(result, null, 2));

    return result;
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
        password: binData.password,  // 添加密码字段
        schemaName: binData.schema || '',
        desc: backend.comment || backend.desc || '',
        status: mapStatus(backend.latest_task_status),
        // 治理字段 - 使用 mock 默认值
        system: backend.system || '政务服务平台',
        env: backend.env || 'prod',
        owner: backend.owner || '张三 (Data Owner)',
        scanPolicy: { frequency: 'manual', scopeRegex: '.*', alertReceivers: [] },
        auth: { type: 'password' },
        lastScan: backend.last_scan_time || (backend.updated_at ? new Date(backend.updated_at).toLocaleDateString() : 'Never'),
        tableCount: backend.table_count || backend.total_tables || 0,
    };
};

/**
 * 格式化数据源类型（后端类型名 -> 前端显示名）
 */
const formatDataSourceType = (type: string): string => {
    if (!type) {
        console.warn('[DataSource] formatDataSourceType: type is empty, returning "Unknown"');
        return 'Unknown';
    }

    // 首先尝试直接匹配
    if (backendToDisplayMap[type]) {
        return backendToDisplayMap[type];
    }

    // 尝试忽略大小写的匹配
    const lowerType = type.toLowerCase();
    for (const [backendType, displayName] of Object.entries(backendToDisplayMap)) {
        if (backendType.toLowerCase() === lowerType) {
            return displayName;
        }
    }

    // 如果找不到匹配项，尝试常见类型的映射
    const commonMappings: Record<string, string> = {
        'mysql': 'MySQL',
        'postgresql': 'PostgreSQL',
        'sqlserver': 'SQL Server',
        'mssql': 'SQL Server',
        'oracle': 'Oracle',
        'mongodb': 'MongoDB',
        'redis': 'Redis',
        'elasticsearch': 'Elasticsearch',
        'clickhouse': 'ClickHouse',
        'starrocks': 'StarRocks',
        'hive': 'Hive',
        'kafka': 'Kafka'
    };

    return commonMappings[lowerType] || type;
};

/**
 * 解析后端连接器数据并更新映射缓存
 */
const parseBackendConnectors = (backendConnectors: BackendConnector[]): Connector[] => {
    console.log('[DataSource] 开始解析连接器数据:', backendConnectors);

    // 清空缓存
    displayToBackendMap = {};
    backendToDisplayMap = {};
    const connectors: Connector[] = [];

    backendConnectors.forEach((item: any) => {
        console.log('[DataSource] 处理连接器项:', item);

        // 尝试多个可能的字段名
        const displayName = item.show_connector_name || item.connectorName || item.name || item.type || 'Unknown';
        const backendName = item.olk_connector_name || item.connectorType || item.type || displayName;

        console.log(`[DataSource] 映射: ${displayName} -> ${backendName}`);

        // 建立映射关系
        displayToBackendMap[displayName] = backendName;
        backendToDisplayMap[backendName] = displayName;

        // 获取默认配置
        const config = defaultTypeConfigs[displayName] || {
            color: 'text-slate-700',
            bgColor: 'bg-slate-100',
            defaultPort: 3306,
        };

        connectors.push({
            type: displayName,
            name: displayName,
            defaultPort: config.defaultPort,
            color: config.color,
            bgColor: config.bgColor,
        });
    });

    console.log('[DataSource] 解析完成，映射表:', {
        displayToBackendMap,
        backendToDisplayMap,
        connectors
    });

    return connectors;
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
        'unscanned': 'disconnected',  // 新增：未扫描状态视为断开连接
        'scanning': 'scanning',      // 新增：扫描中状态
    };

    return statusMapping[status.toLowerCase()] || 'disconnected';
};

// ==================== API 端点定义 ====================

const DATASOURCE_ENDPOINTS = {
    DATASOURCES: '/datasource',
    DATASOURCE_DETAIL: (id: string) => `/datasource/${id}`,
    DATASOURCE_STATISTICS: (id: string) => `/datasource/${id}/statistics`,
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

            // 尝试从多种可能的数据结构中提取数据源列表
            const data = result.data || result.items || result.entries || result;
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
        console.log('getConnectors: 开始调用接口', DATASOURCE_ENDPOINTS.CONNECTORS);
        try {
            const response = await dataConnectionServiceClient(DATASOURCE_ENDPOINTS.CONNECTORS, {
                method: 'GET',
            });
            console.log('getConnectors: 接口响应', response.status, response.statusText);

            if (!response.ok) {
                throw await parseDataSourceError(response);
            }

            const result = await response.json();
            console.log('getConnectors: 解析后的 JSON', result);

            // 检查业务状态码
            if (result.code && result.code !== 0 && result.code !== 200) {
                const errorMsg = result.msg || result.description || '获取数据源类型失败';
                console.error('getConnectors: 业务错误', errorMsg);
                throw new Error(errorMsg);
            }

            // 后端返回的数据结构是 {code: 0, connectors: [...]}
            // 需要先检查 connectors 字段，如果不存在再尝试其他字段
            const data = result.connectors || result.data || result.items || [];
            const list = Array.isArray(data) ? data : [];
            console.log('getConnectors: 连接器列表', list);

            // 解析后端连接器数据并更新映射缓存
            const connectors = parseBackendConnectors(list);
            cachedConnectors = connectors;

            console.log('getConnectors: 解析后的连接器', connectors);

            return connectors;
        } catch (error) {
            console.error('Failed to fetch connectors:', error);
            throw error;
        }
    },

    /**
     * 获取数据源统计信息
     */
    async getDataSourceStatistics(id: string): Promise<DataSourceStatisticsVo> {
        try {
            const response = await dataConnectionServiceClient(DATASOURCE_ENDPOINTS.DATASOURCE_STATISTICS(id), {
                method: 'GET',
            });

            if (!response.ok) {
                throw await parseDataSourceError(response);
            }

            const result = await response.json();

            // 检查业务状态码
            if (result.code && result.code !== 0 && result.code !== 200) {
                const errorMsg = result.msg || result.description || '获取数据源统计信息失败';
                throw new Error(errorMsg);
            }

            return result.data || result;
        } catch (error) {
            console.error('Failed to fetch data source statistics:', error);
            throw error;
        }
    },
};
