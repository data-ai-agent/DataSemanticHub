/**
 * P0 组件集成示例 - Copy this code to DataSemanticUnderstandingView.tsx
 * 
 * 本文件展示如何在 DataSemanticUnderstandingView 中集成 P0 优化组件
 */

import React, { useState } from 'react';
import { GateFailureAlertCard } from './components/GateFailureAlertCard';
import { FieldFilterBar, FieldFilterType, filterFields } from './components/FieldFilterBar';

// ============================================
// 示例 1: 在 Overview Tab 中集成 GateFailureAlertCard
// ============================================

/**
 * 在 DataSemanticUnderstandingView.tsx 中找到大约 1937 行的位置:
 * {resultTab === 'overview' && (
 *     <div className="space-y-4">
 *         <div id="result-key-evidence" ...>
 * 
 * 在 <div className="space-y-4"> 之后，<div id="result-key-evidence"> 之前插入：
 */

const OverviewTabIntegrationExample = () => {
    const resultTab = 'overview'; // 示例
    const gateReviewable = true; // 示例：从你的实际状态获取
    const semanticProfile = {
        gateResult: {
            result: 'REVIEW' as 'PASS' | 'REJECT' | 'REVIEW',
            details: { primaryKey: false, lifecycle: false, tableType: true },
            reasons: ['未找到主键字段', '未找到生命周期字段'],
            actionItems: [
                {
                    type: 'sql' as 'sql' | 'workflow' | 'manual',
                    title: '添加主键字段',
                    description: '为表添加主键约束以确保数据唯一性',
                    sqlTemplate: `ALTER TABLE your_table \n  ADD COLUMN id BIGINT AUTO_INCREMENT PRIMARY KEY FIRST;`,
                    priority: 'high' as 'high' | 'medium' | 'low'
                }
            ]
        }
    }; // 示例：从你的实际状态获取
    const [currentResultTab, setResultTab] = useState('overview');

    return (
        <div className="p-4">
            {resultTab === 'overview' && (
                <div className="space-y-4">
                    {/* P0-2: Gate Failure Alert Card - 新增这段代码 */}
                    {gateReviewable && semanticProfile.gateResult && (
                        <GateFailureAlertCard
                            gateResult={semanticProfile.gateResult}
                            onNavigateToEvidence={() => setResultTab('evidence')}
                        />
                    )}

                    {/* 原有的 result-key-evidence 区域保持不变 */}
                    <div id="result-key-evidence" className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                        {/* ... 原有代码 ... */}
                    </div>
                </div>
            )}
        </div>
    );
};

// ============================================
// 示例 2: 在 DeepAnalysisTabs 字段 tab 中集成 FieldFilterBar
// ============================================

/**
 * 在 DeepAnalysisTabs.tsx 组件的字段分析 tab 中集成筛选器
 * 
 * 步骤:
 * 1. 添加状态管理
 * 2. 在字段列表顶部添加 FieldFilterBar
 * 3. 使用 filterFields 过滤字段列表
 */

const FieldTabIntegrationExample = () => {
    // 1. 添加状态
    const [fieldFilter, setFieldFilter] = useState<FieldFilterType>('all');

    // 示例数据
    const semanticProfile = {
        fields: [
            {
                fieldName: 'id',
                dataType: 'bigint',
                role: 'Identifier' as 'Identifier',
                roleConfidence: 0.95,
                sensitivity: 'L1' as 'L1' | 'L2' | 'L3' | 'L4',
                quality: 'A' as 'A' | 'B' | 'C' | 'D'
            },
            {
                fieldName: 'mobile',
                dataType: 'varchar',
                role: 'BusAttr' as 'BusAttr',
                roleConfidence: 0.6, // 低置信度 -> 问题字段
                sensitivity: 'L3' as 'L1' | 'L2' | 'L3' | 'L4', // 敏感字段
                quality: 'C' as 'A' | 'B' | 'C' | 'D' // 低质量 -> 问题字段
            }
        ]
    };

    // 3. 过滤字段
    const filteredFields = filterFields(semanticProfile.fields, fieldFilter);

    return (
        <div>
            {/* 2. 在字段列表顶部添加筛选器 */}
            <FieldFilterBar
                fields={semanticProfile.fields}
                activeFilter={fieldFilter}
                onFilterChange={setFieldFilter}
            />

            {/* 字段列表渲染 - 使用 filteredFields 而不是原始 fields */}
            <div className="p-4">
                {filteredFields.map((field, idx) => (
                    <div key={idx} className="p-3 border rounded mb-2">
                        <div className="font-mono">{field.fieldName}</div>
                        <div className="text-xs text-slate-500">
                            {field.role} ({field.roleConfidence}) - {field.sensitivity} / {field.quality}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ============================================
// 具体集成位置参考
// ============================================

/**
 * DataSemanticUnderstandingView.tsx 集成位置:
 * 
 * 1. 导入语句 (约第 10 行):
 *    import { GateFailureAlertCard } from './semantic/GateFailureAlertCard';  // ✅ 已添加
 * 
 * 2. Overview Tab (约第 1937 行):
 *    找到: {resultTab === 'overview' && (
 *           <div className="space-y-4">
 *     在这两行之间插入上面的 GateFailureAlertCard 组件代码
 * 
 * DeepAnalysisTabs.tsx 集成位置:
 * 
 * 1. 导入语句:
 *    import { FieldFilterBar, FieldFilterType, filterFields } from './FieldFilterBar';
 * 
 * 2. 组件内添加状态:
 *    const [fieldFilter, setFieldFilter] = useState<FieldFilterType>('all');
 * 
 * 3. 字段分析 tab 渲染处:
 *    在字段列表渲染之前添加 <FieldFilterBar ... />
 *    使用 filterFields(fields, fieldFilter) 替代原始 fields 数组
 */

export {
    OverviewTabIntegrationExample,
    FieldTabIntegrationExample
};
