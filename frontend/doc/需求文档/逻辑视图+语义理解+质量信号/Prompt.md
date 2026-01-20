
# 📌 BizSemantic v2.4

## 语义理解 × 质量信号（SEMANTIC_MIN）工程实现 Prompt

---

## 一、系统角色定义（System Prompt）

> 你是一个企业级数据治理平台的工程实现助手，
> 需要严格按照给定的产品与工程约束，
> 生成 **可运行、可维护、不引入概念歧义** 的代码与结构。

---

## 二、项目背景（Context）

项目名称：**BizSemantic – 数据资源管理平台**
当前版本：**v2.4**

平台核心能力：

* 逻辑视图（表级上下文）
* 字段语义理解（AI Suggestion + 人工 Decision）
* 语义版本（唯一生效事实）
* 已有能力：

  * 数据质量（规则 + 检测）
  * 数据安全（分级 / 脱敏）

本次任务聚焦：

> **在“语义理解阶段”引入轻量质量信号（SEMANTIC_MIN），
> 用于提升语义 Suggestion 的准确性与可解释性，
> 但不引入质量治理逻辑。**

---

## 三、核心设计原则（必须遵守）

### P0（不可违反）

1. **语义理解不被质量检测阻塞**
2. 质量信号 ≠ 质量规则 ≠ 质量通过/失败
3. 质量信号只用于：

   * Suggestion 置信度修正
   * 人工 Review 风险提示
4. 所有可编辑行为仅发生在「语义裁决（Decision）」中
5. 语义理解基于 **逻辑视图详情页的模式切换**，不是新页面

---

## 四、功能范围（Scope）

### 需要实现的能力

1. **SEMANTIC_MIN 质量信号模板**
2. Profile Job（字段画像）
3. 质量信号在语义理解页面的展示
4. 轻量运行设置（开关 / 采样 / 刷新）
5. 与语义 Suggestion 的工程对接（权重/置信度）

### 明确不做的能力

* ❌ 不配置质量规则
* ❌ 不做质量 Pass/Fail
* ❌ 不进入数据质量模块
* ❌ 不影响语义版本发布 Gate

---

## 五、后端工程任务定义

### 5.1 Profile Job（SEMANTIC_MIN）

#### 输入

```json
{
  "logicalViewId": "lv_xxx",
  "tableName": "t_order",
  "template": "SEMANTIC_MIN",
  "sample": {
    "ratio": 0.01,
    "maxRows": 200000,
    "minRows": 10000
  }
}
```

#### 计算信号（字段级）

* null_ratio
* distinct_count
* distinct_ratio
* top_k_values（Top10）
* top3_concentration
* type_parse_rate
* min/max（numeric / time）

#### 输出（字段级）

```json
{
  "field": "order_status",
  "signals": { ... },
  "risk_flags": ["ENUM_NOT_STABLE"],
  "computed_at": "...",
  "profile_hash": "..."
}
```

---

### 5.2 存储模型（最小）

表：`field_profile_snapshot`

* logical_view_id
* table_name
* field_name
* signals_json
* risk_flags_json
* computed_at
* ttl
* profile_hash

---

### 5.3 API 定义（最小集）

* `POST /profile/run`
* `GET  /profile/signals?logicalViewId=&tableName=`
* `GET  /profile/status?logicalViewId=&tableName=`

---

## 六、语义理解引擎对接逻辑

### 6.1 信号使用方式

质量信号 **不得直接决定语义结果**，只能：

* 修正 Suggestion confidence
* 附加 risk_flags
* 作为 evidence 展示

### 6.2 权重策略（工程可实现）

按语义维度区分：

#### Role（强依赖信号）

* Identifier：null_ratio + distinct_ratio
* Status/Enum：distinct_count + top3_concentration
* Timestamp：type_parse_rate + range

#### Term（弱依赖）

* 仅在 HIGH_NULL / DIRTY_TYPE 时下调置信度

#### Tag

* PII：regex / pattern 命中
* Core：低 null_ratio

---

## 七、前端工程任务定义

### 7.1 页面结构（必须遵守）

页面：**逻辑视图详情页**

模式：

* Browse Mode（默认）
* Semantic Mode（语义理解模式）

---

### 7.2 Semantic Mode 布局（固定）

```text
[ Top Governance Bar ]
[ Column 1 ] 字段列表（状态 + 风险）
[ Column 2 ] 字段上下文（signals + evidence）
[ Column 3 ] 语义裁决面板（唯一可编辑）
```

---

### 7.3 质量信号相关 UI（必须实现）

#### 1️⃣ 辅助检测状态条

* 开启/关闭（默认开启）
* 模板：SEMANTIC_MIN（只读）
* 采样比例（可选下拉）
* 最近计算时间
* 刷新按钮

#### 2️⃣ Signals Card（字段级）

* null_ratio
* distinct_count
* top3_concentration
* type_parse_rate
* risk_flags（badge）

#### 3️⃣ Signals Detail Drawer（只读）

* 展示完整 profile 证据
* 不允许任何编辑

---

### 7.4 状态机（前端）

```text
IDLE
 └─ RUNNING (profile)
     ├─ SUCCESS
     └─ ERROR (retry)
```

* ERROR 不阻塞语义理解
* SUCCESS 自动刷新 signals

---

## 八、与语义版本的关系（必须遵守）

* profile/signals **不直接进入语义版本**
* 但在 `semantic_version.version_dependency` 中记录：

  * profile_hash
  * computed_at

目的：

* 保证语义 Suggestion 的可追溯性

---

## 九、验收标准（LLM 输出必须满足）

### 后端

* Profile Job 可独立运行
* 不依赖质量规则引擎
* 支持按需 + TTL

### 前端

* 语义理解流程不被阻塞
* 质量信号明确是“辅助信息”
* 所有编辑只发生在 Decision 面板

### 架构

* 不引入“质量治理前置”
* 不破坏现有质量/安全模块边界

---

## 十、禁止事项（Hard NO）

* ❌ 将 SEMANTIC_MIN 当作质量规则
* ❌ 在语义理解页显示“通过 / 失败”
* ❌ 让 Profile 失败阻止语义裁决
* ❌ 在语义理解中配置质量阈值

---

## 十一、输出要求（给大模型）

当你生成代码或方案时，请输出：

1. 模块划分（Frontend / Backend）
2. 关键数据结构
3. 核心函数 / 组件
4. 状态流转说明
5. 可扩展点（v2.5+）

---

# ✅ 一句话总结（可以放在 Prompt 最前面）

> **实现“语义理解辅助质量信号（SEMANTIC_MIN）”：
> 自动 Profile 字段，输出 Signals 与风险提示，
> 用于提升语义理解准确性，不构成质量治理，不阻塞流程。**

---
