/**
 * LLM Service Type Definitions
 * 定义 LLM 服务的所有接口类型
 */

import { AnalysisResultVNext } from '../../types/analysisVNext';

// ============ 业务要素提取 ============

export interface ExtractedElements {
    subjects: string[];      // 主体（谁）
    actions: string[];       // 行为（做什么）
    objects: string[];       // 客体/材料（涉及什么）
    states: string[];        // 状态（什么变化）
    rules?: string[];        // 规则（约束条件）
}

export interface ScenarioAnalysisRequest {
    description: string;     // 场景描述文本
    context?: string;        // 可选的上下文信息
}

export type ScenarioAnalysisResult = AnalysisResultVNext;

// ============ 政策文件解析 ============

export interface PolicyParseRequest {
    fileUrl: string;         // 文件 URL（后端返回）
    fileName: string;
    fileType: 'pdf' | 'docx' | 'image';
}

export interface ScenarioChunk {
    id: string;
    title: string;           // 场景标题
    description: string;     // 场景描述
    elements: ExtractedElements;
    confidence: number;      // 该场景的置信度
    sourceLocation?: {       // 来源位置
        chapter?: string;
        article?: string;
        pageNumber?: number;
    };
}

export interface PolicyParseResult {
    scenarios: ScenarioChunk[];
    metadata: {
        totalPages?: number;
        processedAt: string;
        warnings?: string[];
    };
}

// ============ 业务对象生成 ============

export interface BusinessObjectAttribute {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'date' | 'object';
    description?: string;
    required?: boolean;
}

export interface BusinessObject {
    name: string;
    type: 'Subject' | 'BusinessObject' | 'Resource';
    description: string;
    attributes: BusinessObjectAttribute[];
    behaviors?: string[];    // 主体的行为
    states?: string[];       // 对象的状态
}

export interface GenerateObjectsRequest {
    elements: ExtractedElements;
    scenarioContext?: string;
}

export interface GenerateObjectsResult {
    objects: BusinessObject[];
    relationships?: Array<{
        from: string;
        to: string;
        type: string;
    }>;
}

// ============ LLM Provider 配置 ============

export type LLMProvider = 'openai' | 'claude' | 'azure' | 'local';

export interface LLMConfig {
    provider: LLMProvider;
    apiKey?: string;         // 前端不应该设置，由后端管理
    baseUrl: string;         // 后端 API 地址
    model?: string;          // 模型名称（可选，后端可能有默认值）
    timeout?: number;        // 超时时间（毫秒）
}

// ============ 通用响应结构 ============

export interface LLMResponse<T> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
    };
}
