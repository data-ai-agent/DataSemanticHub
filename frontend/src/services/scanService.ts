/**
 * 扫描服务层
 * 基于 data-connection 的元数据扫描 API
 */

import { dataConnectionServiceClient } from '../utils/serviceClient';

// ==================== 类型定义（基于 data-connection API）====================

/**
 * 扫描任务类型
 */
export enum ScanTaskType {
    /** 数据源-即时扫描 */
    DataSourceInstant = 0,
    /** 特定表-即时扫描 */
    TableInstant = 1,
    /** 数据源-定时扫描 */
    DataSourceScheduled = 2,
}

/**
 * 扫描状态
 */
export enum ScanStatus {
    /** 等待中 */
    Wait = 'wait',
    /** 扫描中 */
    Running = 'running',
    /** 扫描成功 */
    Success = 'success',
    /** 扫描失败 */
    Fail = 'fail',
}

/**
 * 任务状态
 */
export enum TaskStatus {
    /** 启用 */
    Enable = 'enable',
    /** 禁用 */
    Disable = 'disable',
}

/**
 * 扫描策略
 */
export enum ScanStrategy {
    /** 全量扫描 */
    Full = 'full',
    /** 增量扫描 */
    Incremental = 'incremental',
}

/**
 * 扫描进度信息
 */
export interface TaskProcessInfo {
    /** 表数量 */
    table_count: number;
    /** 成功数量 */
    success_count: number;
    /** 失败数量 */
    fail_count: number;
}

/**
 * 扫描结果信息
 */
export interface TaskResultInfo {
    /** 表数量 */
    table_count: number;
    /** 成功数量 */
    success_count: number;
    /** 失败数量 */
    fail_count: number;
    /** 失败阶段 */
    fail_stage?: number;
    /** 错误堆栈 */
    error_stack?: string;
}

/**
 * 数据源信息（扫描任务中）
 */
export interface ScanDataSourceInfo {
    /** 数据源ID */
    ds_id: string;
    /** 数据源类型 */
    ds_type: string;
    /** 扫描策略 */
    scan_strategy?: ScanStrategy;
}

/**
 * 后端 - 扫描任务模型
 */
export interface ScanTaskVo {
    /** 任务ID */
    id: string;
    /** 定时任务ID */
    schedule_id?: string;
    /** 扫描任务名称 */
    name: string;
    /** 扫描任务类型 */
    type: ScanTaskType;
    /** 数据源类型 */
    ds_type: string;
    /** 创建用户 */
    create_user: string;
    /** 扫描状态 */
    scan_status: ScanStatus;
    /** 任务状态 */
    task_status: TaskStatus;
    /** 开始时间 */
    start_time: string;
    /** 扫描进度信息 */
    task_process_info?: TaskProcessInfo;
    /** 扫描结果信息 */
    task_result_info?: TaskResultInfo;
}

/**
 * 后端 - 扫描任务列表响应
 */
export interface ScanTaskListResponse {
    /** 总数 */
    total_count: number;
    /** 任务列表 */
    entries: ScanTaskVo[];
}

/**
 * 后端 - 创建扫描任务请求
 */
export interface CreateScanTaskRequest {
    /** 扫描任务名称 */
    scan_name: string;
    /** 扫描任务类型 */
    type: ScanTaskType;
    /** 数据源信息 */
    ds_info: ScanDataSourceInfo;
    /** 表ID列表（type为1或3时需要） */
    tables?: string[];
    /** 定时表达式（针对定时扫描） */
    cron_expression?: string;
    /** 任务状态 */
    status?: 'open' | 'close';
}

/**
 * 后端 - 表扫描状态
 */
export enum TableScanStatus {
    Wait = 'wait',
    Running = 'running',
    Success = 'success',
    Fail = 'fail',
}

/**
 * 后端 - 表信息模型
 */
export interface TableScanVo {
    /** 表ID */
    table_id: string;
    /** 表名 */
    table_name: string;
    /** 表注释 */
    table_comment?: string;
    /** 数据库类型 */
    db_type: string;
    /** 扫描状态 */
    scan_status: TableScanStatus;
    /** 行数 */
    row_count?: number;
    /** 扫描时间 */
    scan_time?: string;
    /** 错误信息 */
    error_msg?: string;
}

/**
 * 后端 - 查询扫描任务表信息响应
 */
export interface TableScanListResponse {
    /** 任务ID */
    task_id: string;
    /** 总数 */
    total_count: number;
    /** 表列表 */
    entries: TableScanVo[];
}

