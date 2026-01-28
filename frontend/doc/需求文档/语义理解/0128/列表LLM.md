# 逻辑视图列表页（Semantic Logical View List）

## 改版后 · Figma 信息架构（组件级 · LLM 可理解版）

> 页面目标：
> **作为语义治理的调度入口，清晰表达每个逻辑视图所处的语义阶段，并给出唯一下一步动作。**

---

## 一、页面顶层 Frame 定义

```text
Frame: LogicalView_List_v2
Description:
语义治理入口页面，用于管理逻辑视图的语义理解进度，
从字段语义理解 → 候选业务对象 → 业务对象建模。
```

---

## 二、整体页面结构（Frame Tree）

```text
LogicalView_List_v2
├─ PageHeader
├─ FilterBar
├─ ListSummaryBar
├─ LogicalViewTable
│  ├─ TableHeader
│  ├─ TableRow (repeat)
│  │   └─ RowAction
└─ BulkActionBar (conditional)
```

---

## 三、PageHeader（页面头部）

```text
Frame: PageHeader
Components:
- Title
- Subtitle
- PrimaryAction
- SecondaryAction
```

### 组件说明

```text
Title:
文本：逻辑视图

Subtitle:
文本：语义治理入口 · 从字段语义理解到业务对象建模

PrimaryAction:
按钮：批量开始字段语义理解

SecondaryAction:
按钮：语义治理指南 / 帮助
```

> 【语义说明】
> Header 明确告诉用户：
> **这是“语义治理工作台”，不是普通数据表列表。**

---

## 四、FilterBar（治理视角筛选区）

```text
Frame: FilterBar
Components:
- SearchInput
- StatusFilter
- RiskFilter
- DatasourceFilter (optional)
```

### 筛选项定义（强制）

```text
StatusFilter（语义建模状态）:
Enum:
- 未开始语义理解
- 字段语义待确认
- 语义建模进行中
- 可进入对象建模
- 已完成

RiskFilter:
Enum:
- Gate 未通过
- 高风险
- 无风险
```

> 【重要约束】
> 所有筛选项必须围绕 **“语义治理进度”**，
> 不允许出现“是否 Review / 是否检测”这类技术向筛选。

---

## 五、ListSummaryBar（治理概览条）

```text
Frame: ListSummaryBar
Components:
- StatusCountItem (repeat)
```

### 展示示例

```text
未开始 12 | 待确认 8 | 建模中 6 | 可建模 4 | 已完成 6
```

> 【语义说明】
> 用于让用户快速感知当前治理瓶颈集中在哪个阶段。

---

## 六、LogicalViewTable（核心表格）

### 6.1 TableHeader（表头列定义）

```text
Columns:
- SelectCheckbox
- LogicalViewName
- Datasource
- RowCount
- SemanticStatus (核心)
- FieldProgress (核心)
- GateStatus
- RiskCount
- UpdatedAt
- Action
```

---

### 6.2 核心列语义定义（必须给大模型）

#### SemanticStatus（语义建模状态）

```text
SemanticStatus:
类型：状态枚举（Badge / Tag）

Enum:
- 未开始语义理解
- 字段语义待确认
- 语义建模进行中
- 可进入对象建模
- 已完成
```

> 【状态含义约束】

* 这是“治理阶段状态”，不是系统运行状态
* 状态由系统自动判定，不可手动修改

---

#### FieldProgress（字段进度）

```text
FieldProgress:
格式：X / Y

说明：
X = 已确认字段数
Y = 字段总数
```

Hover 展示：

```text
已确认：X
待确认：Y-X
```

> 【语义说明】
> 用于快速判断当前逻辑视图是否卡在字段层面。

---

### 6.3 TableRow（单行逻辑视图）

```text
TableRow
├─ SelectCheckbox
├─ LogicalViewName
│   ├─ PhysicalName
│   └─ BusinessName
├─ Datasource
├─ RowCount
├─ SemanticStatus
├─ FieldProgress
├─ GateStatus
├─ RiskCount
├─ UpdatedAt
└─ RowAction
```

---

## 七、RowAction（行级 CTA 规则 · 极其重要）

```text
Component: RowAction
Rule:
根据 SemanticStatus 显示唯一 CTA
```

### 状态 × CTA 映射（强制）

```text
IF SemanticStatus == 未开始语义理解
→ CTA: 开始字段语义理解

IF SemanticStatus == 字段语义待确认
→ CTA: 继续字段语义确认

IF SemanticStatus == 语义建模进行中
→ CTA: 查看语义进展

IF SemanticStatus == 可进入对象建模
→ CTA: 进入对象建模

IF SemanticStatus == 已完成
→ CTA: 查看语义结果
```

> 【重要约束】

* 每行只允许 **一个主 CTA**
* 不允许出现多个操作按钮
* CTA 代表“系统建议的唯一下一步动作”

---

## 八、BulkActionBar（批量操作栏）

```text
Frame: BulkActionBar
Condition:
当选中 ≥ 1 行时显示

Components:
- SelectedCount
- BulkPrimaryAction
```

### 行为约束

```text
BulkPrimaryAction:
仅支持“同 SemanticStatus”批量操作
```

示例：

```text
已选 3 个逻辑视图
[ 批量开始字段语义理解 ]
```

---

## 九、页面级语义约束（给大模型的关键规则）

```text
Rules:
1. 逻辑视图列表页不展示字段详情
2. 不在列表页展示候选业务对象结构
3. 所有状态围绕“语义治理阶段”
4. 所有 CTA 必须与状态强绑定
5. 页面目标是“调度下一步治理动作”
```

---

## 十、可以直接给大模型的一段总结 Prompt

> 本页面是逻辑视图的语义治理入口列表页。
> 页面需围绕“语义治理阶段”组织信息，明确每个逻辑视图当前所处阶段，并为每个阶段提供唯一下一步 CTA。
> 列表页不展示字段或业务对象细节，仅用于治理调度与跳转。

---

## 十一、你现在已经具备的“完整闭环”

到这里，你已经有了：

* ✅ 逻辑视图列表（治理调度）
* ✅ 字段语义理解（解释字段）
* ✅ 候选业务对象视角（解释对象）
* ✅ 业务对象建模（最终裁决）

**这是一个非常完整、非常少见的语义治理产品骨架。**

