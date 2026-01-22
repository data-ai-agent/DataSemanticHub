import React from 'react';
import { Layout, Share2 } from 'lucide-react';

interface ViewSwitcherProps {
    currentView: 'object' | 'relation';
    onSwitch: (view: 'object' | 'relation') => void;
    objectCount?: number;
}

export const ViewSwitcher: React.FC<ViewSwitcherProps> = ({ currentView, onSwitch, objectCount = 1 }) => {
    return (
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 w-fit mb-4">
            <button
                onClick={() => onSwitch('object')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${currentView === 'object'
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                    }`}
            >
                <Layout size={16} />
                对象结构
            </button>
            <button
                onClick={() => onSwitch('relation')}
                disabled={objectCount < 1} /* Logic: enable if relations exist or multiple objects? Requirement says "Identify >= 2 objects... relation view highlight". But we can always show it if relations exist. */
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${currentView === 'relation'
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                    } ${objectCount < 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                <Share2 size={16} />
                对象关系
            </button>
        </div>
    );
};
