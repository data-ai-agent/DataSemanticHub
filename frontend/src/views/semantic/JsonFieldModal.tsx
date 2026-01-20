import React, { useState } from 'react';
import { X, Search, Database, FileJson, Tag } from 'lucide-react';

interface JsonField {
    fieldName: string;
    fieldType: string;
    sampleData?: string;
    jsonStructure?: any;
}

interface JsonFieldModalProps {
    fields: JsonField[];
    onIdentifyAsJson: (fieldNames: string[]) => void;
    onMarkAsExtension: (fieldNames: string[]) => void;
    onCancel: () => void;
}

export const JsonFieldModal: React.FC<JsonFieldModalProps> = ({
    fields,
    onIdentifyAsJson,
    onMarkAsExtension,
    onCancel
}) => {
    const [selectedFields, setSelectedFields] = useState<Set<string>>(
        new Set(fields.map(f => f.fieldName))
    );
    const [expandedField, setExpandedField] = useState<string | null>(
        fields.length > 0 ? fields[0].fieldName : null
    );

    const toggleFieldSelection = (fieldName: string) => {
        const newSelected = new Set(selectedFields);
        if (newSelected.has(fieldName)) {
            newSelected.delete(fieldName);
        } else {
            newSelected.add(fieldName);
        }
        setSelectedFields(newSelected);
    };

    const handleIdentifyAsJson = () => {
        onIdentifyAsJson(Array.from(selectedFields));
    };

    const handleMarkAsExtension = () => {
        onMarkAsExtension(Array.from(selectedFields));
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                            <Search className="text-indigo-600" size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">JSON/TEXT 字段识别</h2>
                            <p className="text-sm text-slate-500 mt-0.5">
                                检测到 {fields.length} 个可能包含结构化数据的字段
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
                    {/* Info Banner */}
                    <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <Database size={20} className="text-blue-600 mt-0.5" />
                            <div className="flex-1 text-sm">
                                <p className="font-medium text-blue-900 mb-1">如何选择？</p>
                                <ul className="space-y-1 text-blue-700">
                                    <li>
                                        <strong>识别为 JSON 结构化字段：</strong> 字段内容包含规范的 JSON 数据，需要进行结构化解析和字段拆解
                                    </li>
                                    <li>
                                        <strong>标记为扩展字段：</strong> 字段存储业务扩展信息，暂不需要结构化解析，作为整体使用
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Fields List */}
                    <div className="space-y-3">
                        {fields.map((field) => (
                            <div
                                key={field.fieldName}
                                className={`border rounded-lg overflow-hidden transition-all ${selectedFields.has(field.fieldName)
                                        ? 'border-indigo-300 bg-indigo-50/30'
                                        : 'border-slate-200 bg-white'
                                    }`}
                            >
                                {/* Field Header */}
                                <div className="flex items-center gap-3 p-4">
                                    <input
                                        type="checkbox"
                                        checked={selectedFields.has(field.fieldName)}
                                        onChange={() => toggleFieldSelection(field.fieldName)}
                                        className="rounded border-slate-300"
                                    />
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-sm font-medium text-slate-800">
                                                {field.fieldName}
                                            </span>
                                            <span className="px-2 py-0.5 bg-slate-100 rounded text-xs text-slate-600">
                                                {field.fieldType}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() =>
                                            setExpandedField(
                                                expandedField === field.fieldName ? null : field.fieldName
                                            )
                                        }
                                        className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                                    >
                                        {expandedField === field.fieldName ? '收起' : '查看示例'}
                                    </button>
                                </div>

                                {/* Expanded Content */}
                                {expandedField === field.fieldName && (
                                    <div className="px-4 pb-4 pt-2 border-t border-slate-100">
                                        <label className="block text-xs font-medium text-slate-500 mb-2">
                                            样例数据预览:
                                        </label>
                                        <div className="bg-slate-900 rounded-lg p-3 overflow-x-auto">
                                            <pre className="text-xs text-emerald-400 font-mono">
                                                {field.sampleData ||
                                                    JSON.stringify(
                                                        field.jsonStructure || {
                                                            status: 1,
                                                            config: { theme: 'dark', lang: 'zh' },
                                                            tags: ['tag1', 'tag2']
                                                        },
                                                        null,
                                                        2
                                                    )}
                                            </pre>
                                        </div>
                                        {field.jsonStructure && (
                                            <div className="mt-2 text-xs text-slate-500">
                                                <FileJson size={12} className="inline mr-1" />
                                                已检测到可解析的 JSON 结构
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Selection Info */}
                    <div className="mt-4 text-xs text-slate-500">
                        已选择 <strong className="text-indigo-600">{selectedFields.size}</strong> 个字段
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-slate-200 bg-slate-50">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Search size={16} className="text-indigo-500" />
                        <span>请选择字段的处理方式</span>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onCancel}
                            className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg font-medium transition-colors"
                        >
                            取消
                        </button>
                        <button
                            onClick={handleMarkAsExtension}
                            disabled={selectedFields.size === 0}
                            className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Tag size={16} />
                            标记为扩展字段
                        </button>
                        <button
                            onClick={handleIdentifyAsJson}
                            disabled={selectedFields.size === 0}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <FileJson size={16} />
                            识别为 JSON 结构
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
