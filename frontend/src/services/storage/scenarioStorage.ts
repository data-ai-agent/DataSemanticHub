/**
 * Scenario Storage Service
 * 场景数据存储服务 - 支持本地存储和远程 API
 */

import { ScenarioData, ScenarioListData, ScenarioSummary, StorageConfig, DEFAULT_STORAGE_CONFIG } from '../../types/scenario';
import { ModelVersion } from '../../types/scene-model';

class ScenarioStorageService {
    private config: StorageConfig;

    constructor(config?: Partial<StorageConfig>) {
        this.config = { ...DEFAULT_STORAGE_CONFIG, ...config };
    }

    /**
     * 获取存储键
     */
    private getStorageKey(id?: string): string {
        return id
            ? `${this.config.localStoragePrefix}${id}`
            : `${this.config.localStoragePrefix}list`;
    }

    /**
     * 保存场景列表索引
     */
    private async saveScenarioIndex(scenarios: (ScenarioData | ScenarioSummary)[]): Promise<void> {
        // 转换为摘要数据，排除大型字段
        const summaries: ScenarioSummary[] = scenarios.map(s => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { analysisResult, ...summary } = s as ScenarioData; // Cast to access analysisResult safely
            return summary;
        });

        const listData: ScenarioListData = {
            scenarios: summaries,
            total: scenarios.length,
            lastSyncAt: new Date().toISOString(),
        };

        if (this.config.mode === 'local' || this.config.mode === 'hybrid') {
            localStorage.setItem(
                this.getStorageKey(),
                JSON.stringify(listData)
            );
        }

