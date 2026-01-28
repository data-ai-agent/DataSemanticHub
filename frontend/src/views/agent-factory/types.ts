export enum AgentType {
  QNA = 'QNA',
  SEM = 'SEMANTIC_UNDERSTANDING',
  KG = 'KNOWLEDGE_GRAPH',
  REPORT = 'REPORTING',
  ASSISTANT = 'ASSISTANT'
}

export enum AgentStatus {
  DRAFT = 'DRAFT',
  STABLE = 'STABLE',
  CANARY = 'CANARY',
  DEPRECATED = 'DEPRECATED'
}

export type HealthStatus = 'HEALTHY' | 'WARNING' | 'CRITICAL';
export type GateStatus = 'PASS' | 'FAIL' | 'PENDING' | 'UNKNOWN';

export interface Template {
  id: string;
  name: string;
  description: string;
  type: AgentType;
  status: AgentStatus;
  version: string;
  updatedAt: string;
  owner: string;

  // Tagging & Metadata
  tags: string[];
  domain?: string;
  scenario?: string;

  // Governance & Deployment
  health: HealthStatus;
  deployment: {
    prodStable?: string;
    prodCanary?: string;
    canaryPercent?: number;
  };
  governance: {
    gateStatus: GateStatus;
    runtimePack?: string;
    semanticVersion?: string;
  };

  // Metrics
  stats: {
    calls: number;
    successRate: number;
    p95: number;
    cost: number;
    trends: {
      calls: number;
      successRate: number;
      p95: number;
      cost: number;
    };
  };
}

export interface TraceStep {
  id: string;
  stage: 'Parse' | 'Ground' | 'Plan' | 'Generate' | 'Execute' | 'Explain';
  status: 'success' | 'error' | 'running' | 'pending';
  duration: number;
  details: string;
}

// Workflow & Validation Types
export type ValidationLevel = 'BLOCKER' | 'WARNING' | 'SUGGESTION';

export interface ValidationIssue {
  id: string;
  level: ValidationLevel;
  title: string;
  location: string;
  suggestion?: string;
}

export interface WorkflowModule {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  dependencies: { type: 'TOOL' | 'KNOWLEDGE' | 'POLICY', name: string }[];
}

export interface InputField {
  name: string;
  type: 'String' | 'Number' | 'Boolean' | 'Object' | 'Array';
  required: boolean;
  description: string;
  defaultValue?: string;
}
