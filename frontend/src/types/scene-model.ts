
// 1. Scene Template Types
export type SceneType = 'government_one_service' | 'enterprise_hr' | 'enterprise_supply_chain' | 'generic';

export interface CapabilityConfig {
    base: {
        business_object: boolean;
        state_machine: boolean;
        actions: boolean;
        roles: boolean;
        artifacts: boolean;
        rules: boolean;
    };
    government?: {
        enabled: boolean;
        multi_department_verification: boolean;
        statutory_time_limit: boolean;
        reason_code: boolean;
        audit_and_supervision: boolean;
    };
    enterprise?: {
        hr?: { [key: string]: boolean };
        supply_chain?: { [key: string]: boolean };
    };
}

export interface SceneTemplate {
    template_id: string;
    template_name: string;
    scene_type: SceneType;
    base_capabilities: string[];
    required_items: string[];
    capability_modules: CapabilityConfig;
}

// 2. Scene Data Extension
// Note: This extends the existing scenario data concept
export interface SceneExtension {
    template_id?: string;
    capability_config?: CapabilityConfig;
    // Status alignment with legacy: 'draft' | 'analyzing' | 'extracted' | 'modeled' | 'published';
}

// 3. AI Recognition Contract (Strict JSON Schema)
export interface CandidateItem {
    id: string;
    type: string;
    label: string;
    normalized_name?: string;
    confidence: number;
    source_span?: { start: number; end: number; text: string };
    required_by_template?: boolean;
    status: 'pending' | 'accepted' | 'rejected' | 'edited';
    mapping?: Record<string, any>; // Flexible storage for type-specific fields (e.g., actor_role, duration)
}

export interface RelationCandidate {
    from: string;
    rel: string; // e.g., '1-n', '1-1'
    to: string;
}

export interface FieldSuggestion {
    object: string; // Object label or ID
    fields: {
        name: string;
        type: string;
        required: boolean;
        description?: string;
    }[];
}

export interface CandidateSet {
    business_objects: {
        primary_object: CandidateItem;
        related_objects: CandidateItem[];
        relations: RelationCandidate[];
        field_suggestions: FieldSuggestion[];
    };
    roles: CandidateItem[];
    actions: CandidateItem[];
    artifacts: {
        materials: CandidateItem[];
        data_checks: CandidateItem[];
    };
    state_machine: {
        primary_object: string;
        states: { code: string; name: string }[];
        transitions: { from: string; to: string; trigger_action: string; guards?: string[] }[];
    };
    constraints: {
        time_limits: CandidateItem[];
        eligibility_rules: CandidateItem[];
        priority_rules?: CandidateItem[];
        exceptions?: CandidateItem[];
    };
}

export interface GapAnalysis {
    required_but_missing: { key: string; message: string }[];
    suggested_but_missing: { key: string; message: string }[];
}

export interface RecognitionRun {
    run_id: string;
    scene_id: string;
    model_version: string; // e.g., 'topdown-vNext'
    confidence_overall: number;
    coverage_score: number;
    candidates: CandidateSet;
    gap_analysis: GapAnalysis;
    created_at: string;
}

// 4. Business Model (Working Copy)
export interface BusinessModel {
    model_id: string;
    scene_id: string;
    status: 'draft' | 'incomplete' | 'ready_to_publish' | 'published';
    current_version_id: string | null;
    published_version_id: string | null;

    // The actual model content, accepted from candidates
    working_copy: {
        template_id: string; // Bound template
        primary_business_object: CandidateItem;
        business_objects: CandidateItem[]; // Related objects
        relations: { from: string; rel: string; to: string }[];
        field_suggestions: { object: string; fields: any[] }[];

        roles: CandidateItem[];
        actions: CandidateItem[];
        artifacts: {
            materials: CandidateItem[];
            data_checks: CandidateItem[];
        };
        state_machine: {
            primary_object: string;
            states: { code: string; name: string; is_terminal?: boolean }[];
            transitions: { from: string; to: string; trigger_action: string; guards?: string[] }[];
        };
        rules: CandidateItem[]; // Mapping to constraints
    };

    validation_result?: {
        score: number;
        missing_required: string[];
    };

    created_at: string;
    updated_at: string;
}

export interface ModelVersion {
    version_id: string;
    model_id: string;
    version: string; // e.g., v0.1
    snapshot_json: BusinessModel['working_copy'];
    created_at: string;
}
