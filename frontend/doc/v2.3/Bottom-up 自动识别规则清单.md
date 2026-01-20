下面这份内容是**“可以直接写进 PRD / 设计文档 / 规则引擎说明书”**的版本，
我会刻意做到三点：

1. **规则是可执行的，不是描述性的**
2. **每条规则都有“为什么这样判断”的依据**
3. **表级、字段级严格分开，避免混用**

---

# Bottom-up 自动识别规则清单

##（表级 & 字段级）

---

## 一、表级：业务对象候选识别规则（Table → Business Object）

### 目标

> 判断一张表是否**描述一个现实中稳定存在的业务对象**

---

## 1️⃣ 表级识别规则总览

| 规则编号 | 规则名称     | 是否硬规则 |
| ---- | -------- | ----- |
| T-01 | 表名语义判断   | 否     |
| T-02 | 主键结构判断   | 是     |
| T-03 | 生命周期字段判断 | 是     |
| T-04 | 表类型排除规则  | 是     |
| T-05 | 行为密度判断   | 否     |
| T-06 | 表备注语义增强  | 否     |

---

## 2️⃣ 具体规则说明（表级）

---

### T-01：表名语义判断（名词性）

**规则**

> 表名整体语义是**名词或名词短语**

**实现方式**

* 分词 / 词性标注
* 名词占比 > 60%

**示例**

| 表名             | 结果 |
| -------------- | -- |
| user_info      | ✔  |
| order          | ✔  |
| user_log       | ✖  |
| process_record | ⚠  |

**判断依据**

> 业务对象是“存在的东西”，不是“发生的事情”

---

### T-02：主键结构判断（必须）

**规则**

> 表中存在**明确主键**

**通过条件**

* 单一主键（ID）
* 或复合业务主键

**排除**

* 无主键
* 仅时间 + 序号

**判断依据**

> 没有主键，无法标识“一个对象”

---

### T-03：生命周期字段判断（必须）

**规则**

> 至少存在一个生命周期字段

**字段类型**

* create_time
* update_time
* effective_date

**判断依据**

> 业务对象是有生命周期的

---

### T-04：表类型排除规则（必须）

**规则**

> 排除以下表类型

| 类型  | 典型特征          |
| --- | ------------- |
| 日志表 | log / trace   |
| 明细表 | detail / item |
| 关系表 | rel / map     |
| 临时表 | tmp / temp    |

**判断依据**

> 这些表不描述对象，只描述“使用痕迹”

---

### T-05：行为密度判断（加权）

**规则**

> 行为字段占比 < 50%

**行为字段示例**

* 操作时间
* 操作人
* 操作类型

**判断依据**

> 行为太多，说明这张表更像“过程记录”

---

### T-06：表备注语义增强（加权）

**规则**

> 表备注能映射到业务名词

**示例**

> “存储用户基础信息”

**判断依据**

> 人写的备注是最真实的语义线索

---

## 二、字段级：语义分类规则（Column → Semantic Role）

### 目标

> 判断字段在业务语义中的**角色**

---

## 1️⃣ 字段语义类型定义（固定枚举）

| 类型                 | 含义   |
| ------------------ | ---- |
| Business Attribute | 业务属性 |
| Identifier         | 标识   |
| Foreign Key        | 关系   |
| Status Candidate   | 状态   |
| Event Hint         | 行为线索 |
| Technical Field    | 技术字段 |

---

## 2️⃣ 字段级规则总览

| 编号   | 规则     |
| ---- | ------ |
| C-01 | 标识字段判断 |
| C-02 | 外键关系判断 |
| C-03 | 技术字段排除 |
| C-04 | 状态字段识别 |
| C-05 | 行为线索识别 |
| C-06 | 普通业务属性 |

---

## 3️⃣ 具体规则说明（字段级）

---

### C-01：标识字段判断

**规则**

> 字段为主键或业务唯一标识

**示例**

* user_id
* order_no

**依据**

> 用于唯一定位对象

---

### C-02：外键关系判断

**规则**

