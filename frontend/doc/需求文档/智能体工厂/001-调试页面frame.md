
## 智能体工厂 · 调试与 Trace（Debug Session）完整 Frame 结构（组件级）

### Frame 0：Page /DebugSession

* **PageContainer**

  * **TopBar（固定）**

    * Breadcrumb：`智能体工厂 / 调试与 Trace`
    * Title：`调试会话 #<runNo>`（或 `调试与 Trace`）
    * VersionSelector（下拉）：Draft / Canary / Stable / 自定义版本号
    * EnvSelector（下拉）：Dev / Staging / Prod（含环境说明 Tooltip）
    * PrimaryButton：运行（Run）
    * SecondaryButton：取消（Cancel，运行中出现）
    * SecondaryButton：保存为用例（Save as Test Case）
    * IconButton：复制链接（Share）
    * (可选) Switch：Diff 模式 / 对比模式（与历史运行对比）
  * **Body（滚动区）**

    * **MainGrid（3 列布局，卡片化）**

      * Col-1：InputPanelCard
      * Col-2：OutputPanelCard
      * Col-3：TracePanelCard
    * **BottomStatusArea（固定或贴底，运行异常/提示时出现）**
  * **Drawers（抽屉层）**

    * Drawer：原始 JSON（Input / Output / Trace）
    * Drawer：工具调用详情（Tool Call Detail）
    * Drawer：保存为用例（用例元信息 + 归档位置）
    * Drawer：管理员信息（Prompt 渲染 / 模型原文 / 重试记录）

---

### Frame 1：InputPanelCard（输入面板）

* **CardHeader**

  * Title：输入面板
  * Badge：Schema 校验状态（Valid / Warning / Invalid）
  * Actions：

    * Segmented：输入方式（表单 / JSON / 文件上传 / 加载用例）
* **CardBody**

  * **Section：变量表单（VariableForm）**（默认）

    * FormList（按 Input Schema 动态渲染）

      * FormRow（repeat）

        * FieldLabel：`time_range`（含 Required/Optional）
        * FieldTypeTag：string / enum / number / object
        * FieldSourceHint：用户输入 / 会话上下文 / 语义资产 / 系统默认
        * FieldEditor：

          * Input / Select / MultiSelect / DateRange / JSONInlineEditor
        * HelperText：约束说明（枚举值、pattern、min/max）
        * RightActions：

          * IconButton：编辑字段（映射/默认值/校验规则）
      * Divider
      * ButtonGroup：

        * Button：新增字段（若允许扩展）
        * Button：重置为模板默认
  * **Section：JSON 输入（JsonEditorBlock）**（JSON 模式）

    * JsonEditor（Monaco）
    * Button：格式化
    * InlineValidation：缺失字段提示（例如 scope 缺失将使用默认范围）
  * **Section：文件上传（FileUploadBlock）**（文件模式）

    * UploadDropzone
    * FileList（含解析状态）
    * ParseResultPreview（可折叠）
  * **Section：输入校验提示（ValidationBanner）**

    * WarningBanner：黄色（可继续运行）
    * ErrorBanner：红色（禁止运行）
    * CTA Buttons（随错误类型变化）：

      * 重试 / 缩小范围 / 仅返回结构 / 去修复（跳转到对应模块）
* **CardFooter**

  * QuickActions：

    * Button：复制 Input JSON
    * Button：保存当前输入为默认用例

---

### Frame 2：OutputPanelCard（输出面板）

* **CardHeader**

  * Title：输出面板
  * Tabs：Text / JSON / 结构化预览（Schema Render）
  * StatusTag：Schema Valid / Invalid（含失败字段数）
* **CardBody**

  * **Section：输出预览（OutputPreview）**

    * TextViewer（markdown）
    * JSONViewer（树形/折叠）
    * StructuredTable（当输出是数组对象时自动表格化）
  * **Section：Schema 校验（SchemaValidationBlock）**

    * Summary：通过 / 失败字段数
    * FailedFieldsList（repeat）

      * FieldPath（e.g. `entities[0].id`）
      * Reason（type mismatch / missing required）
      * Suggestion（修复建议）
  * **Section：输出操作（OutputActions）**

    * Button：复制输出
    * Button：导出 JSON
    * Button：查看原始输出（打开 Drawer）
* **CardFooter（可选）**

  * RunMeta：耗时 / tokens / 预估成本（与 Trace 汇总一致）

---

### Frame 3：TracePanelCard（Trace 面板）

* **CardHeader**

  * Title：Trace 面板
  * Badge：运行状态（Running / Success / Failed / Timeout / Canceled）
* **CardBody**

  * **Section：阶段时间线（StageTimelineChips）**

    * ChipList：parse / ground / plan / generate / execute / explain

      * 每个 Chip：

        * stageName
        * duration
        * statusIcon（success/warn/fail/running）
        * onClick：滚动定位到 StageDetail
  * **Section：工具调用列表（ToolCallsList）**

    * ToolCallRow（repeat）

      * ToolName：SemanticSearch / MetricResolver / SQLRunner
      * Duration
      * ResultTag：OK / FAIL / TIMEOUT
      * ExpandIcon（打开 ToolCall Detail Drawer）
  * **Section：资源与成本（CostSummary）**

    * Token：xx
    * 成本：¥xx
    * 耗时：xxs
  * **Section：管理员区（AdminBlock，可折叠，仅管理员可见）**

    * Prompt 渲染结果（含变量展开）
    * 模型响应原文（raw completion）
    * 重试记录（retry history）
    * Trace 原始 JSON（link）
