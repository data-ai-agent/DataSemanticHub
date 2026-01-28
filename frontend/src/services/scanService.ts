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
 * 扫描策略（仅增量扫描时使用）
 */
export enum ScanStrategy {
    /** 插入 */
    Insert = 'insert',
    /** 更新 */
    Update = 'update',
    /** 删除 */
    Delete = 'delete',
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
    /** 扫描策略（仅在增量扫描时使用） */
    scan_strategy?: ('insert' | 'update' | 'delete')[];
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
    /** 高级参数（JSON字符串，包含字段数、存储大小等统计信息） */
    advanced_params?: string | any;
    /** 字段数 */
    field_count?: number;
    /** 数据大小（字节） */
    data_length?: number;
    /** 索引大小（字节） */
    index_length?: number;
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
    /** 扫描策略（定时扫描不使用此字段） */
    scan_strategy?: never;
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
    /** 扫描策略（定时扫描不使用此字段） */
    scan_strategy?: never;
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
    /** 扫描策略（仅在保存后可用） */
    scanStrategy?: ('insert' | 'update' | 'delete')[];
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
    /** 字段数 */
    fieldCount?: number;
    /** 数据大小（字节） */
    dataSize?: number;
    /** 索引大小（字节） */
    indexSize?: number;
    /** 总大小（字节） */
    totalSize?: number;
    /** 数据大小（格式化） */
    dataSizeFormatted?: string;
    /** 索引大小（格式化） */
    indexSizeFormatted?: string;
    /** 总大小（格式化） */
    totalSizeFormatted?: string;
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
    /** 扫描策略（用于展示和编辑，存储后端的 scan_strategy 数组） */
    scanStrategy?: ('insert' | 'update' | 'delete')[];
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
    /** 扫描策略（仅在数据源即时扫描type=0和定时扫描type=2时使用，支持insert/update/delete的一种或几种组合） */
    scanStrategy?: ('insert' | 'update' | 'delete')[];
    /** 表ID列表（type为1时需要） */
    tables?: string[];
    /** 定时表达式（针对定时扫描type=2） */
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

/**
 * 后端 - 表信息模型（数据源下的表）
 */
export interface TableInfoVo {
    /** 表ID */
    id: string;
    /** 表名 */
    table_name: string;
    /** 数据库类型 */
    db_type: string;
    /** 表注释 */
    table_comment?: string;
    /** 创建时间 */
    create_time?: string;
    /** 更新时间 */
    update_time?: string;
}

/**
 * 后端 - 字段信息模型
 */
export interface FieldInfoVo {
    /** 字段ID */
    id: string;
    /** 字段名 */
    field_name: string;
    /** 字段类型 */
    field_type: string;
    /** 字段注释 */
    field_comment?: string;
    /** 是否主键 */
    is_primary?: boolean;
    /** 是否可为空 */
    is_nullable?: boolean;
    /** 默认值 */
    default_value?: string;
    /** 创建时间 */
    create_time?: string;
}

/**
 * 前端 - 表信息
 */
export interface TableInfo {
    /** 表ID */
    id: string;
    /** 表名 */
    tableName: string;
    /** 数据库类型 */
    dbType: string;
    /** 表注释 */
    tableComment?: string;
    /** 创建时间 */
    createTime?: string;
    /** 更新时间 */
    updateTime?: string;
    /** 字段数 */
    fieldCount?: number;
    /** 总行数 */
    rowCount?: number;
    /** 数据大小（字节） */
    dataSize?: number;
    /** 索引大小（字节） */
    indexSize?: number;
    /** 总大小（字节） */
    totalSize?: number;
    /** 数据大小（格式化） */
    dataSizeFormatted?: string;
    /** 索引大小（格式化） */
    indexSizeFormatted?: string;
    /** 总大小（格式化） */
    totalSizeFormatted?: string;
}

/**
 * 前端 - 字段信息
 */
export interface FieldInfo {
    /** 字段ID */
    id: string;
    /** 字段名 */
    fieldName: string;
    /** 字段类型 */
    fieldType: string;
    /** 字段注释 */
    fieldComment?: string;
    /** 是否主键 */
    isPrimary?: boolean;
    /** 是否可为空 */
    isNullable?: boolean;
    /** 默认值 */
    defaultValue?: string;
    /** 创建时间 */
    createTime?: string;
}

/**
 * 前端 - 查询表列表参数
 */
export interface QueryTablesParams {
    /** 数据源ID */
    dataSourceId: string;
    /** 每页数量 */
    limit?: number;
    /** 偏移量 */
    offset?: number;
    /** 搜索关键词 */
    keyword?: string;
}

/**
 * 前端 - 查询字段列表参数
 */
export interface QueryFieldsParams {
    /** 表ID */
    tableId: string;
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
    SCAN_RETRY: '/metadata/scan/retry',
    SCAN_SCHEDULE: '/metadata/scan/schedule',
    SCAN_SCHEDULE_STATUS: (scheduleId: string) => `/metadata/scan/schedule/${scheduleId}`,
    SCAN_SCHEDULE_TASK: (scheduleId: string) => `/metadata/scan/schedule/task/${scheduleId}`,
    SCAN_SCHEDULE_EXEC: (scheduleId: string) => `/metadata/scan/schedule/exec/${scheduleId}`,
    SCAN_SCHEDULE_DELETE: (scheduleId: string) => `/metadata/scan/schedule/${scheduleId}`,
    SCAN_SCHEDULE_EXECUTE: (scheduleId: string) => `/metadata/scan/schedule/${scheduleId}/execute`,
    SCAN_BATCH: '/metadata/scan/batch',
    DATA_SOURCE_TABLES: (dsId: string) => `/metadata/data-source/${dsId}`,
    TABLE_FIELDS: (tableId: string) => `/metadata/table/${tableId}`,
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
export const fromBackendScanTask = (backend: any): ScanTask => {
    // 解析 task_process_info（可能是 JSON 字符串或对象）
    let processInfo = undefined;
    if (backend.task_process_info) {
        try {
            const parsed = typeof backend.task_process_info === 'string'
                ? JSON.parse(backend.task_process_info)
                : backend.task_process_info;
            processInfo = {
                tableCount: parsed.table_count || 0,
                successCount: parsed.success_count || 0,
                failCount: parsed.fail_count || 0,
            };
        } catch (e) {
            console.error('Failed to parse task_process_info:', e);
        }
    }

    // 解析 task_result_info（可能是 JSON 字符串或对象）
    let resultInfo = undefined;
    if (backend.task_result_info) {
        try {
            const parsed = typeof backend.task_result_info === 'string'
                ? JSON.parse(backend.task_result_info)
                : backend.task_result_info;
            resultInfo = {
                tableCount: parsed.table_count || 0,
                successCount: parsed.success_count || 0,
                failCount: parsed.fail_count || 0,
                failStage: parsed.fail_stage,
                errorStack: parsed.error_stack,
            };
        } catch (e) {
            console.error('Failed to parse task_result_info:', e);
        }
    }

    // 标准化 scan_status 值（处理后端返回数字或字符串的情况）
    let normalizedStatus = backend.scan_status;
    if (typeof normalizedStatus === 'number') {
        const statusMap: Record<number, string> = {
            0: 'wait',
            1: 'running',
            2: 'success',
            3: 'fail',
        };
        normalizedStatus = statusMap[normalizedStatus] || 'wait';
    } else if (!normalizedStatus || typeof normalizedStatus !== 'string') {
        normalizedStatus = 'wait';
    }

    return {
        id: backend.id,
        scheduleId: backend.schedule_id,
        name: backend.name,
        type: mapScanTaskType(backend.type),
        dataSourceType: formatDataSourceType(backend.ds_type),
        createUser: backend.create_user,
        status: normalizedStatus as any,
        taskStatus: backend.task_status === 'enable' ? 'enable' : 'disable',
        startTime: backend.start_time,
        scanStrategy: backend.scan_strategy || [],
        processInfo,
        resultInfo,
        isScheduled: !!backend.schedule_id,
    };
};

/**
 * 后端表扫描信息 → 前端表扫描信息
 */
export const fromBackendTableScan = (backend: TableScanVo): TableScan => {
    // 标准化 scan_status 值
    let normalizedStatus = backend.scan_status;
    if (typeof normalizedStatus === 'number') {
        const statusMap: Record<number, string> = {
            0: 'wait',
            1: 'running',
            2: 'success',
            3: 'fail',
        };
        normalizedStatus = statusMap[normalizedStatus] || 'wait';
    } else if (!normalizedStatus || typeof normalizedStatus !== 'string') {
        normalizedStatus = 'wait';
    }

    // 解析带单位的大小字符串（如 "16384MB" -> 字节数）
    const parseSizeString = (sizeStr: string | number | undefined): number => {
        if (!sizeStr) return 0;
        if (typeof sizeStr === 'number') return sizeStr;
        if (typeof sizeStr !== 'string') return 0;

        const str = sizeStr.toString().trim().toUpperCase();
        if (str === '0' || str === '') return 0;

        // 匹配 "16384MB" 格式
        const match = str.match(/^([\d.]+)(B|KB|MB|GB|TB)?$/);
        if (!match) return 0;

        const value = parseFloat(match[1]);
        const unit = match[2] || 'B';

        const unitMultipliers: Record<string, number> = {
            'B': 1,
            'KB': 1024,
            'MB': 1024 * 1024,
            'GB': 1024 * 1024 * 1024,
            'TB': 1024 * 1024 * 1024 * 1024,
        };

        return value * (unitMultipliers[unit] || 1);
    };

    // 解析高级参数获取统计信息
    let fieldCount = backend.field_count;
    let dataSize = backend.data_length;
    let indexSize = backend.index_length;

    // 如果没有直接字段，尝试从 advanced_params 解析
    if ((!fieldCount || !dataSize || !indexSize) && backend.advanced_params) {
        try {
            const params = typeof backend.advanced_params === 'string'
                ? JSON.parse(backend.advanced_params)
                : backend.advanced_params;

            // params 可能是数组格式 [{key: xxx, value: xxx}, ...]
            if (Array.isArray(params)) {
                const paramMap: Record<string, any> = {};
                params.forEach((p: any) => {
                    if (p.key && p.value !== undefined) {
                        paramMap[p.key] = p.value;
                    }
                });

                if (!fieldCount) fieldCount = paramMap.field_count ? parseInt(paramMap.field_count) : undefined;

                // 处理 data_length（可能是字符串如 "16384MB"）
                if (!dataSize && paramMap.data_length) {
                    dataSize = parseSizeString(paramMap.data_length);
                }

                // 处理 index_length（可能是字符串如 "16384MB"）
                if (!indexSize && paramMap.index_length) {
                    indexSize = parseSizeString(paramMap.index_length);
                }
            } else if (typeof params === 'object') {
                // 如果是对象格式，直接读取字段
                if (!fieldCount) fieldCount = params.field_count;
                if (!dataSize && params.data_length) {
                    dataSize = typeof params.data_length === 'string'
                        ? parseSizeString(params.data_length)
                        : params.data_length;
                }
                if (!indexSize && params.index_length) {
                    indexSize = typeof params.index_length === 'string'
                        ? parseSizeString(params.index_length)
                        : params.index_length;
                }
            }
        } catch (e) {
            console.error('Failed to parse advanced_params:', e);
        }
    }

    // 如果 dataSize 和 indexSize 还是后端返回的字符串格式，进行转换
    if (typeof dataSize === 'string' && dataSize) {
        dataSize = parseSizeString(dataSize);
    }
    if (typeof indexSize === 'string' && indexSize) {
        indexSize = parseSizeString(indexSize);
    }

    // 格式化大小显示
    const formatSize = (bytes: number): string => {
        if (!bytes || bytes === 0) return '-';
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        const digitGroups = Math.floor(Math.log10(bytes) / Math.log10(1024));
        return `${(bytes / Math.pow(1024, digitGroups)).toFixed(1)} ${units[digitGroups]}`;
    };

    const totalSize = (dataSize || 0) + (indexSize || 0);

    return {
        tableId: backend.table_id,
        tableName: backend.table_name,
        tableComment: backend.table_comment,
        dbType: formatDataSourceType(backend.db_type),
        status: normalizedStatus as any,
        rowCount: backend.row_count,
        scanTime: backend.scan_time,
        errorMsg: backend.error_msg,
        fieldCount,
        dataSize,
        indexSize,
        totalSize,
        dataSizeFormatted: formatSize(dataSize || 0),
        indexSizeFormatted: formatSize(indexSize || 0),
        totalSizeFormatted: formatSize(totalSize),
    };
};

/**
 * 后端定时任务 → 前端定时任务
 */
export const fromBackendScheduledScan = (backend: any): ScheduledScan => {
    // 处理后端返回的 cron_expression 可能是对象格式 {type: "CRON", expression: "..."}
    const cronExpr = backend.cron_expression?.expression || backend.cron_expression || '0 0 2 * * ?';

    return {
        scheduleId: backend.schedule_id,
        name: backend.name,
        dataSourceType: formatDataSourceType(backend.ds_type),
        // 后端可能返回 scan_strategy 数组，如果没有则默认为空数组
        scanStrategy: backend.scan_strategy || [],
        cronExpression: cronExpr,
        status: backend.status || (backend.task_status === 'enable' ? 'open' : 'close'),
        createTime: backend.start_time || backend.create_time || '',
        nextRunTime: backend.next_run_time,
    };
};

/**
 * 后端定时任务执行历史 → 前端定时任务执行历史
 * 支持两种后端格式：
 * 1. ScheduleTaskInfoDto: task_id, scan_status, start_time, end_time, duration, task_process_info, task_result_info
 * 2. ScheduledScanExecution: execution_id, schedule_id, execute_time, scan_status, table_count, success_count, fail_count, duration
 */
export const fromBackendScheduledScanExecution = (backend: any): ScheduledScanExecutionHistory => {
    // 标准化 scan_status 值
    let normalizedStatus = backend.scan_status;
    if (typeof normalizedStatus === 'number') {
        const statusMap: Record<number, string> = {
            0: 'wait',
            1: 'running',
            2: 'success',
            3: 'fail',
        };
        normalizedStatus = statusMap[normalizedStatus] || 'wait';
    } else if (!normalizedStatus || typeof normalizedStatus !== 'string') {
        normalizedStatus = 'wait';
    }

    // 处理 ScheduleTaskInfoDto 格式（来自 /scan/schedule/task/{scheduleId} 接口）
    if (backend.task_id) {
        const taskProcessInfo = backend.task_process_info ? JSON.parse(backend.task_process_info) : null;
        const taskResultInfo = backend.task_result_info ? JSON.parse(backend.task_result_info) : null;

        return {
            executionId: backend.task_id,
            scheduleId: backend.schedule_id || '',
            executeTime: backend.start_time,
            status: normalizedStatus as any,
            tableCount: taskProcessInfo?.table_count || taskResultInfo?.table_count || 0,
            successCount: taskResultInfo?.success_count || 0,
            failCount: taskResultInfo?.fail_count || 0,
            duration: backend.duration ? parseFloat(backend.duration) : undefined,
        };
    }

    // 处理 ScheduledScanExecution 格式（预期的标准格式）
    return {
        executionId: backend.execution_id,
        scheduleId: backend.schedule_id,
        executeTime: backend.execute_time,
        status: normalizedStatus as any,
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

/**
 * 后端表信息 → 前端表信息
 */
const fromBackendTableInfo = (backend: TableInfoVo | any): TableInfo => {
    // 解析带单位的大小字符串（如 "16384MB" -> 字节数）
    const parseSizeString = (sizeStr: string | number | undefined): number => {
        if (!sizeStr) return 0;
        if (typeof sizeStr === 'number') return sizeStr;
        if (typeof sizeStr !== 'string') return 0;

        const str = sizeStr.toString().trim().toUpperCase();
        if (str === '0' || str === '') return 0;

        // 匹配 "16384MB" 格式
        const match = str.match(/^([\d.]+)(B|KB|MB|GB|TB)?$/);
        if (!match) return 0;

        const value = parseFloat(match[1]);
        const unit = match[2] || 'B';

        const unitMultipliers: Record<string, number> = {
            'B': 1,
            'KB': 1024,
            'MB': 1024 * 1024,
            'GB': 1024 * 1024 * 1024,
            'TB': 1024 * 1024 * 1024 * 1024,
        };

        return value * (unitMultipliers[unit] || 1);
    };

    // 格式化大小显示
    const formatSize = (bytes: number): string => {
        if (!bytes || bytes === 0) return '-';
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        const digitGroups = Math.floor(Math.log10(bytes) / Math.log10(1024));
        return `${(bytes / Math.pow(1024, digitGroups)).toFixed(1)} ${units[digitGroups]}`;
    };

    // 初始化统计信息
    let fieldCount = undefined;
    let rowCount = undefined;
    let dataSize = undefined;
    let indexSize = undefined;

    // 1. 首先尝试从根级别直接读取（后端直接返回的字段）
    if (backend.data_length) {
        dataSize = parseSizeString(backend.data_length);
    }
    if (backend.index_length) {
        indexSize = parseSizeString(backend.index_length);
    }
    if (backend.table_rows !== undefined) {
        rowCount = typeof backend.table_rows === 'string' ? parseInt(backend.table_rows) : backend.table_rows;
    }
    if (backend.field_count !== undefined) {
        fieldCount = typeof backend.field_count === 'string' ? parseInt(backend.field_count) : backend.field_count;
    }

    // 2. 如果根级别没有，尝试从 advanced_params 解析
    if ((!fieldCount || !rowCount || !dataSize || !indexSize) && backend.advanced_params) {
        try {
            const params = typeof backend.advanced_params === 'string'
                ? JSON.parse(backend.advanced_params)
                : backend.advanced_params;

            // params 可能是数组格式 [{key: xxx, value: xxx}, ...]
            if (Array.isArray(params)) {
                const paramMap: Record<string, any> = {};
                params.forEach((p: any) => {
                    if (p.key && p.value !== undefined) {
                        paramMap[p.key] = p.value;
                    }
                });

                if (!fieldCount && paramMap.field_count) {
                    fieldCount = parseInt(paramMap.field_count);
                }
                // 支持两种字段名: row_count 或 table_rows
                if (!rowCount && (paramMap.row_count || paramMap.table_rows)) {
                    rowCount = parseInt(paramMap.row_count || paramMap.table_rows);
                }
                if (!dataSize && paramMap.data_length) {
                    dataSize = parseSizeString(paramMap.data_length);
                }
                if (!indexSize && paramMap.index_length) {
                    indexSize = parseSizeString(paramMap.index_length);
                }
            } else if (typeof params === 'object') {
                // 如果是对象格式，直接读取字段
                if (!fieldCount && params.field_count) {
                    fieldCount = params.field_count;
                }
                // 支持两种字段名: row_count 或 table_rows
                if (!rowCount && (params.row_count || params.table_rows)) {
                    rowCount = typeof (params.row_count || params.table_rows) === 'string'
                        ? parseInt(params.row_count || params.table_rows)
                        : (params.row_count || params.table_rows);
                }
                if (!dataSize && params.data_length) {
                    dataSize = typeof params.data_length === 'string'
                        ? parseSizeString(params.data_length)
                        : params.data_length;
                }
                if (!indexSize && params.index_length) {
                    indexSize = typeof params.index_length === 'string'
                        ? parseSizeString(params.index_length)
                        : params.index_length;
                }
            }
        } catch (e) {
            console.error('Failed to parse advanced_params:', e);
        }
    }

    const totalSize = (dataSize || 0) + (indexSize || 0);

    return {
        id: backend.id,
        // 兼容两种命名格式: table_name 或 name
        tableName: backend.table_name || backend.name || '',
        // 兼容两种命名格式: db_type 或直接使用已格式化的类型
        dbType: backend.db_type ? formatDataSourceType(backend.db_type) : (backend.dbType || '未知'),
        // 兼容多种字段名格式: table_comment, comment, 或 advanced_params.comment
        tableComment: backend.table_comment || backend.comment || (backend.advanced_params?.comment) || '',
        createTime: backend.create_time,
        updateTime: backend.update_time,
        fieldCount,
        rowCount,
        dataSize,
        indexSize,
        totalSize,
        dataSizeFormatted: dataSize !== undefined ? formatSize(dataSize) : '-',
        indexSizeFormatted: indexSize !== undefined ? formatSize(indexSize) : '-',
        totalSizeFormatted: totalSize > 0 ? formatSize(totalSize) : '-',
    };
};

/**
 * 后端字段信息 → 前端字段信息
 */
const fromBackendFieldInfo = (backend: FieldInfoVo | any): FieldInfo => {
    return {
        id: backend.id,
        // 兼容两种命名格式: field_name 或 name
        fieldName: backend.field_name || backend.name || '',
        // 兼容两种命名格式: field_type 或 type
        fieldType: backend.field_type || backend.type || backend.vega_type || '',
        // 兼容两种命名格式: field_comment 或 comment
        fieldComment: backend.field_comment || backend.comment,
        // 兼容两种命名格式: is_primary 或 isPrimary
        isPrimary: backend.is_primary ?? backend.isPrimary,
        // 兼容两种命名格式: is_nullable 或 isNullable
        isNullable: backend.is_nullable ?? backend.isNullable,
        // 兼容两种命名格式: default_value 或 defaultValue
        defaultValue: backend.default_value || backend.defaultValue,
        createTime: backend.create_time,
    };
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
            const requestBody: any = {
                scan_name: params.scanName,
                type: params.type,
                ds_info: {
                    ds_id: params.dataSourceId,
                    ds_type: params.dataSourceType.toLowerCase(),
                },
            };

            // 只在有 scanStrategy 且是数据源扫描(type=0)或定时扫描(type=2)时才添加此字段
            if (params.scanStrategy && (params.type === ScanTaskType.DataSourceInstant || params.type === ScanTaskType.DataSourceScheduled)) {
                requestBody.ds_info.scan_strategy = params.scanStrategy;
            }

            if (params.tables) {
                requestBody.tables = params.tables;
            }

            // cron_expression 需要是一个对象，包含 type 和 expression
            if (params.cronExpression) {
                requestBody.cron_expression = {
                    type: 'CRON',
                    expression: params.cronExpression
                };
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
            const requestBody: any[] = params.map(param => {
                const requestObj: any = {
                    scan_name: param.scanName,
                    type: param.type,
                    ds_info: {
                        ds_id: param.dataSourceId,
                        ds_type: param.dataSourceType.toLowerCase(),
                    },
                    ...(param.tables && { tables: param.tables }),
                    ...(param.cronExpression && { cron_expression: { type: 'CRON', expression: param.cronExpression } }),
                    ...(param.status && { status: param.status }),
                };

                // 只在有 scanStrategy 且是数据源扫描(type=0)或定时扫描(type=2)时才添加此字段
                if (param.scanStrategy && (param.type === ScanTaskType.DataSourceInstant || param.type === ScanTaskType.DataSourceScheduled)) {
                    requestObj.ds_info.scan_strategy = param.scanStrategy;
                }

                return requestObj;
            });

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
        scanStrategy?: ('insert' | 'update' | 'delete')[];
        status?: 'open' | 'close';
    }): Promise<ScheduledScan> {
        try {
            const requestBody: any = {
                schedule_id: params.scheduleId,
                cron_expression: {
                    type: 'CRON',
                    expression: params.cronExpression
                },
            };

            // 只在提供了 scanStrategy 时才添加此字段
            if (params.scanStrategy) {
                requestBody.scan_strategy = params.scanStrategy;
            }

            // 只在提供了 status 时才添加此字段
            if (params.status !== undefined) {
                requestBody.status = params.status;
            }

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

    /**
     * 获取数据源下的表列表
     */
    async getTablesByDataSourceId(params: QueryTablesParams): Promise<{ tables: TableInfo[]; totalCount: number }> {
        try {
            const queryParams = new URLSearchParams();
            if (params.limit) {
                queryParams.append('limit', params.limit.toString());
            }
            if (params.offset) {
                queryParams.append('offset', params.offset.toString());
            }
            if (params.keyword) {
                queryParams.append('keyword', params.keyword);
            }

            const url = `${SCAN_ENDPOINTS.DATA_SOURCE_TABLES(params.dataSourceId)}?${queryParams.toString()}`;

            const response = await dataConnectionServiceClient(url, {
                method: 'GET',
            });

            if (!response.ok) {
                throw await parseScanError(response);
            }

            const result: any = await response.json();

            // 处理可能的不同响应格式
            const entries = result.entries || result.data || result.items || [];
            const totalCount = result.total_count || result.totalCount || (Array.isArray(entries) ? entries.length : 0);
            const tables = Array.isArray(entries) ? entries.map(fromBackendTableInfo) : [];

            return {
                tables,
                totalCount,
            };
        } catch (error) {
            console.error('Failed to fetch tables by data source id:', error);
            if (import.meta.env.DEV) {
                return {
                    tables: [],
                    totalCount: 0,
                };
            }
            throw error;
        }
    },

    /**
     * 获取表下的字段列表
     */
    async getFieldsByTableId(params: QueryFieldsParams): Promise<{ fields: FieldInfo[]; totalCount: number }> {
        try {
            const queryParams = new URLSearchParams();
            if (params.limit) {
                queryParams.append('limit', params.limit.toString());
            }
            if (params.offset) {
                queryParams.append('offset', params.offset.toString());
            }
            if (params.keyword) {
                queryParams.append('keyword', params.keyword);
            }

            const url = `${SCAN_ENDPOINTS.TABLE_FIELDS(params.tableId)}?${queryParams.toString()}`;

            const response = await dataConnectionServiceClient(url, {
                method: 'GET',
            });

            if (!response.ok) {
                throw await parseScanError(response);
            }

            const result: any = await response.json();

            // 处理可能的不同响应格式
            const entries = result.entries || result.data || result.items || [];
            const totalCount = result.total_count || result.totalCount || (Array.isArray(entries) ? entries.length : 0);
            const fields = Array.isArray(entries) ? entries.map(fromBackendFieldInfo) : [];

            return {
                fields,
                totalCount,
            };
        } catch (error) {
            console.error('Failed to fetch fields by table id:', error);
            if (import.meta.env.DEV) {
                return {
                    fields: [],
                    totalCount: 0,
                };
            }
            throw error;
        }
    },

    /**
     * 删除定时扫描任务
     */
    async deleteScheduledScan(scheduleId: string): Promise<void> {
        try {
            const response = await dataConnectionServiceClient(SCAN_ENDPOINTS.SCAN_SCHEDULE_DELETE(scheduleId), {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw await parseScanError(response);
            }
        } catch (error) {
            console.error('Failed to delete scheduled scan:', error);
            throw error;
        }
    },

    /**
     * 立即执行定时扫描任务
     */
    async executeScheduledScan(scheduleId: string): Promise<void> {
        try {
            const response = await dataConnectionServiceClient(SCAN_ENDPOINTS.SCAN_SCHEDULE_EXECUTE(scheduleId), {
                method: 'POST',
            });

            if (!response.ok) {
                throw await parseScanError(response);
            }
        } catch (error) {
            console.error('Failed to execute scheduled scan:', error);
            throw error;
        }
    },

    /**
     * 重新扫描任务
     */
    async retryScan(taskId: string, tableIds?: string[]): Promise<void> {
        try {
            const requestBody: any = {
                id: taskId,
            };

            // 如果提供了表ID列表，则只重新扫描这些表
            if (tableIds && tableIds.length > 0) {
                requestBody.tables = tableIds;
            }

            const response = await dataConnectionServiceClient(SCAN_ENDPOINTS.SCAN_RETRY, {
                method: 'POST',
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                throw await parseScanError(response);
            }
        } catch (error) {
            console.error('Failed to retry scan:', error);
            throw error;
        }
    },
};