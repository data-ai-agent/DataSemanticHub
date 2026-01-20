import React, { useMemo } from 'react';
import { ArrowRight, Circle, CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react';

interface StateNode {
    state_code: string;
    state_name: string;
    is_terminal?: boolean;
    confidence?: number;
}

interface Transition {
    from_state: string;
    to_state: string;
    trigger_action?: string;
    guard_conditions?: string[];
}

interface StateMachineVisualizerProps {
    states: StateNode[];
    transitions: Transition[];
    primaryObject?: string;
    className?: string;
    compact?: boolean;
}

const StateMachineVisualizer: React.FC<StateMachineVisualizerProps> = ({
    states,
    transitions,
    primaryObject,
    className = '',
    compact = false
}) => {
    // Build state graph for layout
    const stateGraph = useMemo(() => {
        // Group states by their position in the flow
        const stateMap = new Map<string, StateNode>();
        states.forEach(s => stateMap.set(s.state_code, s));

        // Find initial states (states with no incoming transitions)
        const hasIncoming = new Set(transitions.map(t => t.to_state));
        const initialStates = states.filter(s => !hasIncoming.has(s.state_code));

        // Find terminal states
        const terminalStates = states.filter(s => s.is_terminal);

        // Order states by flow (BFS from initial)
        const ordered: StateNode[] = [];
        const visited = new Set<string>();
        const queue = initialStates.map(s => s.state_code);

        while (queue.length > 0) {
            const code = queue.shift()!;
            if (visited.has(code)) continue;
            visited.add(code);

            const state = stateMap.get(code);
            if (state) ordered.push(state);

            // Find outgoing transitions
            transitions
                .filter(t => t.from_state === code)
                .forEach(t => {
                    if (!visited.has(t.to_state)) {
                        queue.push(t.to_state);
                    }
                });
        }

        // Add any missed states
        states.forEach(s => {
            if (!visited.has(s.state_code)) {
                ordered.push(s);
            }
        });

        return { ordered, stateMap, initialStates, terminalStates };
    }, [states, transitions]);

    // State colors based on name/type
    const getStateColor = (state: StateNode): string => {
        const name = state.state_name.toLowerCase();
        if (state.is_terminal) {
            if (name.includes('通过') || name.includes('完成') || name.includes('报到') || name.includes('录取')) {
                return 'bg-emerald-100 border-emerald-400 text-emerald-700';
            }
            if (name.includes('拒绝') || name.includes('不通过') || name.includes('失败')) {
                return 'bg-red-100 border-red-400 text-red-700';
            }
        }
        if (name.includes('草稿')) return 'bg-slate-100 border-slate-400 text-slate-700';
        if (name.includes('待') || name.includes('中')) return 'bg-amber-100 border-amber-400 text-amber-700';
        if (name.includes('已')) return 'bg-blue-100 border-blue-400 text-blue-700';
        return 'bg-purple-100 border-purple-400 text-purple-700';
    };

    const getStateIcon = (state: StateNode) => {
        const name = state.state_name.toLowerCase();
        if (state.is_terminal) {
            if (name.includes('通过') || name.includes('完成') || name.includes('录取')) {
                return <CheckCircle2 size={12} className="text-emerald-600" />;
            }
            if (name.includes('拒绝') || name.includes('不通过')) {
                return <XCircle size={12} className="text-red-600" />;
            }
        }
        if (name.includes('待') || name.includes('中')) {
            return <Clock size={12} className="text-amber-600" />;
        }
        return <Circle size={12} className="text-slate-400" />;
    };

    if (states.length === 0) {
        return (
            <div className={`text-center py-8 text-slate-400 ${className}`}>
                <AlertTriangle size={24} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">暂无状态定义</p>
            </div>
        );
    }

    // Compact mode: horizontal flow
    if (compact) {
        return (
            <div className={`flex flex-wrap items-center gap-2 ${className}`}>
                {stateGraph.ordered.map((state, idx) => (
                    <React.Fragment key={state.state_code}>
                        <div
                            className={`px-2.5 py-1 rounded-full border text-xs font-medium flex items-center gap-1.5 ${getStateColor(state)}`}
                            title={`状态: ${state.state_name}`}
                        >
                            {getStateIcon(state)}
                            {state.state_name}
                        </div>
                        {idx < stateGraph.ordered.length - 1 && (
                            <ArrowRight size={14} className="text-slate-300" />
                        )}
                    </React.Fragment>
                ))}
            </div>
        );
    }

    // Full mode: detailed flow with transitions
    return (
        <div className={`space-y-4 ${className}`}>
            {/* Header */}
            {primaryObject && (
                <div className="text-xs text-slate-500 flex items-center gap-2">
                    <span>状态机：</span>
                    <span className="font-semibold text-slate-700">{primaryObject}</span>
                    <span className="text-slate-400">（共 {states.length} 个状态）</span>
                </div>
            )}

            {/* Flow visualization */}
            <div className="relative">
                {/* States in flex row with wrapping */}
                <div className="flex flex-wrap gap-3">
                    {stateGraph.ordered.map((state, idx) => {
                        // Find transitions from this state
                        const outgoing = transitions.filter(t => t.from_state === state.state_code);

                        return (
                            <div key={state.state_code} className="flex items-center gap-2">
                                {/* State node */}
                                <div
                                    className={`relative px-3 py-2 rounded-lg border-2 min-w-[80px] text-center ${getStateColor(state)}`}
                                >
                                    <div className="flex items-center justify-center gap-1.5 text-sm font-medium">
                                        {getStateIcon(state)}
                                        {state.state_name}
                                    </div>
                                    {state.confidence && (
                                        <div className="text-[10px] opacity-70 mt-0.5">
                                            置信度 {Math.round(state.confidence * 100)}%
                                        </div>
                                    )}
                                    {state.is_terminal && (
                                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full border border-current flex items-center justify-center">
                                            <div className="w-1.5 h-1.5 rounded-full bg-current" />
                                        </div>
                                    )}
                                </div>

                                {/* Transition arrow */}
                                {outgoing.length > 0 && idx < stateGraph.ordered.length - 1 && (
                                    <div className="flex flex-col items-center">
                                        <ArrowRight size={18} className="text-slate-400" />
                                        {outgoing[0]?.trigger_action && (
                                            <div className="text-[9px] text-slate-500 max-w-[60px] text-center truncate">
                                                {outgoing[0].trigger_action}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Transitions list */}
            <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="text-xs text-slate-500 mb-2">状态转换规则</div>
                <div className="space-y-1.5">
                    {transitions.slice(0, 6).map((t, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 rounded px-2 py-1">
                            <span className="font-medium text-slate-700">
                                {stateGraph.stateMap.get(t.from_state)?.state_name || t.from_state}
                            </span>
                            <ArrowRight size={12} className="text-slate-400" />
                            <span className="font-medium text-slate-700">
                                {stateGraph.stateMap.get(t.to_state)?.state_name || t.to_state}
                            </span>
                            {t.trigger_action && (
                                <span className="text-indigo-600 ml-auto">
                                    触发：{t.trigger_action}
                                </span>
                            )}
                        </div>
                    ))}
                    {transitions.length > 6 && (
                        <div className="text-xs text-slate-400 text-center">
                            还有 {transitions.length - 6} 条转换规则...
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StateMachineVisualizer;
