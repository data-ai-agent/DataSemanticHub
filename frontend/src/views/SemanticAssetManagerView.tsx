import { useState, useEffect } from 'react';
import { Book, Tag, Plus, Search, Edit2, Trash2, MoreHorizontal, Link } from 'lucide-react';
import TermManagementView from './TermManagementView';
import TagManagementView from './TagManagementView';

interface SemanticAssetManagerViewProps {
    initialTab?: 'terms' | 'tags';
}

const SemanticAssetManagerView = ({ initialTab = 'terms' }: SemanticAssetManagerViewProps) => {
    const [activeTab, setActiveTab] = useState<'terms' | 'tags'>(initialTab);

    // Sync state with prop when switching routes
    useEffect(() => {
        if (initialTab) {
            setActiveTab(initialTab);
        }
    }, [initialTab]);

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shrink-0">
                <div>
                    <h1 className="text-xl font-bold text-slate-800">语义资产管理</h1>
                    <p className="text-sm text-slate-500 mt-1">管理企业标准业务术语与语义标签</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="px-6 py-4 flex gap-4 shrink-0">
                <button
                    onClick={() => setActiveTab('terms')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${activeTab === 'terms'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                        }`}
                >
                    <Book size={18} />
                    术语管理
                </button>
                <button
                    onClick={() => setActiveTab('tags')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${activeTab === 'tags'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                        }`}
                >
                    <Tag size={18} />
                    标签管理
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 px-6 pb-6 overflow-hidden min-h-0">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm h-full flex flex-col overflow-hidden">
                    {activeTab === 'terms' ? <TermManagementView /> : <TagManagementView />}
                </div>
            </div>
        </div>
    );
};

export default SemanticAssetManagerView;
