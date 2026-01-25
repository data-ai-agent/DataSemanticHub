/**
 * Auto-Save Hook for Scenario Editor
 * 自动保存 Hook
 */

import { useEffect, useRef, useCallback } from 'react';
import { scenarioStorage } from '../services/storage/scenarioStorage';
import { ScenarioData } from '../types/scenario';

interface UseAutoSaveOptions {
    enabled?: boolean;
    interval?: number; // 毫秒
    onSaveSuccess?: () => void;
    onSaveError?: (error: Error) => void;
}

/**
 * 自动保存 Hook
 * 
 * @example
 * ```tsx
 * const { saveNow, lastSavedAt } = useAutoSave(scenario, {
 *   enabled: true,
 *   interval: 5000,
 *   onSaveSuccess: () => console.log('Saved!'),
 * });
 * ```
 */
export function useAutoSave(
    scenario: Partial<ScenarioData> | null,
    options: UseAutoSaveOptions = {}
) {
    const {
        enabled = true,
        interval = 5000,
        onSaveSuccess,
        onSaveError,
    } = options;

    const lastSavedAt = useRef<string | null>(null);
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isSavingRef = useRef(false);

    /**
     * 执行保存
     */
    const performSave = useCallback(async () => {
        if (!scenario || !scenario.id || isSavingRef.current) {
            return;
        }

        isSavingRef.current = true;

        try {
            await scenarioStorage.saveScenario(scenario as ScenarioData);
            lastSavedAt.current = new Date().toISOString();
            onSaveSuccess?.();
        } catch (error) {
            console.error('Auto-save failed:', error);
            onSaveError?.(error as Error);
        } finally {
            isSavingRef.current = false;
        }
    }, [scenario, onSaveSuccess, onSaveError]);

    /**
     * 立即保存
     */
    const saveNow = useCallback(async () => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
            saveTimeoutRef.current = null;
        }
        await performSave();
    }, [performSave]);

    /**
     * 设置自动保存定时器
     */
    useEffect(() => {
        if (!enabled || !scenario?.id) {
            return;
        }

        // 清除旧的定时器
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        // 设置新的定时器
        saveTimeoutRef.current = setTimeout(() => {
            performSave();
        }, interval);

        // 清理函数
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [enabled, scenario, interval, performSave]);

    return {
        saveNow,
        lastSavedAt: lastSavedAt.current,
        isSaving: isSavingRef.current,
    };
}

/**
 * Debounce Hook
 * 用于延迟保存，避免频繁触发
 */
export function useDebouncedSave<T>(
    value: T,
    delay: number,
    callback: (value: T) => void | Promise<void>
) {
    useEffect(() => {
        const handler = setTimeout(() => {
            callback(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay, callback]);
}
