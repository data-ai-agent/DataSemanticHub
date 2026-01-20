/**
 * V2.3F P4: Field Statistics Utilities
 * 
 * Provides mutually exclusive field counting logic to ensure
 * accurate statistics where each field is counted exactly once
 * in its highest priority role category.
 * 
 * Priority Order: Identifier > Time > State > BusAttr
 */

// Role priority mapping (lower number = higher priority)
const ROLE_PRIORITY: Record<string, number> = {
    'Identifier': 1,
    'Time': 2,
    'State': 3,
    'BusAttr': 4
};

/**
 * Check if field is an identifier (PK/FK/ID)
 */
export const isIdentifier = (field: any): boolean => {
    if (field.role === 'Identifier') return true;
    if (field.key === 'PK' || field.key === 'FK') return true;

    const name = (field.fieldName || field.name || '').toLowerCase();
    return name.endsWith('_id') ||
        name.endsWith('_pk') ||
        name.endsWith('_fk') ||
        name === 'id';
};

/**
 * Check if field is a lifecycle/time field
 */
export const isTime = (field: any): boolean => {
    if (field.role === 'Time') return true;

    const name = (field.fieldName || field.name || '').toLowerCase();
    return name.includes('time') ||
        name.includes('date') ||
        name.includes('created') ||
        name.includes('updated') ||
        name.includes('deleted') ||
        name.startsWith('dt_') ||
        name.endsWith('_at');
};

/**
 * Check if field is a state/status field
 */
export const isState = (field: any): boolean => {
    if (field.role === 'State') return true;

    const name = (field.fieldName || field.name || '').toLowerCase();
    return name.includes('status') ||
        name.includes('state') ||
        name.includes('flag') ||
        name.endsWith('_yn');
};

/**
 * Calculate mutually exclusive field statistics
 * Each field is counted ONCE in its highest priority role
 */
export function calculateFieldStatistics(fields: any[]) {
    if (!fields || fields.length === 0) {
        return {
            total: 0,
            identifiers: 0,
            timeFields: 0,
            stateFields: 0,
            busAttrs: 0,
            identifierList: [],
            timeList: [],
            stateList: [],
            busAttrList: []
        };
    }

    // Categorize fields by their highest priority role (mutually exclusive)
    const categorized = {
        identifierList: fields.filter(isIdentifier),
        timeList: fields.filter(f => !isIdentifier(f) && isTime(f)),
        stateList: fields.filter(f => !isIdentifier(f) && !isTime(f) && isState(f)),
        busAttrList: fields.filter(f => !isIdentifier(f) && !isTime(f) && !isState(f))
    };

    return {
        total: fields.length,
        identifiers: categorized.identifierList.length,
        timeFields: categorized.timeList.length,
        stateFields: categorized.stateList.length,
        busAttrs: categorized.busAttrList.length,
        ...categorized
    };
}

/**
 * Calculate three-dimensional metrics for audit summary
 */
export function calculateThreeDimensionalMetrics(fields: any[], profile?: any) {
    if (!fields || fields.length === 0) {
        return {
            coverageRate: 0,
            identifiedCount: 0,
            totalCount: 0,
            completenessStatus: 'incomplete' as const,
            completenessIssues: ['无字段数据'],
            riskCount: 0,
            sensitiveFieldCount: 0,
            unknownTypeFieldCount: 0,
            riskDetails: {
                sensitive: [],
                unknown: []
            }
        };
    }

    const stats = calculateFieldStatistics(fields);
    const gateDetails = profile?.gateResult?.details;
    const hasGateDetails = gateDetails
        && typeof gateDetails.primaryKey === 'boolean'
        && typeof gateDetails.lifecycle === 'boolean'
        && typeof gateDetails.tableType === 'boolean';

    // Dimension 1: Field Recognition Coverage Rate
    const identifiedFields = fields.filter(f => f.role && f.role !== 'Unknown');
    const coverageRate = (identifiedFields.length / fields.length) * 100;

    // Dimension 2: Key Element Completeness
    const hasSemanticPK = hasGateDetails ? gateDetails.primaryKey : stats.identifiers > 0;
    const hasLifecycle = hasGateDetails ? gateDetails.lifecycle : stats.timeFields > 0;
    const isValidTableType = hasGateDetails ? gateDetails.tableType : true;

    const completenessIssues: string[] = [];
    if (!hasSemanticPK) completenessIssues.push('主键缺失');
    if (!hasLifecycle) completenessIssues.push('生命周期字段缺失');
    if (!isValidTableType) completenessIssues.push('表类型不符合');

    // Dimension 3: Risk Item Count
    const sensitiveFields = fields.filter(f => f.sensitivity === 'L3' || f.sensitivity === 'L4');
    const unknownTypeFields = fields.filter(f => !f.role || f.role === 'Unknown');
    const riskCount = sensitiveFields.length + unknownTypeFields.length;

    return {
        // Dimension 1
        coverageRate,
        identifiedCount: identifiedFields.length,
        totalCount: fields.length,

        // Dimension 2
        completenessStatus: (completenessIssues.length === 0 ? 'complete' : 'incomplete') as 'complete' | 'incomplete',
        completenessIssues,

        // Dimension 3
        riskCount,
        sensitiveFieldCount: sensitiveFields.length,
        unknownTypeFieldCount: unknownTypeFields.length,
        riskDetails: {
            sensitive: sensitiveFields.map(f => ({ name: f.fieldName || f.name, level: f.sensitivity })),
            unknown: unknownTypeFields.map(f => f.fieldName || f.name)
        }
    };
}
