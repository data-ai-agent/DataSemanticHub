/**
 * LLM Service - Main Service Class
 * LLM 服务主类，负责与后端 API 通信
 */

import {
    ScenarioAnalysisRequest,
    ScenarioAnalysisResult,
    PolicyParseRequest,
    PolicyParseResult,
    GenerateObjectsRequest,
    GenerateObjectsResult,
    LLMResponse,
} from './types';
import { getLLMConfig } from './config';
import { mockAnalysisResultVNext } from '../../data/mockAnalysisVNext';
import { MOCK_RECOGNITION_RUN } from '../../data/mockRecognitionRun';
import { RecognitionRun } from '../../types/scene-model';

class LLMService {
    /**
     * 分析场景描述，提取业务要素
     */
    async analyzeScenario(
        description: string,
        context?: string
    ): Promise<ScenarioAnalysisResult> {
        const config = getLLMConfig();
        const request: ScenarioAnalysisRequest = { description, context };

        try {
            const response = await fetch(`${config.baseUrl}/analyze-scenario`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...request,
                    provider: config.provider,
                    model: config.model,
                }),
                signal: AbortSignal.timeout(config.timeout || 30000),
            });

            // 如果是404，说明后端未实现，使用fallback
            if (response.status === 404) {
                console.warn('🔄 Backend API not implemented, using mock data fallback');
                return this.mockAnalyzeScenario(description);
            }

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result: LLMResponse<ScenarioAnalysisResult> = await response.json();

            if (!result.success || !result.data) {
                throw new Error(result.error?.message || 'Analysis failed');
            }

            return result.data;
        } catch (error) {
            console.error('LLM Service - analyzeScenario error:', error);

            // 网络错误也fallback到mock
            if (error instanceof TypeError) {
                console.warn('🔄 Network error, using mock data fallback');
                return this.mockAnalyzeScenario(description);
            }

            throw this.handleError(error);
        }
    }

    /**
     * Phase 2: 基于模板的场景分析 (Strict JSON Schema)
     */
    async analyzeScenarioV2(
        description: string,
        templateId: string,
        context?: string
    ): Promise<RecognitionRun> {
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 2000)); // Latency

            // Return Mock Data (Sprint 1 MVP)
            console.log(`[Mock] Analyzing with template: ${templateId}`);
            return Promise.resolve(MOCK_RECOGNITION_RUN);

        } catch (error) {
            console.error('LLM Service - analyzeScenarioV2 error:', error);
            throw this.handleError(error);
        }
    }

    /**
     * 解析政策文件，提取多个场景
     */
    async parsePolicy(file: File): Promise<PolicyParseResult> {
        const config = getLLMConfig();

        try {
            // Step 1: 上传文件
            const uploadFormData = new FormData();
            uploadFormData.append('file', file);

            const uploadResponse = await fetch(`${config.baseUrl}/upload-policy`, {
                method: 'POST',
                body: uploadFormData,
            });

            if (!uploadResponse.ok) {
                throw new Error(`Upload failed: ${uploadResponse.statusText}`);
            }

            const uploadResult = await uploadResponse.json();
            const fileUrl = uploadResult.data?.fileUrl;

            if (!fileUrl) {
                throw new Error('File upload failed: no file URL returned');
            }

            // Step 2: 解析文件
            const parseRequest: PolicyParseRequest = {
                fileUrl,
                fileName: file.name,
                fileType: this.getFileType(file.name),
            };

            const parseResponse = await fetch(`${config.baseUrl}/parse-policy`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...parseRequest,
                    provider: config.provider,
                    model: config.model,
                }),
                signal: AbortSignal.timeout(120000), // 2分钟超时，文件解析可能较慢
            });

            if (!parseResponse.ok) {
                throw new Error(`Parse failed: ${parseResponse.statusText}`);
            }

            const result: LLMResponse<PolicyParseResult> = await parseResponse.json();

            if (!result.success || !result.data) {
                throw new Error(result.error?.message || 'Policy parsing failed');
            }

            return result.data;
        } catch (error) {
            console.error('LLM Service - parsePolicy error:', error);
            throw this.handleError(error);
        }
    }

    /**
     * 根据提取的要素生成业务对象建议
     */
    async generateBusinessObjects(
        request: GenerateObjectsRequest
    ): Promise<GenerateObjectsResult> {
        const config = getLLMConfig();

        try {
            const response = await fetch(`${config.baseUrl}/generate-objects`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...request,
                    provider: config.provider,
                    model: config.model,
                }),
                signal: AbortSignal.timeout(config.timeout || 30000),
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result: LLMResponse<GenerateObjectsResult> = await response.json();

            if (!result.success || !result.data) {
                throw new Error(result.error?.message || 'Object generation failed');
            }

            return result.data;
        } catch (error) {
            console.error('LLM Service - generateBusinessObjects error:', error);
            throw this.handleError(error);
        }
    }



    /**
     * Mock 场景分析（当后端API不可用时的fallback）
     */
    private mockAnalyzeScenario(description: string): ScenarioAnalysisResult {
        // 模拟分析延迟
        console.log('Mock analyzing scenario:', description.substring(0, 50) + '...');
        return mockAnalysisResultVNext;
    }

    /**
     * 错误处理
     */
    private handleError(error: any): Error {
        if (error.name === 'TimeoutError' || error.name === 'AbortError') {
            return new Error('请求超时，请稍后重试');
        }

        if (error.message) {
            return error;
        }

        return new Error('未知错误，请联系管理员');
    }

    /**
     * 获取文件类型
     */
    private getFileType(fileName: string): 'pdf' | 'docx' | 'image' {
        const ext = fileName.split('.').pop()?.toLowerCase();
        if (ext === 'pdf') return 'pdf';
        if (ext === 'doc' || ext === 'docx') return 'docx';
        return 'image';
    }
}

// 导出单例
export const llmService = new LLMService();

// 导出类供测试使用
export default LLMService;