/**
 * 后端 - 更新定时扫描任务请求
 */
export interface UpdateScheduledScanRequest {
    /** 定时任务ID */
    schedule_id: string;
    /** 定时表达式 */
    cron_expression: string;
    /** 扫描策略 */
    scan_strategy?: ScanStrategy;
    /** 状态 */
    status?: 'open' | 'close';
}

/**
 * 后端 - 定时任务状态
 */
export interface ScheduledScanStatus {
    /** 定时任务ID */
    schedule_id: string;
    /** 扫描任务名称 */
    name: string;
    /** 数据源类型 */
    ds_type: string;
    /** 扫描策略 */
    scan_strategy: ScanStrategy;
    /** 定时表达式 */
    cron_expression: string;
    /** 状态 */
    status: 'open' | 'close';
    /** 创建时间 */
    create_time: string;
    /** 下次执行时间 */
    next_run_time?: string;
}

/**
 * 后端 - 定时任务执行历史
 */
export interface ScheduledScanExecution {
    /** 执行ID */
    execution_id: string;
    /** 定时任务ID */
    schedule_id: string;
    /** 执行时间 */
    execute_time: string;
    /** 扫描状态 */
    scan_status: ScanStatus;
    /** 表数量 */
    table_count: number;
    /** 成功数量 */
    success_count: number;
    /** 失败数量 */
    fail_count: number;
    /** 耗时（秒） */
    duration?: number;
}

/**
 * 后端 - 定时任务执行列表响应
 */
export interface ScheduledScanExecutionListResponse {
    /** 定时任务ID */
    schedule_id: string;
    /** 总数 */
    total_count: number;
    /** 执行列表 */
    entries: ScheduledScanExecution[];
}

// ==================== 前端模型 ====================

/**
 * 前端 - 扫描任务
 */
export interface ScanTask {
    /** 任务ID */
    id: string;
    /** 定时任务ID */
    scheduleId?: string;
    /** 扫描任务名称 */
    name: string;
    /** 扫描任务类型 */
    type: 'source_instant' | 'table_instant' | 'source_scheduled';
    /** 数据源类型 */
    dataSourceType: string;
    /** 创建用户 */
    createUser: string;
    /** 扫描状态 */
    status: 'wait' | 'running' | 'success' | 'fail';
    /** 任务状态（定时任务） */
    taskStatus: 'enable' | 'disable';
    /** 开始时间 */
    startTime: string;
    /** 扫描进度信息 */
    processInfo?: {
        tableCount: number;
        successCount: number;
        failCount: number;
    };
    /** 扫描结果信息 */
    resultInfo?: {
        tableCount: number;
        successCount: number;
        failCount: number;
        failStage?: number;
        errorStack?: string;
    };
    /** 是否为定时任务 */
    isScheduled: boolean;
}

/**
 * 前端 - 表扫描信息
 */
export interface TableScan {
    /** 表ID */
    tableId: string;
    /** 表名 */
    tableName: string;
    /** 表注释 */
    tableComment?: string;
    /** 数据库类型 */
    dbType: string;
    /** 扫描状态 */
    status: 'wait' | 'running' | 'success' | 'fail';
    /** 行数 */
    rowCount?: number;
    /** 扫描时间 */
    scanTime?: string;
    /** 错误信息 */
    errorMsg?: string;
}

/**
 * 前端 - 定时任务
 */
export interface ScheduledScan {
    /** 定时任务ID */
    scheduleId: string;
    /** 扫描任务名称 */
    name: string;
    /** 数据源类型 */
    dataSourceType: string;
    /** 扫描策略 */
    scanStrategy: 'full' | 'incremental';
    /** 定时表达式 */
    cronExpression: string;
    /** 状态 */
    status: 'open' | 'close';
    /** 创建时间 */
    createTime: string;
    /** 下次执行时间 */
    nextRunTime?: string;
}

/**
 * 前端 - 定时任务执行历史
 */
export interface ScheduledScanExecutionHistory {
    /** 执行ID */
    executionId: string;
    /** 定时任务ID */
    scheduleId: string;
    /** 执行时间 */
    executeTime: string;
    /** 扫描状态 */
    status: 'wait' | 'running' | 'success' | 'fail';
    /** 表数量 */
    tableCount: number;
    /** 成功数量 */
    successCount: number;
    /** 失败数量 */
    failCount: number;
    /** 耗时（秒） */
    duration?: number;
}

