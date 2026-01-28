

## 智能体工厂 · 智能设计器（模板编辑页）Frame 结构（组件级）

### Frame 0：Page /AgentFactory/TemplateDesigner

* **PageContainer**

  * **TopHeader（固定）**

    * Left

      * IconButton：Back
      * TitleBlock

        * Text：模板名称（H1）`供应链问数助手`
        * MetaRow

          * StatusBadge：Stable / Canary / Draft
          * SaveStateBadge：未保存 / 已保存
          * Text：ID（可复制）`tpl_xxx`
    * Right（操作区）

      * Button：去使用（跳转使用/运行页）
      * Button（Primary）：打开调试（跳转 DebugSession）
      * Button：保存草稿
      * Button（Primary）：发布
      * Button：回滚
      * IconButton：更多（…）

        * DropdownMenu

          * MenuItem：复制模板链接
          * MenuItem：导出配置 JSON
          * MenuItem：从 JSON 导入覆盖
          * MenuItem：权限与协作设置
  * **VersionStrip（固定，TopHeader 下）**

    * Left

      * CurrentVersionChip：`v2.3.1 Stable`
      * EnvFlowText：`Staging → v2.3.1 / Prod → v2.3.0 (20%)`
    * Center

      * WarningPill：`2 Warnings`（点击打开 Warnings Drawer）
      * GateStatus：`Gate Pass`（可点击查看 Gate 规则）
      * RuntimePackageTag：`运行包：QNA-SupplyChain-v1`
    * Right

      * LinkButton：版本历史
      * LinkButton：Diff 模式
      * LinkButton：从某版本拉草稿
  * **Body（滚动区）**

    * **ContentGrid（3列布局）**

      * Col-A：LeftAnchorNav（粘性）
      * Col-B：MainEditor（主编辑区）
      * Col-C：RunConfigPanel（右侧运行配置面板，粘性，可折叠）
  * **Drawers / Modals（全局）**

    * Drawer：Warnings & Fix（警告与一键修复）
    * Drawer：版本历史（Version Timeline）
    * Drawer：Diff 对比（结构化对比 + JSON 对比）
    * Drawer：导入/导出（Schema/Workflow/全量）
    * Drawer：工具调用详情（Tool/Operator Detail）
    * Modal：发布确认（含 Gate、灰度、变更说明）
    * Modal：回滚确认（选择回滚点）
    * Modal：切换语义资产版本（语义版本选择器）
    * Modal：选择知识源（文档/指标/知识网络等）
    * Modal：从注册表添加工具/算子（Tool Registry Picker）

---

## Frame 1：LeftAnchorNav（左侧锚点导航）

* **NavCard**

  * NavItem：基本信息
  * NavItem：输入配置（Input Schema）
  * NavItem：绑定语义资产
  * NavItem：知识源（跳转右侧面板同模块并定位）
  * NavItem：角色指令（Role/System Prompt）
  * NavItem：流程编排（Workflow / DSL）
  * NavItem：输出结构（Output Schema）
  * NavItem：运行限制与安全
  * NavItem：发布与版本（可选）
* **NavFooter（可选）**

  * MiniStatus：未保存提示
  * Button：滚动到顶部

> 交互：点击 NavItem → 主编辑区滚动定位；滚动时高亮同步；每项可显示小红点（有校验错误）/小黄点（Warning）。

---

## Frame 2：MainEditor（主编辑区，按模块卡片化）

### 2.1 SectionCard：基本信息（BasicInfo）

* CardHeader

  * Title：基本信息
* CardBody（FormGrid）

  * Field：模板名称（Input）
  * Field：能力类型（Select：问数/QNA、语义理解/SEM、知识网络构建/KG、报告、客服、通用…）
  * Field：简介（Textarea）
  * Field：业务域（Input/Select）
  * Field：分类（MultiSelect chips：分析助手/辅助决策/智能洞察…）
  * Field：标签（TagInput：逗号分隔）
* CardFooter（可选）

  * InlineHint：发布后修改哪些字段会触发重新评审

---

### 2.2 SectionCard：输入配置（Input Schema）

* CardHeader

  * Title：输入配置（Input Schema）
  * RightActions

    * Button：新增字段
    * Button：从示例推导（AI/规则推导，可选）
