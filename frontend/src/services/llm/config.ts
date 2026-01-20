/**
 * LLM Service Configuration
 * LLM 服务配置管理
 */

import { LLMConfig, LLMProvider } from './types';

// 默认配置
const DEFAULT_CONFIG: LLMConfig = {
    provider: (import.meta.env.VITE_LLM_PROVIDER as LLMProvider) || 'openai',
    baseUrl: import.meta.env.VITE_LLM_API_BASE_URL || '/api/llm', // 后端代理地址
    timeout: 30000, // 30秒超时
};

// 可配置的 LLM 提供商
export const SUPPORTED_PROVIDERS: Record<LLMProvider, { name: string; models: string[] }> = {
    openai: {
        name: 'OpenAI GPT',
        models: ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    },
    claude: {
        name: 'Anthropic Claude',
        models: ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229', 'claude-3-haiku-20240307'],
    },
    azure: {
        name: 'Azure OpenAI',
        models: ['gpt-4', 'gpt-35-turbo'],
    },
    local: {
        name: 'Local Model',
        models: ['qwen', 'llama', 'custom'],
    },
};

class LLMConfigManager {
    private config: LLMConfig;

    constructor() {
        this.config = { ...DEFAULT_CONFIG };
    }

    /**
     * 获取当前配置
     */
    getConfig(): LLMConfig {
        return { ...this.config };
    }

    /**
     * 更新配置
     */
    updateConfig(newConfig: Partial<LLMConfig>): void {
        this.config = {
            ...this.config,
            ...newConfig,
        };
    }

    /**
     * 设置 Provider
     */
    setProvider(provider: LLMProvider): void {
        this.config.provider = provider;
    }

    /**
     * 获取当前 Provider
     */
    getProvider(): LLMProvider {
        return this.config.provider;
    }

    /**
     * 设置模型
     */
    setModel(model: string): void {
        this.config.model = model;
    }

    /**
     * 获取 API Base URL
     */
    getBaseUrl(): string {
        return this.config.baseUrl;
    }

    /**
     * 重置为默认配置
     */
    reset(): void {
        this.config = { ...DEFAULT_CONFIG };
    }
}

// 导出单例
export const llmConfigManager = new LLMConfigManager();

// 导出配置获取函数
export const getLLMConfig = () => llmConfigManager.getConfig();
