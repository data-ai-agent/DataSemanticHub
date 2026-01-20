import { RecognitionRun } from '../types/scene-model';

export const MOCK_RECOGNITION_RUN: RecognitionRun = {
    run_id: 'run_mock_2026011701',
    scene_id: 'scene_demo_01',
    model_version: 'topdown-vNext-0.5',
    confidence_overall: 0.88,
    coverage_score: 0.92,
    created_at: new Date().toISOString(),
    gap_analysis: {
        required_but_missing: [
            { key: 'statutory_time_limit', message: '政务模板要求明确法定时限，但描述中未检测到具体天数' }
        ],
        suggested_but_missing: [
            { key: 'supervision_metrics', message: '建议补充监管指标（如：办件满意度）以符合一件事标准' }
        ]
    },
    candidates: {
        business_objects: {
            primary_object: {
                id: 'bo_enrollment',
                type: 'business_object',
                label: '入学申请',
                normalized_name: 'EnrollmentApplication',
                confidence: 0.96,
                status: 'pending',
                source_span: { start: 10, end: 14, text: '入学申请' }
            },
            related_objects: [
                {
                    id: 'bo_student',
                    type: 'business_object',
                    label: '适龄儿童',
                    normalized_name: 'Student',
                    confidence: 0.92,
                    status: 'pending'
                },
                {
                    id: 'bo_school',
                    type: 'business_object',
                    label: '公办小学',
                    normalized_name: 'PublicSchool',
                    confidence: 0.89,
                    status: 'pending'
                }
            ],
            relations: [
                { from: 'EnrollmentApplication', rel: '1-1', to: 'Student' },
                { from: 'EnrollmentApplication', rel: 'n-1', to: 'PublicSchool' }
            ],
            field_suggestions: [
                {
                    object: 'EnrollmentApplication',
                    fields: [
                        { name: 'application_no', type: 'string', required: true, description: '申请单号' },
                        { name: 'apply_date', type: 'date', required: true, description: '申请日期' }
                    ]
                }
            ]
        },
        roles: [
            {
                id: 'role_applicant',
                type: 'role',
                label: '申请人/监护人',
                confidence: 0.95,
                status: 'pending',
                mapping: { responsibilities: ['提交申请', '上传材料'] }
            },
            {
                id: 'role_staff',
                type: 'role',
                label: '教育局工作人员',
                confidence: 0.90,
                status: 'pending',
                mapping: { responsibilities: ['资格审核', '分配学位'] }
            }
        ],
        actions: [
            {
                id: 'act_submit',
                type: 'action',
                label: '提交申请',
                confidence: 0.98,
                status: 'pending',
                mapping: { actor_role: '申请人', target_object: '入学申请' }
            },
            {
                id: 'act_audit',
                type: 'action',
                label: '资格审核',
                confidence: 0.94,
                status: 'pending',
                mapping: { actor_role: '教育局工作人员', target_object: '入学申请' }
            },
            {
                id: 'act_notify',
                type: 'action',
                label: '发放通知书',
                confidence: 0.85,
                status: 'pending'
            }
        ],
        artifacts: {
            materials: [
                {
                    id: 'mat_hukou',
                    type: 'material',
                    label: '户口簿',
                    confidence: 0.95,
                    status: 'pending',
                    mapping: { material_type: 'identity' }
                },
                {
                    id: 'mat_prop',
                    type: 'material',
                    label: '房产证',
                    confidence: 0.92,
                    status: 'pending',
                    mapping: { material_type: 'asset_proof' }
                }
            ],
            data_checks: [
                {
                    id: 'check_citizenship',
                    type: 'data_check',
                    label: '户籍核验',
                    confidence: 0.88,
                    status: 'pending',
                    mapping: { data_source: '公安库' }
                }
            ]
        },
        state_machine: {
            primary_object: 'EnrollmentApplication',
            states: [
                { code: 'DRAFT', name: '草稿' },
                { code: 'SUBMITTED', name: '已提交' },
                { code: 'AUDITED', name: '审核通过' },
                { code: 'REJECTED', name: '审核驳回' },
                { code: 'ADMITTED', name: '已录取' }
            ],
            transitions: [
                { from: 'DRAFT', to: 'SUBMITTED', trigger_action: '提交申请' },
                { from: 'SUBMITTED', to: 'AUDITED', trigger_action: '资格审核' },
                { from: 'SUBMITTED', to: 'REJECTED', trigger_action: '资格审核' }
            ]
        },
        constraints: {
            time_limits: [],
            eligibility_rules: [
                {
                    id: 'rule_area',
                    type: 'rule',
                    label: '学区划分规则',
                    confidence: 0.80,
                    status: 'pending',
                    mapping: { description: '人户一致优先' }
                }
            ]
        }
    }
};