* CardBody

  * **SchemaTable（表格式）**

    * Row（repeat）

      * FieldName：`question`
      * RequiredBadge：REQUIRED / OPTIONAL
      * TypeTag：string / enum / object / array
      * SourceText：From 用户输入 / 会话上下文 / 语义资产 / 系统默认
      * RightActions

        * LinkButton：编辑
        * IconButton：排序拖拽
        * IconButton：删除
  * **FieldEditorDrawer（编辑字段抽屉，点击“编辑”打开）**

    * Tabs：基础 / 校验规则 / 默认值 / 映射与注入
    * 基础

      * name、displayName、description
      * type（含 enum values）
      * required（switch）
    * 校验规则

      * pattern / min / max / arrayMaxLen
      * missingBehavior：报错 / warning / fallback-default
    * 默认值

      * defaultValue（支持模板变量）
    * 映射与注入

      * mapTo：workflow 入参路径（如 `tools.SQLRunner.params.scope`）
      * injectFrom：语义资产字段 / 运行上下文键

---

### 2.3 SectionCard：绑定语义资产（Semantic Bindings）

* CardHeader

  * Title：绑定语义资产
* CardBody（CardGrid）

  * **SemanticVersionCard**

    * Label：语义版本 `v2.1.0`
    * Button：切换（打开“语义版本选择器”Modal）
    * Meta：最后同步时间
  * **ObjectScopeCard**

    * Label：业务对象范围（chips）

      * `供应链` `采购` `库存` …
    * Button：+ 添加对象（从对象列表选择）
  * **LogicViewCard**

    * Label：逻辑视图（只读或跳转查看）
  * **Metric/Term/TagCard**

    * Label：指标/术语标签（chips）
  * **Quality/SecurityPolicyCard（关键）**

    * Label：质量/安全策略绑定（如 `SQL 安全策略 v1`）
    * Status：已启用/未启用
    * LinkButton：查看策略
  * **ConsistencyCheckRow**

    * Switch：强一致性校验（知识源过期将阻断发布）
    * Tooltip：策略说明

---

### 2.4 SectionCard：角色指令（Role / System Prompt）

* CardHeader

  * Title：角色指令（Role / System Prompt）
  * RightActions

    * Button：插入变量
    * Button：模板片段库（可选）
* CardBody

  * PromptEditor（Textarea/Monaco，支持变量高亮）
  * InlineHint

    * InfoIcon + 文案：提示注入风险检测与敏感词提示已开启（可点击配置）
  * PromptTestMini（可选）

    * QuickInput：一句话测试
    * Button：试运行（跳转调试页并带入）

---

### 2.5 SectionCard：流程编排（Workflow / DSL）

* CardHeader

  * Title：流程编排（Workflow / DSL）
  * Right

    * SkeletonTag：当前骨架 `问数骨架 v1`
    * LinkButton：切换骨架
    * LinkButton：Flow Editor（进入可视化/DSL编辑器）
* CardBody

  * **WorkflowStepsList（纵向步骤卡）**

    * StepCard（repeat）

      * StepIndexBadge：1/2/3…
      * StepTitle：`SemanticSearch`（ToolTag：工具）
      * ParamsPreview：`query={term}`
      * DependencyChips：`v2.1.0` / `SafePolicy-v1`
      * RightActions

        * IconButton：配置（打开 StepConfigDrawer）
        * IconButton：上下移动
        * IconButton：删除
    * InlineWarningRow（当缺少关键配置）

      * WarningIcon + 文案：`SQLRunner 缺少运行限制配置`
      * LinkButton：去修复（滚动定位“运行限制与安全”）
  * **StepConfigDrawer（步骤配置抽屉）**

    * Tabs：参数 / 输入映射 / 输出映射 / 守卫（Guard）/ 重试与超时
    * 参数：表单 + JSON模式
    * 映射：从 Input Schema / Context / PreviousStep 输出选择
    * 守卫：绑定安全策略（SQL 白名单/敏感字段拦截）
    * 重试与超时：retry 次数、退避、timeoutMs、fallback

---

### 2.6 SectionCard：输出结构（Output Schema）

* CardHeader

  * Title：输出结构（Output Schema）
* CardBody

  * Tabs：Text / JSON / 多段输出
  * **OutputTypeCards**

    * Card：Text（选择）
    * Card：JSON（选择）
    * Card：多段输出（选择）
  * **SchemaHintBar**

    * 文案：`Schema 必填字段：entities / relations / evidence / confidence / conflicts`
  * **SchemaEditorBlock**

    * MonacoEditor（JSON Schema）
    * RightActions

      * Button：Schema 规则（打开规则说明）
      * Button：生成示例输出（基于 schema 生成 1 份结构化示例）
  * **SchemaRuleCard（只读说明）**

    * 必填字段、枚举约束、最大数组长度
  * **ExampleOutputCard**

    * 状态：已生成/未生成
    * Button：查看示例 / 重新生成

