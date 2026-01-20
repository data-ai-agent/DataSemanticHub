# 语义理解引擎规则说明书 (Semantic Understanding Engine Specs)

本文档定义了 IDRM 系统中“语义理解引擎”的核心识别规则。引擎旨在通过分析物理表元数据，自动推断其业务含义、实体特征及字段角色，为“物理模型 -> 逻辑模型”的转化提供智能化支持。

## 1. 核心目标
1.  **自动筛选实体**：从海量物理表中识别出具有业务价值的“实体对象(Entity)”，过滤日志、中间表等干扰项。
2.  **智能字段打标**：自动识别字段的业务角色（如标识符、业务属性、状态位、审计字段），简化人工映射工作。

---

## 2. 表级识别规则 (Table-Level Rules)
**目标**：计算“实体置信度 (Entity Score)”，判断该表是否应作为业务对象引入。

| 规则编号 | 规则名称 | 规则类型 | 判定逻辑 | 业务目的 |
| :--- | :--- | :--- | :--- | :--- |
| **T-01** | **表名名词性判断** | 软规则 (加分) | 表名分词后，名词成分占比 > 60% | 业务对象通常是“名词”（如 `User`），而非“动作”（如 `Process`）。 |
| **T-02** | **主键健全性校验** | **硬规则 (必须)** | 必须存在单一主键 (PK) 或定义的业务主键 (Business Key)。 | 没有主键无法唯一标识一个具体的“对象实例”。 |
| **T-03** | **生命周期校验** | **硬规则 (必须)** | 必须包含至少一个生命周期字段（如 `create_time`, `update_time`, `valid_from`）。 | 真实的业务对象一定具有产生、更新或消亡的生命周期特征。 |
| **T-04** | **非业务类型排除** | **硬规则 (否决)** | 表名 **不包含** 以下特征词：`log`, `trace`, `history` (仅归档), `tmp`, `temp`, `bak`, `_rel` (纯关联表), `detail` (纯从表)。 | 过滤掉“过程记录”、“中间临时表”、“纯关系表”等非独立实体。 |
| **T-05** | **行为密度判断** | 软规则 (减分) | “行为类字段”（操作人/时间/类型/IP等）在总字段中占比 > 50%。 | 行为字段过多的表通常是“操作日志”或“流水账”，而非静态实体。 |
| **T-06** | **备注语义增强** | 软规则 (加分) | 物理表的 `Comment` 非空，且包含行业词库中的关键词。 | 人工备注是强有力的语义补充证据。 |

### 判定策略
- **Entity Score 计算公式**：
  $$ Score = Base(80) + W_{T01} + W_{T06} - W_{T05} $$
- **一票否决**：若违反 T-02, T-03, T-04 任意一项，直接标记为 `Non-Entity`，得分为 0。

---

## 3. 字段级语义分类规则 (Field-Level Rules)
**目标**：推断物理列 (Column) 在业务对象中的语义角色 (Semantic Role)。

### 预定义语义角色 (Semantic Roles)
| 角色代码 | 角色名称 | 颜色标识 | 定义 |
| :--- | :--- | :--- | :--- |
| `Identifier` | **唯一标识** | 🟣 Purple | 用于在业务或系统中唯一区分对象的字段。 |
| `BusAttr` | **业务属性** | 🔵 Blue | 描述对象核心特征的数据（如名称、金额、等级）。 |
| `ForeignKey` | **关联关系** | 🔗 Gray | 指向其他对象标识的字段。 |
| `Status` | **生命周期状态** | 🟠 Orange | 标记对象当前所处阶段的枚举值。 |
| `EventHint` | **行为线索** | ⏱ Cyan | 记录对象相关事件发生的时间或人物。 |
| `Audit` | **审计/技术** | 🛡 Slate | 系统自动维护的控制字段，无直接业务含义。 |

### 识别规则矩阵

