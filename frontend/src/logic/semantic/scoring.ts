import { TableRuleScore, FieldSemanticProfile } from '../../types/semantic';


const NAMING_PREFIX = [/^t_/, /^dim_/, /^ods_/, /^dwd_/, /^dws_/, /^ads_/];
const NAMING_KEYWORDS = [
    'order', 'trade', 'pay', 'user', 'member', 'account', 'profile',
    'product', 'goods', 'sku', 'item', 'supplier', 'supply', 'logistics',
    'inventory', 'stock', 'warehouse', 'finance', 'invoice', 'bill'
];

const BEHAVIOR_KEYWORDS = /time|date|operator|action|status|state|flag|event|record/;

export const calculateTableRuleScore = (tableName: string, fields: any[], comment?: string): { score: TableRuleScore, evidence: string[] } => {
    const score: TableRuleScore = {
        naming: 0,
        behavior: 0,
        comment: 0,
        total: 0
    };
    const evidence: string[] = [];
    const name = tableName.toLowerCase();

    // T-01: Table Name Naming
    const prefixMatched = NAMING_PREFIX.some(p => p.test(name));
    const keywordMatched = NAMING_KEYWORDS.some(k => name.includes(k));
    const tokenCount = name.replace(/^t_/, '').split('_').filter(Boolean).length;
    score.naming = 0.2;
    if (prefixMatched) {
        score.naming += 0.35;
        evidence.push('表名前缀符合规范');
    }
    if (keywordMatched) {
        score.naming += 0.35;
        evidence.push('表名包含业务关键词');
    }
    if (tokenCount >= 2) {
        score.naming += 0.1;
        evidence.push('命名结构清晰');
    }
    score.naming = Math.min(score.naming, 1);

    // T-05: Behavior Density
    const safeFieldCount = fields.length || 1;
    const behaviorFields = fields.filter((f: any) => {
        const fieldName = (f.name || f.fieldName || f.col || f.field || '').toLowerCase();
        return BEHAVIOR_KEYWORDS.test(fieldName);
    });
    const behaviorRatio = behaviorFields.length / safeFieldCount;
    if (behaviorRatio < 0.35) {
        score.behavior = 0.85;
        evidence.push(`行为字段占比低 (${(behaviorRatio * 100).toFixed(0)}%)`);
    } else if (behaviorRatio < 0.6) {
        score.behavior = 0.65;
        evidence.push(`行为字段占比中 (${(behaviorRatio * 100).toFixed(0)}%)`);
    } else {
        score.behavior = 0.45;
        evidence.push(`行为字段占比高 (${(behaviorRatio * 100).toFixed(0)}%)`);
    }

    // T-06: Comment
    const fieldWithComment = fields.filter((f: any) => {
        const comment = f.comment || f.businessDefinition || f.description || '';
        return comment && comment.trim();
    }).length;
    const commentCoverage = fieldWithComment / safeFieldCount;
    if (comment && comment.length > 2) {
        score.comment = 0.6;
        evidence.push('表注释完整');
    }
    if (commentCoverage >= 0.7) {
        score.comment += 0.4;
        evidence.push(`字段注释覆盖率高 (${Math.round(commentCoverage * 100)}%)`);
    } else if (commentCoverage >= 0.4) {
        score.comment += 0.25;
        evidence.push(`字段注释覆盖率中 (${Math.round(commentCoverage * 100)}%)`);
    } else {
        score.comment += 0.1;
        evidence.push(`字段注释覆盖率低 (${Math.round(commentCoverage * 100)}%)`);
    }
    score.comment = Math.min(score.comment, 1);

    score.total = (score.naming * 0.3) + (score.behavior * 0.3) + (score.comment * 0.4);
    return { score, evidence };
};

export const calculateFusionScore = (tableScore: number, fieldScore: number, aiScore: number): number => {
    // 0.55 * AI + 0.45 * Rule
    // Rule is combination of tableScore and fieldScore?
    // Let's assume Rule Score passed here is already combined
    const ruleScore = (tableScore + fieldScore) / 2;
    return parseFloat((0.55 * aiScore + 0.45 * ruleScore).toFixed(2));
};
