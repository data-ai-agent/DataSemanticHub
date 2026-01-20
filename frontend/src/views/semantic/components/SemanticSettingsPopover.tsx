import React, { useState, useEffect, useRef } from 'react';
import { Settings, X, Check } from 'lucide-react';

interface SemanticSettingsPopoverProps {
    isOpen: boolean;
    onClose: () => void;
    anchorRef?: React.RefObject<HTMLElement>;
    onApply: (settings: SemanticSettings) => void;
    currentSettings?: SemanticSettings;
}

export interface SemanticSettings {
    template: string;
    sampleRatio: number;
    maxRows: number;
    ttl: string;
}

export const SemanticSettingsPopover: React.FC<SemanticSettingsPopoverProps> = ({
    isOpen,
    onClose,
    anchorRef,
    onApply,
    currentSettings = {
        template: 'SEMANTIC_MIN',
        sampleRatio: 0.01,
        maxRows: 200000,
        ttl: '24h'
    }
}) => {
    const [settings, setSettings] = useState<SemanticSettings>(currentSettings);
    const popoverRef = useRef<HTMLDivElement>(null);

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node) &&
                anchorRef?.current && !anchorRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose, anchorRef]);

    if (!isOpen) return null;

    // Calculate position (simple approach: below anchor, aligned right or center)
    // For now, using absolute positioning relative to parent if parent is relative, or fixed logic could be added.
    // Assuming this component is rendered conveniently near the button or inside a relative container.
    // Spec says "Popover", usually implies floating. Let's make it absolute with z-index.

    return (
        <div
            ref={popoverRef}
            className="absolute top-full mt-2 right-0 w-[320px] bg-white rounded-xl shadow-xl border border-slate-200 z-50 animate-in fade-in zoom-in-95 duration-200"
            style={{ transformOrigin: 'top right' }}
        >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <Settings size={14} className="text-slate-500" />
                    语义理解辅助检测设置
                </div>
                <button
                    onClick={onClose}
                    className="p-1 rounded-md hover:bg-slate-200 text-slate-400 transition-colors"
                >
                    <X size={14} />
                </button>
            </div>

            <div className="p-4 space-y-4">
                {/* Template (Read-only) */}
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-500">
                        模板 (内置)
                    </label>
                    <div className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-600 font-mono flex justify-between items-center cursor-not-allowed">
                        {settings.template}
                        <span className="text-[10px] bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded">不可编辑</span>
                    </div>
                </div>

                {/* Sample Ratio (Editable) */}
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-700 flex justify-between">
                        <span>采样比例</span>
                        <span className="text-xs text-blue-600 font-normal">
                            {(settings.sampleRatio * 100).toFixed(1)}%
                        </span>
                    </label>
                    <select
                        value={settings.sampleRatio}
                        onChange={(e) => setSettings({ ...settings, sampleRatio: parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 hover:border-slate-400 transition-colors"
                    >
                        <option value={0.005}>0.5% (快速)</option>
                        <option value={0.01}>1.0% (推荐)</option>
                        <option value={0.05}>5.0% (深度)</option>
                    </select>
                </div>

                {/* Read-only Params Group */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-500">最大行数</label>
                        <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-500 font-mono">
                            {settings.maxRows.toLocaleString()}
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-500">TTL (缓存)</label>
                        <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-500 font-mono">
                            {settings.ttl}
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-100 rounded-b-xl flex justify-end">
                <button
                    onClick={() => {
                        onApply(settings);
                        onClose();
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-all shadow-sm active:scale-95"
                >
                    <Check size={14} />
                    应用配置
                </button>
            </div>
        </div>
    );
};
