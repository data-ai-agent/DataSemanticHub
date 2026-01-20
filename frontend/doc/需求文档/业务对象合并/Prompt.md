

# LLM 工程开发 Prompt（v2.4）

## 任务：合并「候选业务对象」到「业务对象建模」页面（统一对象入口）

### 0. 背景与目标

我们是「数据语义治理平台」v2.4。当前有两个页面：

* **业务对象建模**：对象卡片网格、业务域树、筛选、发布语义版本。
* **候选业务对象**：识别结果总览（统计、置信度）、列表、批量确认、冲突解释。

目标：**下线候选业务对象独立页面**，但保留其能力，**全部内嵌到业务对象建模**，通过对象状态驱动 UI：

* Candidate（候选）
* Pending（待确认/冲突处理中/流程中）
* Published（已发布）
* All（全部聚合视图）

核心原则：

* AI 只输出 Suggestion，不直接生效。
* 人工 Decision 记录审计。
* 语义版本只消费 Published 对象。

---

## 1. 交付范围（Scope）

### 1.1 必须交付（MVP）

1. 业务对象建模页新增 Tabs：

   * 全部 / 候选中 / 待确认 / 已发布（带计数）
2. 候选/待确认 Tab 显示 Summary Bar：

   * 总对象数、已接受、待确认、冲突项、平均置信度、刷新识别（可选）
3. 对象卡片增强：

   * 状态标签（Candidate/Pending/Published）
   * 置信度展示（仅候选/待确认）
   * 冲突标识（⚠）
   * 主 CTA 随状态变化
4. 对象建议抽屉（Candidate 的查看建议/确认入口）：

   * 展示识别证据与属性映射建议
   * 支持 Decision：接受 / 修改后接受 / 拒绝
5. 批量操作（多选卡片后出现浮条）：

   * 批量接受 / 批量拒绝 / 批量分配负责人 / 批量移动业务域（后两项可先占位）
6. 冲突处理抽屉（Pending/有冲突对象入口）：

   * 最少支持：合并 / 保留其一 / 绑定到已有对象（可选）

### 1.2 暂不做（Out of Scope）

* 复杂拆分（Split）算法（可后续）
* 对象关系网络编辑（另模块）
* 完整工作流审批（先保留扩展点）
* 质量/安全规则编辑（本任务只展示只读提示）

---

## 2. 统一概念与状态机（必须严格实现）

### 2.1 对象状态定义

* `CANDIDATE`：系统/AI 推导的对象建议（未被人确认）
* `PENDING`：已被人“接受/修改后接受”，但仍可能存在冲突或待完善
* `PUBLISHED`：对象已确认并进入语义版本生效（下游可消费）
* `DEPRECATED`：可选，已废弃（非 MVP）

### 2.2 状态迁移

* Candidate → Pending：接受/修改后接受（Decision 生效）
* Candidate → Deprecated：拒绝（Decision 生效）
* Pending → Published：满足发布条件后发布（触发版本发布流程或对象发布动作）
* Published → Pending：发生变更时创建新草稿（非 MVP 可留扩展点）

### 2.3 操作权限矩阵（前端必须按此禁用按钮）

| 状态        | 允许                      | 禁止             |
| --------- | ----------------------- | -------------- |
| CANDIDATE | 查看建议、接受、修改后接受、拒绝、批量操作   | 发布版本、被下游消费     |
| PENDING   | 编辑对象（已有能力）、解决冲突、提交发布前校验 | 直接发布（需校验）      |
| PUBLISHED | 查看、映射、下游绑定              | 直接编辑（需新草稿/新版本） |

---

## 3. 页面上下文（Page Context）

### 3.1 页面：业务对象建模（/semantic/object-model）

布局：

* 顶部：标题 + 右侧按钮（新建对象、发布语义版本）
* 左侧：业务域树
* 右侧：对象卡片网格（多选）
* 工具栏：搜索、筛选、排序

新增区域：

* Tabs（全部/候选中/待确认/已发布）
* Summary Bar（仅候选/待确认显示）

