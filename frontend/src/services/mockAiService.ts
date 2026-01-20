import { ObjectType, BusinessDomain } from '../types/semantic';

/**
 * V2 Beta: 模拟 AI 语义分析服务
 * 在实际应用中，这里会调用 LLM API (GPT-4 / Claude / 通义千问)
 */

// 对象类型推断规则
const inferObjectType = (tableName: string, fields: any[]): { type: ObjectType; reason: string } => {
    const name = tableName.toLowerCase();

    // 行为对象: 日志、历史、流水
    if (/log|trace|history|flow|record|event/.test(name)) {
        return { type: 'event', reason: '表名包含日志/流水关键词' };
    }

    // 规则对象: 字典、配置、枚举
    if (/dict|config|enum|setting|param/.test(name)) {
        return { type: 'rule', reason: '表名包含字典/配置关键词' };
    }

    // 状态对象: 状态、快照
    if (/status|state|snapshot/.test(name)) {
        return { type: 'state', reason: '表名包含状态关键词' };
    }

    // 属性对象: 标签、汇总、宽表
    if (/tag|label|summary|wide|agg|stat/.test(name)) {
        return { type: 'attribute', reason: '表名包含标签/汇总关键词' };
    }

    // 默认: 主体对象 (含 base/info/main 或普通表)
    if (/base|info|main|master|profile/.test(name) || fields.some(f => /^id$|_id$/.test(f.name))) {
        return { type: 'entity', reason: '表名包含实体关键词或含主键字段' };
    }

    return { type: 'entity', reason: '默认判断为主体对象' };
};

// 业务域推断
const inferBusinessDomain = (tableName: string): BusinessDomain => {
    const name = tableName.toLowerCase();

    if (/order|pay|trade|transaction/.test(name)) return '交易域';
    if (/user|member|account|profile/.test(name)) return '用户域';
    if (/product|goods|sku|item/.test(name)) return '商品域';
    if (/coupon|promotion|campaign|marketing/.test(name)) return '营销域';
    if (/stock|warehouse|supply|logistics/.test(name)) return '供应链域';
    if (/finance|bill|invoice|cost/.test(name)) return '财务域';
    if (/ticket|service|customer/.test(name)) return '客服域';

    return '其他';
};

// 数据粒度推断
const inferDataGrain = (tableName: string, fields: any[]): string => {
    const name = tableName.toLowerCase();

    if (/detail|item|line/.test(name)) return '明细粒度';
    if (/summary|agg|stat|wide/.test(name)) return '汇总粒度';
    if (/snapshot|daily|monthly/.test(name)) return '快照粒度';

    // 如果有聚合字段，判断为汇总粒度
    if (fields.some(f => /total|sum|count|avg/.test(f.name.toLowerCase()))) {
        return '汇总粒度';
    }

    return '明细粒度';
};

// 字段级建议生成
interface FieldSuggestion {
    name: string;
    suggestedRole: string;
    description: string;
    sensitivity: 'L1' | 'L2' | 'L3' | 'L4';
}

interface EvidenceItem {
    field: string;
    reason: string;
    weight: number;
}

const generateFieldSuggestions = (fields: any[]): FieldSuggestion[] => {
    return fields.map(field => {
        const name = field.name.toLowerCase();
        let role = '业务属性';
        let description = field.comment || '待补充业务描述';
        let sensitivity: 'L1' | 'L2' | 'L3' | 'L4' = 'L1';

        // 识别主键
        if (name === 'id' || name.endsWith('_id')) {
            role = '标识符';
            description = description || `${field.name.replace('_id', '')} 的唯一标识`;
        }

        // 识别时间字段
        if (/(create|update|modify)_(time|at|date)/.test(name)) {
            role = '时间标记';
            description = description || `记录${name.includes('create') ? '创建' : '更新'}时间`;
        }

        // 识别状态字段
        if (/status|state|flag|type/.test(name)) {
            role = '状态';
            description = description || '业务状态标识';
        }

        // 敏感字段识别
        if (/phone|mobile|tel/.test(name)) {
            sensitivity = 'L3';
            description = description || '手机号码 (个人隐私)';
        }
        if (/id_card|passport|cert/.test(name)) {
            sensitivity = 'L3';
            description = description || '证件号码 (个人隐私)';
        }
        if (/password|secret|token/.test(name)) {
            sensitivity = 'L4';
            description = description || '敏感凭证 (严格加密)';
        }
        if (/name|address|email/.test(name)) {
            sensitivity = 'L2';
            description = description || '个人信息';
        }

        return {
            name: field.name,
            suggestedRole: role,
            description,
            sensitivity
        };
    });
};

