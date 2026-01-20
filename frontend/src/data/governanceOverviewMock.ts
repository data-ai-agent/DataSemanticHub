const governanceOverviewMock = {
    title: '治理总览',
    ranges: {
        '7d': {
            timeRange: '7d',
            activeVersion: {
                versionId: 'v_241',
                versionName: 'v2.4.1',
                publishedAt: '2026-01-05T10:00:00Z'
            },
            kpis: {
                fieldSemantic: { coverageRate: 0.61, covered: 610, total: 1000 },
                qualityGate: { passRate: 0.78, passTables: 78, totalTables: 100, blockerTables: 7 },
                security: { completionRate: 0.69, done: 690, required: 1000, highUndone: 5 },
                risk: { level: 'HIGH', reasons: ['DQ_BLOCKER_TABLES', 'SEC_HIGH_UNDONE'] }
            },
            pipeline: [
                { step: 'LOGICAL_VIEW', status: 'DONE', done: 120, total: 120, blockers: 0, cta: { text: '查看逻辑视图', module: 'bu_semantic' } },
                { step: 'FIELD_SEMANTIC', status: 'IN_PROGRESS', done: 610, total: 1000, blockers: 3, cta: { text: '继续字段语义理解', module: 'bu_semantic' } },
                { step: 'QUALITY', status: 'IN_PROGRESS', done: 78, total: 100, blockers: 7, cta: { text: '处理质量阻塞项', module: 'governance' } },
                { step: 'SECURITY', status: 'IN_PROGRESS', done: 690, total: 1000, blockers: 5, cta: { text: '完成高敏字段分级', module: 'governance' } },
                { step: 'VERSION', status: 'DONE', done: 1, total: 1, blockers: 0, cta: { text: '查看语义版本', module: 'td_modeling' } }
            ],
            blockers: {
                semantic: {
                    count: 3,
                    topItems: [
                        { label: 't_order.order_status' },
                        { label: 't_user.user_id' }
                    ],
                    cta: { text: '进入字段语义理解', module: 'bu_semantic' }
                },
                quality: {
                    count: 7,
                    topItems: [
                        { label: 't_payment' },
                        { label: 't_refund' }
                    ],
                    cta: { text: '查看质量阻塞', module: 'governance' }
                },
                security: {
                    count: 5,
                    topItems: [
                        { label: 't_user.id_card_no' },
                        { label: 't_account.mobile' }
                    ],
                    cta: { text: '去安全分级', module: 'governance' }
                }
            },
            distribution: {
                tableSemantic: { subject: 118, event: 42, dimension: 28, unknown: 66 },
                fieldRole: { businessAttr: 0.46, status: 0.14, relation: 0.2, audit: 0.2 }
            },
            quickActions: [
                { text: '继续字段语义理解', count: 14, module: 'bu_semantic' },
                { text: '处理质量阻塞项', count: 7, module: 'governance' },
                { text: '完成高敏字段分级', count: 5, module: 'governance' },
                { text: '查看当前语义版本', module: 'td_modeling' }
            ],
            versionStats: {
                fieldSemanticCoverage: 0.98,
                qualityRuleCoverage: 0.82,
                securityPolicyCoverage: 0.88
            }
        },
        '30d': {
            timeRange: '30d',
            activeVersion: {
                versionId: 'v_243',
                versionName: 'v2.4.3',
                publishedAt: '2026-01-12T10:00:00Z'
            },
            kpis: {
                fieldSemantic: { coverageRate: 0.68, covered: 680, total: 1000 },
                qualityGate: { passRate: 0.82, passTables: 82, totalTables: 100, blockerTables: 5 },
                security: { completionRate: 0.74, done: 740, required: 1000, highUndone: 3 },
                risk: { level: 'HIGH', reasons: ['SEMANTIC_BLOCKER', 'DQ_BLOCKER_TABLES'] }
            },
            pipeline: [
                { step: 'LOGICAL_VIEW', status: 'DONE', done: 120, total: 120, blockers: 0, cta: { text: '查看逻辑视图', module: 'bu_semantic' } },
                { step: 'FIELD_SEMANTIC', status: 'IN_PROGRESS', done: 680, total: 1000, blockers: 2, cta: { text: '继续字段语义理解', module: 'bu_semantic' } },
                { step: 'QUALITY', status: 'IN_PROGRESS', done: 82, total: 100, blockers: 5, cta: { text: '处理质量阻塞项', module: 'governance' } },
                { step: 'SECURITY', status: 'IN_PROGRESS', done: 740, total: 1000, blockers: 3, cta: { text: '完成高敏字段分级', module: 'governance' } },
                { step: 'VERSION', status: 'DONE', done: 1, total: 1, blockers: 0, cta: { text: '查看语义版本', module: 'td_modeling' } }
            ],
            blockers: {
                semantic: {
                    count: 2,
                    topItems: [
                        { label: 't_order.order_status' },
                        { label: 't_payment.pay_status' }
                    ],
                    cta: { text: '进入字段语义理解', module: 'bu_semantic' }
                },
                quality: {
                    count: 5,
                    topItems: [
                        { label: 't_payment' },
                        { label: 't_refund' }
                    ],
                    cta: { text: '查看质量阻塞', module: 'governance' }
                },
                security: {
                    count: 3,
                    topItems: [
                        { label: 't_user.id_card_no' },
                        { label: 't_account.mobile' }
                    ],
                    cta: { text: '去安全分级', module: 'governance' }
                }
            },
            distribution: {
                tableSemantic: { subject: 120, event: 45, dimension: 30, unknown: 60 },
                fieldRole: { businessAttr: 0.48, status: 0.12, relation: 0.18, audit: 0.22 }
            },
            quickActions: [
                { text: '继续字段语义理解', count: 12, module: 'bu_semantic' },
                { text: '处理质量阻塞项', count: 5, module: 'governance' },
                { text: '完成高敏字段分级', count: 3, module: 'governance' },
                { text: '查看当前语义版本', module: 'td_modeling' }
            ],
            versionStats: {
                fieldSemanticCoverage: 1,
                qualityRuleCoverage: 0.85,
                securityPolicyCoverage: 0.9
            }
        },
        '90d': {
            timeRange: '90d',
            activeVersion: {
                versionId: 'v_244',
                versionName: 'v2.4.4',
                publishedAt: '2026-01-20T10:00:00Z'
            },
            kpis: {
                fieldSemantic: { coverageRate: 0.73, covered: 730, total: 1000 },
                qualityGate: { passRate: 0.86, passTables: 86, totalTables: 100, blockerTables: 3 },
                security: { completionRate: 0.8, done: 800, required: 1000, highUndone: 2 },
                risk: { level: 'MEDIUM', reasons: ['DQ_WARNING_TABLES'] }
            },
            pipeline: [
                { step: 'LOGICAL_VIEW', status: 'DONE', done: 120, total: 120, blockers: 0, cta: { text: '查看逻辑视图', module: 'bu_semantic' } },
                { step: 'FIELD_SEMANTIC', status: 'IN_PROGRESS', done: 730, total: 1000, blockers: 1, cta: { text: '继续字段语义理解', module: 'bu_semantic' } },
                { step: 'QUALITY', status: 'IN_PROGRESS', done: 86, total: 100, blockers: 3, cta: { text: '处理质量阻塞项', module: 'governance' } },
                { step: 'SECURITY', status: 'IN_PROGRESS', done: 800, total: 1000, blockers: 2, cta: { text: '完成高敏字段分级', module: 'governance' } },
                { step: 'VERSION', status: 'DONE', done: 1, total: 1, blockers: 0, cta: { text: '查看语义版本', module: 'td_modeling' } }
            ],
            blockers: {
                semantic: {
                    count: 1,
                    topItems: [
                        { label: 't_user.user_id' }
                    ],
                    cta: { text: '进入字段语义理解', module: 'bu_semantic' }
                },
                quality: {
                    count: 3,
                    topItems: [
                        { label: 't_refund' }
                    ],
                    cta: { text: '查看质量阻塞', module: 'governance' }
                },
                security: {
                    count: 2,
                    topItems: [
                        { label: 't_account.mobile' }
                    ],
                    cta: { text: '去安全分级', module: 'governance' }
                }
            },
            distribution: {
                tableSemantic: { subject: 126, event: 48, dimension: 32, unknown: 52 },
                fieldRole: { businessAttr: 0.5, status: 0.1, relation: 0.18, audit: 0.22 }
            },
            quickActions: [
                { text: '继续字段语义理解', count: 8, module: 'bu_semantic' },
                { text: '处理质量阻塞项', count: 3, module: 'governance' },
                { text: '完成高敏字段分级', count: 2, module: 'governance' },
                { text: '查看当前语义版本', module: 'td_modeling' }
            ],
            versionStats: {
                fieldSemanticCoverage: 1,
                qualityRuleCoverage: 0.88,
                securityPolicyCoverage: 0.92
            }
        }
    }
};

export default governanceOverviewMock;