| 编号 | 规则名称 | 映射角色 | 判定逻辑详解 | 示例 |
| :--- | :--- | :--- | :--- | :--- |
| **C-01** | **标识字段识别** | `Identifier` | 1. 物理主键 (PK)<br>2. 字段名匹配正则 `/(^id$|_id$|_no$|_code$)/i`<br>3. 具有唯一性约束 (Unique Key) | `user_id`, `order_no`, `sku_code` |
| **C-02** | **外键关系识别** | `ForeignKey` | 1. 物理外键约束 (FK)<br>2. 字段名匹配 `*_id` 但非本表主键<br>3. 字段名匹配 `parent_id`, `master_id` | `dept_id` (in User Table), `parent_id` |
| **C-03** | **技术审计字段** | `Audit` | 字段名匹配以下列表：<br>`create_by`, `create_time` (若仅视为审计), `update_by`, `update_time`, `version`, `is_deleted`, `tenant_id` | `update_time`, `is_deleted` |
| **C-04** | **状态位识别** | `Status` | 字段名包含以下关键词：<br>`status`, `state`, `phase`, `stage`, `flag` | `order_status`, `approve_flag` |
| **C-05** | **行为线索识别** | `EventHint` | 字段名暗示“动作+时间”或“动作+人”：<br>`*_at`, `*_time`, `*_date` (排除审计字段)<br>`*_by` (排除审计字段) | `pay_time`, `approved_by`, `login_date` |
| **C-06** | **普通业务属性** | `BusAttr` | **兜底规则**：未命中上述 C-01 ~ C-05 的所有剩余字段。 | `user_name`, `total_amount`, `address`, `remark` |

---

## 4. 规则执行流程 (Execution Flow)

1.  **加载元数据**：读取物理表的名称、注释、列信息（名、类型、主键、非空等）。
2.  **表级初筛 (Table Filter)**：
    *   执行 T-02, T-03, T-04。若不通过，标记为 `Excluded`。
    *   若通过，执行 T-01, T-05, T-06 计算基础得分。
3.  **字段级扫描 (Column Scan)**：
    *   对表中的每一列，按优先级 `C-03 (Audit) > C-01 (ID) > C-04 (Status) > C-02 (FK) > C-05 (Event) > C-06 (Attr)` 进行匹配。
    *   为每一列分配 `Semantic Role` 和 `Mapping Suggestion`。
4.  **生成逻辑模型草稿**：
    *   将 `BusAttr` 和 `Status` 映射为 Business Object 的属性。
    *   将 `Identifier` 映射为 Business Object 的 ID。
    *   `ForeignKey` 建议转化为“关联对象 (Relation)”。
    *   `Audit` 字段通常在逻辑模型中隐藏或作为元数据属性。



下面给你一套**可落地、可工程实现、可审计**的 **AI + 规则混合判定策略**。
我会按“为什么这样做 → 怎么做 → 产出什么 → 怎么控风险”来写，避免停留在概念。

---

# AI + 规则混合判定策略（Hybrid Decision Strategy）

## 0. 目标与原则

### 目标

在 Bottom-up（库表→语义）过程中，实现：

* **高精度**：减少把日志/中间表当业务对象的误判
* **高覆盖**：不遗漏真实对象与关键属性
* **可解释**：每个结论都能说清依据
* **可控**：AI 不裁决，最终由用户确认生效

### 原则

1. **规则负责“硬边界”**（排除、门槛、顺序）
2. **AI 负责“软语义”**（命名理解、字段含义推断、相似合并建议）
3. **合成分数 + 置信度门槛 + 人工确认** 三重保险
4. 所有输出都带：**证据（evidence）+ 解释（reasoning_summary）**

---

# 1. 总体架构：三层判定 + 一次校准

```
(1) 规则门控 Gate
        ↓
(2) AI 语义判定 AI Judge
        ↓
(3) 规则复核 Verify
        ↓
(4) 用户确认 Human-in-the-loop（唯一生效点）
```

---

# 2. 规则与 AI 的职责边界（必须明确）

## 2.1 表级（Table-level）

