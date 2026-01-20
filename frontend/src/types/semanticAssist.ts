/**
 * BizSemantic v2.4 - 语义理解辅助检测类型定义
 * 
 * 统一概念声明：
 * - 语义理解辅助检测（Semantic Assist）是语义理解阶段的辅助能力
 * - 通过模板化信号（SEMANTIC_MIN）为语义建议提供证据与风险提示
 * - 不等同于数据质量检测
 * - 不产生通过/失败结论
 * - 不影响语义裁决与语义版本生效
 */

export type SemanticAssistTemplate = 'SEMANTIC_MIN';

export type SemanticAssistScope = 'TABLE' | 'BATCH';

export type SemanticAssistStatus = 'IDLE' | 'RUNNING' | 'SUCCESS' | 'ERROR';

export interface SemanticAssistRuntimeConfig {
    /** 采样比例 (0.5 | 1 | 5 表示百分比) */
    sampleRatio: 0.5 | 1 | 5;
    /** 是否强制重新计算（忽略缓存） */
    forceRecompute?: boolean;
}

export interface SemanticAssistSystemConfig {
    /** 最大采样行数 */
    maxRows: number;
    /** 缓存有效期（小时） */
    ttlHours: number;
}

export interface SemanticAssistSourceInfo {
    /** 是否来自质量检测结果 */
    fromQuality: boolean;
    /** 是否来自语义辅助采样 */
    fromSemanticProfile: boolean;
    /** 最后计算时间 */
    lastComputedAt?: string;
}

/**
 * 语义理解辅助检测核心对象
 */
export interface SemanticAssist {
    /** 是否启用 */
    enabled: boolean;
    /** 检测模板（v2.4固定不可编辑） */
    template: SemanticAssistTemplate;
    /** 运行时配置（用户可调整） */
    runtimeConfig: SemanticAssistRuntimeConfig;
    /** 系统配置（只读） */
    systemConfig: SemanticAssistSystemConfig;
    /** 作用域 */
    scope: SemanticAssistScope;
    /** 运行状态 */
    status?: SemanticAssistStatus;
    /** 信号来源信息 */
    sourceInfo?: SemanticAssistSourceInfo;
}

/**
 * 批量运行配置
 */
export interface SemanticAssistBatchRunConfig {
    runType: 'SEMANTIC_SUGGESTION_BATCH';
    scope: 'BATCH';
    targets: string[];
    semanticAssist: Omit<SemanticAssist, 'scope' | 'status' | 'sourceInfo'>;
}

/**
 * 默认配置
 */
export const DEFAULT_SEMANTIC_ASSIST: SemanticAssist = {
    enabled: true,
    template: 'SEMANTIC_MIN',
    runtimeConfig: {
        sampleRatio: 1,
        forceRecompute: false,
    },
    systemConfig: {
        maxRows: 10000,
        ttlHours: 24,
    },
    scope: 'TABLE',
    status: 'IDLE',
};

/**
 * 模板信号维度说明
 */
export const SEMANTIC_MIN_SIGNALS = [
    { name: '字段角色识别', description: '主键、外键、业务属性等' },
    { name: '数据类型推断', description: '验证字段实际数据类型' },
    { name: '空值率分析', description: '评估字段数据完整性' },
    { name: '唯一性分析', description: '识别潜在主键和去重字段' },
    { name: '敏感字段识别', description: '识别可能包含敏感信息的字段' },
];
