
# BizSemantic · v2.4

## 字段语义理解 × 逻辑视图改造

### 工程实现 Prompt（给开发型大模型）

---

## 0. 任务目标（必须放在最前）

```text
你正在为 BizSemantic（数据语义治理平台）实现 v2.4 的一项核心功能：

【字段语义理解（Field Semantic Understanding）】

要求：
- 不新增字段详情页
- 基于现有【逻辑视图列表页 & 逻辑视图详情页】做最小侵入式改造
- 通过“页面模式切换”的方式完成字段语义理解
- 复用既有 run / suggestion / decision / version 治理模型
```

---

## 1. 产品背景（工程必须遵守）

```text
BizSemantic 的治理原则是：

1. AI 只输出 Suggestion（建议）
2. 人工做 Decision（裁决）
3. 只有 Version 才会生效
4. 逻辑视图是字段语义理解的上下文容器
```

**严禁：**

* AI 自动生效
* 绕过 decision 写入版本
* 新建与逻辑视图重复的字段页面

---

## 2. 现有页面（你必须基于这些页面改）

### 2.1 已存在页面

```text
- LogicalViewListPage（逻辑视图列表页）
- LogicalViewDetailPage（逻辑视图详情页）
```

你只能：

* 调整 UI 结构
* 增加组件
* 增加状态与模式

你不能：

* 删除页面
* 新建“字段详情页”
* 复制字段上下文 UI

````

---

## 3. 逻辑视图列表页改造要求（必须实现）

### 3.1 状态模型（替换原有状态）

```text
TableSemanticStage:
- NOT_STARTED        未开始语义建模
- FIELD_PENDING      字段语义待确认
- MODELING_IN_PROGRESS  语义建模进行中
- READY_FOR_OBJECT   可进入对象建模
````

### 3.2 CTA 行为（每行只能有 1 个）

```text
if stage in [NOT_STARTED, FIELD_PENDING]:
  CTA = "开始/继续字段语义理解"
  action = open LogicalViewDetailPage with mode=SEMANTIC

if stage == READY_FOR_OBJECT:
  CTA = "查看语义结果"
  action = open LogicalViewDetailPage with mode=BROWSE
```

---

## 4. 逻辑视图详情页改造要求（核心）

### 4.1 页面模式（必须实现）

```ts
PageMode = "BROWSE" | "SEMANTIC"
```

* 默认：BROWSE
* 从列表页 CTA 进入：SEMANTIC

---

### 4.2 页面结构（禁止改动中部上下文）

```text
Header
├─ 表名
├─ 当前模式（仅 SEMANTIC）
├─ 语义建模进度（已确认 / 总数）

Body
├─ Left: FieldList (增强为“治理列表”)
├─ Center: FieldContext (原样复用，不改)
├─ Right: SemanticDecisionPanel (新增，仅 SEMANTIC)
```

---

## 5. 字段治理列表（Left Panel）要求

```text
字段行必须包含：
- fieldName
- dataType
- semanticStatus: UNANALYZED | SUGGESTED | DECIDED | BLOCKED
- riskLevel: LOW | MEDIUM | HIGH
```

点击字段：

* Center 显示上下文
* Right 显示该字段的语义裁决面板

---

## 6. 语义裁决面板（Right Panel）要求

### 6.1 支持的裁决维度（MVP）

```text
- Role（必选）
- Term（可选）
- Tags（可选）
```

### 6.2 Role 枚举（不可扩展）

```text
Identifier
ForeignKey
Status
Time
Measure
Attribute
Audit
Technical
```

---

### 6.3 操作行为

```text
- AcceptSuggestion
- ModifyAndConfirm
- Reject (必须填写原因)
```

操作结果：

* 写入 decision
* 更新字段 semanticStatus = DECIDED
* 不写入 version

````

---

## 7. Suggestion 的来源与使用方式

```text
Suggestion 来源：
- 规则引擎
- LLM

Suggestion 数据只用于：
- 右侧裁决面板展示
- 置信度 / 风险提示

严禁：
- Suggestion 直接改变字段状态
````

---

## 8. 字段语义理解工作台（新增页面，但极简）

### 页面定位

```text
跨逻辑视图的字段治理调度页
```

### 功能

```text
- 列表展示所有 semanticStatus != DECIDED 的字段
- 点击“定位”：
  → 打开 LogicalViewDetailPage
  → mode=SEMANTIC
  → 高亮字段
```

---

## 9. 后端模型复用要求（禁止重建）

你必须复用：

```text
run
suggestion
decision
semantic_version
```

### 新增字段（允许）

```text
suggestion.type = FIELD_SEMANTIC
decision.dimension = ROLE | TERM | TAG
```

---

## 10. 验收条件（模型生成内容必须满足）

```text
- 字段语义理解发生在逻辑视图详情页
- 页面通过 mode 切换而不是跳转
- AI 结果永远是 suggestion
- 决策必须经 decision
- 生效必须通过 semantic_version
```

---

## 11. 输出要求（给开发型大模型）

```text
请基于以上约束，输出以下任一或多项内容：
- 前端页面组件拆分
- React/Vue 组件结构
- API 设计（REST / RPC）
- 状态机定义
- 数据模型变更
```

---

## 12. 禁止项（非常重要）

```text
禁止：
- 新建字段详情页
- 在列表页裁决字段语义
- 自动发布语义版本
- 在语义理解阶段编辑质量/安全规则
```

---

## 13. 一句话工作准则（必须遵守）

```text
字段语义理解不是新功能页，
而是逻辑视图的一种治理工作模式。
```

---

