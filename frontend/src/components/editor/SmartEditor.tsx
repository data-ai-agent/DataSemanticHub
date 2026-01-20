/**
 * Smart Tiptap Editor Component
 * 智能富文本编辑器，支持业务要素高亮
 */

import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { EntityHighlight } from './EntityMarks';
import { SmartCompletion } from './extensions/SmartCompletion';

interface SmartEditorProps {
    content: string;
    onChange: (content: string) => void;
    analysisResult?: {
        subjects: string[];
        actions: string[];
        objects: string[];
        states: string[];
    } | null;
    completionItems?: any[];
    placeholder?: string;
    editable?: boolean;
}

const SmartEditor: React.FC<SmartEditorProps> = ({
    content,
    onChange,
    analysisResult,
    completionItems = [],
    placeholder = '请用自然语言描述业务流程...',
    editable = true,
}) => {
    const editor = useEditor({
        extensions: [
            StarterKit,
            EntityHighlight.configure({
                config: analysisResult || null,
            }),
            SmartCompletion.configure({
                items: completionItems,
            }),
        ],
        content,
        editable,
        onUpdate: ({ editor }) => {
            const text = editor.getText();
            onChange(text);
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none min-h-[400px] max-w-none p-6',
            },
        },
    });

    // 当分析结果更新时，重新配置扩展
    useEffect(() => {
        if (editor && analysisResult) {
            editor.extensionManager.extensions.forEach(ext => {
                if (ext.name === 'entityHighlight') {
                    ext.options.config = analysisResult;
                }
            });
            // 强制重新渲染
            editor.view.dispatch(editor.state.tr);
        }
    }, [analysisResult, editor]);

    // 当补全建议更新时，重新配置扩展
    useEffect(() => {
        if (editor && completionItems.length > 0) {
            editor.extensionManager.extensions.forEach(ext => {
                if (ext.name === 'smartCompletion') {
                    ext.options.items = completionItems;
                }
            });
        }
    }, [completionItems, editor]);

    // 内容变化时更新编辑器
    useEffect(() => {
        if (editor && content !== editor.getText()) {
            editor.commands.setContent(content);
        }
    }, [content, editor]);

    if (!editor) {
        return null;
    }

    return (
        <div className="smart-editor-container">
            {/* 编辑器 */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden relative">
                <EditorContent
                    editor={editor}
                    className="tiptap-editor"
                />

                {/* Placeholder */}
                {editor.isEmpty && (
                    <div className="absolute top-6 left-6 text-slate-400 pointer-events-none text-lg">
                        {placeholder} <span className="opacity-60 text-sm ml-2">(输入 '/' 快速插入)</span>
                    </div>
                )}
            </div>

            {/* 高亮图例 */}
            {analysisResult && (
                <div className="mt-3 flex items-center gap-4 text-xs">
                    <span className="text-slate-500">高亮图例:</span>
                    <div className="flex items-center gap-1">
                        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded">主体</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded">行为</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded">客体</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded">状态</span>
                    </div>
                </div>
            )}

            {/* 自定义样式 */}
            <style>{`
                .tiptap-editor .ProseMirror {
                    min-height: 400px;
                    outline: none;
                }
                
                .tiptap-editor .ProseMirror p {
                    margin: 0.75rem 0;
                    line-height: 1.75;
                }
                
                .tiptap-editor .ProseMirror p:first-child {
                    margin-top: 0;
                }
                
                .smart-editor-container {
                    position: relative;
                }
            `}</style>
        </div>
    );
};

export default SmartEditor;