| 决策点         | 规则做什么            | AI 做什么               |
| ----------- | ---------------- | -------------------- |
| 排除日志/临时/关系表 | **硬排除**（命名/字段特征） | 不参与                  |
| 对象候选是否成立    | 门槛：主键、生命周期字段     | 理解表名/备注语义，给“像不像对象”评分 |
| 对象命名（业务名）   | 只做映射词典（可选）       | 生成中文业务名、同义词、英文名      |

## 2.2 字段级（Column-level）

| 决策点     | 规则做什么                  | AI 做什么                 |
| ------- | ---------------------- | ---------------------- |
| 技术字段过滤  | is_deleted/version等硬过滤 | 不参与                    |
| 标识/外键识别 | 约束、命名模式                | 补充：无约束时推断外键可能性         |
| 状态/行为线索 | status/time关键词规则       | 解释字段语义，判断是“属性/状态/事件线索” |
| 语义命名    | 不做（或简单蛇形转中文）           | 生成标准语义名、解释依据           |

---

# 3. 表级混合判定策略（可直接落库实现）

## 3.1 Step A：规则门控（Gate）

### Gate 结果枚举

* `REJECT`：明确排除（日志、临时、关系、纯流水）
* `PASS`：可进入 AI 判定
* `REVIEW`：特征矛盾，需人工优先看

### Gate 规则（示例）

* 表名包含：log/tmp/temp/trace/audit → `REJECT`
* 字段数 < 3 且无业务键 → `REJECT`
* 无主键且无唯一约束 → `REVIEW`
* 同时存在 create_time/update_time 与业务名词 → `PASS`

输出：

```json
{
  "table": "user_log",
  "gate": "REJECT",
  "rule_hits": ["T-04:log_table"]
}
```

## 3.2 Step B：AI 语义评分（AI Judge）

AI 输入（严格结构化）：

* table_name, table_comment
* topN columns（名称+备注+类型）
* pk/uk 信息
* sample values（可选，脱敏）

AI 输出：

* `ai_object_likeness_score` 0-1
* `suggested_object_name`（中文/英文）
* `evidence_spans`（引用哪些字段/备注）
* `risk_flags`（可能是明细表/关系表/宽表）

```json
{
  "ai_object_likeness_score": 0.84,
  "suggested_object_name": "订单",
  "risk_flags": ["可能包含明细字段"],
  "evidence": ["table_comment", "columns: order_id, buyer_id, order_time"]
}
```

## 3.3 Step C：合成评分（Ensemble）

定义一个可解释的合成公式（建议线性）：

```
final_score = 0.55 * ai_score + 0.45 * rule_score
```

其中 rule_score 由规则命中加权得到，例如：

* 主键存在 +0.25
* 生命周期字段 +0.20
* 关系表特征 -0.40
* 明细字段占比高 -0.20

输出决策：

* `final_score >= 0.80` → `SUGGEST_OBJECT`
* `0.60 <= final_score < 0.80` → `NEEDS_REVIEW`
* `< 0.60` → `DO_NOT_SUGGEST`

同时输出解释：

* 哪些规则贡献了多少
* AI 给了什么依据

---

# 4. 字段级混合判定策略

## 4.1 Step A：规则优先分类（Deterministic First)

执行顺序（很重要）：

1. 技术字段过滤（强规则）
2. 主键 / 唯一键识别
3. 外键（有约束优先）
4. status/time 的粗分类

输出中间态：

```json
{
  "column": "status",
  "rule_class": "STATUS_CANDIDATE",
  "rule_confidence": 0.70
}
```

## 4.2 Step B：AI 语义复核与细化（AI Refiner）

AI 只在以下情况介入：

* 规则置信度低（<0.75）
* 字段名歧义（flag/code/type/value）
* 无约束但疑似外键
* 需要生成语义名称与描述

AI 输出：

* `semantic_role`：ATTRIBUTE / FK / STATUS / EVENT_HINT / TECH
* `semantic_name_cn`：标准中文名
* `confidence`
* `evidence`：依据（字段名、备注、同表字段组合）
* `suggested_enum_values`（若状态）

