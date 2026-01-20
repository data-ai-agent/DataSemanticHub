

# Figma Frame 清单

## 逻辑视图 × 语义理解（同页模式）v2.4

---

## A. 逻辑视图列表页（List）

### Frame A1：Logic View List — Default

**用途**：表级入口、治理调度入口

**结构**

1. **Page Header**

   * 标题：逻辑视图
   * 全局筛选：数据源 / 域 / 负责人 / 更新时间
   * 搜索框：表名/别名/描述
2. **KPI Strip（可选，推荐）**

   * 待语义理解表数
   * 待确认字段数
   * 高风险字段数
3. **Table List**

   * 列（建议最终列）：

     * 表名（含别名/描述）
     * 表语义类型（主体/事件/关系/维度，badge）
     * 语义治理进度（已确认字段/总字段 + progress bar）
     * 质量概览（失败字段数/严重级别）
     * 安全等级（L0-L4）
     * 操作 CTA（主按钮）

**交互状态（组件变体）**

* CTA 文案变体：

  * `开始语义理解`（未开始）
  * `继续语义理解`（进行中）
  * `查看语义结果`（完成）
* 行点击：进入详情页（默认浏览模式）
* CTA 点击：进入详情页并自动切换到语义理解模式

---

### Frame A2：Logic View List — Filter Panel（抽屉/侧栏）

**用途**：高级筛选

**结构**

* 状态筛选：未开始/待确认/已完成/阻塞
* 风险筛选：高/中/低（来自 signals flags 聚合）
* 质量筛选：失败字段 > N
* 安全筛选：等级 >= Lx

---

## B. 逻辑视图详情页（Detail）— 浏览模式

### Frame B1：Logic View Detail — Browse Mode（默认）

**用途**：表上下文阅读、结构与概览

**结构**

1. **Top Bar（表上下文条）**

   * 表名 + 数据源 + 所属域
   * 表语义类型 badge（只读）
   * 概览：字段语义进度 / 质量概览 / 安全等级（只读）
   * 主 CTA：`开始语义理解` / `继续语义理解`
   * 次 CTA：`查看语义版本`（若有）
2. **Tabs（建议）**

   * 字段（默认）
   * 表关系（可选）
   * 质量概览（只读入口，可选）
   * 安全概览（只读入口，可选）
3. **Main Layout：2 列**

   * **Left Panel：字段列表**

     * 字段名、类型、描述
     * 语义状态小标（只读：未开始/待确认/已确认）
     * 支持搜索/筛选（按状态）
   * **Right Panel：字段详情（只读）**

     * 字段基础信息：类型、nullable、comment
     * 示例值/采样（现有的保留）
     * 基础统计（现有的保留）
       -（可选）语义摘要（只读）：当前 Term/Role/Tags

**关键交互**

* 点击字段行：右侧切换字段上下文
* 点击主 CTA：切换到语义理解模式（同页切换）

---

## C. 逻辑视图详情页（Detail）— 语义理解模式（核心）

### Frame C1：Logic View Detail — Semantic Mode（主工作区）

**用途**：字段语义裁决（Decision）唯一发生地

**结构**

1. **Top Bar（治理状态条，替换/增强 B1 顶部信息）**

   * 左：表名 + 数据源 + 表语义类型 badge
   * 中：治理进度（已确认/总数）、阻塞数（高风险/未确认关键字段）
   * 右：

     * 主 CTA：`完成并返回列表` 或 `进入候选业务对象`（满足条件时）
     * 次 CTA：`退出语义理解模式`
2. **3 列主布局（固定）**

   * **Column 1：治理字段列表（必须）**

     * 列内容：

       * 字段名
       * 状态（UNANALYZED/SUGGESTED/PARTIALLY_DECIDED/DECIDED）
       * 风险旗标（HIGH_NULL/LOW_UNIQUENESS/ENUM_NOT_STABLE/…）
       * 置信度（可选：数值或条形）
     * 顶部工具条：

       * 搜索字段
       * 状态过滤
       * 风险过滤
       * 批量选择（checkbox）
   * **Column 2：字段上下文（证据区，只读）**

     * Field Summary：名称/类型/注释/nullable
     * Sample Values：TopN 值
     * Profile/Signals 卡片（来自 SEMANTIC_MIN）

       * null_ratio、distinct_count、top3_concentration、parse_rate…
       * risk flags list（只读）
         -（可选）关联上下文字段：同表相邻字段/同名字段提示
   * **Column 3：语义裁决面板（唯一可编辑区）**

     * Suggestion Card（AI+规则）

       * 建议 Term/Role/Tags（带 confidence）
       * Evidence（引用 signals + 名称匹配等）
     * Decision Form（人工裁决）

       * Term（单选，来自术语库，可搜索）
       * Role（单选）
       * Tags（多选，来自标签库）
       * Domain（只读或轻微调整，视你们规划）
       * 备注（可选）
     * Actions

       * `接受建议`
       * `修改并接受`
       * `拒绝`
     * Audit Mini

       * decision_by / decision_at（保存后显示）
3. **Footer（可选）**

   * 快捷键提示：上下字段、接受、拒绝等

**关键交互（必须落在原型里）**

* 字段行点击：中列+右列联动更新
* 接受/拒绝后：字段状态变化，自动跳到下一个“待确认”字段（可配置）
* 批量操作（若你们 v2.4 要做）：批量设置 Role/Tags（建议只支持低风险维度，避免误操作）
* 退出语义模式：保留当前字段选择状态

---