### 3.2 卡片字段（必须能渲染）

* objectName、objectCode、objectType（主体/事件…）
* domainName（业务域）
* fieldCount（字段数）
* mappingProgress（0-100%）
* status（Candidate/Pending/Published）
* confidence（0-100，仅候选/待确认）
* conflictFlag（bool）
* lastUpdatedAt

### 3.3 抽屉（Drawer）组件

* Drawer A：对象建议抽屉（Candidate）
* Drawer B：冲突处理抽屉（Pending 或 conflictFlag=true）
* Drawer C：对象详情（你们已有详情页或抽屉可复用）

---

## 4. 数据模型（后端落库/前端类型）

> 关键：不再使用 candidate_object 独立实体；候选只是 business_object 的一个状态。

### 4.1 BusinessObject（统一实体）

字段建议：

```json
{
  "objectId": "string",
  "tenantId": "string",
  "projectId": "string",
  "domainId": "string",
  "objectName": "string",
  "objectCode": "string",
  "objectType": "CORE_ENTITY|EVENT_ENTITY|RELATION_ENTITY|DIMENSION_ENTITY",
  "status": "CANDIDATE|PENDING|PUBLISHED|DEPRECATED",
  "source": "AI|MANUAL",
  "confidence": 0.92,
  "conflictFlag": true,
  "conflictType": ["DUPLICATE_NAME","KEY_CONFLICT","ATTR_MAPPING_CONFLICT"],
  "evidence": {
    "sourceTables": ["t_user_info"],
    "keyFields": ["user_id"],
    "fieldCoverage": 0.78
  },
  "ownerId": "string",
  "mappingProgress": 1.0,
  "updatedAt": "2026-01-18T00:00:00Z"
}
```

### 4.2 ObjectSuggestion（用于建议抽屉）

```json
{
  "objectId": "string",
  "suggestionId": "string",
  "suggestedName": "string",
  "suggestedType": "CORE_ENTITY",
  "confidence": 0.92,
  "evidence": {...},
  "attributes": [
    {
      "attrName": "userName",
      "mappedFields": [{"table":"t_user_info","field":"name"}],
      "semantic": {"termId":"xxx","role":"ATTRIBUTE","tags":["PII"]},
      "riskHints": {"quality":"WARN","security":"HIGH"}
    }
  ]
}
```

### 4.3 Decision（审计必需）

```json
{
  "decisionId": "string",
  "targetType": "BUSINESS_OBJECT",
  "targetId": "objectId",
  "action": "ACCEPT|ACCEPT_WITH_EDIT|REJECT|MERGE|BIND_EXISTING",
  "payload": {...},
  "decidedBy": "userId",
  "decidedAt": "timestamp"
}
```

---

## 5. API 契约（MVP 必须实现）

### 5.1 列表与计数

* `GET /api/objects`

  * query：`status? domainId? keyword? conflictFlag? confidenceRange? sort? page? pageSize?`
  * return：`{items: BusinessObject[], total: number}`

* `GET /api/objects/stats`

  * query：`domainId?`
  * return：

```json
{
  "all": 120,
  "candidate": 12,
  "pending": 3,
  "published": 105,
  "conflicts": 2,
  "avgConfidence": 0.91,
  "accepted": 6,
  "toConfirm": 6
}
```

### 5.2 获取对象建议（抽屉 A）

* `GET /api/objects/{objectId}/suggestion`

  * return：ObjectSuggestion

### 5.3 对象决策（接受/拒绝/修改后接受）

* `POST /api/objects/{objectId}/decision`

  * body：

```json
{
  "action": "ACCEPT|ACCEPT_WITH_EDIT|REJECT",
  "edit": {"objectName":"xxx","objectType":"CORE_ENTITY","domainId":"..."} 
}
```

* effect：

  * ACCEPT / ACCEPT_WITH_EDIT：状态变为 PENDING（或无冲突可直接 PENDING）
  * REJECT：状态变为 DEPRECATED

### 5.4 批量决策

* `POST /api/objects/batch-decision`

  * body：

