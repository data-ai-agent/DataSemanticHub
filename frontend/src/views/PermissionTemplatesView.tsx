import { useMemo, useState, useEffect } from 'react';
import {
    Plus,
    Search,
    Copy,
    PauseCircle,
    PlayCircle,
    Trash2,
    Pencil,
    Upload,
    Download,
    Sparkles,
    X
} from 'lucide-react';
import {
    permissionTemplateService,
    convertBackendToFrontendTemplate,
    convertBackendToFrontendTemplateItem,
    convertFrontendToCreateRequest,
    convertFrontendToUpdateRequest,
    mapFrontendToBackendStatus,
    mapBackendToFrontendStatus,
    type FrontendTemplate,
    type FrontendPermissionItem,
} from '../services/permissionTemplateService';

type TemplateStatus = '草稿' | '已发布' | '停用';

// Using imported types from service
type Template = FrontendTemplate;
type PermissionItem = FrontendPermissionItem;

const actionLabels = ['查看', '编辑', '发布', '管理'];

const permissionCatalog: PermissionItem[] = [
    { module: '语义资产', actions: [], note: '裁决与发布' },
    { module: '语义版本', actions: [], note: '版本评审与回溯' },
    { module: '数据质量', actions: [], note: '质量规则维护' },
    { module: '数据安全', actions: [], note: '安全策略与审计' },
    { module: '数据服务', actions: [], note: '服务配置与路由' },
    { module: '问数/找数', actions: [], note: '模板与词典' },
    { module: '业务场景', actions: [], note: '场景编排' },
    { module: '资源知识网络', actions: [], note: '关系维护' }
];

const operationPointDefinitions: Record<string, { label: string; key: string; parentAction: string }[]> = {
    '语义资产': [
        { label: '强制解锁', key: 'force_unlock', parentAction: '管理' },
        { label: '变更历史回滚', key: 'revert_history', parentAction: '编辑' },
        { label: '批量下架', key: 'batch_offline', parentAction: '发布' }
    ],
    '语义版本': [
        { label: '版本审批', key: 'approve_version', parentAction: '发布' },
        { label: '版本回滚', key: 'rollback_version', parentAction: '管理' },
        { label: '强制发布', key: 'force_publish', parentAction: '管理' }
    ]
};

const scopeHintOptions = ['全平台', '组织级', '数据域', '租户'];

const statusStyles: Record<TemplateStatus, string> = {
    草稿: 'bg-amber-100 text-amber-700',
    已发布: 'bg-emerald-100 text-emerald-700',
    停用: 'bg-slate-200 text-slate-600'
};

const normalizePermissions = (existing?: PermissionItem[]) => {
    const normalized = permissionCatalog.map((item) => {
        const match = existing?.find((permission) => permission.module === item.module);
        return match
            ? { ...item, actions: [...match.actions], note: match.note || item.note, operationPoints: match.operationPoints }
            : { ...item, actions: [] };
    });
    const extra = (existing ?? []).filter(
        (permission) => !permissionCatalog.some((catalog) => catalog.module === permission.module)
    );
    return [...normalized, ...extra.map((permission) => ({ ...permission, actions: [...permission.actions] }))];
};

