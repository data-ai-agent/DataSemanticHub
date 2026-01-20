
下面我给你一份 **LLM Developer Task Pack（可直接复制到大模型）**，包含：

* 项目目标与边界
* 数据模型（DB/DTO）
* API 契约（REST）
* AI 编排（Prompt + Output JSON Schema + 校验）
* 前端页面与组件树（与你现有 UI 对齐）
* 校验规则与发布流程
* 最小可用版本（MVP）拆解与任务清单

> 你可以把这一整段作为“系统/开发指令”发给大模型，让它逐项生成代码与 PR。

---

## LLM Developer Task Pack：业务梳理（Scene → AI识别 → 建模确认 → 发布）

### 0. 背景与目标

我们要在「数据语义治理平台 > 业务梳理」模块实现一条完整链路：

1. 创建/编辑业务场景（自然语言描述）
2. 绑定场景模板（通用 + 政务增强 + 企业增强）
3. 触发 AI 识别生成建模候选（Candidates）
4. 在页面上采纳/编辑候选，形成业务模型（Model）
5. 模型完整度校验通过后可“确认并发布”

**约束**

* 不重做现有页面结构：沿用现有「场景列表 → 场景详情（描述 + 识别结果 + 建模）」的布局
* AI 输出必须结构化（JSON），禁止自然语言散文式输出
* 识别结果与建模模型需要版本/快照能力
* 发布必须受模板强制项约束

---

## 1) 核心概念与对象（Domain Model）

### 1.1 实体清单

* Scene（业务场景）
* SceneTemplate（场景模板）
* SceneCapabilityConfig（场景能力配置，来自模板但可覆盖）
* RecognitionRun（一次 AI 识别运行记录）
* CandidateSet（识别结果候选集合）
* BusinessModel（业务模型，用户采纳后形成）
* ModelVersion（模型版本/快照）
* ValidationResult（完整度校验结果）

### 1.2 关系

* Scene 1—1 SceneTemplate（必选）
* Scene 1—N RecognitionRun
* Scene 1—1 BusinessModel（当前生效草稿/已发布指针）
* BusinessModel 1—N ModelVersion

---

## 2) 数据结构（建议直接落库的字段）

### 2.1 Scene（表：scene）

