/**
 * Scenario Data Model
 * 场景数据模型定义
 */

import { AnalysisResultVNext } from './analysisVNext';
import { CapabilityConfig, BusinessModel, RecognitionRun, ModelVersion } from './scene-model';

export interface ScenarioData {
    id: string;
    title: string;
    description: string;
    status: 'draft' | 'analyzing' | 'extracted' | 'modeled';

    // 分析结果 (vNext)
    analysisResult?: AnalysisResultVNext;

    // Phase 2: Template Support & Working Copy
    template_id?: string;
    capability_config?: CapabilityConfig;
    recognitionRun?: RecognitionRun;
    workingCopy?: BusinessModel['working_copy'];
    versions?: ModelVersion[]; // Published versions

    // 生成的业务对象
    proposedObjects?: BusinessObjectProposal[];

    // 元数据
    metadata: {
        createdAt: string;
        updatedAt: string;
        lastModified: string;
        version: number;
    };

    // 来源信息（如果是从政策文件导入）
    source?: {
        type: 'manual' | 'policy_import';
        fileName?: string;
        fileUrl?: string;
        sourceLocation?: {
            chapter?: string;
            article?: string;
            pageNumber?: number;
        };
    };
}

export interface BusinessObjectProposal {
    name: string;
    type: 'Subject' | 'BusinessObject' | 'Resource';
    description: string;
    attributes: BusinessObjectAttribute[];
    behaviors?: string[];
    states?: string[];
}

export interface BusinessObjectAttribute {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'date' | 'object';
    description?: string;
    required?: boolean;
}

/**
 * 场景摘要数据 (用于列表展示)
 */
export type ScenarioSummary = Omit<ScenarioData, 'analysisResult'> & {
    analysisResult?: never; // 明确排除
};

/**
 * 场景列表数据
 */
export interface ScenarioListData {
    scenarios: ScenarioSummary[];
    total: number;
    lastSyncAt?: string;
}

/**
 * 存储配置
 */
export interface StorageConfig {
    // 使用本地存储还是远程 API
    mode: 'local' | 'remote' | 'hybrid';
    // 远程 API 基础 URL
    apiBaseUrl?: string;
    // 本地存储键前缀
    localStoragePrefix: string;
    // 自动保存间隔（毫秒）
    autoSaveInterval: number;
}

/**
 * 默认配置
 */
export const DEFAULT_STORAGE_CONFIG: StorageConfig = {
    mode: 'local', // 默认使用本地存储
    localStoragePrefix: 'semantic_scenario_',
    autoSaveInterval: 5000, // 5秒自动保存
};
