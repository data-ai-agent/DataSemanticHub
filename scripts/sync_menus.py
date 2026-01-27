
import json
import subprocess
import time

API_BASE = "http://localhost:8888/api/v1/system"

# Define the menu structure based on menuConfig.ts
GOVERNANCE_MENUS = [
    {
        "title": "数据服务",
        "code": "data_service",
        "items": [
            { "id": "ask_data", "label": "问数" },
            { "id": "advanced_ask_data", "label": "高级问数" },
            { "id": "data_supermarket", "label": "找数" }
        ]
    },
    {
        "title": "数据应用",
        "code": "data_application",
        "items": [
            { "id": "scenario_orchestration", "label": "场景编排" }
        ]
    },
    {
        "title": "语义治理",
        "code": "semantic_governance",
        "items": [
            { "id": "dashboard", "label": "语义治理总览" },
            {
                "id": "semantic_modeling",
                "label": "语义建模",
                "children": [
                    { "id": "modeling_overview", "label": "语义建模概览" },
                    { "id": "td_goals", "label": "业务梳理" },
                    { "id": "bu_semantic", "label": "逻辑视图" },
                    { "id": "bu_semantic_v2", "label": "逻辑视图2" },
                    { "id": "field_semantic", "label": "字段语义理解" },
                    { "id": "td_modeling", "label": "业务对象建模" }
                ]
            },
            { "id": "data_quality", "label": "数据质量" },
            { "id": "data_security", "label": "数据安全" },
            { "id": "semantic_version", "label": "语义版本" }
        ]
    },
    {
        "title": "语义资产管理",
        "code": "semantic_asset_mgmt",
        "items": [
            { "id": "term_mgmt", "label": "术语管理" },
            { "id": "tag_mgmt", "label": "标签管理" },
            { "id": "data_standard", "label": "数据标准" },
            { "id": "resource_knowledge_network", "label": "资源知识网络" }
        ]
    },
    {
        "title": "数据连接",
        "code": "data_connection",
        "items": [
            { "id": "bu_connect", "label": "数据源管理" },
            { "id": "bu_scan", "label": "资产扫描" },
        ]
    },
    {
        "title": "平台管理",
        "code": "platform_mgmt",
        "items": [
            { "id": "org_mgmt", "label": "组织架构管理" },
            { "id": "user_mgmt", "label": "用户管理" },
            { "id": "menu_mgmt", "label": "菜单管理" },
            { "id": "user_permission", "label": "角色与权限" },
            { "id": "permission_templates", "label": "权限模板" },
            { "id": "workflow_mgmt", "label": "工作流管理" },
            { "id": "approval_policy", "label": "审批策略" },
            { "id": "audit_log", "label": "审计与审批" }
        ]
    }
]

AGENT_FACTORY_MENUS = [
    {
        "title": "智能体工厂",
        "code": "agent_factory_root",
        "items": [
            { "id": "agent_overview", "label": "概览" },
            { "id": "agent_templates", "label": "模板库" },
            { "id": "agent_designer", "label": "智能体设计器" },
            { "id": "agent_debug", "label": "调试与Trace" },
            { "id": "agent_test", "label": "用例与评测" },
            { "id": "agent_release", "label": "发布与灰度" },
            { "id": "agent_instances", "label": "运行实例" },
            { "id": "agent_observability", "label": "运行观测" }
        ]
    },
    {
        "title": "底座能力",
        "code": "foundation",
        "items": [
            { "id": "agent_tools", "label": "工具与技能" },
            { "id": "agent_knowledge", "label": "知识源与连接" },
            { "id": "agent_runtime_packs", "label": "运行包与策略" }
        ]
    },
    {
        "title": "治理与设置",
        "code": "governance_settings",
        "items": [
            { "id": "agent_audit", "label": "审计日志" },
            { "id": "agent_settings", "label": "工厂设置" }
        ]
    }
]

def create_menu(name, code, type, parent_id=None, order=0, parent_path=""):
    url = f"{API_BASE}/menus"
    
    current_path = f"{parent_path}/{code}"
    if not parent_path:
        current_path = f"/{code}"

    data = {
        "name": name,
        "code": code,
        "type": type,
        "order": order,
        "visible": True,
        "enabled": True,
        "path": current_path,
        "route_name": code,
        "component_key": code
    }
    if parent_id:
        data["parent_id"] = parent_id
    
    json_data = json.dumps(data)
    
    cmd = [
        'curl', '-s', '-X', 'POST', url,
        '-H', 'Content-Type: application/json',
        '-d', json_data
    ]
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True)
        response_body = result.stdout
        
        try:
            resp_json = json.loads(response_body)
            # Check for business error code if present, or if it has 'menu'
            if 'menu' in resp_json:
                print(f"Created menu: {name} (ID: {resp_json['menu']['id']})")
                return resp_json['menu']['id'], current_path
            elif 'code' in resp_json and resp_json['code'] != 0:
                 print(f"Failed to create menu {name}: {resp_json}")
                 return None, current_path
            else:
                 # Some other response structure?
                 print(f"Unexpected response for {name}: {resp_json}")
                 return None, current_path
        except json.JSONDecodeError:
            print(f"Invalid JSON response for {name}: {response_body}")
            return None, current_path
            
    except Exception as e:
        print(f"Error executing curl for {name}: {e}")
        return None, current_path

def process_items(items, parent_id, parent_path):
    for idx, item in enumerate(items):
        is_directory = 'children' in item
        type = 'directory' if is_directory else 'page'
        
        # Create the item
        menu_id, new_path = create_menu(
            name=item['label'],
            code=item['id'],
            type=type,
            parent_id=parent_id,
            order=idx,
            parent_path=parent_path
        )
        
        # Recurse if children exist
        if menu_id and is_directory:
            process_items(item['children'], menu_id, new_path)

def main():
    print("Starting menu synchronization...")
    
    # Process Governance Menus
    print("\n--- Processing Governance Menus ---")
    for idx, group in enumerate(GOVERNANCE_MENUS):
        # Create group directory
        group_id, group_path = create_menu(
            name=group['title'],
            code=group['code'],
            type='directory',
            order=idx * 10,
            parent_path=""
        )
        
        if group_id:
            process_items(group['items'], group_id, group_path)

    # Process Agent Factory Menus
    print("\n--- Processing Agent Factory Menus ---")
    for idx, group in enumerate(AGENT_FACTORY_MENUS):
        # Create group directory
        group_id, group_path = create_menu(
            name=group['title'],
            code=group['code'],
            type='directory',
            order=(idx + 10) * 10,
            parent_path=""
        )
        
        if group_id:
            process_items(group['items'], group_id, group_path)

    print("\nDone.")

if __name__ == "__main__":
    main()
