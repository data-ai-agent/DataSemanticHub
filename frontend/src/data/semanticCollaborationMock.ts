const semanticCollaborationMock = {
    title: '语义治理总览',
    ranges: {
        '7d': {
            summary: {
                objectScale: {
                    total: 9,
                    published: 7,
                    draft: 2,
                    archived: 0
                },
                candidates: {
                    total: 5,
                    pending: 4,
                    confirmed: 0,
                    ignored: 1
                },
                conflicts: {
                    total: 6,
                    open: 5,
                    resolved: 1,
                    severity: {
                        critical: 2,
                        warning: 3,
                        info: 1
                    }
                },
                collaborationIndex: {
                    value: 28,
                    coverageRate: 0.52,
                    kpiConsistencyRate: 0.62,
                    mappingRate: 0.85
                }
            },
            businessView: {
                goals: {
                    total: 3,
                    planning: 1,
                    modeling: 1,
                    implemented: 1
                },
                goalCoverageRate: 0.52,
                kpiCoverage: {
                    total: 6,
                    defined: 3
                },
                scenarios: {
                    total: 4,
                    active: 1,
                    draft: 3
                },
                hotObjects: [
                    '供应商 (Supplier)',
                    '采购订单 (PO)',
                    '新生儿 (Newborn)',
                    '库存 (Inventory)',
                    '物流运单 (Delivery)'
                ]
            },
            governanceView: {
                dataSources: {
                    total: 7,
                    connected: 4,
                    scanning: 2,
                    error: 1
                },
                tables: {
                    count: 680,
                    scanResults: 12
                },
                mapping: {
                    mappedObjects: 7,
                    unmappedObjects: 2,
                    missingObjects: ['库存 (Inventory)', '物流运单 (Delivery)']
                },
                quality: {
                    namingComplianceRate: 0.78,
                    conflicts: 6
                },
                release: {
                    publishCount: 6,
                    successRate: 0.92,
                    rollbackCount: 1
                }
            }
        },
        '30d': {
            summary: {
                objectScale: {
                    total: 9,
                    published: 8,
                    draft: 1,
                    archived: 0
                },
                candidates: {
                    total: 4,
                    pending: 3,
                    confirmed: 0,
                    ignored: 1
                },
                conflicts: {
                    total: 5,
                    open: 4,
                    resolved: 1,
                    severity: {
                        critical: 2,
                        warning: 2,
                        info: 1
                    }
                },
                collaborationIndex: {
                    value: 33,
                    coverageRate: 0.56,
                    kpiConsistencyRate: 0.67,
                    mappingRate: 0.89
                }
            },
            businessView: {
                goals: {
                    total: 3,
                    planning: 1,
                    modeling: 1,
                    implemented: 1
                },
                goalCoverageRate: 0.56,
                kpiCoverage: {
                    total: 6,
                    defined: 4
                },
                scenarios: {
                    total: 4,
                    active: 2,
                    draft: 2
                },
                hotObjects: [
                    '供应商 (Supplier)',
                    '采购订单 (PO)',
                    '库存 (Inventory)',
                    '物流运单 (Delivery)',
                    '新生儿 (Newborn)'
                ]
            },
            governanceView: {
                dataSources: {
                    total: 7,
                    connected: 5,
                    scanning: 1,
                    error: 1
                },
                tables: {
                    count: 740,
                    scanResults: 16
                },
                mapping: {
                    mappedObjects: 8,
                    unmappedObjects: 1,
                    missingObjects: ['库存 (Inventory)']
                },
                quality: {
                    namingComplianceRate: 0.82,
                    conflicts: 5
                },
                release: {
                    publishCount: 8,
                    successRate: 0.95,
                    rollbackCount: 1
                }
            }
        },
        '90d': {
            summary: {
                objectScale: {
                    total: 11,
                    published: 9,
                    draft: 2,
                    archived: 0
                },
                candidates: {
                    total: 6,
                    pending: 3,
                    confirmed: 2,
                    ignored: 1
                },
                conflicts: {
                    total: 4,
                    open: 2,
                    resolved: 2,
                    severity: {
                        critical: 1,
                        warning: 2,
                        info: 1
                    }
                },
                collaborationIndex: {
                    value: 41,
                    coverageRate: 0.63,
                    kpiConsistencyRate: 0.72,
                    mappingRate: 0.91
                }
            },
            businessView: {
                goals: {
                    total: 4,
                    planning: 1,
                    modeling: 1,
                    implemented: 2
                },
                goalCoverageRate: 0.63,
                kpiCoverage: {
                    total: 8,
                    defined: 6
                },
                scenarios: {
                    total: 5,
                    active: 3,
                    draft: 2
                },
                hotObjects: [
                    '采购订单 (PO)',
                    '供应商 (Supplier)',
                    '物流运单 (Delivery)',
                    '库存 (Inventory)',
                    '出生医学证明'
                ]
            },
            governanceView: {
                dataSources: {
                    total: 7,
                    connected: 6,
                    scanning: 0,
                    error: 1
                },
                tables: {
                    count: 820,
                    scanResults: 20
                },
                mapping: {
                    mappedObjects: 9,
                    unmappedObjects: 2,
                    missingObjects: ['库存 (Inventory)', '出生医学证明']
                },
                quality: {
                    namingComplianceRate: 0.86,
                    conflicts: 4
                },
                release: {
                    publishCount: 11,
                    successRate: 0.96,
                    rollbackCount: 1
                }
            }
        }
    },
    collaboration: {
        flow: ['业务目标', 'KPI口径', '业务对象', '映射', '资产/服务'],
        example: {
            goal: '出生一件事高效办成',
            kpis: ['出生证办理时效', '申领完成率'],
            objects: ['新生儿', '出生医学证明'],
            mappings: ['t_pop_base_info_2024', 't_med_birth_cert']
        }
    },
    riskAndTodo: {
        business: ['未绑定目标', '未定义口径', '场景缺口'],
        governance: ['未映射对象', '冲突未解决', '低质量对象'],
        actions: ['去绑定目标', '去定义口径', '去处理映射']
    }
};

export default semanticCollaborationMock;