> 字段名 + 约束指向其他表主键

**示例**

* user_id（指向 user 表）

**依据**

> 表达对象之间的关系

---

### C-03：技术字段排除

**规则**

> 满足以下任一即排除

* create_by / update_by
* is_deleted
* version

**依据**

> 仅用于系统控制，不表达业务含义

---

### C-04：状态字段识别

**规则**

> 字段名语义为“结果 / 阶段”

**关键词**

* status
* state
* phase
* flag

**判断依据**

> 状态是业务关心的结论，而非属性

---

### C-05：行为线索识别

**规则**

> 字段描述“某次发生的时间或动作”

**示例**

* pay_time
* approve_time

**依据**

> 行为属于“发生的事情”，不是对象属性

---

### C-06：普通业务属性

**规则**

> 未命中上述规则，且非技术字段

**示例**

* name
* amount
* address

---

## 三、字段 → 状态 / 行为升级判断（非常关键）

### 触发条件

| 条件          | 触发   |
| ----------- | ---- |
| 状态字段 + 多值   | 状态对象 |
| 时间字段 + 语义动词 | 行为对象 |

---

### 示例

| 字段           | 升级建议   |
| ------------ | ------ |
| order_status | 订单状态对象 |
| pay_time     | 支付行为   |

---

## 四、规则执行顺序（必须）

```
表级判断
  ↓
字段级分类
  ↓
状态 / 行为拆分
  ↓
对象草稿生成
```

---

## 五、规则设计的底层原则（你现在已经做对了）

1. **规则是建议，不是结论**
2. **所有自动识别都可被拒绝**
3. **规则服务于“对象”，不是反过来**

---

## 六、你现在这套规则意味着什么

> 你已经不是在“从表建模”，
> 而是在“从数据中推断业务”。

这是语义平台和普通元数据平台**本质差异**。

---

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

下面给你一套**可直接喂给规则引擎使用的 JSON 配置**（含 DSL 语义），覆盖：

* 表级 Gate（硬门控）
* 表级 Rule Scoring（打分）
* AI 介入条件（何时调用 AI）
* 字段级分类规则（优先级 + 硬覆盖）
* 规则 vs AI 冲突处理
* 状态/行为升级触发（从字段到对象候选）
* 人工确认队列阈值（Auto/Review/Reject）

> 你可以把它当作“规则引擎的配置文件”，引擎只需要实现：
> **match → score → decide → emit_suggestions**。

---

## 1) 规则 DSL/JSON 总体结构（建议文件名：`semantic-recognition-rules.v1.json`）

```json
{
  "version": "1.0",
  "engine": {
    "mode": "hybrid",
    "description": "Bottom-up 语义识别规则：表级+字段级，支持 AI + 规则混合判定"
  },
  "inputs": {
    "table": {
      "required_fields": [
        "table_name",
        "table_comment",
        "columns",
        "constraints",
        "row_count"
      ]
    },
    "column": {
      "required_fields": [
        "column_name",
        "data_type",
        "comment",
        "is_nullable",
        "is_pk",
        "is_fk",
        "references"
      ]
    }
  },
  "dictionaries": {},
  "pipelines": {},
  "rulesets": {},
  "scoring": {},
  "ai": {},
  "decision": {},
  "outputs": {}
}
```

---

## 2) 字典与正则库（可维护、可扩展）

