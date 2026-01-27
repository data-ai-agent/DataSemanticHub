
import json
import subprocess
import time

API_BASE = "http://localhost:8888/api/v1/system"
USER_API_BASE = "http://localhost:5173/api/v1/user" # For login via proxy mainly, but we can direct hit backend if we skipped auth middleware? No, backend has auth

# Using direct backend for org operations, but we need a TOKEN.
# Let's assume we have a valid admin user (e.g. created during menu sync or existing).
# For this script to work autonomously, we'll try to login as the 'admin@datasemantichub.com' (if exists) or 'testuser@example.com'.
# Since I created 'testuser@example.com' with password 'Password123!', I will use that.

LOGIN_EMAIL = "testuser@example.com"
LOGIN_PASSWORD = "Password123!"

DATA_BUREAU_STRUCTURE = [
    {
        "name": "XX市数据局",
        "code": "city_data_bureau",
        "type": 1, # Tenant
        "children": [
            {
                "name": "办公室",
                "code": "general_office",
                "type": 2, # Dept
                "children": []
            },
            {
                "name": "政策法规处",
                "code": "policy_division",
                "type": 2,
                "children": []
            },
            {
                "name": "数据资源管理处",
                "code": "data_resource_division",
                "type": 2,
                "children": []
            },
            {
                "name": "数字经济处",
                "code": "digital_economy_division",
                "type": 2,
                "children": []
            },
            {
                "name": "数字基础设施与安全处",
                "code": "infrastructure_security_division",
                "type": 2,
                "children": []
            },
            {
                "name": "应用推进处",
                "code": "application_promotion_division",
                "type": 2,
                "children": []
            },
            {
                "name": "大数据中心",
                "code": "big_data_center",
                "type": 2,
                "children": [
                     { "name": "数据归集部", "code": "data_collection_dept", "type": 2 },
                     { "name": "平台运维部", "code": "ops_dept", "type": 2 },
                     { "name": "技术研发部", "code": "tech_rd_dept", "type": 2 },
                     { "name": "网络安全部", "code": "cyber_security_dept", "type": 2 }
                ]
            }
        ]
    }
]

def get_token():
    url = "http://localhost:8888/api/v1/user/login"
    data = {
        "email": LOGIN_EMAIL,
        "password": LOGIN_PASSWORD,
        "remember_me": False
    }
    
    cmd = [
        'curl', '-s', '-X', 'POST', url,
        '-H', 'Content-Type: application/json',
        '-d', json.dumps(data)
    ]
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True)
        response = json.loads(result.stdout)
        if 'token' in response:
            return response['token']
        else:
            print(f"Login failed: {response}")
            return None
    except Exception as e:
        print(f"Login error: {e}")
        return None

def create_org(token, name, code, type, parent_id, sort_order=0):
    url = f"{API_BASE}/organization"
    
    data = {
        "name": name,
        "code": code,
        "type": type,
        "parentId": parent_id,
        "sortOrder": sort_order,
        "desc": f"Created via sync script: {name}"
    }
    
    cmd = [
        'curl', '-s', '-X', 'POST', url,
        '-H', 'Content-Type: application/json',
        '-H', f'Authorization: Bearer {token}',
        '-d', json.dumps(data)
    ]
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True)
        response_body = result.stdout
        
        try:
            resp_json = json.loads(response_body)
            if 'id' in resp_json:
                print(f"Created org: {name} (ID: {resp_json['id']})")
                return resp_json['id']
            # Fallback check for code=0 success (though api doc says returns id directly in one response struct, 
            # sometimes wrapper exists if standard response handler is used)
            elif 'data' in resp_json and 'id' in resp_json['data']:
                 print(f"Created org: {name} (ID: {resp_json['data']['id']})")
                 return resp_json['data']['id']
            elif 'code' in resp_json and resp_json['code'] != 200 and resp_json['code'] != 0:
                 print(f"Failed to create org {name}: {resp_json}")
                 return None
            else:
                 # If the API returns just { "id": "..." }
                 print(f"Created org: {name} success (Response: {resp_json})")
                 return resp_json.get('id')
                 
        except json.JSONDecodeError:
            print(f"Invalid JSON response for {name}: {response_body}")
            return None
            
    except Exception as e:
        print(f"Error executing curl for {name}: {e}")
        return None

def process_orgs(token, nodes, parent_id):
    for idx, node in enumerate(nodes):
        org_id = create_org(
            token=token,
            name=node['name'],
            code=node['code'],
            type=node['type'],
            parent_id=parent_id,
            sort_order=idx
        )
        
        if org_id and 'children' in node and node['children']:
            process_orgs(token, node['children'], org_id)

def main():
    print("Starting organization synchronization...")
    token = get_token()
    if not token:
        print("Cannot proceed without auth token.")
        return

    # Root Level (Parent ID = "0" or empty string depending on backend impl, usually "0" for root)
    # The API Doc says: ParentId string `json:"parentId,optional,default=0"
    process_orgs(token, DATA_BUREAU_STRUCTURE, "0")
    
    print("\nDone.")

if __name__ == "__main__":
    main()
