// ==========================================
// SearchBar Component
// ==========================================

import React from 'react';
import { Search, History, Sparkles as SparklesIcon, Hash } from 'lucide-react';
import { SearchMode } from './types';

interface SearchBarProps {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    searchMode: SearchMode;
    setSearchMode: (mode: SearchMode) => void;
    searchSuggestions: string[];
    showSuggestions: boolean;
    setShowSuggestions: (show: boolean) => void;
    searchHistory: string[];
    setSearchHistory: (history: string[]) => void;
    isSearching: boolean;
    onSearch: (query: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
    searchTerm,
    setSearchTerm,
    searchMode,
    setSearchMode,
    searchSuggestions,
    showSuggestions,
    setShowSuggestions,
    searchHistory,
    setSearchHistory,
    isSearching,
    onSearch
}) => {
    const handleSearchHistoryClick = (history: string) => {
        setSearchTerm(history);
        onSearch(history);
        setShowSuggestions(false);
    };

    const handleSuggestionClick = (suggestion: string) => {
        setSearchTerm(suggestion);
        onSearch(suggestion);
        setShowSuggestions(false);
    };

    const toggleSearchMode = () => {
        const modes: SearchMode[] = ['keyword', 'semantic', 'field'];
        const currentIndex = modes.indexOf(searchMode);
        const nextIndex = (currentIndex + 1) % modes.length;
        setSearchMode(modes[nextIndex]);
    };

    return (
        <div className="relative flex-1 max-w-lg">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && searchTerm.trim()) {
                            onSearch(searchTerm.trim());
                            setShowSuggestions(false);
                        }
                    }}
                    placeholder="搜索数据资产、字段、业务术语... (支持 type:业务对象 等语法)"
                    className="pl-10 pr-24 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 w-full shadow-sm"
                />
                {isSearching && (
                    <div className="absolute right-12 top-1/2 -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                    </div>
                )}
                {/* 搜索模式切换 */}
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button
                        onClick={toggleSearchMode}
                        className={`px-2 py-1 text-xs rounded transition-colors ${searchMode === 'semantic' ? 'bg-purple-100 text-purple-700' :
                                searchMode === 'field' ? 'bg-emerald-100 text-emerald-700' :
                                    'bg-slate-100 text-slate-600'
                            }`}
                        title={searchMode === 'semantic' ? '语义搜索' : searchMode === 'field' ? '字段搜索' : '关键词搜索'}
                    >
                        {searchMode === 'semantic' ? <SparklesIcon size={12} /> :
                            searchMode === 'field' ? <Hash size={12} /> :
                                <Search size={12} />}
                    </button>
                </div>
            </div>

            {/* 搜索建议下拉 */}
            {showSuggestions && (searchSuggestions.length > 0 || searchHistory.length > 0) && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-blue-200 rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto">
                    {/* 搜索历史 */}
                    {!searchTerm && searchHistory.length > 0 && (
                        <>
                            <div className="px-3 py-2 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                                <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                                    <History size={12} />
                                    搜索历史
                                </span>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSearchHistory([]);
                                    }}
                                    className="text-xs text-slate-500 hover:text-slate-700"
                                >
                                    清除
                                </button>
                            </div>
                            {searchHistory.slice(0, 5).map((history, idx) => (
                                <button
                                    key={`history-${idx}`}
                                    onClick={() => handleSearchHistoryClick(history)}
                                    className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors flex items-center gap-2 border-b border-slate-100"
                                >
                                    <History size={14} className="text-slate-400" />
                                    <span className="text-slate-600">{history}</span>
                                </button>
                            ))}
                        </>
                    )}

                    {/* 搜索建议 */}
                    {searchTerm && searchSuggestions.length > 0 && (
                        <>
                            <div className="px-3 py-2 border-b border-slate-200 bg-blue-50">
                                <span className="text-xs font-semibold text-blue-700">搜索建议</span>
                            </div>
                            {searchSuggestions.map((suggestion, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleSuggestionClick(suggestion)}
                                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 transition-colors flex items-center gap-2 border-b border-slate-100 last:border-b-0"
                                >
                                    <Search size={14} className="text-blue-500" />
                                    <span className="text-slate-700">{suggestion}</span>
                                    {idx < 3 && (
                                        <span className="ml-auto text-xs text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">
                                            热门
                                        </span>
                                    )}
                                </button>
                            ))}
                        </>
                    )}

                    {/* 搜索语法提示 */}
                    {!searchTerm && (
                        <div className="px-3 py-2 border-t border-slate-200 bg-slate-50">
                            <div className="text-xs text-slate-500 mb-1">搜索语法提示：</div>
                            <div className="text-xs text-slate-400 space-y-0.5">
                                <div>• type:业务对象 - 按类型搜索</div>
                                <div>• owner:卫健委 - 按负责人搜索</div>
                                <div>• tag:核心资产 - 按标签搜索</div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
