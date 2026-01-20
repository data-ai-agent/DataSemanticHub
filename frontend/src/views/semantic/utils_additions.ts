
// Semantic Stage Configuration
export const semanticStageLabelMap: Record<string, string> = {
    'NOT_STARTED': '未开始语义建模',
    'FIELD_PENDING': '字段语义待确认',
    'MODELING_IN_PROGRESS': '语义建模进行中',
    'READY_FOR_OBJECT': '可进入对象建模'
};

export const semanticStageToneMap: Record<string, string> = {
    'NOT_STARTED': 'bg-slate-100 text-slate-500 border-slate-200',
    'FIELD_PENDING': 'bg-amber-50 text-amber-600 border-amber-200',
    'MODELING_IN_PROGRESS': 'bg-blue-50 text-blue-600 border-blue-200',
    'READY_FOR_OBJECT': 'bg-emerald-50 text-emerald-600 border-emerald-200'
};