/**
 * 前端 - 创建扫描任务请求
 */
export interface CreateScanTaskParams {
    /** 扫描任务名称 */
    scanName: string;
    /** 扫描任务类型 */
    type: ScanTaskType;
    /** 数据源ID */
    dataSourceId: string;
    /** 数据源类型 */
    dataSourceType: string;
    /** 扫描策略 */
    scanStrategy?: ScanStrategy;
    /** 表ID列表（type为1或3时需要） */
    tables?: string[];
    /** 定时表达式（针对定时扫描） */
    cronExpression?: string;
    /** 任务状态 */
    status?: 'open' | 'close';
}

/**
 * 前端 - 查询表扫描信息参数
 */
export interface QueryTableScanParams {
    /** 任务ID */
    taskId: string;
    /** 状态过滤 */
    status?: TableScanStatus;
    /** 每页数量 */
    limit?: number;
    /** 偏移量 */
    offset?: number;
    /** 搜索关键词 */
    keyword?: string;
}

// ==================== API 端点定义 ====================

const SCAN_ENDPOINTS = {
    METADATA_SCAN: '/metadata/scan',
    SCAN_INFO: (taskId: string) => `/metadata/scan/info/${taskId}`,
    SCAN_SCHEDULE: '/metadata/scan/schedule',
    SCAN_SCHEDULE_STATUS: (scheduleId: string) => `/metadata/scan/schedule/${scheduleId}`,
    SCAN_SCHEDULE_TASK: (scheduleId: string) => `/metadata/scan/schedule/task/${scheduleId}`,
    SCAN_SCHEDULE_EXEC: (scheduleId: string) => `/metadata/scan/schedule/exec/${scheduleId}`,
    SCAN_BATCH: '/metadata/scan/batch',
} as const;

// ==================== 错误处理 ====================

/**
 * 解析扫描服务错误响应
 */