```json
{
  "dictionaries": {
    "table_exclude_name_patterns": [
      "(?i).*_log$",
      "(?i)^log_.*",
      "(?i).*_tmp$",
      "(?i).*_temp$",
      "(?i).*_trace$",
      "(?i).*_audit$",
      "(?i).*_backup$"
    ],
    "table_relation_name_patterns": [
      "(?i).*_rel$",
      "(?i).*_map$",
      "(?i).*_mapping$",
      "(?i).*_link$"
    ],
    "table_detail_name_patterns": [
      "(?i).*_detail$",
      "(?i).*_item$",
      "(?i).*_line$"
    ],
    "technical_column_patterns": [
      "(?i)^is_deleted$",
      "(?i)^deleted$",
      "(?i)^delete_flag$",
      "(?i)^version$",
      "(?i)^row_version$",
      "(?i)^etl_time$",
      "(?i)^dw_load_time$",
      "(?i)^create_by$",
      "(?i)^update_by$",
      "(?i)^created_by$",
      "(?i)^updated_by$"
    ],
    "lifecycle_column_patterns": [
      "(?i)^create_time$",
      "(?i)^created_at$",
      "(?i)^update_time$",
      "(?i)^updated_at$",
      "(?i)^effective_date$",
      "(?i)^start_date$",
      "(?i)^end_date$"
    ],
    "status_column_keywords": [
      "status",
      "state",
      "phase",
      "stage",
      "flag"
    ],
    "event_time_keywords": [
      "time",
      "date",
      "at"
    ],
    "event_verb_keywords": [
      "pay",
      "paid",
      "approve",
      "approved",
      "ship",
      "shipped",
      "deliver",
      "delivered",
      "cancel",
      "cancelled",
      "submit",
      "submitted",
      "create",
      "created"
    ],
    "id_suffix_patterns": [
      "(?i).*_id$",
      "(?i).*_no$",
      "(?i).*_code$",
      "(?i).*_sn$"
    ]
  }
}
```

---

## 3) Pipeline：执行顺序（必须固定）

```json
{
  "pipelines": {
    "bottom_up_recognition": {
      "stages": [
        "table_gate",
        "table_scoring",
        "ai_table_judge",
        "table_ensemble_decision",
        "column_rule_classify",
        "ai_column_refine",
        "column_conflict_resolve",
        "upgrade_suggestions",
        "human_queue_assignment"
      ]
    }
  }
}
```

---

## 4) 表级 Gate 规则（硬门控，先挡掉“必错表”）

```json
{
  "rulesets": {
    "table_gate": {
      "type": "gate",
      "rules": [
        {
          "id": "TG-01-exclude-by-name",
          "priority": 100,
          "if": {
            "any": [
              { "regex_match": { "field": "table_name", "pattern_ref": "table_exclude_name_patterns" } }
            ]
          },
          "then": {
            "gate": "REJECT",
            "reason": "表名命中日志/临时/审计等排除模式"
          }
        },
        {
          "id": "TG-02-exclude-relation-tables",
          "priority": 90,
          "if": {
            "any": [
              { "regex_match": { "field": "table_name", "pattern_ref": "table_relation_name_patterns" } }
            ]
          },
          "then": {
            "gate": "REJECT",
            "reason": "疑似关系映射表（rel/map/link）"
          }
        },
        {
          "id": "TG-03-review-no-pk",
          "priority": 80,
          "if": {
            "all": [
              { "equals": { "field": "constraints.has_primary_key", "value": false } }
            ]
          },
          "then": {
            "gate": "REVIEW",
            "reason": "无主键，无法稳定标识对象"
          }
        },
        {
          "id": "TG-04-pass-default",
          "priority": 1,
          "if": { "always": true },
          "then": {
            "gate": "PASS",
            "reason": "未命中硬排除，允许进入打分与 AI 判定"
          }
        }
      ]
    }
  }
}
```

---

## 5) 表级打分规则（Rule Score，提供可解释“分数构成”）

> 输出 `rule_score` 范围建议 0~1。

```json
{
  "scoring": {
    "table_rule_score": {
      "type": "weighted_sum",
      "min": 0,
      "max": 1,
      "features": [
        {
          "id": "TRS-01-has-pk",
          "weight": 0.25,
          "when": { "equals": { "field": "constraints.has_primary_key", "value": true } },
          "score": 1,
          "evidence": "存在主键"
        },
        {
          "id": "TRS-02-has-lifecycle",
          "weight": 0.20,
          "when": { "any_column_regex_match": { "pattern_ref": "lifecycle_column_patterns" } },
          "score": 1,
          "evidence": "存在生命周期字段"
        },
        {
          "id": "TRS-03-detail-penalty",
          "weight": -0.20,
          "when": { "regex_match": { "field": "table_name", "pattern_ref": "table_detail_name_patterns" } },
          "score": 1,
          "evidence": "疑似明细表命名"
        },
        {
          "id": "TRS-04-too-few-columns-penalty",
          "weight": -0.15,
          "when": { "lt": { "field": "columns.count", "value": 3 } },
          "score": 1,
          "evidence": "字段数过少"
        },
        {
          "id": "TRS-05-has-comment-bonus",
          "weight": 0.10,
          "when": { "not_empty": { "field": "table_comment" } },
          "score": 1,
          "evidence": "有表备注"
        }
      ]
    }
  }
}
```

