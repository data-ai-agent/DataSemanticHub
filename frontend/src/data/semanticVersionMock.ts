export const semanticVersionMock = {
    versions: [
        {
            id: 'v_243',
            version: 'v2.4.3',
            status: 'published',
            scope: 'HR 域 / 9 个对象',
            objects: 9,
            fields: 1240,
            qualityRules: 85,
            securityPolicies: 90,
            publishedAt: '2026-01-12',
            createdBy: '系统发布',
            baseVersion: 'v2.4.2'
        },
        {
            id: 'v_242',
            version: 'v2.4.2',
            status: 'deprecated',
            scope: 'HR 域 / 9 个对象',
            objects: 9,
            fields: 1210,
            qualityRules: 82,
            securityPolicies: 88,
            publishedAt: '2026-01-05',
            createdBy: '语义管理员',
            baseVersion: 'v2.4.1'
        },
        {
            id: 'v_244_draft',
            version: 'v2.4.4',
            status: 'draft',
            scope: 'HR 域 / 10 个对象',
            objects: 10,
            fields: 1300,
            qualityRules: 88,
            securityPolicies: 92,
            publishedAt: '--',
            createdBy: '语义管理员',
            baseVersion: 'v2.4.3'
        }
    ],
    qualitySnapshot: {
        ruleSetVersion: 'v2.4',
        ruleCount: 85,
        passRate: 0.92,
        failedFields: 14,
        latestRun: '2026-01-12 08:30'
    },
    qualityFailures: [
        't_hr_employee.employee_id',
        't_hr_payroll.pay_amount',
        't_hr_contract.contract_end'
    ],
    securitySnapshot: {
        classification: [
            { label: 'L1 公开', value: 420 },
            { label: 'L2 内部', value: 560 },
            { label: 'L3 敏感', value: 180 },
            { label: 'L4 高敏', value: 80 }
        ],
        maskingRules: 16,
        highRiskFields: 3
    },
    bindings: [
        { type: '问数', name: '人力报表中心', version: 'v2.4.3', owner: '分析组', lastSwitch: '2026-01-12 10:30' },
        { type: 'API', name: '员工信息服务', version: 'v2.4.3', owner: '平台组', lastSwitch: '2026-01-12 10:40' },
        { type: '服务', name: '薪酬核算服务', version: 'v2.4.2', owner: '财务组', lastSwitch: '2026-01-05 09:15' }
    ],
    bindingAudit: [
        { action: '切换版本', target: '薪酬核算服务', from: 'v2.4.1', to: 'v2.4.2', time: '2026-01-05 09:15' },
        { action: '切换版本', target: '员工信息服务', from: 'v2.4.2', to: 'v2.4.3', time: '2026-01-12 10:40' }
    ],
    diffSummary: {
        added: 4,
        removed: 1,
        changed: 7
    },
    diffItems: [
        {
            title: '对象 Diff',
            items: ['新增：员工绩效 (BO_Performance)', '修改：员工合同 (BO_Contract) 字段结构']
        },
        {
            title: '字段语义 Diff',
            items: ['新增术语绑定：t_hr_employee.level', '角色调整：t_hr_department.manager_id → Identifier']
        },
        {
            title: '质量规则 Diff',
            items: ['新增规则：薪酬金额非负', '调整规则：入职日期格式校验']
        },
        {
            title: '安全策略 Diff',
            items: ['新增脱敏：身份证号掩码', '调整策略：手机号访问权限']
        }
    ]
};
