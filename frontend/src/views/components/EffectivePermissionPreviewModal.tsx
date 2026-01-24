import React, { useState, useMemo } from 'react';
import { Check, Shield, User, X } from 'lucide-react';

// --- Shared Types ---
interface PermissionItem {
    module: string;
    actions: string[];
    operationPoints?: string[];
}

interface Role {
    id: string;
    name: string;
    permissions: PermissionItem[];
    scope?: { type: string; ids: string[] };
    dataFilters?: string[];
}

interface MockUser {
    id: string;
    name: string;
    roleIds: string[];
    avatar?: string;
}

// --- Mock Data ---
export const MOCK_USERS: MockUser[] = [
    { id: 'u1', name: 'Alice (Data Steward)', roleIds: ['role_admin', 'role_governance'] }, // IDs matching mock roles in UserPermissionView if possible
    { id: 'u2', name: 'Bob (Viewer)', roleIds: ['role_audit'] },
    { id: 'u3', name: 'Charlie (Ops)', roleIds: ['role_ops'] },
];

interface EffectivePermissionPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    allRoles: Role[];
}

export const EffectivePermissionPreviewModal: React.FC<EffectivePermissionPreviewModalProps> = ({
    isOpen,
    onClose,
    allRoles
}) => {
    const [selectedUserId, setSelectedUserId] = useState<string>('');

    const selectedUser = useMemo(() => MOCK_USERS.find(u => u.id === selectedUserId), [selectedUserId]);

    const effectivePermissions = useMemo(() => {
        if (!selectedUser) return [];

        // Match based on ID (assuming fuzzy match or direct match? In UserPermissionView mock roles are role_admin etc.)
        // Users above use correct IDs now.
        const userRoles = allRoles.filter(r => selectedUser.roleIds.includes(r.id));

        // Merge Strategy: Union
        const mergedMap = new Map<string, { actions: Set<string>, operationPoints: Set<string> }>();

        userRoles.forEach(role => {
            role.permissions.forEach(perm => {
                if (!mergedMap.has(perm.module)) {
                    mergedMap.set(perm.module, { actions: new Set(), operationPoints: new Set() });
                }
                const entry = mergedMap.get(perm.module)!;
                perm.actions.forEach(a => entry.actions.add(a));
                perm.operationPoints?.forEach(op => entry.operationPoints.add(op));
            });
        });

        // Convert back to array
        const result: PermissionItem[] = [];
        mergedMap.forEach((val, key) => {
            result.push({
                module: key,
                actions: Array.from(val.actions),
                operationPoints: Array.from(val.operationPoints)
            });
        });

        return result;
    }, [selectedUser, allRoles]);

    const effectiveFilters = useMemo(() => {
        if (!selectedUser) return [];
        const userRoles = allRoles.filter(r => selectedUser.roleIds.includes(r.id));
        return Array.from(new Set(userRoles.flatMap(role => role.dataFilters || [])));
    }, [selectedUser, allRoles]);

    // Helper to get roles that grant a specific module
    const getGrantingRoles = (module: string) => {
        if (!selectedUser) return [];
        return allRoles.filter(r =>
            selectedUser.roleIds.includes(r.id) &&
            r.permissions.some(p => p.module === module)
        ).map(r => r.name);
    };

    const modules = Array.from(new Set(allRoles.flatMap(r => r.permissions.map(p => p.module))));

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
            <div className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl flex max-h-[90vh] flex-col animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                    <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-indigo-600" />
                        <div>
                            <h3 className="text-lg font-semibold text-slate-800">有效权限预览</h3>
                            <p className="text-xs text-slate-500">模拟用户在多角色叠加下的最终生效权限</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-full p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto space-y-6">
                    {/* User Selection */}
                    <div className="flex items-center gap-4 p-4 bg-slate-50/50 rounded-xl border border-slate-200">
                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                            <User size={20} />
                        </div>
                        <div className="flex-1">
                            <label className="text-xs font-semibold text-slate-500 mb-1 block">选择模拟用户</label>
                            <select
                                value={selectedUserId}
                                onChange={(e) => setSelectedUserId(e.target.value)}
                                className="w-full sm:w-[300px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                                <option value="" disabled>请选择用户...</option>
                                {MOCK_USERS.map(user => (
                                    <option key={user.id} value={user.id}>
                                        {user.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {selectedUser && (
                            <div className="text-sm text-slate-600 border-l border-slate-200 pl-4">
                                <div className="text-xs text-slate-400">已分配角色</div>
                                <div className="font-semibold text-slate-900 mt-0.5">
                                    {allRoles.filter(r => selectedUser.roleIds.includes(r.id)).map(r => r.name).join(', ') || '无角色'}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Permission Matrix */}
                    {selectedUser ? (
                        <div className="border border-slate-200 rounded-lg overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 font-medium text-xs uppercase tracking-wider">
                                    <tr>
                                        <th className="px-4 py-3 w-1/4">治理模块</th>
                                        <th className="px-4 py-3">生效权限 (Effective Actions)</th>
                                        <th className="px-4 py-3 w-1/4">数据过滤规则</th>
                                        <th className="px-4 py-3 w-1/4">来源角色</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {modules.map((module, index) => {
                                        const perm = effectivePermissions.find(p => p.module === module);
                                        const actions = perm?.actions || [];
                                        const ops = perm?.operationPoints || [];
                                        const sources = getGrantingRoles(module);

                                        // Skip modules with no permissions if desired, or show them as empty
                                        if (!perm && actions.length === 0) return null;

                                        return (
                                            <tr key={module} className={`hover:bg-slate-50/50 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                                                <td className="px-4 py-3 font-semibold text-slate-700">{module}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-wrap gap-2 mb-1.5">
                                                        {actions.map(action => (
                                                            <span key={action} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                                                                <Check className="w-3 h-3 mr-1" />
                                                                {action}
                                                            </span>
                                                        ))}
                                                    </div>
                                                    {ops.length > 0 && (
                                                        <div className="flex flex-wrap gap-1">
                                                            {ops.map(op => (
                                                                <span key={op} className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] border border-slate-200">
                                                                    {op}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-slate-500 text-xs">
                                                    {effectiveFilters.length > 0 ? effectiveFilters.join(' AND ') : '-'}
                                                </td>
                                                <td className="px-4 py-3 text-slate-500">
                                                    {sources.length > 0 ? (
                                                        <div className="flex flex-wrap gap-1">
                                                            {sources.map(s => (
                                                                <span key={s} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-xs border border-indigo-100">
                                                                    {s}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-400">-</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {effectivePermissions.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-4 py-12 text-center text-slate-400">
                                                该用户暂无任何生效权限。
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-16 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                            <div className="bg-white p-3 rounded-full shadow-sm inline-block mb-3">
                                <User className="h-6 w-6 text-slate-300" />
                            </div>
                            <p className="text-slate-500 text-sm font-medium">请选择上方用户以查看权限详情</p>
                            <p className="text-slate-400 text-xs mt-1">系统将自动合并用户所有角色的权限策略</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4 bg-slate-50/50 rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-50 transition-colors shadow-sm"
                    >
                        关闭
                    </button>
                </div>
            </div>
        </div>
    );
};