const parseScanError = async (response: Response): Promise<Error> => {
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

// ==================== 数据转换函数 ====================

/**
 * 后端扫描任务 → 前端扫描任务
 */
export const fromBackendScanTask = (backend: ScanTaskVo): ScanTask => {
    return {
        id: backend.id,
        scheduleId: backend.schedule_id,
        name: backend.name,
        type: mapScanTaskType(backend.type),
        dataSourceType: formatDataSourceType(backend.ds_type),
        createUser: backend.create_user,
        status: backend.scan_status,
        taskStatus: backend.task_status === 'enable' ? 'enable' : 'disable',
        startTime: backend.start_time,
        processInfo: backend.task_process_info ? {
            tableCount: backend.task_process_info.table_count,
            successCount: backend.task_process_info.success_count,
            failCount: backend.task_process_info.fail_count,
        } : undefined,
        resultInfo: backend.task_result_info ? {
            tableCount: backend.task_result_info.table_count,
            successCount: backend.task_result_info.success_count,
            failCount: backend.task_result_info.fail_count,
            failStage: backend.task_result_info.fail_stage,
            errorStack: backend.task_result_info.error_stack,
        } : undefined,
        isScheduled: !!backend.schedule_id,
    };
};

/**
 * 后端表扫描信息 → 前端表扫描信息
 */
export const fromBackendTableScan = (backend: TableScanVo): TableScan => {
    return {
        tableId: backend.table_id,
        tableName: backend.table_name,
        tableComment: backend.table_comment,
        dbType: formatDataSourceType(backend.db_type),
        status: backend.scan_status,
        rowCount: backend.row_count,
        scanTime: backend.scan_time,
        errorMsg: backend.error_msg,
    };
};

/**
 * 后端定时任务 → 前端定时任务
 */
export const fromBackendScheduledScan = (backend: ScheduledScanStatus): ScheduledScan => {
    return {
        scheduleId: backend.schedule_id,
        name: backend.name,
        dataSourceType: formatDataSourceType(backend.ds_type),
        scanStrategy: backend.scan_strategy,
        cronExpression: backend.cron_expression,
        status: backend.status,
        createTime: backend.create_time,
        nextRunTime: backend.next_run_time,
    };
};

/**
 * 后端定时任务执行历史 → 前端定时任务执行历史
 */
export const fromBackendScheduledScanExecution = (backend: ScheduledScanExecution): ScheduledScanExecutionHistory => {
    return {
        executionId: backend.execution_id,
        scheduleId: backend.schedule_id,
        executeTime: backend.execute_time,
        status: backend.scan_status,
        tableCount: backend.table_count,
        successCount: backend.success_count,
        failCount: backend.fail_count,
        duration: backend.duration,
    };
};

/**
 * 前端扫描任务类型映射
 */
const mapScanTaskType = (type: ScanTaskType): ScanTask['type'] => {
    const typeMap: Record<ScanTaskType, ScanTask['type']> = {
        [ScanTaskType.DataSourceInstant]: 'source_instant',
        [ScanTaskType.TableInstant]: 'table_instant',
        [ScanTaskType.DataSourceScheduled]: 'source_scheduled',
    };
    return typeMap[type] || 'source_instant';
};

/**
 * 格式化数据源类型
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
        'opensearch': 'OpenSearch',
    };
    return typeMapping[type?.toLowerCase()] || type;
};

// ==================== Scan Service ====================

export const scanService = {
    /**
     * 获取所有扫描任务列表
     */
    async getScanTasks(): Promise<ScanTask[]> {
        try {
            const response = await dataConnectionServiceClient(SCAN_ENDPOINTS.METADATA_SCAN, {
                method: 'GET',
            });

            if (!response.ok) {
                throw await parseScanError(response);
            }

            const result: ScanTaskListResponse = await response.json();

            return result.entries.map(fromBackendScanTask);
        } catch (error) {
            console.error('Failed to fetch scan tasks:', error);
            if (import.meta.env.DEV) {
                return [];
            }
            throw error;
        }
    },

    /**
     * 创建扫描任务
     */
    async createScanTask(params: CreateScanTaskParams): Promise<ScanTask> {
        try {
            const requestBody: CreateScanTaskRequest = {
                scan_name: params.scanName,
                type: params.type,
                ds_info: {
                    ds_id: params.dataSourceId,
                    ds_type: params.dataSourceType.toLowerCase(),
                    scan_strategy: params.scanStrategy,
                },
            };

            if (params.tables) {
                requestBody.tables = params.tables;
            }

            if (params.cronExpression) {
                requestBody.cron_expression = params.cronExpression;
            }

            if (params.status) {
                requestBody.status = params.status;
            }

            const response = await dataConnectionServiceClient(SCAN_ENDPOINTS.METADATA_SCAN, {
                method: 'POST',
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                throw await parseScanError(response);
            }

            const result = await response.json();
            return fromBackendScanTask(result);
        } catch (error) {
            console.error('Failed to create scan task:', error);
            throw error;
        }
    },

    /**
     * 批量创建并启动扫描任务
     */
    async batchCreateScanTasks(params: CreateScanTaskParams[]): Promise<ScanTask[]> {
        try {
            const requestBody: CreateScanTaskRequest[] = params.map(param => ({
                scan_name: param.scanName,
                type: param.type,
                ds_info: {
                    ds_id: param.dataSourceId,
                    ds_type: param.dataSourceType.toLowerCase(),
                    scan_strategy: param.scanStrategy,
                },
                ...(param.tables && { tables: param.tables }),
                ...(param.cronExpression && { cron_expression: param.cronExpression }),
                ...(param.status && { status: param.status }),
            }));

            const response = await dataConnectionServiceClient(SCAN_ENDPOINTS.SCAN_BATCH, {
                method: 'POST',
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                throw await parseScanError(response);
            }

            const result = await response.json();
            const tasks = Array.isArray(result) ? result : [result];
            return tasks.map(fromBackendScanTask);
        } catch (error) {
            console.error('Failed to batch create scan tasks:', error);
            throw error;
        }
    },

    /**
     * 查询扫描任务的表信息
     */
    async getTableScanInfo(params: QueryTableScanParams): Promise<{ taskId: string; tables: TableScan[]; totalCount: number }> {
        try {
            const queryParams = new URLSearchParams();
            if (params.status) {
                queryParams.append('status', params.status);
            }
            if (params.limit) {
                queryParams.append('limit', params.limit.toString());
            }
            if (params.offset) {
                queryParams.append('offset', params.offset.toString());
            }
            if (params.keyword) {
                queryParams.append('keyword', params.keyword);
            }

            const url = `${SCAN_ENDPOINTS.SCAN_INFO(params.taskId)}?${queryParams.toString()}`;

            const response = await dataConnectionServiceClient(url, {
                method: 'GET',
            });

            if (!response.ok) {
                throw await parseScanError(response);
            }

            const result: TableScanListResponse = await response.json();

            return {
                taskId: result.task_id,
                tables: result.entries.map(fromBackendTableScan),
                totalCount: result.total_count,
            };
        } catch (error) {
            console.error('Failed to fetch table scan info:', error);
            if (import.meta.env.DEV) {
                return {
                    taskId: params.taskId,
                    tables: [],
                    totalCount: 0,
                };
            }
            throw error;
        }
    },

    /**
     * 更新定时扫描任务
     */
    async updateScheduledScan(params: {
        scheduleId: string;
        cronExpression: string;
        scanStrategy?: ScanStrategy;
        status?: 'open' | 'close';
    }): Promise<ScheduledScan> {
        try {
            const requestBody: UpdateScheduledScanRequest = {
                schedule_id: params.scheduleId,
                cron_expression: params.cronExpression,
                scan_strategy: params.scanStrategy,
                status: params.status,
            };

            const response = await dataConnectionServiceClient(SCAN_ENDPOINTS.SCAN_SCHEDULE, {
                method: 'PUT',
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                throw await parseScanError(response);
            }

            const result = await response.json();
            return fromBackendScheduledScan(result);
        } catch (error) {
            console.error('Failed to update scheduled scan:', error);
            throw error;
        }
    },

    /**
     * 查询定时扫描任务状态
     */
    async getScheduledScanStatus(scheduleId: string, type?: string): Promise<ScheduledScan> {
        try {
            const queryParams = type ? `?type=${type}` : '';
            const url = `${SCAN_ENDPOINTS.SCAN_SCHEDULE_STATUS(scheduleId)}${queryParams}`;

            const response = await dataConnectionServiceClient(url, {
                method: 'GET',
            });

            if (!response.ok) {
                throw await parseScanError(response);
            }

            const result = await response.json();
            return fromBackendScheduledScan(result);
        } catch (error) {
            console.error('Failed to fetch scheduled scan status:', error);
            throw error;
        }
    },

    /**
     * 查询定时扫描任务执行历史列表
     */
    async getScheduledScanExecutions(
        scheduleId: string,
        limit?: number,
        offset?: number
    ): Promise<{ scheduleId: string; executions: ScheduledScanExecutionHistory[]; totalCount: number }> {
        try {
            const queryParams = new URLSearchParams();
            if (limit) {
                queryParams.append('limit', limit.toString());
            }
            if (offset) {
                queryParams.append('offset', offset.toString());
            }

            const url = `${SCAN_ENDPOINTS.SCAN_SCHEDULE_EXEC(scheduleId)}?${queryParams.toString()}`;

            const response = await dataConnectionServiceClient(url, {
                method: 'GET',
            });

            if (!response.ok) {
                throw await parseScanError(response);
            }

            const result: ScheduledScanExecutionListResponse = await response.json();

            return {
                scheduleId: result.schedule_id,
                executions: result.entries.map(fromBackendScheduledScanExecution),
                totalCount: result.total_count,
            };
        } catch (error) {
            console.error('Failed to fetch scheduled scan executions:', error);
            if (import.meta.env.DEV) {
                return {
                    scheduleId,
                    executions: [],
                    totalCount: 0,
                };
            }
            throw error;
        }
    },

    /**
     * 查询定时扫描任务的执行历史列表（另一个接口）
     */
    async getScheduledScanTaskList(
        scheduleId: string,
        limit?: number,
        offset?: number
    ): Promise<{ executions: ScheduledScanExecutionHistory[]; totalCount: number }> {
        try {
            const queryParams = new URLSearchParams();
            if (limit) {
                queryParams.append('limit', limit.toString());
            }
            if (offset) {
                queryParams.append('offset', offset.toString());
            }

            const url = `${SCAN_ENDPOINTS.SCAN_SCHEDULE_TASK(scheduleId)}?${queryParams.toString()}`;

            const response = await dataConnectionServiceClient(url, {
                method: 'GET',
            });

            if (!response.ok) {
                throw await parseScanError(response);
            }

            const result = await response.json();
            const executions = Array.isArray(result) ? result : (result.entries || []);

            return {
                executions: executions.map(fromBackendScheduledScanExecution),
                totalCount: result.total_count || executions.length,
            };
        } catch (error) {
            console.error('Failed to fetch scheduled scan task list:', error);
            if (import.meta.env.DEV) {
                return {
                    executions: [],
                    totalCount: 0,
                };
            }
            throw error;
        }
    },
};