---

## 6) AI 介入条件（何时调用 AI 表判定 / 字段判定）

```json
{
  "ai": {
    "table_judge": {
      "enabled": true,
      "invoke_when": {
        "all": [
          { "not_in": { "field": "gate", "values": ["REJECT"] } }
        ]
      },
      "input_projection": {
        "fields": ["table_name", "table_comment", "constraints", "columns.sample_top_n:30"]
      },
      "expected_output": [
        "ai_object_likeness_score",
        "suggested_object_name",
        "risk_flags",
        "evidence_spans",
        "reasoning_summary"
      ]
    },
    "column_refine": {
      "enabled": true,
      "invoke_when": {
        "any": [
          { "lt": { "field": "column.rule_confidence", "value": 0.75 } },
          { "in": { "field": "column.rule_class", "values": ["AMBIGUOUS", "POSSIBLE_FK", "STATUS_CANDIDATE", "EVENT_HINT"] } }
        ]
      },
      "input_projection": {
        "fields": [
          "table_name",
          "table_comment",
          "column.column_name",
          "column.data_type",
          "column.comment",
          "peer_columns.sample_top_n:20",
          "constraints"
        ]
      },
      "expected_output": [
        "semantic_role",
        "semantic_name_cn",
        "confidence",
        "suggested_enum_values",
        "evidence_spans",
        "reasoning_summary"
      ]
    }
  }
}
```

---

## 7) 表级 AI+规则合成判定（Ensemble Decision）

```json
{
  "decision": {
    "table_ensemble": {
      "final_score_formula": {
        "type": "linear",
        "terms": [
          { "field": "ai_object_likeness_score", "weight": 0.55 },
          { "field": "rule_score", "weight": 0.45 }
        ]
      },
      "thresholds": [
        { "if": { "gte": { "field": "final_score", "value": 0.80 } }, "then": "SUGGEST_OBJECT" },
        { "if": { "gte": { "field": "final_score", "value": 0.60 } }, "then": "NEEDS_REVIEW" },
        { "if": { "always": true }, "then": "DO_NOT_SUGGEST" }
      ],
      "emit": {
        "suggestion_type": "TABLE_OBJECT",
        "fields": [
          "table_name",
          "suggested_object_name",
          "final_score",
          "rule_score",
          "ai_object_likeness_score",
          "risk_flags",
          "evidence"
        ]
      }
    }
  }
}
```

---

## 8) 字段级规则分类（Rule-first，带优先级与硬覆盖）

> 输出 `rule_class` + `rule_confidence`，再由 AI 细化。

