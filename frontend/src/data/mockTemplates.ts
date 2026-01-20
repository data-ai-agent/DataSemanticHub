import { SceneTemplate } from '../types/scene-model';

export const SCENE_TEMPLATES: SceneTemplate[] = [
    {
        template_id: 'gov_one_service_v1',
        template_name: '政务服务·一件事',
        scene_type: 'government_one_service',
        base_capabilities: ['business_object', 'state_machine', 'actions', 'roles', 'artifacts', 'rules'],
        required_items: ['primary_business_object', 'state_machine', 'roles', 'materials'],
        capability_modules: {
            base: {
                business_object: true,
                state_machine: true,
                actions: true,
                roles: true,
                artifacts: true,
                rules: true
            },
            government: {
                enabled: true,
                multi_department_verification: true,
                statutory_time_limit: true,
                reason_code: true,
                audit_and_supervision: true
            }
        }
    },
    {
        template_id: 'enterprise_hr_v1',
        template_name: '企业人力·入转调离',
        scene_type: 'enterprise_hr',
        base_capabilities: ['business_object', 'state_machine', 'actions', 'roles', 'rules'],
        required_items: ['primary_business_object', 'actions', 'roles'],
        capability_modules: {
            base: {
                business_object: true,
                state_machine: true,
                actions: true,
                roles: true,
                artifacts: false,
                rules: true
            },
            enterprise: {
                hr: {
                    enabled: true,
                    org_structure: true,
                    position_control: true,
                    access_provisioning: true
                }
            }
        }
    },
    {
        template_id: 'generic_v1',
        template_name: '通用业务场景',
        scene_type: 'generic',
        base_capabilities: ['business_object', 'actions', 'roles'],
        required_items: ['primary_business_object'],
        capability_modules: {
            base: {
                business_object: true,
                state_machine: false,
                actions: true,
                roles: true,
                artifacts: false,
                rules: false
            }
        }
    }
];