// AI 分析入口
export const analyzeTableWithMockAI = async (
    tableName: string,
    fields: any[],
    comment?: string
): Promise<{
    aiScore: number;
    businessName: string;
    description: string;
    scenarios: string[];
    evidence: string[];
    evidenceItems: EvidenceItem[];
    tags: string[];
    objectType: ObjectType;
    objectTypeReason: string;
    businessDomain: BusinessDomain;
    dataGrain: string;
    fieldSuggestions: FieldSuggestion[];
}> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const isLogTable = /log|trace|history/i.test(tableName);

    if (isLogTable) {
        return {
            aiScore: 0.25,
            businessName: tableName,
            description: '可能是日志或历史记录表，建议人工确认业务含义',
            scenarios: [],
            evidence: ['表名包含日志关键词', '可能需要补充业务定义'],
            evidenceItems: [{ field: 'table', reason: '表名命中日志关键词', weight: 0.4 }],
            tags: ['待确认'],
            objectType: 'event',
            objectTypeReason: '表名包含日志/流水关键词',
            businessDomain: '其他',
            dataGrain: '明细粒度',
            fieldSuggestions: generateFieldSuggestions(fields)
        };
    }

    // 👔 SG-DEMO: HR Scenario Mock Logic
    if (tableName === 't_hr_employee') {
        return {
            aiScore: 0.96,
            businessName: '员工档案',
            description: '企业核心人力资源主数据，记录员工基础信息、职位及入职状态。',
            scenarios: ['人力资源管理', '薪资核算', '组织架构分析'],
            evidence: ['表名包含 employee', '字段包含 employee_id, department_id', '高置信度匹配 HR 领域模型'],
            evidenceItems: [
                { field: 'employee_id', reason: '关键标识字段', weight: 0.3 },
                { field: 'department_id', reason: '部门维度字段', weight: 0.2 }
            ],
            tags: ['HR', '核心实体', 'L3'],
            objectType: 'entity',
            objectTypeReason: '核心业务实体',
            businessDomain: '组织人事域',
            dataGrain: '明细粒度',
            fieldSuggestions: generateFieldSuggestions(fields).map(f => {
                if (f.name === 'employee_id') return { ...f, suggestedRole: '工号', description: '员工唯一标识 (工号)' };
                if (f.name === 'name') return { ...f, suggestedRole: '姓名', sensitivity: 'L2' };
                if (f.name === 'department_id') return { ...f, suggestedRole: '所属部门', description: '关联部门表 ID' };
                return f;
            })
        };
    }
    if (tableName === 't_hr_department') {
        return {
            aiScore: 0.92,
            businessName: '部门组织',
            description: '企业组织架构层级信息，定义职能部门及其关系。',
            scenarios: ['组织管理', '审批流配置'],
            evidence: ['表名包含 department', '树形结构数据特征'],
            evidenceItems: [{ field: 'department_id', reason: '组织结构字段', weight: 0.25 }],
            tags: ['HR', '组织架构', 'L1'],
            objectType: 'entity',
            objectTypeReason: '组织实体',
            businessDomain: '组织人事域',
            dataGrain: '明细粒度',
            fieldSuggestions: generateFieldSuggestions(fields)
        };
    }
    if (tableName === 't_hr_payroll') {
        return {
            aiScore: 0.94,
            businessName: '薪资发放记录',
            description: '员工月度薪资计算及发放流水。',
            scenarios: ['薪资发放', '人力成本核算'],
            evidence: ['表名包含 payroll', '字段包含 amount, tax'],
            evidenceItems: [
                { field: 'amount', reason: '核心度量字段', weight: 0.2 },
                { field: 'tax', reason: '薪资税额字段', weight: 0.1 }
            ],
            tags: ['HR', '财务', 'L4'],
            objectType: 'event',
            objectTypeReason: '交易/行为记录',
            businessDomain: '薪酬福利域',
            dataGrain: '明细粒度',
            fieldSuggestions: generateFieldSuggestions(fields)
        };
    }

    if (tableName === 't_hr_attendance') {
        return {
            aiScore: 0.88,
            businessName: '考勤明细',
            description: '员工每日上下班打卡记录流水。',
            scenarios: ['考勤统计', '工时计算'],
            evidence: ['表名包含 attendance', '字段包含 check_in, device_id'],
            evidenceItems: [{ field: 'check_in', reason: '行为时间字段', weight: 0.2 }],
            tags: ['HR', '行为', 'L2'],
            objectType: 'event',
            objectTypeReason: '行为流水',
            businessDomain: '考勤工时域',
            dataGrain: '明细粒度',
            fieldSuggestions: generateFieldSuggestions(fields)
        };
    }
    if (tableName === 't_hr_performance') {
        return {
            aiScore: 0.91,
            businessName: '绩效考核',
            description: '纪录员工定期绩效评价结果。',
            scenarios: ['人才盘点', '晋升评估'],
            evidence: ['表名包含 performance', '字段包含 score, grade'],
            evidenceItems: [
                { field: 'score', reason: '绩效评分字段', weight: 0.2 },
                { field: 'grade', reason: '等级字段', weight: 0.1 }
            ],
            tags: ['HR', '评价', 'L3'],
            objectType: 'entity',
            objectTypeReason: '评价记录',
            businessDomain: '人才发展域',
            dataGrain: '明细粒度',
            fieldSuggestions: generateFieldSuggestions(fields)
        };
    }
    if (tableName === 't_hr_position') {
        return {
            aiScore: 0.95,
            businessName: '岗位职级',
            description: '企业标准岗位及职级体系定义表。',
            scenarios: ['组织管理', '招聘标准'],
            evidence: ['表名包含 position', '字段包含 level_range'],
            evidenceItems: [{ field: 'level_range', reason: '规则字段', weight: 0.2 }],
            tags: ['HR', '规则', 'L1'],
            objectType: 'rule',
            objectTypeReason: '配置/规则数据',
            businessDomain: '组织人事域',
            dataGrain: '明细粒度',
            fieldSuggestions: generateFieldSuggestions(fields)
        };
    }

    const { type, reason } = inferObjectType(tableName, fields);
    const domain = inferBusinessDomain(tableName);
    const grain = inferDataGrain(tableName, fields);

    const fieldNames = fields.map(f => f.name.toLowerCase());
    const keyFields = ['id', 'order_id', 'user_id', 'sku', 'supplier_id'];
    const matchedFields = keyFields.filter(k => fieldNames.includes(k));
    const commentCoverage = fields.length > 0 ? fields.filter(f => f.comment && f.comment.trim()).length / fields.length : 0;
    const nameMatched = /order|user|product|supplier|inventory|logistics/.test(tableName.toLowerCase());

    const nameScore = nameMatched ? 0.9 : 0.6;
    const fieldScore = Math.min(0.9, 0.4 + matchedFields.length * 0.15);
    const commentScore = Math.min(0.9, 0.4 + commentCoverage * 0.5);
    const domainScore = domain === '其他' ? 0.6 : 0.8;

    const aiScore = Math.min(0.95, Math.max(0.3, (
        (nameScore * 0.35) +
        (fieldScore * 0.35) +
        (commentScore * 0.2) +
        (domainScore * 0.1)
    )));

    const businessName = tableName
        .replace(/^t_/, '')
        .split('_')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

    const evidenceItems: EvidenceItem[] = [
        { field: 'table', reason: nameMatched ? '表名命中业务关键词' : '表名符合基础规范', weight: 0.35 },
        { field: matchedFields[0] || '字段结构', reason: matchedFields.length > 0 ? '识别到关键标识字段' : '字段结构较完整', weight: 0.25 },
        { field: 'comment', reason: commentCoverage > 0.5 ? '注释覆盖率较高' : '注释覆盖率一般', weight: 0.2 },
        { field: 'domain', reason: `识别业务域: ${domain}`, weight: 0.2 }
    ];

    return {
        aiScore,
        businessName,
        description: comment || `${businessName} 相关的业务数据表`,
        scenarios: ['数据查询', '数据分析', '业务决策支持'],
        evidence: [
            `AI 推断这是一个${type === 'entity' ? '主体对象' : type === 'event' ? '行为对象' : '其他对象'}`,
            reason,
            `业务域: ${domain}`,
            `数据粒度: ${grain}`
        ],
        evidenceItems,
        tags: [domain, grain, type === 'entity' ? '核心实体' : '业务对象'],
        objectType: type,
        objectTypeReason: reason,
        businessDomain: domain,
        dataGrain: grain,
        fieldSuggestions: generateFieldSuggestions(fields)
    };
};

