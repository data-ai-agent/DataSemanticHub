
export interface SemanticModelingOverviewData {
    meta: {
        tenantId: string;
        projectId: string;
        timeRange: 'LAST_7_DAYS' | 'LAST_30_DAYS' | 'LAST_90_DAYS';
        generatedAt: string;
    };
    kpis: {
        objectScale: {
            total: number;
            published: number;
            draft: number;
            archived: number;
            trend: { ts: string; value: number }[];
        };
        candidateReview: {
            total: number;
            pending: number;
            confirmed: number;
            ignored: number;
            pendingRate: number;
        };
        modelingConflict: {
            total: number;
            severity: { critical: number; warning: number; info: number };
            trend: { ts: string; value: number }[];
        };
        modelingMaturity: {
            score: number;
            components: {
                keyFieldCompletionRate: number;
                objectTypeDefinedRate: number;
                conflictResolvedRate: number;
            };
            trendLabel: string;
        };
    };
    views: {
        business: {
            goalCoverage: {
                rate: number;
                totalGoals: number;
                planned: number;
                modeled: number;
                landed: number;
            };
            kpiCoverage: {
                covered: number;
                total: number;
                consistencyRate: number;
            };
        };
        tech: {
            assetIngestion: {
                connected: number;
                total: number;
                scanning: number;
                error: number;
            };
            mappingProgress: {
                mapped: number;
                total: number;
                missingObjects: string[];
            };
        };
    };
    stages: {
        pipeline: {
            key: 'BUSINESS_MODELING' | 'FIELD_SEMANTIC' | 'CANDIDATE_OBJECT' | 'OBJECT_MODELING';
            label: string;
            status: 'NOT_STARTED' | 'IN_PROGRESS' | 'BLOCKED' | 'DONE';
            progress?: number;
            blockerCount?: number;
        }[];
        objectHeatTopN: {
            objectId: string;
            name: string;
            heatScore: number;
        }[];
    };
    blockers: {
        type: 'GOAL_NOT_BOUND' | 'KEY_FIELD_UNDECIDED' | 'OBJECT_TYPE_CONFLICT' | 'CANDIDATE_PENDING';
        label: string;
        count: number;
        severity: 'CRITICAL' | 'WARNING' | 'INFO';
        filterHint: { route: string; query: Record<string, any> };
    }[];
    nextActions: {
        key: string;
        label: string;
        priority: number;
        highlight: boolean;
        route: string;
        query: Record<string, any>;
    }[];
}

const semanticModelingOverviewMock: Record<string, SemanticModelingOverviewData> = {
    'LAST_30_DAYS': {
        meta: {
            tenantId: 't1',
            projectId: 'p1',
            timeRange: 'LAST_30_DAYS',
            generatedAt: '2026-01-18T10:00:00Z'
        },
        kpis: {
            objectScale: {
                total: 9,
                published: 8,
                draft: 1,
                archived: 0,
                trend: [
                    { ts: '2026-01-01', value: 7 },
                    { ts: '2026-01-08', value: 8 },
                    { ts: '2026-01-15', value: 8 },
                    { ts: '2026-01-18', value: 9 }
                ]
            },
            candidateReview: {
                total: 4,
                pending: 3,
                confirmed: 0,
                ignored: 1,
                pendingRate: 0.75
            },
            modelingConflict: {
                total: 5,
                severity: { critical: 2, warning: 2, info: 1 },
                trend: [
                    { ts: '2026-01-01', value: 3 },
                    { ts: '2026-01-08', value: 4 },
                    { ts: '2026-01-15', value: 5 },
                    { ts: '2026-01-18', value: 5 }
                ]
            },
            modelingMaturity: {
                score: 33,
                components: {
                    keyFieldCompletionRate: 0.56,
                    objectTypeDefinedRate: 0.67,
                    conflictResolvedRate: 0.40 // 1 - 5/total issues roughly
                },
                trendLabel: '近7日趋势稳定'
            }
        },
        views: {
            business: {
                goalCoverage: {
                    rate: 0.56,
                    totalGoals: 3,
                    planned: 1,
                    modeled: 1,
                    landed: 1
                },
                kpiCoverage: {
                    covered: 4,
                    total: 6,
                    consistencyRate: 0.67
                }
            },
            tech: {
                assetIngestion: {
                    connected: 5,
                    total: 7,
                    scanning: 1,
                    error: 1
                },
                mappingProgress: {
                    mapped: 8,
                    total: 15, // Adjusted to match 8/9 roughly or imply total potential
                    missingObjects: ['库存']
                }
            }
        },
        stages: {
            pipeline: [
                { key: 'BUSINESS_MODELING', label: '业务梳理', status: 'DONE' },
                { key: 'FIELD_SEMANTIC', label: '字段语义理解', status: 'IN_PROGRESS', progress: 0.6 },
                { key: 'CANDIDATE_OBJECT', label: '候选业务对象', status: 'BLOCKED', blockerCount: 3 },
                { key: 'OBJECT_MODELING', label: '业务对象建模', status: 'NOT_STARTED' }
            ],
            objectHeatTopN: [
                { objectId: 'o1', name: '供应商', heatScore: 98 },
                { objectId: 'o2', name: '采购订单', heatScore: 85 },
                { objectId: 'o3', name: '库存', heatScore: 72 },
                { objectId: 'o4', name: '物流运单', heatScore: 65 },
                { objectId: 'o5', name: '新生儿', heatScore: 60 }
            ]
        },
        blockers: [
            {
                type: 'GOAL_NOT_BOUND',
                label: '未绑定业务目标',
                count: 2,
                severity: 'CRITICAL',
                filterHint: { route: 'td_goals', query: { status: ['UNBOUND'] } }
            },
            {
                type: 'KEY_FIELD_UNDECIDED',
                label: '关键字段语义未确认',
                count: 12,
                severity: 'CRITICAL',
                filterHint: { route: 'field_semantic', query: { isKeyField: true, status: ['PENDING'] } }
            },
            {
                type: 'OBJECT_TYPE_CONFLICT',
                label: '对象类型冲突',
                count: 1,
                severity: 'WARNING',
                filterHint: { route: 'td_modeling', query: { hasConflict: true } }
            }
        ],
        nextActions: [
            {
                key: 'GO_FIELD_SEMANTIC',
                label: '去字段语义理解',
                priority: 1,
                highlight: true,
                route: 'field_semantic',
                query: { status: ['PENDING'] }
            },
            {
                key: 'GO_CANDIDATES',
                label: '去候选业务对象',
                priority: 2,
                highlight: false,
                route: 'candidate_confirmation',
                query: { status: ['PENDING'] }
            },
            {
                key: 'GO_OBJECT_MODELING',
                label: '去业务对象建模',
                priority: 3,
                highlight: false,
                route: 'td_modeling',
                query: {}
            },
            {
                key: 'GO_BUSINESS_MODELING',
                label: '去业务梳理',
                priority: 4,
                highlight: false,
                route: 'td_goals',
                query: {}
            }
        ]
    }
};

export default semanticModelingOverviewMock;
