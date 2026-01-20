// ==========================================
// Data Catalog Component Types
// ==========================================

export interface Asset {
    id: string;
    name: string;
    code: string;
    type: string;
    categoryType: 'business_object' | 'logical_view' | 'interface';
    owner: string;
    quality: number;
    status?: string;
    tags: string[];
    lastUpdate: string;
    description: string;
    category: string;
    dataVolume: string;
    updateFreq: string;
    accessLevel: string;
    format?: string;
    lineage?: string[];
    applications: string[];
    fields?: Field[];
    usageCount?: number;
    qualityMetrics?: QualityMetrics;
    sampleData?: any[];
}

export interface Field {
    name: string;
    code: string;
    type: string;
    businessType: string;
    length?: number;
    nullable: boolean;
    primaryKey: boolean;
    indexed?: boolean;
    sensitive: boolean;
    description?: string;
    defaultValue?: any;
}

export interface QualityMetrics {
    completeness: number;
    accuracy: number;
    timeliness: number;
    consistency: number;
    validity: number;
    uniqueness: number;
}

export interface FilterOptions {
    qualityRange: { min: number; max: number };
    owners: string[];
    categories: string[];
    accessLevels: string[];
    updateFreqs: string[];
    tags: string[];
    hasSensitiveFields: boolean;
    hasPrimaryKey: boolean;
    applications: string[];
}

export interface SavedFilter {
    id: string;
    name: string;
    filters: Partial<FilterOptions>;
}

export type SearchMode = 'keyword' | 'semantic' | 'field';
export type SortBy = 'relevance' | 'quality' | 'updateTime' | 'usage';
export type ViewMode = 'card' | 'list';
export type DetailTab = 'basic' | 'fields' | 'sample' | 'quality' | 'lineage';
export type ActiveTab = 'all' | 'business_object' | 'logical_view' | 'interface';
