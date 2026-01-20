
// import { v4 as uuidv4 } from 'uuid';
const uuidv4 = () => Math.random().toString(36).substring(2, 15);

// --- Types ---

export interface ProfileSignals {
    nullRatio: number;      // 0.0 - 1.0 (e.g. 0.05 = 5%)
    distinctCount: number;
    distinctRatio?: number; // 0.0 - 1.0
    top3Concentration: number; // 0.0 - 1.0 (Sum of top 3 freq / total)
    typeParseRate?: number;    // 0.0 - 1.0 (e.g. is it valid timestamp)
    min?: string | number;
    max?: string | number;
    topValues?: { value: string; count: number; ratio: number }[];
    rowCount?: number;
}

export type RiskFlag =
    | 'HIGH_NULL'         // > 80% null
    | 'LOW_UNIQUENESS'    // distinct count < 3% for ID
    | 'ENUM_NOT_STABLE'   // High cardinality for Enum
    | 'DIRTY_TYPE'        // Parse rate < 90%
    | 'SENSITIVE_L3'      // PII Detected
    | 'SENSITIVE_L4';

export interface FieldProfileSnapshot {
    id: string; // runId or snapshotId
    logicalViewId: string; // or logicalTableId
    tableName: string;
    fieldName: string;
    signals: ProfileSignals;
    riskFlags: RiskFlag[];
    computedAt: string; // ISO String
}

export interface ProfileRunRequest {
    logicalViewId?: string;
    tableName: string;
    sampleRatio?: number; // default 0.01
}

export interface ProfileRunResponse {
    jobId: string;
    status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED';
    estimatedTime: number; // seconds
}

// --- Mock Service ---

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock Data Generators
const generateMockSignals = (fieldName: string, type: string): { signals: ProfileSignals, risks: RiskFlag[] } => {
    const signals: ProfileSignals = {
        nullRatio: Math.random() * 0.1, // Default low null
        distinctCount: Math.floor(Math.random() * 1000) + 1,
        top3Concentration: Math.random() * 0.5,
        rowCount: 10000 + Math.floor(Math.random() * 5000), // Random row count 10k-15k
        topValues: []
    };
    const risks: RiskFlag[] = [];

    // Simulate specifics based on field name hints
    if (/status|state|type/i.test(fieldName)) {
        signals.distinctCount = Math.floor(Math.random() * 5) + 2; // 2-6
        signals.top3Concentration = 0.95; // High concentration
        signals.nullRatio = 0.01;
        signals.topValues = [
            { value: 'ACTIVE', count: 800, ratio: 0.8 },
            { value: 'INACTIVE', count: 150, ratio: 0.15 },
            { value: 'PENDING', count: 50, ratio: 0.05 }
        ];
    } else if (/id$|code$/i.test(fieldName)) {
        signals.distinctCount = 10000;
        signals.distinctRatio = 0.99;
        signals.nullRatio = 0.0;
        signals.top3Concentration = 0.001;
    } else if (/time|date/i.test(fieldName)) {
        signals.typeParseRate = Math.random() > 0.9 ? 1.0 : 0.85; // Sometimes dirty
        if (signals.typeParseRate < 0.9) risks.push('DIRTY_TYPE');
    }

    // Inject Risks randomly
    if (Math.random() < 0.1) {
        signals.nullRatio = 0.85; // High null
        risks.push('HIGH_NULL');
    }

    if (Math.random() < 0.05 && /card|phone/i.test(fieldName)) {
        risks.push('SENSITIVE_L3');
    }

    return { signals, risks };
};

class ProfileService {
    // Cache for mock results
    private cache: Map<string, FieldProfileSnapshot[]> = new Map();

    async runProfile(req: ProfileRunRequest): Promise<ProfileRunResponse> {
        console.log(`[ProfileService] Requesting run for table: ${req.tableName}`);
        await wait(600); // Simulate API latency
        return {
            jobId: uuidv4(),
            status: 'QUEUED',
            estimatedTime: 2 // 2 seconds
        };
    }

    async getSignals(tableName: string, fields: string[]): Promise<FieldProfileSnapshot[]> {
        const cacheKey = `table:${tableName}`;

        if (this.cache.has(cacheKey)) {
            // Return cached or regenerate partial?
            // For mock, just return cached to be stable during session
            // return this.cache.get(cacheKey)!;
        }

        console.log(`[ProfileService] Fetching signals for ${tableName}`);
        await wait(800); // Simulate processing/fetching

        const snapshots: FieldProfileSnapshot[] = fields.map(field => {
            // We need a way to guess type, but here we just pass simple hint
            const type = 'string';
            const { signals, risks } = generateMockSignals(field, type);
            return {
                id: uuidv4(),
                logicalViewId: 'mock-lv-001',
                tableName,
                fieldName: field,
                signals,
                riskFlags: risks,
                computedAt: new Date().toISOString()
            };
        });

        this.cache.set(cacheKey, snapshots);
        return snapshots;
    }
}

export const profileService = new ProfileService();
