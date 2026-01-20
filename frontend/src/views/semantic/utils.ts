import { GovernanceStatus } from '../../types/semantic';
import { Sparkles } from 'lucide-react';

// Constants
export const governanceLabelMap: Record<GovernanceStatus, string> = {
    'S0': '未治理',
    'S1': 'AI建议中',
    'S2': '待人工确认',
    'S3': '治理完成'
};

export const governanceToneMap: Record<GovernanceStatus, string> = {
    'S0': 'bg-slate-100 text-slate-500 border-slate-200',
    'S1': 'bg-blue-50 text-blue-600 border-blue-200',
    'S2': 'bg-amber-50 text-amber-600 border-amber-200',
    'S3': 'bg-emerald-50 text-emerald-600 border-emerald-200'
};

export const governanceHintMap: Record<GovernanceStatus, string> = {
    'S0': '尚未进行语义理解',
    'S1': 'AI生成的建议待确认',
    'S2': '存在低置信度建议需复核',
    'S3': '已确认所有关键语义'
};

export const rolledBackTone = 'bg-rose-50 text-rose-600 border-rose-200';

export interface GovernanceDisplay {
    label: string;
    tone: string;
    hint: string;
}

export const getGovernanceDisplay = (status: GovernanceStatus, rolledBack?: boolean): GovernanceDisplay => {
    if (rolledBack) {
        return {
            label: '已回滚',
            tone: rolledBackTone,
            hint: '已回滚，可恢复版本'
        };
    }
    return {
        label: governanceLabelMap[status],
        tone: governanceToneMap[status],
        hint: governanceHintMap[status]
    };
};


export const typeConfig: Record<string, { color: string; bgColor: string }> = {
    'MySQL': { color: 'text-slate-700', bgColor: 'bg-slate-100' },
    'Oracle': { color: 'text-slate-700', bgColor: 'bg-slate-100' },
    'PostgreSQL': { color: 'text-slate-700', bgColor: 'bg-slate-100' },
    'SQLServer': { color: 'text-slate-700', bgColor: 'bg-slate-100' },
    'MongoDB': { color: 'text-slate-700', bgColor: 'bg-slate-100' },
    'Redis': { color: 'text-slate-700', bgColor: 'bg-slate-100' },
    'Elasticsearch': { color: 'text-slate-700', bgColor: 'bg-slate-100' },
    'ClickHouse': { color: 'text-slate-700', bgColor: 'bg-slate-100' },
    'TiDB': { color: 'text-slate-700', bgColor: 'bg-slate-100' },
    'OceanBase': { color: 'text-slate-700', bgColor: 'bg-slate-100' },
    '达梦': { color: 'text-slate-700', bgColor: 'bg-slate-100' },
    '人大金仓': { color: 'text-slate-700', bgColor: 'bg-slate-100' },
    'GaussDB': { color: 'text-slate-700', bgColor: 'bg-slate-100' },
    // Add missing ones from standard list if any
    'Hive': { color: 'text-amber-600', bgColor: 'bg-amber-50' },
    'Doris': { color: 'text-teal-600', bgColor: 'bg-teal-50' }
};

// Run Status Constants
import { RunSummary } from '../../types/semantic';

export const runStatusLabelMap: Record<RunSummary['status'], string> = {
    queued: '排队中',
    running: '运行中',
    success: '完成',
    failed: '失败'
};

export const runStatusToneMap: Record<RunSummary['status'], string> = {
    queued: 'text-amber-600',
    running: 'text-blue-600',
    success: 'text-emerald-600',
    failed: 'text-red-600'
};

// Semantic Stage Configuration
export const semanticStageLabelMap: Record<string, string> = {
    'NOT_STARTED': '未开始',
    'FIELD_PENDING': '语义待确认',
    'MODELING_IN_PROGRESS': '语义建模进行中',
    'READY_FOR_OBJECT': '可对象建模'
};

export const semanticStageToneMap: Record<string, string> = {
    'NOT_STARTED': 'bg-slate-100 text-slate-500 border-slate-200',
    'FIELD_PENDING': 'bg-amber-50 text-amber-600 border-amber-200',
    'MODELING_IN_PROGRESS': 'bg-blue-50 text-blue-600 border-blue-200',
    'READY_FOR_OBJECT': 'bg-emerald-50 text-emerald-600 border-emerald-200'
};
