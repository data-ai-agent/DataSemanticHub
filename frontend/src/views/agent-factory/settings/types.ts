// Model Factory Settings Types

export type SettingsTab = 'MODELS' | 'SECRETS' | 'QUOTAS';

export interface GovernanceConfig {
    // Stability
    concurrencyLimit: number;
    requestTimeout: number; // ms

    // Retry
    maxRetries: number;
    retryBackoff: 'FIXED' | 'EXPONENTIAL';
    retryStatusCodes: string[];

    // Circuit Breaker
    circuitBreakerThreshold: number;
    circuitBreakerReset: number;

    // Rate Limit
    rateLimitRPM?: number;
    rateLimitTPM?: number;

    // Fallback & Degrade
    fallbackStrategy: 'NONE' | 'FALLBACK_MODEL' | 'FALLBACK_PROVIDER' | 'DEGRADE';
    fallbackTarget?: string;

    degradeOptions: {
        useSmallerModel: boolean;
        disableTools: boolean;
        conciseReply: boolean;
    };
}

export interface ModelDef {
    id: string;
    name: string;
    enabled: boolean;
    contextWindow: number;
    maxOutputTokens?: number;
    inputPrice?: number;
    outputPrice?: number;

    // Logical Aliases
    aliases: string[];

    // Capabilities & Validation
    capabilities: {
        functionCall: boolean;
        jsonMode: boolean;
        vision: boolean;
        streaming: boolean;
    };

    // Lifecycle & Deprecation
    lifecycle: {
        status: 'ACTIVE' | 'DEPRECATED' | 'EOL';
        eolDate?: string;
        replacedBy?: string;
    };

    // Routing Strategy
    routing: {
        stages: ('PARSE' | 'GENERATE' | 'EXPLAIN')[];
        priority: number;
    };

    // Optional Model-level governance override
    governance?: Partial<GovernanceConfig>;
}

export type EndpointStatus = 'NOT_CONFIGURED' | 'READY' | 'PARTIAL' | 'UNAVAILABLE' | 'DISABLED';
export type EnvType = 'DEV' | 'STAGING' | 'PROD';
export type ProtocolType = 'OPENAI' | 'AZURE' | 'ANTHROPIC' | 'GOOGLE' | 'NATIVE' | 'LOCAL';

export interface NetworkConfig {
    proxyUrl?: string;
    customHeaders: { key: string; value: string }[];
    skipTlsVerify: boolean;
    ipWhitelist?: string;
}

export interface EndpointDef {
    id: string;
    name: string;
    environment: EnvType;
    protocol: ProtocolType;
    baseUrl: string;
    apiKey: string;
    timeout: number;
    retry: number;
    weight: number;
    status: EndpointStatus;

    // Network & Security
    network: NetworkConfig;

    // Health Check Data
    health?: {
        latency: number;
        successRate: number;
        lastCheck: string;
        message?: string;
        statusCode?: number;
        details?: string;
    };
}

export interface ProviderDef {
    id: string;
    name: string;
    region: 'DOMESTIC' | 'FOREIGN' | 'LOCAL';
    description: string;
    endpoints: EndpointDef[];
    models: ModelDef[];
    isCustom?: boolean;

    // Endpoint Routing Strategy
    routingStrategy: 'WEIGHTED' | 'LATENCY_BASED' | 'ERROR_RATE';

    // Global Provider Governance
    governance: GovernanceConfig;
}

export interface ReferenceItem {
    id: string;
    name: string;
    type: 'MODEL' | 'TOOL' | 'CONNECTOR' | 'AGENT';
    status: 'ACTIVE' | 'INACTIVE';
}

export interface Secret {
    id: string;
    key: string;
    value: string;
    type: 'API_KEY' | 'DB_URL' | 'CERTIFICATE' | 'TOKEN';
    storage: 'INTERNAL' | 'AWS_SECRETS' | 'VAULT';
    description: string;
    owner: string;
    status: 'ACTIVE' | 'EXPIRED' | 'ROTATING';
    rotationPolicy: 'MANUAL' | '30_DAYS' | '90_DAYS';
    lastUsed: string;
    createdAt: string;
    updatedAt: string;
    references: ReferenceItem[];
}

export type QuotaScope = 'TENANT' | 'DEPARTMENT' | 'APP' | 'AGENT' | 'USER' | 'MODEL';

export interface QuotaActionLog {
    id: string;
    timestamp: string;
    trigger: string;
    action: string;
    result: string;
}

export interface Quota {
    id: string;
    targetName: string;
    scope: QuotaScope;
    budgetLimit: number;
    budgetUsed: number;
    tokenLimitMonthly: number;
    tokenUsedMonthly: number;
    alertThreshold: number;
    status: 'NORMAL' | 'WARNING' | 'EXCEEDED';

    forecast: {
        predictedUsage: number;
        status: 'ON_TRACK' | 'OVER_BUDGET';
        anomalies: { date: string; description: string; severity: 'HIGH' | 'MEDIUM' }[];
    };

    breakdown?: {
        capability: { name: string; value: number; color: string }[];
        topTemplates: { name: string; cost: number }[];
    };

    strategy: {
        overLimitAction: 'REJECT' | 'DEGRADE' | 'NOTIFY_ONLY' | 'SWITCH_MODEL' | 'STRUCTURE_ONLY';
        fallbackModel?: string;
        criticalTemplates: string[];
    };

    actionLog: QuotaActionLog[];
}

export const DEFAULT_GOVERNANCE: GovernanceConfig = {
    concurrencyLimit: 50,
    requestTimeout: 60000,
    maxRetries: 3,
    retryBackoff: 'EXPONENTIAL',
    retryStatusCodes: ['429', '500', '502', '503'],
    circuitBreakerThreshold: 10,
    circuitBreakerReset: 30,
    rateLimitRPM: 1000,
    rateLimitTPM: 100000,
    fallbackStrategy: 'DEGRADE',
    degradeOptions: {
        useSmallerModel: true,
        disableTools: false,
        conciseReply: true
    }
};