```json
{
  "rulesets": {
    "column_classify": {
      "type": "classifier",
      "rules": [
        {
          "id": "CR-01-technical-field",
          "priority": 100,
          "if": { "regex_match": { "field": "column_name", "pattern_ref": "technical_column_patterns" } },
          "then": { "class": "TECHNICAL_FIELD", "confidence": 0.99, "hard": true }
        },
        {
          "id": "CR-02-primary-key",
          "priority": 95,
          "if": { "equals": { "field": "is_pk", "value": true } },
          "then": { "class": "IDENTIFIER", "confidence": 0.99, "hard": true }
        },
        {
          "id": "CR-03-foreign-key-by-constraint",
          "priority": 90,
          "if": { "equals": { "field": "is_fk", "value": true } },
          "then": { "class": "FOREIGN_KEY", "confidence": 0.95, "hard": true }
        },
        {
          "id": "CR-04-status-by-name",
          "priority": 70,
          "if": { "contains_any": { "field": "column_name", "keywords_ref": "status_column_keywords" } },
          "then": { "class": "STATUS_CANDIDATE", "confidence": 0.75, "hard": false }
        },
        {
          "id": "CR-05-event-hint-by-time+verb",
          "priority": 65,
          "if": {
            "all": [
              { "contains_any": { "field": "column_name", "keywords_ref": "event_time_keywords" } },
              { "contains_any": { "field": "column_name", "keywords_ref": "event_verb_keywords" } }
            ]
          },
          "then": { "class": "EVENT_HINT", "confidence": 0.75, "hard": false }
        },
        {
          "id": "CR-06-possible-fk-by-suffix",
          "priority": 60,
          "if": { "regex_match": { "field": "column_name", "pattern_ref": "id_suffix_patterns" } },
          "then": { "class": "POSSIBLE_FK", "confidence": 0.65, "hard": false }
        },
        {
          "id": "CR-07-default-business-attr",
          "priority": 1,
          "if": { "always": true },
          "then": { "class": "BUSINESS_ATTRIBUTE", "confidence": 0.60, "hard": false }
        }
      ]
    }
  }
}
```

---

## 9) 规则 vs AI 冲突处理（硬规则覆盖 + 否则入 REVIEW）

```json
{
  "decision": {
    "column_conflict_resolve": {
      "hard_override_classes": ["TECHNICAL_FIELD", "IDENTIFIER", "FOREIGN_KEY"],
      "strategy": [
        {
          "if": { "in": { "field": "rule_class", "values": ["TECHNICAL_FIELD", "IDENTIFIER", "FOREIGN_KEY"] } },
          "then": { "final_role_source": "RULE", "final_role": "{rule_class}" }
        },
        {
          "if": {
            "all": [
              { "not_empty": { "field": "ai.semantic_role" } },
              { "neq": { "field": "ai.semantic_role", "value_field": "rule_class_mapped_role" } },
              { "lt": { "field": "ai.confidence", "value": 0.80 } }
            ]
          },
          "then": { "final_role_source": "REVIEW", "final_role": "{rule_class_mapped_role}", "flag": "AI_CONFLICT_LOW_CONF" }
        },
        {
          "if": { "not_empty": { "field": "ai.semantic_role" } },
          "then": { "final_role_source": "AI", "final_role": "{ai.semantic_role}" }
        },
        {
          "if": { "always": true },
          "then": { "final_role_source": "RULE", "final_role": "{rule_class_mapped_role}" }
        }
      ]
    }
  }
}
```

> 注：`rule_class_mapped_role` 是把 `STATUS_CANDIDATE` 映射到 `STATUS` 等角色的内部映射表，你可以放在 dictionaries 里。

---

## 10) 字段→对象升级建议（Snapshot / Event）

### 10.1 状态对象升级（Snapshot）

```json
{
  "rulesets": {
    "upgrade_snapshot": {
      "type": "trigger",
      "rules": [
        {
          "id": "US-01-status-upgrade-by-enum-cardinality",
          "priority": 100,
          "if": {
            "all": [
              { "in": { "field": "final_role", "values": ["STATUS", "STATUS_CANDIDATE"] } },
              { "between": { "field": "column.profile.distinct_count", "min": 2, "max": 20 } }
            ]
          },
          "then": {
            "suggest_upgrade": true,
            "suggestion_type": "UPGRADE_SNAPSHOT",
            "reason": "状态字段且枚举基数合理（2-20）"
          }
        },
        {
          "id": "US-02-status-upgrade-by-comment",
          "priority": 80,
          "if": {
            "all": [
              { "in": { "field": "final_role", "values": ["STATUS", "STATUS_CANDIDATE"] } },
              { "contains_any": { "field": "comment", "keywords": ["状态", "阶段", "是否", "完成"] } }
            ]
          },
          "then": {
            "suggest_upgrade": true,
            "suggestion_type": "UPGRADE_SNAPSHOT",
            "reason": "字段备注体现业务结论语义"
          }
        }
      ]
    }
  }
}
```