/**
 * V2.3: 生成置信度提升任务（游戏化）
 */
export interface BoostingTask {
    factor: string;
    status: 'LOW' | 'MEDIUM' | 'OK';
    statusText: string;
    action: string;
    actionType: 'BATCH_GENERATE' | 'SPECIFY_PK' | 'IDENTIFY_JSON' | 'NONE';
    scoreImpact: number;
    description?: string;
}

export const generateBoostingTasks = (
    fields: any[],
    aiScore: number,
    profile?: any
): BoostingTask[] => {
    const tasks: BoostingTask[] = [];

    // Task 1: 字段注释覆盖率
    const commentedFields = fields.filter(f => f.comment && f.comment.trim()).length;
    const commentCoverage = fields.length > 0 ? commentedFields / fields.length : 0;

    tasks.push({
        factor: '字段注释',
        status: commentCoverage < 0.3 ? 'LOW' : commentCoverage < 0.7 ? 'MEDIUM' : 'OK',
        statusText: commentCoverage < 0.3 ? `覆盖率低 (${Math.round(commentCoverage * 100)}%)` :
            commentCoverage < 0.7 ? `覆盖率一般 (${Math.round(commentCoverage * 100)}%)` :
                '覆盖率良好',
        action: commentCoverage < 0.7 ? '批量生成注释建议' : '(已完成)',
        actionType: commentCoverage < 0.7 ? 'BATCH_GENERATE' : 'NONE',
        scoreImpact: commentCoverage < 0.3 ? 0.15 : commentCoverage < 0.7 ? 0.08 : 0,
        description: 'AI 基于字段名生成业务注释，需人工确认'
    });

    // Task 2: 语义主键识别
    const hasPrimaryKey = fields.some(f => f.name.toLowerCase().endsWith('_id') || f.name.toLowerCase() === 'id');
    tasks.push({
        factor: '主键语义',
        status: hasPrimaryKey ? 'OK' : 'LOW',
        statusText: hasPrimaryKey ? '已识别主键' : '未识别到语义主键',
        action: hasPrimaryKey ? '(已完成)' : '指定语义主键',
        actionType: hasPrimaryKey ? 'NONE' : 'SPECIFY_PK',
        scoreImpact: hasPrimaryKey ? 0 : 0.10,
        description: '跳转至详情页勾选唯一标识符'
    });

    // Task 3: 特殊字段识别
    const unknownFields = fields.filter(f =>
        /ext_|extra_|json|clob|text/.test(f.name.toLowerCase()) ||
        f.type?.toLowerCase().includes('json') ||
        f.type?.toLowerCase().includes('text')
    );

    if (unknownFields.length > 0) {
        tasks.push({
            factor: '特殊字段',
            status: 'MEDIUM',
            statusText: `存在 ${unknownFields.length} 个未知类型`,
            action: '识别 JSON 结构',
            actionType: 'IDENTIFY_JSON',
            scoreImpact: 0.05,
            description: `如: ${unknownFields[0].name}`
        });
    }

    // Task 4: 生命周期字段
    const hasTimeFields = fields.some(f =>
        /(create|update|modify)_(time|at|date)/.test(f.name.toLowerCase())
    );
    tasks.push({
        factor: '时间维度',
        status: hasTimeFields ? 'OK' : 'MEDIUM',
        statusText: hasTimeFields ? '生命周期完整' : '缺少时间字段',
        action: hasTimeFields ? '(已检测到创建/更新时间)' : '建议添加时间字段',
        actionType: 'NONE',
        scoreImpact: 0
    });

    return tasks;
};