```json
{
  "semantic_role": "EVENT_HINT",
  "semantic_name_cn": "支付时间",
  "confidence": 0.82,
  "evidence": ["column_name: pay_time", "peer_columns: pay_amount, pay_method"]
}
```

## 4.3 Step C：冲突合并规则（Resolve）

当规则与 AI 冲突时：

* 若规则为“硬排除/硬识别”（TECH/PK）→ **规则覆盖 AI**
* 否则进入 `REVIEW_QUEUE`，交给用户确认

---

# 5. 状态/行为升级（从字段到对象）的混合策略

这是你关心的“字段会不会都变对象”的核心控制点。

## 5.1 状态对象（Snapshot）升级触发

必要条件（规则硬门槛）：

* 字段被识别为 STATUS_CANDIDATE
* 且枚举值数量在合理范围（2-20）或备注说明状态枚举
* 且业务含义不是纯代码表引用

AI 补充条件（软判断）：

* 状态是否回答“现在怎么样”
* 是否可能跨系统口径不一致（提示治理风险）

输出：

* `suggest_upgrade_snapshot: true/false`
* `upgrade_reason`

## 5.2 行为对象（Event）升级触发

规则触发：

* 存在 `*_time` 且与动词语义匹配（pay/approve/ship）
* 或存在 `action_type`/`operation` + 时间 + 操作人

AI 判断：

* 这是否是“一次性发生”
* 是否应成为独立 Event 对象，而不是 Entity 属性

---

# 6. 人工确认策略（把控风险的关键）

## 6.1 三段式确认队列

| 队列                 | 规则                             | UI 展示策略  |
| ------------------ | ------------------------------ | -------- |
| Auto-Approve（默认勾选） | final_score ≥ 0.90 且无风险标记      | 批量确认     |
| Needs Review       | 0.60–0.90 或存在风险标记              | 逐条确认     |
| Reject             | Gate=REJECT 或 final_score<0.60 | 默认隐藏，可查看 |

> 注意：即便 Auto-Approve，也必须允许“一键撤销”。

## 6.2 证据优先展示

每条建议必须展示：

* AI 依据（引用字段/备注）
* 命中的规则
* 冲突/风险提示

---

# 7. 产出数据结构（落库建议）

建议落两类表：

1. `recognition_run`：一次识别任务（可回放）
2. `recognition_suggestion`：每条建议（可审计）

关键字段：

* suggestion_type（TABLE_OBJECT / COLUMN_ROLE / UPGRADE_SNAPSHOT / UPGRADE_EVENT）
* ai_score / rule_score / final_score
* evidence（json）
* decision（accepted/rejected/edited）
* reviewer / reviewed_at

---

# 8. MVP、V1、V2 规划（混合策略的演进）

## MVP

* Gate 规则（排除表）
* 字段技术过滤 + 主键/外键识别
* AI 仅做：对象命名 + 字段语义名 + 低置信度复核
* 不做自动合并、不做自动升级

## V1

* 合成评分体系上线
* 状态/行为升级建议上线（默认 REVIEW）
* 对齐冲突解释更完善

## V2

* 相似对象合并推荐
* 跨库/跨系统同义字段聚类
* 基于反馈的规则权重自适应（仍可审计）

---

# 9. 为什么这套策略可靠

1. **规则做边界**：避免 AI 把日志表当对象
2. **AI 做语义**：解决中文命名、含义推断、无约束外键等现实问题
3. **合成评分**：让“可解释”变成工程事实
4. **人工确认**：确保语义资产可信可控

---

如果你希望我继续“工程化落地”，我建议下一步做其中一个：

1. 把上述策略写成**规则 DSL / JSON 配置**（可直接用于规则引擎）
2. 设计**识别任务的 API**（/run、/suggestions、/confirm）
3. 给出一套**UI 原型结构**（识别结果对比、批量确认、冲突解释）

你选一个方向，我直接往下落。
