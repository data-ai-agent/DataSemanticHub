/**
 * Agent Service - AI Agent、问数、SQL生成
 * 使用 agentServiceClient 调用 Agent Service API
 */

import { agentServiceClient } from '../../utils/serviceClient';
import type { ErrorResponse } from '../../utils/httpClient';

// ==================== 类型定义 ====================

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp?: string;
}

export interface ChatRequest {
    message: string;
    conversation_id?: string;
    context?: any;
}

export interface ChatResponse {
    message: string;
    conversation_id: string;
    sources?: string[];
    sql?: string;
    data?: any[];
}

export interface TrainRequest {
    ddl?: string;
    documentation?: string;
    sql?: string;
    question?: string;
}

export interface TrainResponse {
    success: boolean;
    message: string;
    training_id?: string;
}

export interface SQLGenerateRequest {
    question: string;
    database?: string;
    tables?: string[];
}

export interface SQLGenerateResponse {
    sql: string;
    explanation: string;
    confidence: number;
}

// ==================== Agent Service ====================

export const agentService = {
    /**
     * AI 对话
     */
    async chat(data: ChatRequest): Promise<ChatResponse> {
        const response = await agentServiceClient('/chat', {
            method: 'POST',
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({
                message: '对话请求失败'
            }));
            throw Object.assign(new Error(error.message), {
                httpStatus: response.status,
                ...error,
            } as ErrorResponse);
        }

        return response.json();
    },

    /**
     * 训练模型
     */
    async train(data: TrainRequest): Promise<TrainResponse> {
        const response = await agentServiceClient('/train', {
            method: 'POST',
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({
                message: '训练请求失败'
            }));
            throw Object.assign(new Error(error.message), error as ErrorResponse);
        }

        return response.json();
    },

    /**
     * 生成 SQL
     */
    async generateSQL(data: SQLGenerateRequest): Promise<SQLGenerateResponse> {
        const response = await agentServiceClient('/sql/generate', {
            method: 'POST',
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({
                message: 'SQL生成失败'
            }));
            throw Object.assign(new Error(error.message), error as ErrorResponse);
        }

        return response.json();
    },

    /**
     * 解释 SQL
     */
    async explainSQL(sql: string): Promise<{ explanation: string }> {
        const response = await agentServiceClient('/sql/explain', {
            method: 'POST',
            body: JSON.stringify({ sql }),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({
                message: 'SQL解释失败'
            }));
            throw Object.assign(new Error(error.message), error as ErrorResponse);
        }

        return response.json();
    },

    /**
     * 获取训练状态
     */
    async getTrainingStatus(trainingId: string): Promise<{
        status: 'pending' | 'processing' | 'completed' | 'failed';
        progress: number;
        message?: string;
    }> {
        const response = await agentServiceClient(`/train/${trainingId}`, {
            method: 'GET',
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({
                message: '获取训练状态失败'
            }));
            throw Object.assign(new Error(error.message), error as ErrorResponse);
        }

        return response.json();
    },
};

export type { ErrorResponse };
