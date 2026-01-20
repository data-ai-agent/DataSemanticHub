export interface HeaderInfo {
    scenario_id: string;
    scenario_name: string;
    model_version: string;
    confidence_overall: number;
    coverage_score: number;
    risk_flags: string[];
}

export interface BaseItem {
    item_id: string;
    type: 'BO' | 'ROLE' | 'ACTION' | 'ARTIFACT' | 'STATE' | 'CONSTRAINT';
    label: string;
    normalized_name: string;
    source_span: string; // Original text fragment for highlighting
    confidence: number;
    status: 'suggested' | 'accepted' | 'edited' | 'rejected';
    comments?: string;
    evidence?: string;
}

export interface BusinessObjectItem extends BaseItem {
    type: 'BO';
    mapping: {
        object_id: string;
        object_category: string; // e.g. application, party, decision
    };
}

export interface BusinessObjectRelations {
    primary_object: BusinessObjectItem;
    related_objects: BusinessObjectItem[];
    object_fields_suggested: {
        object: string; // Object Normalized Name
        fields: {
            field_name: string;
            field_type: string;
            required: boolean;
            source: 'system' | 'user_input' | 'relation' | 'computed';
            privacy_level: string; // L1, L2, etc.
        }[];
    }[];
    object_relations: {
        from_object: string;
        relation: '1-1' | '1-n' | 'n-n';
        to_object: string;
    }[];
}

export interface RoleItem extends BaseItem {
    type: 'ROLE';
    mapping: {
        actor_type: 'person' | 'org' | 'system';
        org_unit?: string;
        responsibility: string[];
    };
}

export interface ActionItem extends BaseItem {
    type: 'ACTION';
    mapping: {
        action_category: string; // e.g. application, verification
        actor_role: string; // Reference to Role Normalized Name
        target_object: string; // Reference to Object Normalized Name
        pre_conditions?: string[];
        post_state?: string;
    };
}

export interface ArtifactMaterialItem extends BaseItem {
    type: 'ARTIFACT';
    mapping: {
        material_type: string;
        required: boolean | 'conditional';
        format: string[];
        privacy_level: string;
        mapped_to_object_field?: string;
    };
}

export interface ArtifactCheckItem extends BaseItem {
    type: 'ARTIFACT';
    mapping: {
        check_type: string; // e.g., HUKOU
        data_source_org: string;
        data_source_system?: string;
        access_mode: 'authorized_query' | 'shared_push' | 'manual';
        result_schema: string[];
        mapped_to_check_item?: string;
    };
}

export interface StateMachineDefinition {
    primary_object: string; // Ref to BO
    states: {
        state_code: string;
        state_name: string;
        is_terminal: boolean;
        confidence: number;
    }[];
    transitions: {
        from_state: string;
        to_state: string;
        trigger_action: string; // Ref to Action
        guard_conditions: string[];
        sla_deadline_ref?: string; // Ref to Constraint
        notify_templates?: string[];
    }[];
}

export interface TimeLimitConstraint extends BaseItem {
    type: 'CONSTRAINT';
    mapping: {
        duration: number;
        unit: 'workday' | 'day' | 'hour';
        start_event: string;
        breach_action: string;
    };
}

export interface RuleConstraint extends BaseItem {
    type: 'CONSTRAINT';
    mapping: {
        rule_expression?: string;
        rule_version?: string;
        inputs: string[];
        outputs: string[];
        reason_code: string;
    };
}

export interface ConstraintCollection {
    time_limits: TimeLimitConstraint[];
    eligibility_rules: RuleConstraint[];
    priority_rules: RuleConstraint[];
    exceptions: RuleConstraint[];
}

export interface OutputConfig {
    namespace: string;
    version: string;
    publish_mode: 'draft' | 'published';
    artifacts: {
        name: string;
        enabled: boolean;
    }[];
    generate_preview_ready: boolean;
}

export interface AnalysisResultVNext {
    header: HeaderInfo;
    source_text: string;
    elements: {
        business_objects: BusinessObjectRelations;
        roles: { roles: RoleItem[] };
        actions: { actions: ActionItem[] };
        artifacts: {
            materials: ArtifactMaterialItem[];
            data_checks: ArtifactCheckItem[];
        };
        state_machine: StateMachineDefinition;
        constraints: ConstraintCollection;
    };
    outputs: OutputConfig;
}