### 10.2 行为对象升级（Event）

```json
{
  "rulesets": {
    "upgrade_event": {
      "type": "trigger",
      "rules": [
        {
          "id": "UE-01-event-by-time-and-verb",
          "priority": 100,
          "if": {
            "all": [
              { "in": { "field": "final_role", "values": ["EVENT_HINT"] } },
              { "contains_any": { "field": "column_name", "keywords_ref": "event_verb_keywords" } },
              { "contains_any": { "field": "column_name", "keywords_ref": "event_time_keywords" } }
            ]
          },
          "then": {
            "suggest_upgrade": true,
            "suggestion_type": "UPGRADE_EVENT",
            "reason": "字段名称同时包含动词语义与时间语义"
          }
        },
        {
          "id": "UE-02-event-by-operation-triple",
          "priority": 90,
          "if": {
            "all": [
              { "exists_peer_column": { "keywords": ["operator", "user", "by"] } },
              { "exists_peer_column": { "keywords": ["operation", "action", "type"] } },
              { "exists_peer_column": { "keywords": ["time", "date", "at"] } }
            ]
          },
          "then": {
            "suggest_upgrade": true,
            "suggestion_type": "UPGRADE_EVENT",
            "reason": "存在操作人+操作类型+操作时间三元组，典型行为记录"
          }
        }
      ]
    }
  }
}
```

---

## 11) 人工确认队列分配（Auto / Review / Reject）

```json
{
  "decision": {
    "human_queue": {
      "table_suggestions": {
        "auto_approve": {
          "when": {
            "all": [
              { "gte": { "field": "final_score", "value": 0.90 } },
              { "not_contains": { "field": "risk_flags", "value": "relation_table" } }
            ]
          }
        },
        "needs_review": {
          "when": { "gte": { "field": "final_score", "value": 0.60 } }
        },
        "reject": {
          "when": { "always": true }
        }
      },
      "column_suggestions": {
        "auto_approve": {
          "when": {
            "all": [
              { "in": { "field": "final_role", "values": ["IDENTIFIER", "FOREIGN_KEY", "TECHNICAL_FIELD"] } }
            ]
          }
        },
        "needs_review": {
          "when": {
            "any": [
              { "in": { "field": "final_role", "values": ["STATUS", "STATUS_CANDIDATE", "EVENT_HINT", "POSSIBLE_FK"] } },
              { "equals": { "field": "final_role_source", "value": "REVIEW" } }
            ]
          }
        },
        "reject": { "when": { "always": true } }
      }
    }
  }
}
```

---

## 12) 输出建议对象结构（给 UI/后续流程用）

```json
{
  "outputs": {
    "suggestion_schema": {
      "common_fields": [
        "suggestion_id",
        "suggestion_type",
        "source",
        "target_name",
        "final_score",
        "rule_score",
        "ai_score",
        "confidence",
        "gate",
        "risk_flags",
        "evidence",
        "reasoning_summary",
        "queue"
      ],
      "types": {
        "TABLE_OBJECT": {
          "target_fields": ["suggested_object_name", "source_table"]
        },
        "COLUMN_ROLE": {
          "target_fields": ["semantic_role", "semantic_name_cn", "source_table", "column_name"]
        },
        "UPGRADE_SNAPSHOT": {
          "target_fields": ["snapshot_name_suggested", "source_table", "column_name"]
        },
        "UPGRADE_EVENT": {
          "target_fields": ["event_name_suggested", "source_table", "column_name"]
        }
      }
    }
  }
}
```

---

# 你现在拿到的是什么

* 一份**可配置**的规则 DSL（JSON）
* 支持 **门控（硬规则）→ 打分（可解释）→ AI 介入（软语义）→ 冲突处理（可控）→ 升级建议（不爆炸）→ 人工队列（可运营）**
* 完全符合你之前的“AI 只建议不裁决”原则

---