```json
{
  "scene_id": "string",
  "name": "string",
  "description": "text",
  "status": "draft|modeled|published",
  "template_id": "string",
  "capability_config": { "…见 2.3" },
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### 2.2 SceneTemplate（表：scene_template）

内置模板（初期可写死配置文件 + seeded 到 DB）

```json
{
  "template_id": "gov_one_service_v1",
  "template_name": "政务·一件事",
  "scene_type": "government_one_service|enterprise_hr|enterprise_supply_chain|generic",
  "base_capabilities": ["business_object","state_machine","actions","roles","artifacts","rules"],
  "required_items": ["primary_business_object","state_machine", "..."],
  "capability_modules": { "…见 2.3" }
}
```

### 2.3 CapabilityConfig（嵌入 Scene 或独表）

```json
{
  "base": {
    "business_object": true,
    "state_machine": true,
    "actions": true,
    "roles": true,
    "artifacts": true,
    "rules": true
  },
  "government": {
    "enabled": true,
    "multi_department_verification": true,
    "statutory_time_limit": true,
    "reason_code": true,
    "audit_and_supervision": true
  },
  "enterprise": {
    "hr": {
      "enabled": false,
      "org_structure": false,
      "position_control": false,
      "background_check": false,
      "access_provisioning": false,
      "offboarding": false
    },
    "supply_chain": {
      "enabled": false,
      "supplier_management": false,
      "inventory_binding": false,
      "logistics_tracking": false,
      "settlement": false,
      "exception_handling": false
    }
  }
}
```

### 2.4 RecognitionRun（表：recognition_run）

```json
{
  "run_id": "string",
  "scene_id": "string",
  "model_version": "string",
  "input_hash": "string",
  "confidence_overall": "number",
  "coverage_score": "number",
  "candidates_json": { "…见 3.2" },
  "gap_analysis_json": { "…见 3.3" },
  "created_at": "datetime"
}
```

### 2.5 BusinessModel（表：business_model）

```json
{
  "model_id": "string",
  "scene_id": "string",
  "status": "draft|incomplete|ready_to_publish|published",
  "current_version_id": "string|null",
  "working_copy_json": { "…见 4.2" },
  "validation_json": { "…见 5.1" },
  "published_version_id": "string|null",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### 2.6 ModelVersion（表：model_version）

```json
{
  "version_id": "string",
  "model_id": "string",
  "version": "v0.1",
  "snapshot_json": { "…同 working_copy_json" },
  "created_at": "datetime"
}
```

---

## 3) AI 识别输出协议（Candidates Contract）

### 3.1 设计原则

* AI 输出必须符合 JSON Schema
* 输出是“候选项”，可被采纳/编辑/拒绝
* 每个候选项含：id、type、label、normalized_name、confidence、source_span、required_by_template、status

### 3.2 CandidateSet JSON（candidates_json）

```json
{
  "recognition_meta": {
    "model_version": "topdown-vNext",
    "confidence": 0.87,
    "coverage": 0.92
  },
  "candidates": {
    "business_objects": {
      "primary_object": { "...CandidateItem" },
      "related_objects": [ { "...CandidateItem" } ],
      "relations": [ { "from": "EnrollmentApplication", "rel": "1-n", "to": "Guardian" } ],
      "field_suggestions": [
        { "object": "EnrollmentApplication", "fields": [ { "name":"student_id","type":"string","required":true } ] }
      ]
    },
    "roles": [ { "...CandidateItem", "mapping": { "org_unit":"教育局", "responsibilities":["资格审核"] } } ],
    "actions": [ { "...CandidateItem", "mapping": { "actor_role":"Applicant", "target_object":"EnrollmentApplication" } } ],
    "artifacts": {
      "materials": [ { "...CandidateItem", "mapping": { "material_type":"statutory" } } ],
      "data_checks": [ { "...CandidateItem", "mapping": { "check_type":"HUKOU", "data_source_org":"公安" } } ]
    },
    "state_machine": {
      "primary_object": "EnrollmentApplication",
      "states": [ { "code":"SUBMITTED","name":"已提交" } ],
      "transitions": [ { "from":"DRAFT","to":"SUBMITTED","trigger_action":"SubmitApplication","guards":[] } ]
    },
    "constraints": {
      "time_limits": [ { "...CandidateItem", "mapping": { "duration":5,"unit":"workday" } } ],
      "eligibility_rules": [ { "...CandidateItem", "mapping": { "rule_expression":"all(check.status=='PASS')" } } ],
      "priority_rules": [],
      "exceptions": []
    }
  }
}
```

### 3.3 Gap Analysis（gap_analysis_json）

```json
{
  "required_but_missing": [
    { "key":"statutory_time_limit", "message":"政务模板要求法定时限，但描述中未出现具体时限数值" }
  ],
  "suggested_but_missing": [
    { "key":"supervision_metrics", "message":"建议补充监管指标用于统计" }
  ]
}
```

---

## 4) 建模工作区协议（Model Working Copy）

### 4.1 设计原则

* Working Copy = 用户采纳/编辑后的“准模型”
* 每个实体都有 `provenance`（来自哪次 run 的哪个 candidate）
* 支持 `status`: accepted/edited/rejected

### 4.2 working_copy_json（结构）

```json
{
  "template_id": "gov_one_service_v1",
  "capability_config": { "...同 2.3" },
  "model": {
    "primary_business_object": {
      "name": "入学申请",
      "normalized_name": "EnrollmentApplication",
      "fields": [ { "name":"student_id","type":"string","required":true } ],
      "provenance": { "run_id":"...", "candidate_id":"bo_001" }
    },
    "business_objects": [ ... ],
    "roles": [ ... ],
    "actions": [ ... ],
    "artifacts": { "materials": [...], "data_checks":[...] },
    "state_machine": { ... },
    "rules": { "eligibility": [...], "allocation": [...], "exceptions":[...] },
    "constraints": { "time_limits":[...], "reason_codes":[...] }
  }
}
```

---

## 5) 模型完整度校验（Validation Engine）

### 5.1 validation_json 输出

```json
{
  "score": 92,
  "status": "incomplete|ready_to_publish",
  "missing_required": [
    { "key":"reason_code", "message":"模板要求原因码体系，但当前模型未配置" }
  ],
  "warnings": [
    { "key":"data_mapping", "message":"建议配置数据要素映射，便于下游落地" }
  ]
}
```

### 5.2 校验规则（按模板）

* 从 SceneTemplate.required_items 决定必填
* 必填项缺失 => status=incomplete 且禁止 publish
* 所有 Base Capabilities 对应内容必须存在（至少一项/可配置最小门槛）

---

## 6) 后端 API（REST 契约）

### 6.1 场景

* `POST /api/scenes` 创建场景
* `GET /api/scenes` 列表（支持搜索）
* `GET /api/scenes/{scene_id}` 详情
* `PUT /api/scenes/{scene_id}` 更新描述/名称
* `PUT /api/scenes/{scene_id}/template` 绑定模板 + capability_config
* `POST /api/scenes/{scene_id}/recognitions` 触发 AI 识别（创建 RecognitionRun）
* `GET /api/scenes/{scene_id}/recognitions/latest` 获取最新识别结果

### 6.2 模型

* `GET /api/scenes/{scene_id}/model` 获取 working copy
* `PUT /api/scenes/{scene_id}/model` 更新 working copy（前端编辑）
* `POST /api/scenes/{scene_id}/model/validate` 运行校验，返回 validation_json 并写入
* `POST /api/scenes/{scene_id}/model/publish` 发布（先 validate，成功则创建 ModelVersion + 更新 published_version_id）

### 6.3 模板

* `GET /api/templates` 获取模板列表
* `GET /api/templates/{template_id}` 获取模板详情

---

## 7) 前端页面与组件树（与你现有 UI 对齐）

### 7.1 场景列表页（已存在，补字段）

* 每个卡片增加：template tag（政务/HR/供应链）、model_status（draft/incomplete/published）
* “开始分析”仅在 template 已选时可用，否则引导去配置

### 7.2 场景详情页（核心：新增「模板配置」Section）

页面结构（保持你现有布局）：

* 左：场景描述编辑区
* 右：Tabs（识别结果 / 业务建模）

新增模块：
**SceneTemplateConfigPanel（放在描述区上方或折叠）**

* SceneTypeSelector（政务/HR/供应链/通用）
* BaseCapabilities（锁定勾选）
* CapabilityModules（按 scene_type 展示）
* RequirementPreview（显示 required vs missing）

### 7.3 识别结果 Tab（候选列表）

* BO / Roles / Actions / Artifacts / StateMachine / Constraints
* 每个 item 支持：采纳(accept)、编辑(edit)、拒绝(reject)
* 顶部显示：confidence / coverage / gap_analysis

### 7.4 业务建模 Tab（你现在已有雏形）

* 子 Tab：模型定义 / 状态机 / 业务规则
* 左侧对象列表（primary 标识）
* 右侧字段编辑（字段名、类型、必填、来源、隐私等级）
* 顶部固定区：模型完整度、缺失项、【确认并发布】按钮
* 发布按钮：若 validation.status != ready_to_publish 则禁用并提示缺失项

---

## 8) AI 编排（实现建议）

### 8.1 调用流程

1. 后端收到 `POST /recognitions`
2. 构造 prompt：包含 scene.description + template.required_items + capability_config
3. 调用大模型，要求严格 JSON 输出（按 3.2）
4. 服务器端 JSON Schema 校验
5. 计算 coverage_score（按模板 required items 覆盖率 + base 完整度）
6. 保存 RecognitionRun

### 8.2 Prompt 模板（直接可用）

```text
你是业务语义建模 AI。请基于“场景描述”和“模板能力要求”输出严格 JSON。
场景模板：{template_name}
强制项：{required_items}
能力开关：{capability_config}
场景描述：{description_text}

要求：
- 仅输出 JSON，不要输出任何解释性文字
- 输出结构必须包含：recognition_meta、candidates、template_gap_analysis
- 每个 candidate 必须含：id,type,label,normalized_name,confidence,source_span,required_by_template,status
- 对模板要求但无法识别的项，写入 template_gap_analysis.required_but_missing
```

---

## 9) MVP 任务拆解（让 LLM 按顺序产出代码）

### Sprint 1（可跑通）

1. Scene/Template/CapabilityConfig 数据模型 + API
2. 场景详情页新增 SceneTemplateConfigPanel
3. AI 识别接口（mock 返回固定 candidates 也可）
4. 识别结果 Tab 渲染 candidates

### Sprint 2（可编辑可采纳）

5. Candidate 采纳/拒绝/编辑交互 + 写入 BusinessModel.working_copy_json
6. BusinessModel API（GET/PUT）
7. 建模页读取 working_copy 并可编辑字段

### Sprint 3（可校验可发布）

8. Validation Engine（按模板 required_items 校验）
9. Publish 流程（validate → version snapshot → publish）
10. 列表页显示建模/发布状态

---

## 10) 交付标准（Definition of Done）

* 场景必须先选择模板才能开始分析
* AI 输出不合规 JSON 时，后端拒绝并返回可读错误
* 识别结果可采纳为模型
* 发布前必须通过模板强制项校验
* 所有结构可扩展（新增模板/增强模块无需改代码，仅改配置）

---

