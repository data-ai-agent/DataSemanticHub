import React from 'react';
import { X, AlertTriangle, ArrowRight, ShieldAlert, Check } from 'lucide-react';

// Define the Scope and Role types internally or import if shared (mocking for self-containment/simplicity here)
type ScopeType = 'Global' | 'Tenant' | 'Organization' | 'Domain';
type Scope = { type: ScopeType; ids: string[] };
type Role = { id: string; name: string; scope: Scope; description: string; status: string; };
type PermissionItem = { module: string; actions: string[]; operationPoints?: string[] };

interface RoleChangeConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    draftRole: Role;
    originalRole: Role | null;
    permissions: PermissionItem[];
}

const RoleChangeConfirmModal: React.FC<RoleChangeConfirmModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    draftRole,
    originalRole,
    permissions
}) => {
    if (!isOpen) return null;

    // 1. Analyze Risks
    const isGlobalScope = draftRole.scope.type === 'Global';
    const hasManagePermission = permissions.some(p => p.actions.includes('管理'));
    const isHighRisk = isGlobalScope || hasManagePermission;

    // 2. Calculate Scope Changes
    const scopeChanged = !originalRole ||
        originalRole.scope.type !== draftRole.scope.type ||
        JSON.stringify(originalRole.scope.ids) !== JSON.stringify(draftRole.scope.ids);

    const oldScopeLabel = originalRole
        ? (originalRole.scope.type === 'Global' ? '全平台' : `${originalRole.scope.type} (${originalRole.scope.ids.length})`)
        : '无';
    const newScopeLabel = draftRole.scope.type === 'Global' ? '全平台' : `${draftRole.scope.type} (${draftRole.scope.ids.length})`;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                    <div className="flex items-center gap-2">
                        {isHighRisk ? (
                            <ShieldAlert className="text-amber-500" size={24} />
                        ) : (
                            <Check className="text-emerald-500" size={24} />
                        )}
                        <div>
                            <h3 className="text-lg font-semibold text-slate-800">
                                {isHighRisk ? '高风险变更确认' : '确认保存角色'}
                            </h3>
                            <p className="text-xs text-slate-500">
                                {isHighRisk ? '检测到敏感权限或广域范围，建议仔细核对。' : '请确认以下变更配置。'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="px-6 py-6 space-y-6">
                    {/* Risk Warning Box */}
                    {isHighRisk && (
                        <div className="rounded-lg bg-amber-50 border border-amber-100 p-4">
                            <h4 className="flex items-center gap-2 text-sm font-semibold text-amber-800">
                                <AlertTriangle size={16} />
                                潜在影响评估
                            </h4>
                            <ul className="mt-2 space-y-1 text-xs text-amber-700 list-disc list-inside">
                                {isGlobalScope && <li>该角色拥有 <b>全平台 (Global)</b> 访问范围，影响所有租户。</li>}
                                {hasManagePermission && <li>该角色包含 <b>管理 (Manage)</b> 权限，可执行破坏性操作（如删除/回滚）。</li>}
                            </ul>
                        </div>
                    )}

                    {/* Change Summary */}
                    <div className="space-y-4">
                        <div className="flex items-start justify-between text-sm">
                            <span className="text-slate-500 w-20">角色名称</span>
                            <span className="font-semibold text-slate-800 flex-1 text-right">{draftRole.name}</span>
                        </div>

                        <div className="flex items-start justify-between text-sm">
                            <span className="text-slate-500 w-20">授权范围</span>
                            <div className="flex-1 flex items-center justify-end gap-2">
                                {scopeChanged && (
                                    <>
                                        <span className="text-slate-400 line-through text-xs">{oldScopeLabel}</span>
                                        <ArrowRight size={14} className="text-slate-300" />
                                    </>
                                )}
                                <span className={`font-semibold ${isGlobalScope ? 'text-amber-600' : 'text-slate-800'}`}>
                                    {newScopeLabel}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-start justify-between text-sm">
                            <span className="text-slate-500 w-20">权限策略</span>
                            <div className="flex-1 text-right">
                                {permissions.filter(p => p.actions.includes('管理')).length > 0 ? (
                                    <span className="text-amber-600 font-medium">包含管理权限</span>
                                ) : (
                                    <span className="text-slate-600">常规操作权限</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4 bg-slate-50/50 rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-white transition-colors"
                    >
                        取消修改
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors flex items-center gap-2 ${isHighRisk
                                ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-100'
                                : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100'
                            }`}
                    >
                        {isHighRisk ? '我确认风险并保存' : '确认保存'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RoleChangeConfirmModal;