```json
{"objectIds":["..."],"action":"ACCEPT|REJECT"}
```

### 5.5 冲突详情与解决（抽屉 B）

* `GET /api/objects/{objectId}/conflicts`

  * return：

```json
{
  "objectId":"...",
  "conflictFlag":true,
  "conflictItems":[
    {"type":"DUPLICATE_NAME","candidates":["objA","objB"],"recommendation":"MERGE"}
  ]
}
```

* `POST /api/objects/{objectId}/resolve-conflict`

  * body：

```json
{"action":"MERGE|KEEP_ONE|BIND_EXISTING","targetObjectId":"optional"}
```

### 5.6 发布语义版本（只需要调用既有发布接口）

* 前端发布按钮只在满足条件时可点：

  * 当前筛选范围存在 `status=PENDING` 且通过校验（校验接口如已有则调用）
* 若你们已有版本接口：直接复用 `POST /semantic/versions/publish`
* MVP 可仅做按钮状态控制 + 调用成功刷新列表

---

## 6. 前端实现要点（React/Vue 均可，按你们栈生成）

### 6.1 状态驱动 UI

* Tabs 控制 `status` 查询条件：

  * 全部：不传 status
  * 候选中：status=CANDIDATE
  * 待确认：status=PENDING
  * 已发布：status=PUBLISHED

### 6.2 Summary Bar 只在 Candidate/Pending 显示

* 通过 `/api/objects/stats` 获取
* “刷新识别”按钮点击调用（如有）：`POST /api/objects/refresh-suggestions`（可先 stub）

### 6.3 卡片 CTA 与抽屉

* Candidate：

  * CTA：查看建议（打开建议抽屉）
  * 抽屉内做 Decision
* Pending：

  * CTA：去解决冲突（如果 conflictFlag=true 打开冲突抽屉）
  * 否则 CTA：继续完善（打开对象详情）
* Published：

  * CTA：查看详情

### 6.4 批量操作条

* 选中对象后显示浮条
* 仅当选中对象状态一致时允许批量动作（否则提示“请筛选同状态对象”）
* 批量接受后：

  * 逐个刷新或整体刷新列表+stats

---

## 7. 发布与校验规则（MVP 版）

发布语义版本前置条件（前端 gating，后端仍要二次校验）：

* 至少存在 1 个 `PENDING` 对象且满足：

  * 必填字段齐全（name/code/type/domain）
  * 冲突已解决（conflictFlag=false）
  * 映射进度 >= 阈值（例如 80%，阈值可配置）
* 不满足则：

  * 发布按钮置灰
  * tooltip 提示阻塞原因（列举 1-3 条）

---

## 8. 验收标准（Acceptance Criteria）

1. 用户进入业务对象建模页，可切换 4 个 Tab，列表正确过滤状态
2. 在候选 Tab 可看到统计条，数值与列表一致
3. 候选对象卡片可打开建议抽屉，点击接受后对象进入待确认 Tab
4. 批量选择多个候选对象，可批量接受/拒绝，状态变化正确
5. 有冲突的对象在卡片上显示冲突标识，点击可进入冲突抽屉并完成“合并/保留其一”至少一种解决方式
6. 已发布对象不可编辑（按钮置灰或只读），候选不可发布
7. 发布语义版本按钮按 gating 规则启用/禁用，调用发布接口成功后刷新状态

---

## 9. 非功能要求

* 所有决策动作必须写审计日志（Decision）
* 列表查询支持分页与排序
* 抽屉数据懒加载（打开时再请求）
* API 返回需包含错误码与可展示的 message（用于 toast）

---

## 10. 输出要求（你是大模型要返回什么）

请输出：

1. 前端：页面组件拆分、路由、状态管理、接口调用、UI 交互代码（按既有技术栈）
2. 后端：数据表/实体定义、API 实现（controller/service/dao），以及关键校验逻辑
3. 关键测试：至少包含列表过滤、决策流转、冲突解决、发布 gating 的单测/接口测试样例
4. 所有新增/修改点请按文件路径列出变更清单

---
