import React, { useState } from 'react';
import { X, Sparkles, Check, Edit3 } from 'lucide-react';

interface FieldComment {
    fieldName: string;
    fieldType: string;
    currentComment: string;
    suggestedComment: string;
}

interface CommentGenerationModalProps {
    fields: FieldComment[];
    onConfirm: (updates: { fieldName: string; comment: string }[]) => void;
    onCancel: () => void;
}

export const CommentGenerationModal: React.FC<CommentGenerationModalProps> = ({
    fields,
    onConfirm,
    onCancel
}) => {
    const [selectedFields, setSelectedFields] = useState<Set<string>>(
        new Set(fields.map(f => f.fieldName))
    );
    const [editedComments, setEditedComments] = useState<Record<string, string>>(
        fields.reduce((acc, f) => ({ ...acc, [f.fieldName]: f.suggestedComment }), {})
    );
    const [editingField, setEditingField] = useState<string | null>(null);

    const toggleFieldSelection = (fieldName: string) => {
        const newSelected = new Set(selectedFields);
        if (newSelected.has(fieldName)) {
            newSelected.delete(fieldName);
        } else {
            newSelected.add(fieldName);
        }
        setSelectedFields(newSelected);
    };

    const handleCommentEdit = (fieldName: string, newComment: string) => {
        setEditedComments(prev => ({ ...prev, [fieldName]: newComment }));
    };

    const handleConfirm = () => {
        const updates = Array.from(selectedFields).map(fieldName => ({
            fieldName,
            comment: editedComments[fieldName]
        }));
        onConfirm(updates);
    };

    const handleSelectAll = () => {
        if (selectedFields.size === fields.length) {
            setSelectedFields(new Set());
        } else {
            setSelectedFields(new Set(fields.map(f => f.fieldName)));
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <Sparkles className="text-purple-600" size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">AI 批量生成注释建议</h2>
                            <p className="text-sm text-slate-500 mt-0.5">
                                已为 {fields.length} 个缺失注释的字段生成建议，请审核后确认
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onCancel}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6">
                    <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-100 border-b border-slate-300">
                                <tr>
                                    <th className="px-4 py-3 text-left">
                                        <input
                                            type="checkbox"
                                            checked={selectedFields.size === fields.length}
                                            onChange={handleSelectAll}
                                            className="rounded border-slate-300"
                                        />
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium text-slate-700">字段名</th>
                                    <th className="px-4 py-3 text-left font-medium text-slate-700">类型</th>
                                    <th className="px-4 py-3 text-left font-medium text-slate-700">AI 建议注释</th>
                                    <th className="px-4 py-3 text-center font-medium text-slate-700">操作</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 bg-white">
                                {fields.map((field) => (
                                    <tr
                                        key={field.fieldName}
                                        className={`hover:bg-purple-50/30 transition-colors ${selectedFields.has(field.fieldName) ? 'bg-purple-50/20' : ''
                                            }`}
                                    >
                                        <td className="px-4 py-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedFields.has(field.fieldName)}
                                                onChange={() => toggleFieldSelection(field.fieldName)}
                                                className="rounded border-slate-300"
                                            />
                                        </td>
                                        <td className="px-4 py-3 font-mono text-xs text-slate-800 font-medium">
                                            {field.fieldName}
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">
                                            <span className="px-2 py-0.5 bg-slate-100 rounded text-xs">
                                                {field.fieldType}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {editingField === field.fieldName ? (
                                                <input
                                                    type="text"
                                                    value={editedComments[field.fieldName]}
                                                    onChange={(e) => handleCommentEdit(field.fieldName, e.target.value)}
                                                    onBlur={() => setEditingField(null)}
                                                    autoFocus
                                                    className="w-full px-2 py-1 border border-purple-300 rounded focus:ring-2 focus:ring-purple-200 outline-none text-sm"
                                                />
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <span className="flex-1 text-slate-700">
                                                        {editedComments[field.fieldName]}
                                                    </span>
                                                    <Sparkles size={12} className="text-purple-400" />
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                onClick={() => setEditingField(field.fieldName)}
                                                className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                                                title="编辑"
                                            >
                                                <Edit3 size={14} className="text-slate-500" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Stats */}
                    <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
                        <span>
                            已选择 <strong className="text-purple-600">{selectedFields.size}</strong> 个字段
                        </span>
                        <span>•</span>
                        <span>点击注释可编辑修改</span>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-slate-200 bg-slate-50">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Sparkles size={16} className="text-purple-500" />
                        <span>AI 基于字段名称和类型生成注释，请审核后确认</span>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onCancel}
                            className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg font-medium transition-colors"
                        >
                            取消
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={selectedFields.size === 0}
                            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Check size={18} />
                            确认应用 ({selectedFields.size})
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