        // TODO: 如果是 remote 或 hybrid 模式，同步到服务器
        if (this.config.mode === 'remote' || this.config.mode === 'hybrid') {
            // await this.syncToRemote(listData);
        }
    }

    /**
     * 获取所有场景列表 (仅摘要)
     */
    async getAllScenarios(): Promise<ScenarioSummary[]> {
        try {
            const key = this.getStorageKey();
            const data = localStorage.getItem(key);

            if (!data) {
                return [];
            }

            const listData: ScenarioListData = JSON.parse(data);
            return listData.scenarios || [];
        } catch (error) {
            console.error('Failed to load scenarios:', error);
            return [];
        }
    }

    /**
     * 获取单个场景
     */
    async getScenario(id: string): Promise<ScenarioData | null> {
        try {
            const key = this.getStorageKey(id);
            const data = localStorage.getItem(key);

            if (!data) {
                return null;
            }

            return JSON.parse(data) as ScenarioData;
        } catch (error) {
            console.error(`Failed to load scenario ${id}:`, error);
            return null;
        }
    }

    /**
     * 保存场景
     */
    async saveScenario(scenario: ScenarioData): Promise<void> {
        try {
            // 更新元数据
            const now = new Date().toISOString();
            const updatedScenario: ScenarioData = {
                ...scenario,
                metadata: {
                    ...scenario.metadata,
                    updatedAt: now,
                    lastModified: now,
                    version: (scenario.metadata.version || 0) + 1,
                },
            };

            // 保存完整数据
            const key = this.getStorageKey(scenario.id);
            localStorage.setItem(key, JSON.stringify(updatedScenario));

            // 更新索引
            const allScenarios = await this.getAllScenarios();

            // 创建摘要对象
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { analysisResult, ...summary } = updatedScenario;

            const index = allScenarios.findIndex(s => s.id === scenario.id);

            if (index >= 0) {
                allScenarios[index] = summary;
            } else {
                allScenarios.push(summary);
            }

            await this.saveScenarioIndex(allScenarios);

            console.log(`Scenario ${scenario.id} saved successfully`);
        } catch (error) {
            console.error('Failed to save scenario:', error);
            throw new Error('保存场景失败');
        }
    }

    /**
     * 发布场景模型版本
     */
    async publishVersion(id: string, workingCopy: any): Promise<void> {
        const scenario = await this.getScenario(id);
        if (!scenario) throw new Error('Scenario not found');

        const currentVersions = scenario.versions || [];
        const nextVersionNum = currentVersions.length + 1;
        const versionLabel = `v1.${nextVersionNum - 1}`; // v1.0, v1.1...

        const newVersion = {
            version_id: `${id}_v${nextVersionNum}`,
            model_id: id,
            version: versionLabel,
            snapshot_json: workingCopy,
            created_at: new Date().toISOString()
        };

        const updatedScenario: ScenarioData = {
            ...scenario,
            status: 'modeled',
            versions: [newVersion, ...currentVersions], // Newest first
            workingCopy: workingCopy // Ensure working copy is also up to date
        };

        await this.saveScenario(updatedScenario);
    }

    /**
     * 获取场景的版本历史
     */
    async getVersionHistory(id: string): Promise<ModelVersion[]> {
        const scenario = await this.getScenario(id);
        if (!scenario) return [];
        return scenario.versions || [];
    }

    /**
     * 回滚到指定版本
     */
    async rollbackToVersion(id: string, versionId: string): Promise<void> {
        const scenario = await this.getScenario(id);
        if (!scenario) throw new Error('Scenario not found');

        const versions = scenario.versions || [];
        const targetVersion = versions.find(v => v.version_id === versionId);

        if (!targetVersion) throw new Error('Version not found');

        // Restore workingCopy from snapshot
        const updatedScenario: ScenarioData = {
            ...scenario,
            workingCopy: targetVersion.snapshot_json,
            metadata: {
                ...scenario.metadata,
                updatedAt: new Date().toISOString(),
                lastModified: new Date().toISOString()
            }
        };

        await this.saveScenario(updatedScenario);
    }

    /**
     * 获取指定版本的快照
     */
    async getVersionSnapshot(id: string, versionId: string): Promise<any | null> {
        const scenario = await this.getScenario(id);
        if (!scenario) return null;

        const versions = scenario.versions || [];
        const targetVersion = versions.find(v => v.version_id === versionId);

        return targetVersion?.snapshot_json || null;
    }

    /**
     * 创建新场景
     */
    async createScenario(data: Partial<ScenarioData>): Promise<ScenarioData> {
        const now = new Date().toISOString();
        const id = `scenario_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const scenario: ScenarioData = {
            id,
            title: data.title || '未命名场景',
            description: data.description || '',
            status: data.status || 'draft',
            analysisResult: data.analysisResult,
            proposedObjects: data.proposedObjects,
            metadata: {
                createdAt: now,
                updatedAt: now,
                lastModified: now,
                version: 1,
            },
            source: data.source,
        };

        await this.saveScenario(scenario);
        return scenario;
    }

    /**
     * 删除场景
     */
    async deleteScenario(id: string): Promise<void> {
        try {
            // 删除完整数据
            const key = this.getStorageKey(id);
            localStorage.removeItem(key);

            // 更新索引
            const allScenarios = await this.getAllScenarios();
            const filtered = allScenarios.filter(s => s.id !== id);
            await this.saveScenarioIndex(filtered);

            console.log(`Scenario ${id} deleted successfully`);
        } catch (error) {
            console.error('Failed to delete scenario:', error);
            throw new Error('删除场景失败');
        }
    }

    /**
     * 批量删除场景
     */
    async deleteScenarios(ids: string[]): Promise<void> {
        try {
            // 删除详细数据
            for (const id of ids) {
                const key = this.getStorageKey(id);
                localStorage.removeItem(key);
            }

            // 更新索引
            const allScenarios = await this.getAllScenarios();
            const filtered = allScenarios.filter(s => !ids.includes(s.id));
            await this.saveScenarioIndex(filtered);

            console.log(`${ids.length} scenarios deleted successfully`);
        } catch (error) {
            console.error('Failed to batch delete scenarios:', error);
            throw new Error('批量删除场景失败');
        }
    }

    /**
     * 批量导入场景（用于政策文件导入）
     */
    async importScenarios(scenarios: Partial<ScenarioData>[]): Promise<ScenarioData[]> {
        const imported: ScenarioData[] = [];

        for (const scenarioData of scenarios) {
            const scenario = await this.createScenario(scenarioData);
            imported.push(scenario);
        }

        return imported;
    }

    /**
     * 清空所有场景（慎用）
     */
    async clearAll(): Promise<void> {
        const scenarios = await this.getAllScenarios();
        for (const scenario of scenarios) {
            const key = this.getStorageKey(scenario.id);
            localStorage.removeItem(key);
        }
        localStorage.removeItem(this.getStorageKey());
        console.log('All scenarios cleared');
    }

    /**
     * 导出所有场景数据（用于备份）
     */
    async exportAll(): Promise<ScenarioData[]> {
        return await this.getAllScenarios();
    }

    /**
     * 导入备份数据
     */
    async importBackup(scenarios: ScenarioData[]): Promise<void> {
        for (const scenario of scenarios) {
            await this.saveScenario(scenario);
        }
    }
}

// 导出单例
export const scenarioStorage = new ScenarioStorageService();

// 导出类供配置使用
export default ScenarioStorageService;
