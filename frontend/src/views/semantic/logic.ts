import { ActionItem, SemanticGateResult, TableSemanticProfile, GovernanceStatus, ReviewStats, TableRuleScore } from '../../types/semantic';
import { checkGatekeeper, analyzeField } from '../../logic/semantic/rules';
export { checkGatekeeper, analyzeField };
import { calculateTableRuleScore, calculateFusionScore } from '../../logic/semantic/scoring';
export { calculateTableRuleScore, calculateFusionScore };
import { analyzeTableWithMockAI } from '../../services/mockAiService';

export const resolveGovernanceStatus = (asset: any): GovernanceStatus => {
    if (asset?.governanceStatus) return asset.governanceStatus as GovernanceStatus;
    if (asset?.semanticAnalysis?.governanceStatus) return asset.semanticAnalysis.governanceStatus as GovernanceStatus;
    if (asset?.status === 'confirmed' || asset?.status === 'effective') return 'S3';
    if (asset?.status === 'pending_review' || asset?.status === 'analyzed') return 'S1';
    if (asset?.semanticAnalysis?.analysisStep === 'done') return 'S1';
    return 'S0';
};

export const normalizeFields = (fields: any[]) => {
    return fields
        .map((field: any) => {
            const name = field.name || field.fieldName || field.col || field.field || '';
            const type = field.type || field.dataType || field.dtype || field.datatype || '';
            const comment = field.comment || field.businessDefinition || field.description || '';
            const primaryKey = typeof field.primaryKey === 'boolean'
                ? field.primaryKey
                : typeof field.isPrimary === 'boolean'
                    ? field.isPrimary
                    : field.key === 'PK';
            return { ...field, name, type, comment, primaryKey };
        })
        .filter((field: any) => field.name);
};

export const buildReviewStats = (tableName: string, fields: any[], comment?: string): ReviewStats => {
    const safeFields = normalizeFields(Array.isArray(fields) ? fields : []);
    if (safeFields.length === 0) {
        return { pendingReviewFields: 0, gateFailedItems: 0, riskItems: 0 };
    }
    const gateResult = checkGatekeeper(tableName, safeFields);
    const analyzedFields = safeFields.map((f: any) => analyzeField(f));
    const pendingReviewFields = analyzedFields.filter((f: any) =>
        ['L3', 'L4'].includes(f.sensitivity) || (f.roleConfidence || 0) < 0.7
    ).length;
    const gateFailedItems = gateResult.result === 'PASS'
        ? 0
        : Math.max(gateResult.reasons?.length || 0, 1);
    const { score } = calculateTableRuleScore(tableName, safeFields, comment);
    const sensitiveRatio = analyzedFields.length === 0
        ? 0
        : analyzedFields.filter((f: any) => ['L3', 'L4'].includes(f.sensitivity)).length / analyzedFields.length;
    let riskItems = 0;
    if (score.total < 0.6) riskItems += 1;
    if (sensitiveRatio >= 0.3) riskItems += 1;
    if (gateResult.result === 'REJECT') riskItems += 1;
    return { pendingReviewFields, gateFailedItems, riskItems };
};

export const analyzeSingleTable = async (
    tableName: string,
    fields: any[],
    comment: string = ''
): Promise<TableSemanticProfile> => {
    // 1. Data Preparation
    const safeFields = fields.length > 0 ? normalizeFields(fields) : [
        { name: 'id', type: 'bigint', primaryKey: true },
        { name: 'create_time', type: 'datetime' },
        { name: 'name', type: 'varchar' }
    ];

    // 2. Gate Check
    const gateResult = checkGatekeeper(tableName, safeFields);

    // 3. Field Analysis
    const analyzedFields = safeFields.map((f: any) => analyzeField(f));
    const fieldScore = analyzedFields.reduce((acc: number, f: any) => acc + (f.roleConfidence || 0.5), 0) / analyzedFields.length;

    // 4. Table Rule Score
    const { score: ruleScore, evidence: ruleEvidence } = calculateTableRuleScore(tableName, safeFields, comment);

    // 5. Mock AI Service
    const aiResult = await analyzeTableWithMockAI(tableName, safeFields, comment);

    // 6. Fusion Logic
    const finalScore = calculateFusionScore(ruleScore.total, fieldScore, aiResult.aiScore);
    const ruleContribution = 0.225 * ruleScore.total;
    const fieldContribution = 0.225 * fieldScore;
    const aiContribution = 0.55 * aiResult.aiScore;
    const totalContribution = ruleContribution + fieldContribution + aiContribution || 1; // Prevent div by zero
    const scoreBreakdown = {
        rule: ruleContribution / totalContribution,
        field: fieldContribution / totalContribution,
        ai: aiContribution / totalContribution
    };

    return {
        tableName,
        gateResult,
        ruleScore,
        fieldScore,
        aiScore: aiResult.aiScore,
        finalScore,
        scoreBreakdown,
        businessName: aiResult.businessName,
        description: aiResult.description,
        tags: aiResult.tags,
        fields: analyzedFields,
        aiEvidence: aiResult.evidence,
        ruleEvidence,
        aiEvidenceItems: aiResult.evidenceItems,
        objectType: aiResult.objectType,
        objectTypeReason: aiResult.objectTypeReason,
        businessDomain: aiResult.businessDomain,
        dataGrain: aiResult.dataGrain,
        dataLayer: 'DWD',
        updateStrategy: '增量追加',
        retentionPeriod: '永久',
        securityLevel: 'L2',
        governanceStatus: 'S1',
        reviewStats: buildReviewStats(tableName, safeFields, comment)
    };
};
