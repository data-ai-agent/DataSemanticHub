export const agentFactoryMock = {
    overview: {
        kpis: [
            { label: '模板数', value: '86', trend: '+12%' },
            { label: '已发布版本', value: '214', trend: '+6%' },
            { label: '运行实例', value: '48', trend: '+4%' },
            { label: '近7天调用量', value: '1,284,560', trend: '+18%' },
            { label: '成功率', value: '98.2%', trend: '+0.6%' },
            { label: '超时率', value: '0.7%', trend: '-0.2%' }
        ],
        recentActivities: [
            { type: '发布', template: '供应链问数助手', version: 'v2.3.1', time: '2小时前' },
            { type: '回滚', template: '政务事项解读', version: 'v1.8.4', time: '昨天 22:14' },
            { type: '失败', template: '销售预测洞察', version: 'v3.0.0-rc1', time: '昨天 18:30' }
        ],
        topUsage: [
            { name: '运营日报生成器', calls: '412k', successRate: '99.1%' },
            { name: '供应链问数助手', calls: '298k', successRate: '98.4%' },
            { name: '合同风险审查', calls: '184k', successRate: '97.9%' }
        ],
        topFailures: [
            { name: '销售预测洞察', failRate: '4.8%', p95: '5.2s' },
            { name: '政府事项解析', failRate: '3.2%', p95: '4.1s' },
            { name: '供应商画像助手', failRate: '2.7%', p95: '3.8s' }
        ],
        governanceStatus: [
            { label: '未通过门禁版本', value: 4, desc: '包含 schema 校验失败' },
            { label: '灰度发布中', value: 2, desc: 'Prod 20% 流量' },
            { label: '工具异常告警', value: 3, desc: '检索类工具超时' }
        ]
    },
    templateLibrary: {
        categories: ['全部', '辅助阅读', '事件感知', '报告生成', '辅助决策', '数据处理', '情报分析', '智能洞察', '分析助手'],
        capabilityTypes: ['问数(QNA)', '语义理解(SEM)', '知识网络构建(KG)', '报告', '客服', '通用'],
        statuses: ['草稿', '待审核', '已发布', '已废弃', '灰度中'],
        templates: [
            {
                id: 'tpl_001',
                name: '供应链问数助手',
                description: '结合语义版本与指标库，支持跨域问数与归因解释。',
                capability: '问数(QNA)',
                domain: '供应链',
                status: 'Stable',
                semanticVersion: 'v2.1.0',
                calls: '298k',
                successRate: '98.4%',
                p95: '2.6s'
            },
            {
                id: 'tpl_002',
                name: '运营日报生成器',
                description: '自动生成日/周/月经营报告与异常说明。',
                capability: '报告',
                domain: '运营',
                status: 'Canary',
                semanticVersion: 'v1.9.3',
                calls: '412k',
                successRate: '99.1%',
                p95: '1.9s'
            },
            {
                id: 'tpl_003',
                name: '合同风险审查',
                description: '识别合同条款风险点与合规建议。',
                capability: '语义理解(SEM)',
                domain: '法务',
                status: 'Stable',
                semanticVersion: 'v2.0.4',
                calls: '184k',
                successRate: '97.9%',
                p95: '3.1s'
            },
            {
                id: 'tpl_004',
                name: '政府事项解读',
                description: '政务事项材料解读与流程指引。',
                capability: '语义理解(SEM)',
                domain: '政务',
                status: 'Draft',
                semanticVersion: 'v1.6.0',
                calls: '38k',
                successRate: '96.8%',
                p95: '3.9s'
            },
            {
                id: 'tpl_005',
                name: '供应商画像助手',
                description: '结合知识网络输出供应商风险画像与评分。',
                capability: '知识网络构建(KG)',
                domain: '采购',
                status: 'Deprecated',
                semanticVersion: 'v1.3.2',
                calls: '12k',
                successRate: '94.2%',
                p95: '4.7s'
            },
            {
                id: 'tpl_006',
                name: '销售预测洞察',
                description: '通过多源数据构建预测并输出解释。',
                capability: '智能洞察',
                domain: '销售',
                status: 'Canary',
                semanticVersion: 'v2.4.0',
                calls: '64k',
                successRate: '95.2%',
                p95: '5.2s'
            }
        ]
    },
    debugTrace: {
        traceStages: [
            { name: 'parse', cost: '220ms', status: 'pass' },
            { name: 'ground', cost: '640ms', status: 'pass' },
            { name: 'plan', cost: '410ms', status: 'pass' },
            { name: 'generate', cost: '1.8s', status: 'pass' },
            { name: 'execute', cost: '2.4s', status: 'warn' },
            { name: 'explain', cost: '520ms', status: 'pass' }
        ],
        toolCalls: [
            { name: 'SemanticSearch', duration: '420ms', status: 'success' },
            { name: 'MetricResolver', duration: '310ms', status: 'success' },
            { name: 'SQLRunner', duration: '1.9s', status: 'timeout' }
        ]
    },
    testEvaluation: {
        cases: [
            { id: 'case_001', name: '库存异常识别', input: '近30天库存波动', status: '通过' },
            { id: 'case_002', name: '跨域归因解释', input: '销量下滑原因', status: '失败' },
            { id: 'case_003', name: '成本占比输出', input: '按渠道拆分成本', status: '通过' }
        ],
        report: {
            successRate: '96.4%',
            schemaPassRate: '94.2%',
            avgLatency: '2.8s',
            p95: '4.9s',
            cost: '￥1.82 / 千次'
        }
    },
    releaseCanary: {
        steps: [
            { name: '预检查', status: 'done' },
            { name: '回归门禁', status: 'done' },
            { name: '执行发布', status: 'in_progress' },
            { name: '监控窗口', status: 'pending' }
        ],
        metrics: [
            { label: '成功率', value: '98.1%', delta: '+0.4%' },
            { label: '超时率', value: '0.9%', delta: '+0.1%' },
            { label: '平均成本', value: '￥0.021', delta: '-3%' }
        ]
    },
    instances: [
        { id: 'ins_001', name: '供应链助手-华东', version: 'v2.3.1', type: '问数', domain: '供应链', env: 'Prod', status: '运行中', owner: '陈颖', updated: '2小时前' },
        { id: 'ins_002', name: '运营日报-总部', version: 'v1.9.3', type: '报告', domain: '运营', env: 'Prod', status: '运行中', owner: '刘杰', updated: '昨天' },
        { id: 'ins_003', name: '合同审查-法务', version: 'v2.0.4', type: '语义理解', domain: '法务', env: 'Staging', status: '停用', owner: '王璐', updated: '3天前' }
    ],
    observability: {
        kpis: [
            { label: '调用量', value: '1.28M', trend: '+18%' },
            { label: '成功率', value: '98.2%', trend: '+0.6%' },
            { label: 'P95耗时', value: '3.9s', trend: '-0.3s' },
            { label: '平均成本', value: '￥0.020', trend: '-2%' }
        ],
        errorCodes: [
            { code: 'TOOL_TIMEOUT', count: 86, template: '销售预测洞察' },
            { code: 'SCHEMA_FAIL', count: 48, template: '供应商画像助手' },
            { code: 'POLICY_BLOCK', count: 31, template: '政府事项解读' }
        ],
        traces: [
            { traceId: 'tr_90a1', requestId: 'rq_10091', template: '供应链问数助手', status: '成功', latency: '2.1s' },
            { traceId: 'tr_90a2', requestId: 'rq_10092', template: '销售预测洞察', status: '失败', latency: '4.9s' },
            { traceId: 'tr_90a3', requestId: 'rq_10093', template: '运营日报生成器', status: '成功', latency: '1.8s' }
        ]
    },
    tools: {
        registry: [
            { name: 'SemanticSearch', type: '检索', version: 'v1.3.0', status: '可用', permission: '普通', timeout: '2s', cost: '0.2' },
            { name: 'SQLRunner', type: '执行', version: 'v2.1.4', status: '告警', permission: '高级', timeout: '6s', cost: '0.6' },
            { name: 'PolicyGuard', type: '安全', version: 'v1.0.8', status: '可用', permission: '管理员', timeout: '1s', cost: '0.1' }
        ]
    },
    knowledge: {
        connectors: [
            { name: '业务知识网络', type: '知识网络', scope: '供应链/采购', status: '已连接' },
            { name: '指标库', type: '指标', scope: '经营分析', status: '已连接' },
            { name: '文档库', type: '文档', scope: '制度/流程', status: '需要更新' }
        ]
    },
    runtimePacks: [
        { id: 'pack_001', name: 'QNA-供应链-稳定', type: '问数', domain: '供应链', version: 'v2.3.1', status: 'Stable' },
        { id: 'pack_002', name: 'SEM-法务-灰度', type: '语义理解', domain: '法务', version: 'v2.0.4', status: 'Canary' }
    ],
    auditLogs: [
        { action: '发布', target: '供应链问数助手 v2.3.1', operator: '陈颖', time: '2024-11-12 10:32' },
        { action: '回滚', target: '政府事项解读 v1.8.4', operator: '赵峰', time: '2024-11-11 22:14' },
        { action: '权限变更', target: 'SQLRunner 工具', operator: '管理员', time: '2024-11-10 09:12' }
    ],
    settings: {
        models: [
            { provider: 'OpenAI', models: ['gpt-4o', 'gpt-4o-mini'], status: '已配置' },
            { provider: '通义千问', models: ['qwen-max', 'qwen-plus'], status: '已配置' }
        ]
    }
};
