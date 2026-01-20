/**
 * Semantic Version Service
 * 语义版本存储与管理服务
 * 
 * 核心职责：
 * 1. 版本 CRUD（创建草稿、发布、废弃）
 * 2. Active 版本管理（只有一个活跃版本）
 * 3. 版本对比与回滚
 * 4. 快照构建（从 BO 列表生成快照）
 */

import {
    SemanticVersion,
    SemanticSnapshot,
    BusinessObjectSnapshot,
    FieldSnapshot,
    RelationSnapshot,
    VersionDiff
} from '../../types/semanticVersion';

const STORAGE_KEY = 'semantic_versions';
const ACTIVE_VERSION_KEY = 'semantic_active_version';

class SemanticVersionService {

    // ==================== 版本管理 ====================

    /**
     * 获取所有版本
     */
    async getAllVersions(): Promise<SemanticVersion[]> {
        const data = localStorage.getItem(STORAGE_KEY);
        if (!data) return [];
        try {
            return JSON.parse(data) as SemanticVersion[];
        } catch {
            return [];
        }
    }

    /**
     * 保存所有版本
     */
    private async saveAllVersions(versions: SemanticVersion[]): Promise<void> {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(versions));
    }

    /**
     * 获取当前 Active 版本
     */
    async getActiveVersion(): Promise<SemanticVersion | null> {
        const versions = await this.getAllVersions();
        return versions.find(v => v.is_active) || null;
    }

    /**
     * 获取当前草稿版本（如果有）
     */
    async getDraftVersion(): Promise<SemanticVersion | null> {
        const versions = await this.getAllVersions();
        return versions.find(v => v.status === 'draft') || null;
    }

    /**
     * 获取指定版本
     */
    async getVersionById(versionId: string): Promise<SemanticVersion | null> {
        const versions = await this.getAllVersions();
        return versions.find(v => v.version_id === versionId) || null;
    }

    /**
     * 获取版本历史（按时间倒序）
     */
    async getVersionHistory(): Promise<SemanticVersion[]> {
        const versions = await this.getAllVersions();
        return versions
            .filter(v => v.status !== 'draft')
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    // ==================== 版本创建与发布 ====================

    /**
     * 创建新草稿
     * 如果已存在草稿，则返回现有草稿
     */
    async createDraft(businessObjects: any[]): Promise<SemanticVersion> {
        const versions = await this.getAllVersions();

        // 检查是否已有草稿
        const existingDraft = versions.find(v => v.status === 'draft');
        if (existingDraft) {
            // 更新现有草稿
            existingDraft.snapshot = this.buildSnapshot(businessObjects);
            existingDraft.stats = this.calculateStats(existingDraft.snapshot);
            await this.saveAllVersions(versions);
            return existingDraft;
        }

        // 计算下一个版本号
        const publishedVersions = versions.filter(v => v.status === 'published');
        const nextVersion = this.calculateNextVersion(publishedVersions);

        const draft: SemanticVersion = {
            version_id: `sv_${nextVersion}_${Date.now()}`,
            version: nextVersion,
            status: 'draft',
            is_active: false,
            snapshot: this.buildSnapshot(businessObjects),
            created_at: new Date().toISOString(),
            stats: undefined
        };

        draft.stats = this.calculateStats(draft.snapshot);

        versions.push(draft);
        await this.saveAllVersions(versions);

        return draft;
    }

    /**
     * 发布草稿版本
     */
    async publishVersion(draftId: string, changeSummary: string): Promise<SemanticVersion> {
        const versions = await this.getAllVersions();
        const draftIndex = versions.findIndex(v => v.version_id === draftId);

        if (draftIndex === -1) {
            throw new Error('Draft version not found');
        }

        const draft = versions[draftIndex];
        if (draft.status !== 'draft') {
            throw new Error('Only draft versions can be published');
        }

        // 将当前 active 版本取消激活
        versions.forEach(v => {
            if (v.is_active) {
                v.is_active = false;
            }
        });

        // 发布并激活
        draft.status = 'published';
        draft.is_active = true;
        draft.published_at = new Date().toISOString();
        draft.change_summary = changeSummary;

        await this.saveAllVersions(versions);

        return draft;
    }

    /**
     * 废弃版本
     */
    async deprecateVersion(versionId: string): Promise<void> {
        const versions = await this.getAllVersions();
        const version = versions.find(v => v.version_id === versionId);

        if (!version) {
            throw new Error('Version not found');
        }

        if (version.is_active) {
            throw new Error('Cannot deprecate active version');
        }

        version.status = 'deprecated';
        version.deprecated_at = new Date().toISOString();

        await this.saveAllVersions(versions);
    }

    /**
     * 设置 Active 版本
     */
    async setActiveVersion(versionId: string): Promise<void> {
        const versions = await this.getAllVersions();
        const targetVersion = versions.find(v => v.version_id === versionId);

        if (!targetVersion) {
            throw new Error('Version not found');
        }

        if (targetVersion.status !== 'published') {
            throw new Error('Only published versions can be set as active');
        }

        // 取消所有其他版本的激活状态
        versions.forEach(v => {
            v.is_active = v.version_id === versionId;
        });

        await this.saveAllVersions(versions);
    }

    // ==================== 版本对比与回滚 ====================

    /**
     * 对比两个版本
     */
    async compareVersions(versionId1: string, versionId2: string): Promise<VersionDiff> {
        const v1 = await this.getVersionById(versionId1);
        const v2 = await this.getVersionById(versionId2);

        if (!v1 || !v2) {
            throw new Error('One or both versions not found');
        }

        const diff: VersionDiff = {
            version_from: v1.version,
            version_to: v2.version,
            changes: {
                business_objects: this.diffBusinessObjects(v1.snapshot.business_objects, v2.snapshot.business_objects),
                relations: this.diffRelations(v1.snapshot.object_relations, v2.snapshot.object_relations)
            },
            summary: { total_changes: 0, breaking_changes: 0, additions: 0, modifications: 0, removals: 0 }
        };

        // 计算统计
        const boChanges = diff.changes.business_objects;
        diff.summary.additions = boChanges.added.length + diff.changes.relations.added.length;
        diff.summary.removals = boChanges.removed.length + diff.changes.relations.removed.length;
        diff.summary.modifications = boChanges.modified.length;
        diff.summary.breaking_changes = diff.summary.removals;
        diff.summary.total_changes = diff.summary.additions + diff.summary.removals + diff.summary.modifications;

        return diff;
    }

    /**
     * 回滚到指定版本
     * 创建一个新草稿，内容来自目标版本
     */
    async rollbackToVersion(versionId: string): Promise<SemanticVersion> {
        const targetVersion = await this.getVersionById(versionId);
        if (!targetVersion) {
            throw new Error('Target version not found');
        }

        const versions = await this.getAllVersions();

        // 删除现有草稿
        const newVersions = versions.filter(v => v.status !== 'draft');

        // 计算新版本号
        const publishedVersions = newVersions.filter(v => v.status === 'published');
        const nextVersion = this.calculateNextVersion(publishedVersions);

        // 创建新草稿
        const draft: SemanticVersion = {
            version_id: `sv_${nextVersion}_${Date.now()}`,
            version: nextVersion,
            status: 'draft',
            is_active: false,
            snapshot: JSON.parse(JSON.stringify(targetVersion.snapshot)), // 深拷贝
            created_at: new Date().toISOString(),
            change_summary: `Rollback from ${targetVersion.version}`,
            stats: targetVersion.stats
        };

        newVersions.push(draft);
        await this.saveAllVersions(newVersions);

        return draft;
    }

    // ==================== 快照构建 ====================

    /**
     * 从业务对象列表构建快照
     */
    buildSnapshot(businessObjects: any[]): SemanticSnapshot {
        const boSnapshots: BusinessObjectSnapshot[] = businessObjects.map(bo => ({
            id: bo.id,
            label: bo.label || bo.name || '',
            normalized_name: bo.normalizedName || bo.normalized_name || '',
            type: bo.type || 'BO',
            description: bo.description,
            fields: (bo.fields || []).map((f: any) => this.buildFieldSnapshot(f)),
            mapping: bo.mapping,
            source: bo.source,
            created_at: bo.createdAt || new Date().toISOString(),
            updated_at: bo.updatedAt || new Date().toISOString()
        }));

        // 提取字段语义
        const fieldSemantics = boSnapshots.flatMap(bo =>
            bo.fields.map(f => ({
                field_id: f.id,
                bo_id: bo.id,
                term_id: f.term_id,
                role: undefined,
                tags: f.tags || []
            }))
        );

        // 提取关系（暂时为空，需要从其他地方获取）
        const relations: RelationSnapshot[] = [];

        return {
            business_objects: boSnapshots,
            field_semantics: fieldSemantics,
            object_relations: relations
        };
    }

    private buildFieldSnapshot(field: any): FieldSnapshot {
        return {
            id: field.id || `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: field.name || '',
            label: field.label || field.displayName || '',
            type: field.type || 'string',
            description: field.description,
            required: field.required,
            privacy_level: field.privacyLevel || field.privacy_level,
            tags: field.tags,
            term_id: field.termId || field.term_id
        };
    }

    // ==================== 工具方法 ====================

    private calculateNextVersion(publishedVersions: SemanticVersion[]): string {
        if (publishedVersions.length === 0) {
            return '1.0.0';
        }

        // 找到最新版本
        const sorted = publishedVersions.sort((a, b) =>
            new Date(b.published_at || b.created_at).getTime() -
            new Date(a.published_at || a.created_at).getTime()
        );

        const [major, minor] = sorted[0].version.split('.').map(Number);
        return `${major}.${minor + 1}.0`;
    }

    private calculateStats(snapshot: SemanticSnapshot) {
        return {
            bo_count: snapshot.business_objects.length,
            field_count: snapshot.business_objects.reduce((sum, bo) => sum + bo.fields.length, 0),
            relation_count: snapshot.object_relations.length
        };
    }

    private diffBusinessObjects(from: BusinessObjectSnapshot[], to: BusinessObjectSnapshot[]) {
        const fromIds = new Set(from.map(bo => bo.id));
        const toIds = new Set(to.map(bo => bo.id));

        const added = to.filter(bo => !fromIds.has(bo.id));
        const removed = from.filter(bo => !toIds.has(bo.id));

        const modified: { before: BusinessObjectSnapshot; after: BusinessObjectSnapshot; field_changes: any }[] = [];

        for (const toBo of to) {
            if (fromIds.has(toBo.id)) {
                const fromBo = from.find(bo => bo.id === toBo.id)!;
                const fieldChanges = this.diffFields(fromBo.fields, toBo.fields);

                if (fieldChanges.added.length > 0 || fieldChanges.removed.length > 0 || fieldChanges.modified.length > 0 ||
                    fromBo.label !== toBo.label || fromBo.description !== toBo.description) {
                    modified.push({
                        before: fromBo,
                        after: toBo,
                        field_changes: fieldChanges
                    });
                }
            }
        }

        return { added, removed, modified };
    }

    private diffFields(from: FieldSnapshot[], to: FieldSnapshot[]) {
        const fromIds = new Set(from.map(f => f.id));
        const toIds = new Set(to.map(f => f.id));

        const added = to.filter(f => !fromIds.has(f.id));
        const removed = from.filter(f => !toIds.has(f.id));

        const modified: { before: FieldSnapshot; after: FieldSnapshot }[] = [];

        for (const toField of to) {
            if (fromIds.has(toField.id)) {
                const fromField = from.find(f => f.id === toField.id)!;
                if (JSON.stringify(fromField) !== JSON.stringify(toField)) {
                    modified.push({ before: fromField, after: toField });
                }
            }
        }

        return { added, removed, modified };
    }

    private diffRelations(from: RelationSnapshot[], to: RelationSnapshot[]) {
        const fromIds = new Set(from.map(r => r.id));
        const toIds = new Set(to.map(r => r.id));

        return {
            added: to.filter(r => !fromIds.has(r.id)),
            removed: from.filter(r => !toIds.has(r.id))
        };
    }
}

// 导出单例
export const semanticVersionService = new SemanticVersionService();

export default SemanticVersionService;
