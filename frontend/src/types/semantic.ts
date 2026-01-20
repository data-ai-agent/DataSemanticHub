
// P0: Actionable Governance Recommendations
export interface ActionItem {
    type: 'sql' | 'workflow' | 'manual';
    title: string;
    description: string;
    sqlTemplate?: string;
    priority: 'high' | 'medium' | 'low';
}

export interface SemanticGateResult {
    result: 'PASS' | 'REJECT' | 'REVIEW';
    details: {
        primaryKey: boolean; // T-02
        lifecycle: boolean; // T-03
        tableType: boolean; // T-04
    };
    reasons: string[];
    actionItems?: ActionItem[]; // P0: Specific remediation steps
}

export interface TableRuleScore {
    naming: number; // T-01
    behavior: number; // T-05
    comment: number; // T-06
    total: number;
}


export type GovernanceStatus = 'S0' | 'S1' | 'S2' | 'S3';

// V2.4: Table Semantic Stage
export type TableSemanticStage =
    | 'NOT_STARTED'        // 未开始语义建模
    | 'FIELD_PENDING'      // 字段语义待确认
    | 'MODELING_IN_PROGRESS' // 语义建模进行中
    | 'READY_FOR_OBJECT';  // 可进入对象建模

// V2.4: Field Semantic Status
export type FieldSemanticStatus =
    | 'UNANALYZED'
    | 'SUGGESTED'
    | 'RULE_MATCHED'
    | 'DECIDED'
    | 'PARTIALLY_DECIDED'
    | 'BLOCKED';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface ReviewStats {
    pendingReviewFields: number;
    gateFailedItems: number;
    riskItems: number;
}

export interface RunSummary {
    runId: string;
    status: 'queued' | 'running' | 'success' | 'failed';
    startedAt?: string;
    finishedAt?: string;
    sampleRows?: number;
    ruleVersion?: string;
    modelVersion?: string;
    queueInfo?: string;
    estimateTime?: string;
}

export type SemanticRole =
    | 'Identifier'
    | 'ForeignKey'
    | 'Status'
    | 'Time'
    | 'Measure'
    | 'Attribute'
    | 'Audit'
    | 'Technical'
    | 'BusAttr' // Keep for backward compatibility if needed, or map it
    | 'EventHint'; // Keep for backward compatibility

// V2 Beta: Object Type Classification
export type ObjectType = 'entity' | 'event' | 'state' | 'rule' | 'attribute';

// V2 Beta: Business Domain Options
export const BUSINESS_DOMAINS = [
    '交易域', '用户域', '商品域', '营销域', '供应链域',
    '财务域', '客服域', '风控域', '数据域',
    '组织人事域', '薪酬福利域', '考勤工时域', '人才发展域',
    '其他'
] as const;
export type BusinessDomain = typeof BUSINESS_DOMAINS[number];

// V2 Beta: Data Layer Options
export const DATA_LAYERS = ['ODS', 'DWD', 'DWS', 'ADS', 'DIM', '其他'] as const;
export type DataLayer = typeof DATA_LAYERS[number];

// V2 Beta: Update Strategy Options
export const UPDATE_STRATEGIES = ['增量追加', '全量覆盖', '缓慢变化维'] as const;
export type UpdateStrategy = typeof UPDATE_STRATEGIES[number];

export interface FieldSemanticProfile {
    fieldName: string;
    dataType: string;
    role: SemanticRole;
    roleConfidence: number;
    sensitivity: 'L1' | 'L2' | 'L3' | 'L4';
    quality: 'A' | 'B' | 'C' | 'D';
    aiSuggestion?: string;
    ruleHit?: string;
    // V2 Beta: Field-level enhancements
    businessDefinition?: string;
    // logicalType?: string; // Removed or commented if not needed, or just keep
    logicalType?: string;
    unit?: string;
    governanceStatus?: GovernanceStatus;
    // V2.4 Field Semantic Extensions
    semanticStatus?: FieldSemanticStatus;
    riskLevel?: RiskLevel;
    tags?: string[];
}

export interface TableSemanticProfile {
    tableName: string;
    gateResult: SemanticGateResult;
    ruleScore: TableRuleScore;
    aiScore: number;
    fieldScore: number; // New: aggregate score from fields
    finalScore: number; // 0.55*AI + 0.45*Rule
    scoreBreakdown?: { rule: number; ai: number; field: number };