* **CardFooter**

  * Button：下载 Trace（JSON）
  * Button：复制 TraceId

---

### Frame 4：BottomStatusArea（错误/建议操作条）

> 对应你第 2 张图最关键的“**可操作错误面板**”，用于把“看懂问题”变成“一键修复/重试”。

* **StatusStrip**

  * Left：ErrorCodeTag（如 `TOOL_TIMEOUT`）+ StageHint（execute）
  * Middle：Message（requestId、简述）
  * Right：CTA Buttons（按错误类型策略化渲染）

    * Button：重试（Retry same input）
    * Button：缩小范围（Open InputPanel and highlight fields）
    * Button：仅返回结构（Toggle output_mode = schema_only）
    * Button：切换版本（Open VersionSelector）
    * Button：查看详情（Open Drawer: Error Detail）
* **ErrorDetailDrawer（可选）**

  * 错误栈（服务端）
  * Tool request/response（脱敏）
  * 建议修复步骤（runbook）

---

## 这套调试页为什么更“可用”（对应你问的“哪个更符合使用”）

你给的两套里，**更符合生产使用的是“第 2 张卡片化 + 错误操作条”这一类**，原因很直接：

* **输入/输出/Trace 都是“面板化”**：信息密度够但不会挤压可读性，适合长时间排障。
* **失败时给“可执行动作”**：重试、缩小范围、仅返回结构、切换版本——把排障闭环做完整。
* **更适配多角色**：业务人员看输出 + 建议；工程看 Trace + 工具耗时；管理员看 prompt/raw。

---

## 后端接口契约（建议最小闭环）

> 下面是为了把该页面一次性打通（运行、拿结果、拿 trace、保存用例）。

### 1) 启动运行

* `POST /api/agent-templates/{templateId}/runs`
* Request

```json
{
  "version": "draft|canary|stable|v2.3.1",
  "env": "dev|staging|prod",
  "input": { "question": "...", "time_range": "30d", "scope": "..." },
  "options": {
    "output_mode": "text|json|schema_only",
    "trace_level": "basic|verbose",
    "timeout_ms": 8000
  }
}
```

* Response

```json
{
  "runId": "run_xxx",
  "traceId": "tr_xxx",
  "status": "RUNNING"
}
```

### 2) 拉取运行结果（轮询/长轮询/WS）

* `GET /api/runs/{runId}`
* Response（简化）

```json
{
  "runId": "run_xxx",
  "status": "SUCCESS|FAILED|TIMEOUT|RUNNING",
  "output": { "type": "json", "data": {} },
  "schemaValidation": { "valid": true, "failedFields": [] },
  "cost": { "tokens": 1240, "amount": 0.04, "latencyMs": 5900 },
  "error": null
}
```

### 3) 拉取 Trace（阶段 + tool calls）

* `GET /api/traces/{traceId}`

```json
{
  "traceId": "tr_xxx",
  "stages": [
    { "name": "parse", "status": "SUCCESS", "latencyMs": 220, "detail": {} },
    { "name": "execute", "status": "FAILED", "latencyMs": 2400, "detail": {} }
  ],
  "toolCalls": [
    { "tool": "SQLRunner", "status": "TIMEOUT", "latencyMs": 1900, "requestId": "rq_10092" }
  ]
}
```

### 4) 保存为用例

* `POST /api/agent-templates/{templateId}/testcases`

```json
{
  "name": "库存周转率下降原因",
  "version": "draft",
  "env": "dev",
  "input": {},
  "expected": { "schema": "..." },
  "tags": ["regression"]
}
```

---

## Trace 状态机（页面渲染/按钮态的依据）

### RunStatus（顶层）

* `IDLE → VALIDATING → QUEUED → RUNNING → (SUCCESS | FAILED | TIMEOUT | CANCELED)`

### StageStatus（阶段级）

* `PENDING → RUNNING → (SUCCESS | FAILED | SKIPPED)`
* stages：`parse / ground / plan / generate / execute / explain`

### ToolCallStatus（工具级）

* `PENDING → RUNNING → (SUCCESS | FAILED | TIMEOUT | RATE_LIMITED | DENIED)`

> UI 关键规则：

* 任一 Stage=FAILED → Run=FAILED（但允许部分输出展示）
* ToolCall=TIMEOUT → Stage=FAILED 或 Stage=WARNING（取决于该工具是否“可选”）
* SchemaInvalid 不一定失败：可由 `options.output_mode=schema_only` 兜底

---

## 错误码规范（用于“错误操作条”策略化渲染）

建议格式：`<DOMAIN>_<TYPE>`，并带 `retryable / suggestedActions[]`

* `RUN_INPUT_SCHEMA_INVALID`（不可运行）

  * actions：去修复（定位缺失字段）、加载默认、仅返回结构（若允许）
* `TOOL_TIMEOUT`（可重试）

  * actions：重试、缩小范围、提高超时（若权限允许）
* `TOOL_RATE_LIMITED`（可重试/切换模型）

  * actions：重试、切换版本、切换模型策略
* `POLICY_DENIED`（不可重试）

  * actions：查看安全策略、申请权限
* `MODEL_PROVIDER_ERROR`（可重试/切换供应商）

  * actions：重试、切换模型/供应商
* `TRACE_FETCH_FAILED`（不影响 run，但影响可观测）

  * actions：刷新、下载原始日志（若管理员）

---