### Frame C2：Semantic Mode — Bulk Action Drawer（可选但建议）

**用途**：批量确认效率

**结构**

* 已选字段计数
* 可批量项：

  * Role（单选）
  * Tags（多选）
* 风险提示：若包含 HIGH 风险字段，弹出二次确认

---

### Frame C3：Semantic Mode — Explain Drawer（v3.0 Agent 预埋，可先占位）

**用途**：展示“为什么这么建议”的解释与证据（不改变裁决逻辑）

**结构**

* 建议来源：规则命中/信号命中/同名字段联动
* 关键证据：signals 与样本
* 风险点：为何降置信度

---

## D. 字段语义理解工作台（独立菜单入口，可选但你们建议保留）

### Frame D1：Field Semantic Workbench — Inbox

**用途**：跨表待办与调度，不替代表上下文

**结构**

1. **Header**

   * 标题：字段语义理解
   * Run 选择：最近一次 / 指定 run
2. **Filters**

   * 状态：待确认/高风险/已完成
   * 风险旗标：HIGH_NULL/LOW_UNIQUENESS/…
   * 表语义类型：主体/事件/…
3. **Cross-table Field List**

   * 列：

     * 字段名
     * 所属表
     * 表语义类型
     * 风险
     * 状态
     * 操作：`去处理`
4. **右侧预览（可选）**

   * 选中字段的 signals 摘要（只读）

**关键交互**

* `去处理`：跳转到 **逻辑视图详情页 C1**，自动进入语义理解模式并高亮字段
* 返回工作台：可有 `处理完成并返回` 快捷按钮

---

## E. 组件复用清单（方便设计系统/研发拆组件）

### 必须抽成组件（Component）

* `GovernanceTopBar`（B1/C1 共用，文案/状态不同）
* `FieldListItem`（浏览/语义模式共用，语义模式多状态/风险）
* `SignalsCard`（SEMANTIC_MIN 输出展示）
* `SuggestionCard`（AI/规则建议）
* `DecisionForm`（Term/Role/Tags）
* `RiskFlagBadge`（统一枚举样式）
* `ProgressPill/Bar`（进度展示）

---

## F. 状态与跳转（给设计师必须画在原型里的“连线”）

1. **A1 CTA → B1 并自动切换到 C1**
2. **B1 CTA → C1（同页模式切换）**
3. **D1 去处理 → C1（定位字段）**
4. **C1 完成 →（可选）候选业务对象 / 返回 A1**

---

## 你拿这份清单怎么用（建议落地顺序）

1. 先画 **A1（列表）+ B1（详情浏览）**：复用你们现状
2. 再画 **C1（语义理解模式）**：新增右侧裁决面板 + 左侧状态化列表 + signals 卡
3. 最后补 **D1（工作台）**：如果要独立菜单入口

---



## 必须补充的 3 个 Figma Frame / 组件（强烈建议）

下面是**你现在就应该补进 Figma 的内容**，补完后这套设计就“完整且工程可实现”。

---

## 【补充 Frame 1】

### Frame C1-Addon：语义理解辅助检测 · 状态与入口（必补）

**位置**：
👉 逻辑视图详情页 · 语义理解模式 · Top Bar 右侧或二级工具条

**组件形态**（单行信息条）：

```text
语义理解辅助检测
[ 开启 ✓ ]  模板：SEMANTIC_MIN
采样：1%   最近计算：10 分钟前
[ 重新计算 ]
```

**交互状态（Component Variants）**

* 开启 / 关闭
* 计算中（spinner + 文案）
* 计算失败（error icon + retry）

**设计原则**

* 默认开启
* 关闭 ≠ 禁止语义理解（只是不显示 signals）
* 这是“辅助信息”，不是治理配置

---

## 【补充 Frame 2】

### Frame C1-Drawer：质量信号详情（Signals Detail Drawer）

**触发方式**：

* 点击 Signals Card 的「查看详情」
* 或点击 Risk Flag

**内容结构**：

```text
字段：order_status

【基础统计】
- Row Count
- Null Ratio
- Distinct Count / Ratio

【分布】
- TopK Values（表格/条形）

【解析质量】
- Type Parse Rate

【风险判定】
- ENUM_NOT_STABLE
- 触发原因说明
```

**说明**

* 只读
* 解释“为什么有这个风险”
* 非质量治理页面，不出现 Pass/Fail

---

## 【补充 Frame 3】

### Frame C1-Popover：辅助检测设置（轻量，不是规则配置）

**触发方式**：

* 点击「模板：SEMANTIC_MIN」或设置 icon

**内容（非常克制）**：

```text
语义理解辅助检测设置

模板：SEMANTIC_MIN（内置，不可编辑）
采样比例：1%（下拉：0.5% / 1% / 5%）
最大行数：200,000（只读）
TTL：24h（只读）

[ 应用 ]
```

**注意**

* ❌ 不允许编辑规则
* ❌ 不允许自定义阈值
* 这是**运行参数，不是治理策略**

---

## 四、最终：Figma 中应出现的完整结构（汇总）

在 **语义理解模式（C1）** 中，Figma 至少应包含：

1. ✅ Signals Card（字段级，只读）
2. ✅ Risk Flags（字段列表与详情）
3. ➕ 辅助检测状态条（开启/模板/采样/刷新）
4. ➕ Signals Detail Drawer（解释证据）
5. ➕ 轻量设置 Popover（运行参数）

补完这 5 个，**质量信号就从“概念支持”变成了“产品级能力”**。

---