    businessName: string;
    description: string;
    tags: string[];

    fields: FieldSemanticProfile[];

    // Dual-dimension specific
    aiEvidence: string[];
    ruleEvidence: string[];
    aiEvidenceItems?: { field: string; reason: string; weight: number }[];

    // V2 Beta: Business Identity Dimension
    objectType?: ObjectType;
    objectTypeReason?: string;
    businessDomain?: BusinessDomain;
    dataGrain?: string;

    // V2 Beta: Lifecycle Dimension
    dataLayer?: DataLayer;
    updateStrategy?: UpdateStrategy;
    retentionPeriod?: string;

    // V2 Beta: Quality & Security Dimension
    securityLevel?: 'L1' | 'L2' | 'L3' | 'L4';
    dataOwner?: string;

    // Extra for UI
    relationships?: { targetTable: string; type: string; key: string; description: string }[];
    qualityScore?: number;
    analysisStep?: 'idle' | 'analyzing' | 'done';
    governanceStatus?: GovernanceStatus;
    reviewStats?: ReviewStats;
    lastRun?: RunSummary;
    confirmedBy?: string;
    confirmedAt?: string;
    confirmScope?: string;
    // V2.4 Table Extensions
    semanticStage?: TableSemanticStage;
}

export interface PreviewField {
    col: string;
    type: string;
    attr: string;
    conf: 'High' | 'Medium' | 'Low';
}

export interface AICandidate {
    id: string;
    sourceTable: string;
    suggestedName: string;
    confidence: number;
    reason: string;
    scores: {
        nameMatch: number;
        fieldMatch: number;
        dataSample: number;
    };
    mappedFields: number;
    status: 'pending' | 'accepted' | 'ignored';
    previewFields: PreviewField[];
}

export interface BusinessField {
    name: string;
    code?: string; // Added code for physical field mapping
    type: string;
    required?: boolean;
    description?: string;
    role?: SemanticRole; // e.g., 'Identifier', 'Measure'
}

export type ObjectStatus = 'candidate' | 'pending' | 'draft' | 'published' | 'deprecated' | 'archived';

export interface BusinessObject {
    id: string;
    name: string;
    code: string;
    type?: 'CORE_ENTITY' | 'EVENT_ENTITY' | 'RELATION_ENTITY'; // Added
    domain: string;
    owner: string;
    status: ObjectStatus;
    version?: string;
    description?: string;

    // Core modeling attributes
    fields: BusinessField[];
    mappingProgress?: number; // 0-1

    // Candidate/Conflict attributes
    confidence?: number; // 0-100
    conflictFlag?: boolean;
    conflictType?: ('DUPLICATE_NAME' | 'TypeMismatch')[];
    source?: 'AI' | 'MANUAL';
    evidence?: {
        sourceTables: string[];
        keyFields: string[];
        fieldCoverage?: number;
    };

    // Legacy support (optional)
    sourceTables?: string[];
}

export interface ObjectSuggestion {
    objectId: string; // The candidate object ID
    suggestionId: string;
    suggestedName: string;
    suggestedType: 'CORE_ENTITY' | 'EVENT_ENTITY' | 'RELATION_ENTITY';
    confidence: number;
    evidence: {
        sourceTables: string[];
        keyFields: string[];
        fieldCoverage?: number;
    };
    attributes: {
        attrName: string;
        mappedFields: { table: string; field: string }[];
        semantic?: { termId?: string; role: SemanticRole; tags: string[] };
        riskHints?: { quality: string; security: string };
    }[];
}

export interface Decision {
    decisionId: string;
    targetType: 'BUSINESS_OBJECT';
    targetId: string;
    action: 'ACCEPT' | 'ACCEPT_WITH_EDIT' | 'REJECT' | 'MERGE' | 'BIND_EXISTING' | 'KEEP_ONE';
    payload?: any;
    decidedBy: string;
    decidedAt: string;
}
// Logs and History
export interface AuditLogEntry {
    id: string;
    tableId: string;
    field?: string;
    action: 'accept' | 'override' | 'pending' | 'confirm';
    source?: string;
    reason?: string;
    timestamp: string;
}

export interface UpgradeHistoryEntry {
    id: string;
    tableId: string;
    tableName: string;
    beforeState: any;
    afterState: any;
    timestamp: string;
    rolledBack: boolean;
}