---

### 2.7 SectionCard：运行限制与安全（主区可选，或完全在右侧面板）

> 你当前 UI 是放在右侧面板，我建议主区只放“摘要 + 跳转”，详情仍放右侧，避免重复。

* CardHeader：运行限制与安全
* CardBody

  * SummaryRow：最大耗时 / 最大扫描行数 / 分页策略 / SQL 安全策略（On）
  * LinkButton：在右侧面板编辑

---

## Frame 3：RunConfigPanel（右侧运行配置面板，Accordion）

### 3.1 Accordion：知识源（Knowledge）

* KnowledgeSourceList（repeat）

  * SourceCard：业务知识网络

    * Version：v2.1.0
    * StatusTag：已连接
  * SourceCard：指标库

    * Version：v3.4
    * StatusTag：已连接
  * SourceCard：文档库

    * Version：v1.8
    * StatusTag：需要更新
    * LinkButton：Sync
* SearchPolicyRow

  * Text：检索策略 `topK=8 · 过滤=业务域 · 重排=启用`
  * LinkButton：编辑（Modal：检索策略配置）

### 3.2 Accordion：工具与技能（Tools）

* ToolList（repeat）

  * ToolRow

    * ToolName：SemanticSearch
    * PermissionMeta：普通
    * TimeoutMeta：2s
    * StatusTag：可用
    * IconButton：详情（打开 Tool Detail Drawer）
  * ToolRow：SQLRunner（高级）

    * StatusTag：限制
* Button：从注册表添加工具（打开 Tool Registry Picker）
* Tool Detail Drawer（工具详情）

  * Tabs：基础 / 接口 / 权限与配额 / 超时重试 / 安全守卫 / 版本
  * 基础：name、描述、owner
  * 接口：API Tool / MCP Tool（协议、endpoint、schema）
  * 权限：角色可见、审批流
  * 配额：RPM/TPM/并发
  * 守卫：SQL 安全策略、脱敏策略
  * 版本：工具版本绑定、兼容性提示

### 3.3 Accordion：默认模型配置（Model Policy）

* Select：默认模型（下拉）
* Select：Fallback 模型
* Slider：Temperature
* Input：Max Tokens
* LinkButton：使用“模型策略”（跳转模型工厂策略或弹窗选择）

### 3.4 Accordion：体验配置（UX）

* Switch：长期记忆（开启/关闭）
* Switch：相关问题推荐（开启/关闭）
* DefaultGreeting（默认开场白）

  * Tabs：自动生成 / 手动填写
  * Button：AI 生成
  * GreetingList（repeat，可拖拽排序）
* PresetQuestions（预设问题）

  * Input：新增一个预设问题
  * Button：添加
  * List（repeat）

    * DragHandle
    * Text
    * LinkButton：删除

### 3.5 Accordion：运行限制与安全（Runtime Guardrails）

* Input：最大耗时（秒）
* Input：最大扫描行数
* Select：分页策略（自动/固定大小）
* Switch：SQL 安全策略（启用）
* (可选) Switch：输出脱敏（启用）
* (可选) LinkButton：查看审计与风险（跳转审计页）

---

## Frame 4：Warnings & Fix Drawer（强烈建议补齐）

* DrawerHeader：Warnings（N）
* WarningItem（repeat）

  * Title：`文档库需要更新`
  * Severity：Warning / Error（Error 阻断发布）
  * LocationLink：定位到模块（例如“知识源”）
  * FixActions：

    * Button：一键同步
    * Button：忽略（仅对 Warning）
* DrawerFooter

  * Button：全部修复（可选）
  * Button：关闭

---

## 你这页里我之前提的“治理”到底指什么（避免误解）

这里的“治理”不是泛泛的“数据治理”，而是 **“智能体可控可运营”治理**，落到你页面上就是 5 类东西：

1. **版本治理**：Draft/Canary/Stable、灰度比例、回滚、Diff、变更说明
2. **运行治理**：耗时/扫描行数/超时重试/成本与 token、稳定性指标（P95/成功率）
3. **权限治理**：谁能用、谁能加 SQLRunner、谁能发布、谁能看管理员区
4. **安全治理**：SQL 安全策略、敏感字段拦截、脱敏、注入风险提示、Guard 绑定
5. **知识治理**：知识源版本、过期提醒、强一致性校验（过期阻断发布）

这 5 类治理，正好对应你 UI 的：VersionStrip / Runtime Guardrails / Tools 权限 / 安全策略 / Knowledge Sync。