const PermissionTemplatesView = () => {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [activeTemplateId, setActiveTemplateId] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | TemplateStatus>('all');
    const [showAdvanced, setShowAdvanced] = useState(false);

    const [modalOpen, setModalOpen] = useState(false);
    const [draftTemplate, setDraftTemplate] = useState<Template | null>(null);
    const [draftPermissions, setDraftPermissions] = useState<PermissionItem[]>([]);
    const [showAdvancedPermissions, setShowAdvancedPermissions] = useState(false);

    const [drawerOpen, setDrawerOpen] = useState(false);
    const [drawerTemplate, setDrawerTemplate] = useState<Template | null>(null);
    const [drawerPermissions, setDrawerPermissions] = useState<PermissionItem[]>([]);
    const [drawerShowAdvanced, setDrawerShowAdvanced] = useState(false);
    const [actionModalOpen, setActionModalOpen] = useState(false);
    const [actionType, setActionType] = useState<'publish' | 'disable'>('publish');
    const [actionTarget, setActionTarget] = useState<Template | null>(null);
    const [actionReason, setActionReason] = useState('');

    // API integration states
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isActioning, setIsActioning] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const filteredTemplates = useMemo(() => {
        return templates.filter((template) => {
            const matchesSearch = `${template.name}${template.code}${template.description}`
                .toLowerCase()
                .includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'all' || template.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [templates, searchTerm, statusFilter]);

    const activeTemplate = templates.find((template) => template.id === activeTemplateId) ?? templates[0];

    // Load templates on mount
    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = async (filterStatus?: 'all' | TemplateStatus) => {
        setIsLoading(true);
        setError(null);
        try {
            const backendStatus = filterStatus === 'all' || !filterStatus
                ? undefined
                : mapFrontendToBackendStatus(filterStatus);
            const result = await permissionTemplateService.listPermissionTemplates({
                page: 1,
                page_size: 100,
                status: backendStatus,
                keyword: searchTerm || undefined,
            });
            const frontendTemplates = result.data.map(item =>
                convertBackendToFrontendTemplateItem(item)
            );
            setTemplates(frontendTemplates);
            if (frontendTemplates.length > 0 && !activeTemplateId) {
                setActiveTemplateId(frontendTemplates[0].id);
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : '加载模板列表失败';
            setError(message);
            console.error('Failed to load templates:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // Load template detail when selection changes
    useEffect(() => {
        if (activeTemplateId && activeTemplateId !== activeTemplate?.id) {
            loadTemplateDetail(activeTemplateId);
        }
    }, [activeTemplateId]);

    const loadTemplateDetail = async (id: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const detail = await permissionTemplateService.getPermissionTemplate(id);
            const frontendTemplate = convertBackendToFrontendTemplate(
                detail,
                permissionCatalog
            );
            setTemplates(prev =>
                prev.map(t => t.id === id ? frontendTemplate : t)
            );
        } catch (err) {
            const message = err instanceof Error ? err.message : '加载模板详情失败';
            setError(message);
            console.error('Failed to load template detail:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // Debounced search
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (templates.length > 0) {
                loadTemplates(statusFilter);
            }
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    // Update when status filter changes
    useEffect(() => {
        if (templates.length > 0) {
            loadTemplates(statusFilter);
        }
    }, [statusFilter]);

    const openCreateModal = () => {
        const draft: Template = {
            id: `tpl_${Date.now()}`,
            name: '',
            code: '',
            description: '',
            status: '草稿',
            moduleCount: 0,
            updatedAt: new Date().toISOString().split('T')[0],
            scopeHint: '未设置',
            permissions: []
        };
        setDraftTemplate(draft);
        setDraftPermissions(normalizePermissions());
        setShowAdvancedPermissions(false);
        setModalOpen(true);
    };

    const openEditDrawer = (template?: Template) => {
        const target = template ?? activeTemplate;
        if (!target) return;
        setDrawerTemplate({ ...target });
        setDrawerPermissions(normalizePermissions(target.permissions));
        setDrawerShowAdvanced(false);
        setDrawerOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setDraftTemplate(null);
    };

    const closeDrawer = () => {
        setDrawerOpen(false);
        setDrawerTemplate(null);
    };

    const saveNewTemplate = async () => {
        if (!draftTemplate) return;

        setIsSaving(true);
        setError(null);

        try {
            const templateWithPermissions: Template = {
                ...draftTemplate,
                permissions: draftPermissions.filter((item) => item.actions.length > 0),
            };

            const createReq = convertFrontendToCreateRequest(templateWithPermissions);
            const result = await permissionTemplateService.createPermissionTemplate(createReq);

            // Reload the list to get the full data
            await loadTemplates();
            setActiveTemplateId(result.id);
            closeModal();
        } catch (err) {
            const message = err instanceof Error ? err.message : '创建模板失败';
            setError(message);
            console.error('Failed to create template:', err);
        } finally {
            setIsSaving(false);
        }
    };

    const saveDrawerTemplate = async () => {
        if (!drawerTemplate) return;

        setIsSaving(true);
        setError(null);

        try {
            const templateWithPermissions: Template = {
                ...drawerTemplate,
                permissions: drawerPermissions.filter((item) => item.actions.length > 0),
            };

            const updateReq = convertFrontendToUpdateRequest(templateWithPermissions);
            await permissionTemplateService.updatePermissionTemplate(
                drawerTemplate.id,
                updateReq
            );

            // Reload the list to get the updated data
            await loadTemplates();
            closeDrawer();
        } catch (err) {
            const message = err instanceof Error ? err.message : '保存模板失败';
            setError(message);
            console.error('Failed to update template:', err);
        } finally {
            setIsSaving(false);
        }
    };

    const openTemplateAction = (type: 'publish' | 'disable', template: Template) => {
        setActionType(type);
        setActionTarget(template);
        setActionReason('');
        setActionModalOpen(true);
    };

    const closeActionModal = () => {
        setActionModalOpen(false);
        setActionTarget(null);
        setActionReason('');
    };

    const confirmTemplateAction = async () => {
        if (!actionTarget) return;

        setIsActioning(true);
        setError(null);

        try {
            if (actionType === 'publish') {
                await permissionTemplateService.publishPermissionTemplate(actionTarget.id);
            } else {
                await permissionTemplateService.disablePermissionTemplate(actionTarget.id);
            }

            // Reload the list to get the updated status
            await loadTemplates();
            closeActionModal();
        } catch (err) {
            const message = err instanceof Error
                ? err.message
                : (actionType === 'publish' ? '发布模板失败' : '停用模板失败');
            setError(message);
            console.error('Failed to perform template action:', err);
        } finally {
            setIsActioning(false);
        }
    };

    const handleCloneTemplate = async (template: Template) => {
        setIsActioning(true);
        setError(null);

        try {
            const cloneName = `${template.name} (副本)`;
            const cloneCode = `${template.code}_copy_${Date.now()}`;

            await permissionTemplateService.clonePermissionTemplate(template.id, {
                name: cloneName,
                code: cloneCode,
            });

            // Reload the list
            await loadTemplates();
        } catch (err) {
            const message = err instanceof Error ? err.message : '复制模板失败';
            setError(message);
            console.error('Failed to clone template:', err);
        } finally {
            setIsActioning(false);
        }
    };

    const handleDeleteTemplate = async (id: string) => {
        if (!confirm('确定要删除此模板吗？此操作不可恢复。')) {
            return;
        }

        setIsActioning(true);
        setError(null);

        try {
            await permissionTemplateService.deletePermissionTemplate(id);

            // Reload the list
            await loadTemplates();

            // If deleted template was active, clear selection
            if (activeTemplateId === id) {
                setActiveTemplateId('');
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : '删除模板失败';
            setError(message);
            console.error('Failed to delete template:', err);
        } finally {
            setIsActioning(false);
        }
    };

    const navigateToRoleCreate = (templateId: string) => {
        if (typeof window === 'undefined') return;
        const url = new URL(window.location.href);
        url.searchParams.set('tab', 'user_permission');
        url.searchParams.set('createRole', '1');
        url.searchParams.set('templateId', templateId);
        window.history.pushState({ path: url.href }, '', url.href);
        window.dispatchEvent(new PopStateEvent('popstate'));
    };

    const togglePermissionAction = (module: string, action: string) => {
        setDraftPermissions((prev) =>
            prev.map((item) =>
                item.module === module
                    ? {
                        ...item,
                        actions: item.actions.includes(action)
                            ? item.actions.filter((itemAction) => itemAction !== action)
                            : [...item.actions, action]
                    }
                    : item
            )
        );
    };

    const toggleOperationPoint = (module: string, pointKey: string) => {
        setDraftPermissions((prev) =>
            prev.map((item) => {
                if (item.module !== module) return item;
                const currentPoints = item.operationPoints || [];
                return {
                    ...item,
                    operationPoints: currentPoints.includes(pointKey)
                        ? currentPoints.filter(p => p !== pointKey)
                        : [...currentPoints, pointKey]
                };
            })
        );
    };

    const toggleDrawerPermissionAction = (module: string, action: string) => {
        setDrawerPermissions((prev) =>
            prev.map((item) =>
                item.module === module
                    ? {
                        ...item,
                        actions: item.actions.includes(action)
                            ? item.actions.filter((itemAction) => itemAction !== action)
                            : [...item.actions, action]
                    }
                    : item
            )
        );
    };

    const toggleDrawerOperationPoint = (module: string, pointKey: string) => {
        setDrawerPermissions((prev) =>
            prev.map((item) => {
                if (item.module !== module) return item;
                const currentPoints = item.operationPoints || [];
                return {
                    ...item,
                    operationPoints: currentPoints.includes(pointKey)
                        ? currentPoints.filter(p => p !== pointKey)
                        : [...currentPoints, pointKey]
                };
            })
        );
    };

    return (
        <div className="space-y-6 h-full flex flex-col pt-6 pb-2 px-1">
            {/* Loading Overlay */}
            {isLoading && (
                <div className="fixed inset-0 bg-white/80 flex items-center justify-center z-50">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                        <p className="text-slate-600">加载中...</p>
                    </div>
                </div>
            )}

            {/* Error Banner */}
            {error && (
                <div className="fixed top-4 right-4 bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg z-50 max-w-md">
                    <div className="flex items-start gap-3">
                        <div className="text-red-600 mt-0.5">⚠</div>
                        <div className="flex-1">
                            <div className="font-semibold text-red-800">操作失败</div>
                            <div className="text-sm text-red-700 mt-1">{error}</div>
                        </div>
                        <button
                            onClick={() => setError(null)}
                            className="text-red-400 hover:text-red-600"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between px-1">
                <div>
                    <div className="text-xs text-slate-400">平台管理 / 权限模板</div>
                    <h2 className="text-2xl font-bold text-slate-800">权限模板</h2>
                    <p className="text-slate-500 mt-1">沉淀岗位标准权限，快速复用并形成治理规范。</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <button className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-800 flex items-center gap-2">
                        <Upload size={16} /> 导入模板
                    </button>
                    <button className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-800 flex items-center gap-2">
                        <Download size={16} /> 导出模板
                    </button>
                    <button
                        onClick={openCreateModal}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center gap-2 hover:bg-indigo-700"
                    >
                        <Plus size={16} /> 新建模板
                    </button>
                </div>
            </div>

            <div className="grid gap-6 px-1 lg:grid-cols-[1.1fr_1.6fr]">
                <section className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                        <Search size={16} className="text-slate-400" />
                        <input
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            placeholder="搜索模板名称或编码"
                            className="w-full text-sm text-slate-700 placeholder-slate-400 border-none outline-none"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <select
                            value={statusFilter}
                            onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600"
                        >
                            <option value="all">全部状态</option>
                            <option value="草稿">草稿</option>
                            <option value="已发布">已发布</option>
                            <option value="停用">停用</option>
                        </select>
                    </div>
                    <div className="space-y-3">
                        {filteredTemplates.map((template) => {
                            const isActive = template.id === activeTemplateId;
                            return (
                                <button
                                    key={template.id}
                                    onClick={() => setActiveTemplateId(template.id)}
                                    className={`w-full rounded-xl border p-4 text-left transition ${isActive
                                        ? 'border-indigo-200 bg-indigo-50 shadow-sm'
                                        : 'border-slate-200 hover:border-indigo-200 hover:bg-slate-50'
                                        }`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-semibold text-slate-800">{template.name}</span>
                                                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusStyles[template.status]}`}>
                                                    {template.status}
                                                </span>
                                            </div>
                                            <p className="mt-1 text-xs text-slate-500 line-clamp-2">{template.description}</p>
                                        </div>
                                        <div className="flex flex-col items-end gap-1 text-xs text-slate-400">
                                            <span>{template.moduleCount} 个模块</span>
                                            <span>{template.updatedAt}</span>
                                        </div>
                                    </div>
                                    <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                                        <span className="rounded-full bg-slate-100 px-2 py-0.5">{template.scopeHint}</span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </section>

                <section className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 flex flex-col gap-5">
                    {!activeTemplate && (
                        <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-400">
                            请选择左侧模板查看详情
                        </div>
                    )}
                    {activeTemplate && (
                        <>
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-xl font-semibold text-slate-800">{activeTemplate.name}</h3>
                                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusStyles[activeTemplate.status]}`}>
                                            {activeTemplate.status}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-sm text-slate-500">{activeTemplate.description}</p>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <button
                                        onClick={() => openEditDrawer(activeTemplate)}
                                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 hover:text-slate-800 flex items-center gap-1"
                                    >
                                        <Pencil size={14} /> 编辑
                                    </button>
                                    <button
                                        onClick={() => handleCloneTemplate(activeTemplate)}
                                        disabled={isActioning}
                                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 hover:text-slate-800 flex items-center gap-1 disabled:opacity-50"
                                    >
                                        <Copy size={14} /> 复制
                                    </button>
                                    {activeTemplate.status === '已发布' ? (
                                        <button
                                            onClick={() => openTemplateAction('disable', activeTemplate)}
                                            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 hover:text-slate-800 flex items-center gap-1"
                                        >
                                            <PauseCircle size={14} /> 停用
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => openTemplateAction('publish', activeTemplate)}
                                            className="px-3 py-1.5 rounded-lg border border-emerald-200 text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                                        >
                                            <PlayCircle size={14} /> 发布
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDeleteTemplate(activeTemplate.id)}
                                        disabled={isActioning}
                                        className="px-3 py-1.5 rounded-lg border border-rose-200 text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1 disabled:opacity-50"
                                    >
                                        <Trash2 size={14} /> 删除
                                    </button>
                                </div>
                            </div>

                            <div className="rounded-xl border border-slate-200 p-4">
                                <div className="text-xs text-slate-500">推荐范围</div>
                                <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600">
                                    <span className="rounded-full border border-slate-200 px-2 py-0.5">{activeTemplate.scopeHint}</span>
                                    <span className="rounded-full border border-slate-200 px-2 py-0.5">可覆盖 {activeTemplate.moduleCount} 个模块</span>
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-semibold text-slate-700">权限矩阵</p>
                                    <button
                                        onClick={() => setShowAdvanced(!showAdvanced)}
                                        className={`text-xs flex items-center gap-1 ${showAdvanced ? 'text-indigo-600 font-medium' : 'text-slate-500'}`}
                                    >
                                        <Sparkles size={12} />
                                        {showAdvanced ? '隐藏高级权限点' : '显示高级权限点'}
                                    </button>
                                </div>
                                <div className="mt-3 overflow-hidden rounded-lg border border-slate-200">
                                    <div className="grid grid-cols-[1.1fr_repeat(4,0.7fr)_1fr] bg-slate-50 text-xs font-semibold text-slate-500">
                                        <div className="px-4 py-2">治理模块</div>
                                        {actionLabels.map((label) => (
                                            <div key={label} className="px-3 py-2 text-center">
                                                {label}
                                            </div>
                                        ))}
                                        <div className="px-4 py-2">说明</div>
                                    </div>
                                    {normalizePermissions(activeTemplate.permissions).map((item, index) => {
                                        const ops = operationPointDefinitions[item.module];
                                        const hasOps = ops && ops.length > 0;
                                        return (
                                            <div key={item.module} className={`${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                                                <div className="grid grid-cols-[1.1fr_repeat(4,0.7fr)_1fr] text-xs text-slate-600">
                                                    <div className="px-4 py-3 font-semibold text-slate-700">{item.module}</div>
                                                    {actionLabels.map((label) => (
                                                        <div key={label} className="px-3 py-3 text-center">
                                                            {item.actions.includes(label) ? (
                                                                <span className="text-emerald-600 font-semibold">✓</span>
                                                            ) : (
                                                                <span className="text-slate-300">—</span>
                                                            )}
                                                        </div>
                                                    ))}
                                                    <div className="px-4 py-3 text-slate-500">{item.note}</div>
                                                </div>
                                                {showAdvanced && hasOps && (
                                                    <div className="px-4 pb-3 pt-0 border-t border-slate-100 bg-slate-50/30">
                                                        <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2">
                                                            {ops.map(op => (
                                                                <div key={op.key} className="flex items-center gap-2 text-xs text-slate-600">
                                                                    <span className={`h-2 w-2 rounded-full ${item.operationPoints?.includes(op.key) ? 'bg-indigo-500' : 'bg-slate-200'}`} />
                                                                    <span>{op.label}</span>
                                                                    <span className="text-[10px] text-slate-400">({op.parentAction})</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </>
                    )}
                </section>
            </div>

            {modalOpen && draftTemplate && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40">
                    <div className="min-h-screen p-4 flex items-start justify-center">
                        <div className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl flex max-h-[92vh] flex-col">
                            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-800">新建模板</h3>
                                    <p className="text-xs text-slate-500">配置模板的基本信息与权限策略。</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="rounded-full border border-slate-200 p-2 text-slate-500 hover:text-slate-700"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                            <div className="space-y-6 px-6 py-6 overflow-y-auto">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-600">模板名称</label>
                                        <input
                                            value={draftTemplate.name}
                                            onChange={(event) => setDraftTemplate({ ...draftTemplate, name: event.target.value })}
                                            placeholder="例如：语义治理负责人模板"
                                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-600">模板编码</label>
                                        <input
                                            value={draftTemplate.code}
                                            onChange={(event) => setDraftTemplate({ ...draftTemplate, code: event.target.value })}
                                            placeholder="tpl_semantic_owner"
                                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-xs font-semibold text-slate-600">模板描述</label>
                                        <textarea
                                            value={draftTemplate.description}
                                            onChange={(event) => setDraftTemplate({ ...draftTemplate, description: event.target.value })}
                                            placeholder="描述模板适用的岗位与权限范围"
                                            className="h-20 w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-600">状态</label>
                                        <select
                                            value={draftTemplate.status}
                                            onChange={(event) => setDraftTemplate({ ...draftTemplate, status: event.target.value as TemplateStatus })}
                                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
                                        >
                                            <option value="草稿">草稿</option>
                                            <option value="已发布">已发布</option>
                                            <option value="停用">停用</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-600">推荐范围</label>
                                        <select
                                            value={draftTemplate.scopeHint}
                                            onChange={(event) => setDraftTemplate({ ...draftTemplate, scopeHint: event.target.value })}
                                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
                                        >
                                            {scopeHintOptions.map((option) => (
                                                <option key={option} value={option}>
                                                    {option}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-semibold text-slate-700">权限策略</p>
                                        <button
                                            type="button"
                                            onClick={() => setShowAdvancedPermissions(!showAdvancedPermissions)}
                                            className={`text-xs flex items-center gap-1 ${showAdvancedPermissions ? 'text-indigo-600 font-medium' : 'text-slate-500'}`}
                                        >
                                            <Sparkles size={12} />
                                            {showAdvancedPermissions ? '隐藏高级权限点' : '显示高级权限点'}
                                        </button>
                                    </div>
                                    <div className="mt-3 overflow-hidden rounded-lg border border-slate-200">
                                        <div className="grid grid-cols-[1.1fr_repeat(4,0.7fr)_1fr] bg-slate-50 text-xs font-semibold text-slate-500">
                                            <div className="px-4 py-2">治理模块</div>
                                            {actionLabels.map((label) => (
                                                <div key={label} className="px-3 py-2 text-center">
                                                    {label}
                                                </div>
                                            ))}
                                            <div className="px-4 py-2">说明</div>
                                        </div>
                                        {draftPermissions.map((item, index) => {
                                            const ops = operationPointDefinitions[item.module];
                                            const hasOps = ops && ops.length > 0;
                                            return (
                                                <div key={item.module} className={`${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                                                    <div className="grid grid-cols-[1.1fr_repeat(4,0.7fr)_1fr] text-xs text-slate-600">
                                                        <div className="px-4 py-3 font-semibold text-slate-700 flex flex-col justify-center">
                                                            {item.module}
                                                            {showAdvancedPermissions && hasOps && (
                                                                <span className="text-[10px] font-normal text-slate-400 mt-0.5">
                                                                    包含 {ops.length} 个细分权限点
                                                                </span>
                                                            )}
                                                        </div>
                                                        {actionLabels.map((label) => (
                                                            <label
                                                                key={label}
                                                                className="px-3 py-3 text-center flex items-center justify-center cursor-pointer hover:bg-slate-100/50"
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={item.actions.includes(label)}
                                                                    onChange={() => togglePermissionAction(item.module, label)}
                                                                    className="h-4 w-4 accent-indigo-600 rounded"
                                                                />
                                                            </label>
                                                        ))}
                                                        <div className="px-4 py-3 text-slate-500 flex items-center">{item.note}</div>
                                                    </div>
                                                    {showAdvancedPermissions && hasOps && (
                                                        <div className="px-4 pb-3 pt-0 border-t border-slate-100 bg-slate-50/30">
                                                            <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2">
                                                                {ops.map(op => (
                                                                    <label key={op.key} className="flex items-center gap-2 cursor-pointer group">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={(item.operationPoints || []).includes(op.key)}
                                                                            onChange={() => toggleOperationPoint(item.module, op.key)}
                                                                            className="h-3 w-3 accent-indigo-500 rounded-sm"
                                                                        />
                                                                        <div className="flex flex-col">
                                                                            <span className="text-xs text-slate-600 group-hover:text-indigo-600">{op.label}</span>
                                                                            <span className="text-[10px] text-slate-400 scale-90 origin-top-left">
                                                                                归属: {op.parentAction}
                                                                            </span>
                                                                        </div>
                                                                    </label>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:text-slate-800"
                                >
                                    取消
                                </button>
                                <button
                                    type="button"
                                    onClick={saveNewTemplate}
                                    disabled={isSaving}
                                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    {isSaving ? '创建中...' : '创建模板'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {drawerOpen && drawerTemplate && (
                <div className="fixed inset-0 z-50">
                    <div
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        onClick={closeDrawer}
                    />
                    <div className="absolute right-0 top-0 h-full w-[720px] max-w-[92vw] bg-white shadow-2xl flex flex-col">
                        <div className="sticky top-0 z-10 border-b border-slate-200 bg-white px-6 py-4">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <div className="text-xs text-slate-400">模板编辑</div>
                                    <h3 className="text-xl font-semibold text-slate-800">{drawerTemplate.name || '未命名模板'}</h3>
                                    <div className="mt-2 flex items-center gap-2">
                                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusStyles[drawerTemplate.status]}`}>
                                            {drawerTemplate.status}
                                        </span>
                                        <span className="text-xs text-slate-400">更新：{drawerTemplate.updatedAt}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={saveDrawerTemplate}
                                        className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
                                    >
                                        保存修改
                                    </button>
                                    {drawerTemplate.status === '已发布' ? (
                                        <button
                                            onClick={() => openTemplateAction('disable', drawerTemplate)}
                                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
                                        >
                                            停用
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => openTemplateAction('publish', drawerTemplate)}
                                            className="rounded-lg border border-emerald-200 px-3 py-1.5 text-xs text-emerald-600 hover:text-emerald-700"
                                        >
                                            发布
                                        </button>
                                    )}
                                    <button
                                        onClick={closeDrawer}
                                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
                                    >
                                        关闭
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                            <section className="rounded-xl border border-slate-200 p-4 space-y-4">
                                <div className="text-sm font-semibold text-slate-700">基本信息</div>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-600">模板名称</label>
                                        <input
                                            value={drawerTemplate.name}
                                            onChange={(event) => setDrawerTemplate({ ...drawerTemplate, name: event.target.value })}
                                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                            placeholder="例如：语义治理负责人模板"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-600">模板编码</label>
                                        <input
                                            value={drawerTemplate.code}
                                            onChange={(event) => setDrawerTemplate({ ...drawerTemplate, code: event.target.value })}
                                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                            placeholder="tpl_semantic_owner"
                                        />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-xs font-semibold text-slate-600">模板描述</label>
                                        <textarea
                                            value={drawerTemplate.description}
                                            onChange={(event) => setDrawerTemplate({ ...drawerTemplate, description: event.target.value })}
                                            className="h-20 w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                            placeholder="描述模板适用的岗位与权限范围"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-600">状态</label>
                                        <select
                                            value={drawerTemplate.status}
                                            onChange={(event) => setDrawerTemplate({ ...drawerTemplate, status: event.target.value as TemplateStatus })}
                                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                        >
                                            <option value="草稿">草稿</option>
                                            <option value="已发布">已发布</option>
                                            <option value="停用">停用</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-600">推荐范围</label>
                                        <select
                                            value={drawerTemplate.scopeHint}
                                            onChange={(event) => setDrawerTemplate({ ...drawerTemplate, scopeHint: event.target.value })}
                                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                        >
                                            {scopeHintOptions.map((option) => (
                                                <option key={option} value={option}>
                                                    {option}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </section>

                            <section className="rounded-xl border border-slate-200 p-4">
                                <div className="flex items-center justify-between">
                                    <div className="text-sm font-semibold text-slate-700">权限策略</div>
                                    <button
                                        onClick={() => setDrawerShowAdvanced(!drawerShowAdvanced)}
                                        className={`text-xs flex items-center gap-1 ${drawerShowAdvanced ? 'text-indigo-600 font-medium' : 'text-slate-500'}`}
                                    >
                                        <Sparkles size={12} />
                                        {drawerShowAdvanced ? '隐藏高级权限点' : '显示高级权限点'}
                                    </button>
                                </div>
                                <div className="mt-3 overflow-hidden rounded-lg border border-slate-200">
                                    <div className="grid grid-cols-[1.1fr_repeat(4,0.7fr)_1fr] bg-slate-50 text-xs font-semibold text-slate-500">
                                        <div className="px-4 py-2">治理模块</div>
                                        {actionLabels.map((label) => (
                                            <div key={label} className="px-3 py-2 text-center">
                                                {label}
                                            </div>
                                        ))}
                                        <div className="px-4 py-2">说明</div>
                                    </div>
                                    {drawerPermissions.map((item, index) => {
                                        const ops = operationPointDefinitions[item.module];
                                        const hasOps = ops && ops.length > 0;
                                        return (
                                            <div key={item.module} className={`${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                                                <div className="grid grid-cols-[1.1fr_repeat(4,0.7fr)_1fr] text-xs text-slate-600">
                                                    <div className="px-4 py-3 font-semibold text-slate-700 flex flex-col justify-center">
                                                        {item.module}
                                                        {drawerShowAdvanced && hasOps && (
                                                            <span className="text-[10px] font-normal text-slate-400 mt-0.5">
                                                                包含 {ops.length} 个细分权限点
                                                            </span>
                                                        )}
                                                    </div>
                                                    {actionLabels.map((label) => (
                                                        <label
                                                            key={label}
                                                            className="px-3 py-3 text-center flex items-center justify-center cursor-pointer hover:bg-slate-100/50"
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={item.actions.includes(label)}
                                                                onChange={() => toggleDrawerPermissionAction(item.module, label)}
                                                                className="h-4 w-4 accent-indigo-600 rounded"
                                                            />
                                                        </label>
                                                    ))}
                                                    <div className="px-4 py-3 text-slate-500 flex items-center">{item.note}</div>
                                                </div>
                                                {drawerShowAdvanced && hasOps && (
                                                    <div className="px-4 pb-3 pt-0 border-t border-slate-100 bg-slate-50/30">
                                                        <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2">
                                                            {ops.map(op => (
                                                                <label key={op.key} className="flex items-center gap-2 cursor-pointer group">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={(item.operationPoints || []).includes(op.key)}
                                                                        onChange={() => toggleDrawerOperationPoint(item.module, op.key)}
                                                                        className="h-3 w-3 accent-indigo-500 rounded-sm"
                                                                    />
                                                                    <div className="flex flex-col">
                                                                        <span className="text-xs text-slate-600 group-hover:text-indigo-600">{op.label}</span>
                                                                        <span className="text-[10px] text-slate-400 scale-90 origin-top-left">
                                                                            归属: {op.parentAction}
                                                                        </span>
                                                                    </div>
                                                                </label>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                                    风险提示：包含管理/发布权限的模板需走审批流程。
                                </div>
                            </section>

                            <section className="rounded-xl border border-slate-200 p-4">
                                <div className="text-sm font-semibold text-slate-700">使用情况</div>
                                <div className="mt-3 grid gap-3 md:grid-cols-3 text-xs text-slate-600">
                                    <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                                        <div className="text-slate-400">引用角色</div>
                                        <div className="mt-2 text-lg font-semibold text-slate-800">12</div>
                                    </div>
                                    <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                                        <div className="text-slate-400">最近应用</div>
                                        <div className="mt-2 text-lg font-semibold text-slate-800">2 天前</div>
                                    </div>
                                    <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                                        <div className="text-slate-400">推荐范围</div>
                                        <div className="mt-2 text-lg font-semibold text-slate-800">{drawerTemplate.scopeHint}</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        closeDrawer();
                                        navigateToRoleCreate(drawerTemplate.id);
                                    }}
                                    className="mt-3 text-xs text-indigo-600 hover:text-indigo-700"
                                >
                                    从模板创建角色
                                </button>
                            </section>
                        </div>
                        <div className="border-t border-slate-200 px-6 py-4 flex justify-end gap-3">
                            <button
                                onClick={closeDrawer}
                                className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:text-slate-800"
                            >
                                取消
                            </button>
                            <button
                                onClick={saveDrawerTemplate}
                                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                            >
                                保存修改
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {actionModalOpen && actionTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-800">
                                    {actionType === 'publish' ? '发布模板确认' : '停用模板确认'}
                                </h3>
                                <p className="text-xs text-slate-500">
                                    {actionType === 'publish'
                                        ? '发布后模板将可被角色快速复用。'
                                        : '停用后模板将无法被新增角色使用。'}
                                </p>
                            </div>
                            <button
                                onClick={closeActionModal}
                                className="rounded-full border border-slate-200 p-2 text-slate-500 hover:text-slate-700"
                            >
                                <X size={16} />
                            </button>
                        </div>
                        <div className="px-6 py-5 space-y-3 text-sm text-slate-600">
                            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                                模板：{actionTarget.name}
                            </div>
                            {actionType === 'disable' && (
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-600">停用原因</label>
                                    <textarea
                                        value={actionReason}
                                        onChange={(event) => setActionReason(event.target.value)}
                                        placeholder="请输入停用原因（必填）"
                                        className="h-20 w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                    />
                                </div>
                            )}
                        </div>
                        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-6 py-4">
                            <button
                                onClick={closeActionModal}
                                className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:text-slate-800"
                            >
                                取消
                            </button>
                            <button
                                onClick={confirmTemplateAction}
                                disabled={isActioning || (actionType === 'disable' && !actionReason.trim())}
                                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                            >
                                {isActioning ? '处理中...' : (actionType === 'publish' ? '确认发布' : '确认停用')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PermissionTemplatesView;
