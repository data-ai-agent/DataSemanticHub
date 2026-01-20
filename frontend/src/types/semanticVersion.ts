/**
 * Semantic Version Types
 * 语义版本数据模型
 * 
 * 语义版本是整个体系的"事实源（Source of Truth）"
 * - 只有语义版本能被消费（问数/AI）
 * - 每个版本 = 一个不可变快照
 * - 可对比、可回滚、可切换 Active
 */

// 语义版本主体
export interface SemanticVersion {
    version_id: string;                    // "sv_1.0.0_timestamp"
    version: string;                       // "1.0.0" (Major.Minor.Patch)
    status: 'draft' | 'published' | 'deprecated';
    is_active: boolean;                    // 当前活跃版本（只有一个）

    // 快照内容
    snapshot: SemanticSnapshot;

    // 元数据
    created_at: string;
    published_at?: string;
    deprecated_at?: string;
    created_by?: string;
    change_summary?: string;               // 变更说明

    // 统计
    stats?: {
        bo_count: number;
        field_count: number;
        relation_count: number;
    };
}

// 版本快照（不可变）
export interface SemanticSnapshot {
    business_objects: BusinessObjectSnapshot[];
    field_semantics: FieldSemanticSnapshot[];
    object_relations: RelationSnapshot[];
    terms?: TermSnapshot[];                // 后续
    metrics?: MetricSnapshot[];            // 后续
}

// 业务对象快照
export interface BusinessObjectSnapshot {
    id: string;
    label: string;                         // 中文名
    normalized_name: string;               // 英文标准名
    type: 'Subject' | 'BO' | 'Resource';
    description?: string;

    // 字段
    fields: FieldSnapshot[];

    // 物理映射
    mapping?: PhysicalMapping;

    // 来源
    source?: {
        type: 'top_down' | 'bottom_up';    // 自上而下 or 自下而上
        scenario_id?: string;              // 来源场景
        table_id?: string;                 // 来源物理表
    };

    // 元数据
    created_at: string;
    updated_at: string;
}

// 字段快照
export interface FieldSnapshot {
    id: string;
    name: string;                          // 英文名
    label: string;                         // 中文名
    type: string;                          // string | number | boolean | date | object
    description?: string;
    required?: boolean;
    privacy_level?: 'public' | 'internal' | 'sensitive' | 'secret';

    // 语义标签
    tags?: string[];
    term_id?: string;                      // 关联的术语
}

// 字段语义快照
export interface FieldSemanticSnapshot {
    field_id: string;
    bo_id: string;
    term_id?: string;
    role?: string;                         // 字段角色
    tags: string[];
}

// 对象关系快照
export interface RelationSnapshot {
    id: string;
    source_bo_id: string;
    target_bo_id: string;
    relation_type: 'has' | 'belongs_to' | 'references' | 'extends';
    cardinality?: '1:1' | '1:n' | 'n:1' | 'n:n';
    description?: string;
}

// 物理映射
export interface PhysicalMapping {
    data_source_id: string;
    table_name: string;
    field_mappings: {
        bo_field_id: string;
        physical_column: string;
    }[];
}

// 术语快照（后续）
export interface TermSnapshot {
    id: string;
    name: string;
    definition: string;
    synonyms?: string[];
}

// 指标快照（后续）
export interface MetricSnapshot {
    id: string;
    name: string;
    formula: string;
    unit?: string;
}

// 版本对比结果
export interface VersionDiff {
    version_from: string;
    version_to: string;
    changes: {
        business_objects: {
            added: BusinessObjectSnapshot[];
            removed: BusinessObjectSnapshot[];
            modified: {
                before: BusinessObjectSnapshot;
                after: BusinessObjectSnapshot;
                field_changes: {
                    added: FieldSnapshot[];
                    removed: FieldSnapshot[];
                    modified: { before: FieldSnapshot; after: FieldSnapshot }[];
                };
            }[];
        };
        relations: {
            added: RelationSnapshot[];
            removed: RelationSnapshot[];
        };
    };
    summary: {
        total_changes: number;
        breaking_changes: number;  // 删除或修改类型
        additions: number;
        modifications: number;
        removals: number;
    };
}

// 版本状态机
export type VersionTransition =
    | { from: 'draft'; to: 'published'; action: 'publish' }
    | { from: 'published'; to: 'deprecated'; action: 'deprecate' }
    | { from: 'deprecated'; to: 'published'; action: 'restore' };

