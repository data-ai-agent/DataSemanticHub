下面给你一份**“治理总览页 v2.4”每个 KPI 的后端计算口径 + SQL（伪 SQL，可直接改成 Postgres/MySQL）+ API 伪代码**。
我会按你总览页的 4 个 KPI（第一屏）为主，同时补齐**主线进度**与**阻塞项**需要的口径与接口，否则前端会拼不起来。

> 约定：以下口径均以**当前选定时间窗口**（近7/30/90天）与**可选作用域**（数据源/业务域/逻辑视图集合）过滤。
> 数据模型以你们已确认的：`run / suggestion / decision / version` 为核心，并补齐质量与安全的最小落地表。

---

# 0. 最小数据模型约定（用于口径与 SQL）

## 0.1 元数据/逻辑视图（输入面）

* `asset_table(table_id, datasource_id, db, schema, table_name, updated_at, ...)`
* `asset_field(field_id, table_id, field_name, data_type, nullable, comment, updated_at, ...)`

> 逻辑视图如果是“聚合后的表视图”，可以用 `logical_view(view_id, table_id, ...)` 映射；口径上按 table/field 聚合即可。

---

## 0.2 语义治理（v2.4）

* `semantic_run(run_id, scope_type, scope_id, status, started_at, finished_at, created_by, ...)`
* `semantic_suggestion(suggestion_id, run_id, target_type, target_id, dimension, suggested_value, confidence, evidence_json, created_at, ...)`
* `semantic_decision(decision_id, run_id, target_type, target_id, dimension, decision_type, decided_value, decided_by, decided_at, ...)`

  * `decision_type`: `ACCEPT|REJECT|EDIT|IGNORE`
* `semantic_version(version_id, status, published_at, publisher, base_run_id, ...)`

  * `status`: `DRAFT|PUBLISHED|ARCHIVED`
* `field_semantic_snapshot(version_id, field_id, term_id, role_code, tags_json, domain_json, decided_at, ...)`

> 总览页 KPI 默认以 **“当前生效版本（latest PUBLISHED）”** 为事实源；若你们希望展示“运行中态”，再加 `run_id` 维度（下文给两套口径）。

---

## 0.3 数据质量

* `dq_rule(rule_id, scope_type, scope_id, status, severity, created_at, ...)`

  * `scope_type`: `FIELD|TABLE|OBJECT`
* `dq_rule_binding(rule_id, field_id NULL, table_id NULL, version_id NULL, ...)`
* `dq_check_run(check_run_id, version_id, scope_type, scope_id, status, started_at, finished_at, ...)`
* `dq_check_result(check_run_id, rule_id, target_type, target_id, pass, fail_count, sample_json, severity, created_at, ...)`

> Gate：建议以“表级 Gate”汇总，表 Gate 失败 = 存在 `severity>=BLOCKER` 且 `pass=false` 的结果。

---

## 0.4 数据安全

* `sec_classification(field_id, version_id, level, category, status, decided_by, decided_at, ...)`

  * `status`: `DONE|PENDING`
* `sec_policy(policy_id, version_id, scope_type, scope_id, policy_type, status, ...)`（可选）
* `sec_audit_event(...)`（不用于 KPI 必选）

---

# 1) KPI-1 字段语义覆盖率（Field Semantic Coverage）

## 1.1 口径定义（推荐：以“当前生效版本”为准）

**字段语义覆盖率 = 已在当前版本形成语义快照的字段数 / 作用域内总字段数**

* 分子：`field_semantic_snapshot` 中满足“语义最小完备条件”的字段
* 分母：`asset_field`（过滤掉废弃字段/不纳管字段，如有）

### “语义最小完备条件”（建议固化为 Gate）

你们现在的字段语义维度很多，但覆盖率必须稳定可解释。建议：

* 必填：`role_code`（字段角色） + `term_id`（业务含义）
* 选填：`tags_json`

则：

* `semantic_covered(field) = (role_code IS NOT NULL) AND (term_id IS NOT NULL)`

---

## 1.2 SQL（伪 SQL）

### 获取当前生效版本

```sql
WITH active_version AS (
  SELECT version_id
  FROM semantic_version
  WHERE status = 'PUBLISHED'
  ORDER BY published_at DESC
  LIMIT 1
)
SELECT * FROM active_version;
```

### 覆盖率

```sql
WITH active_version AS (
  SELECT version_id
  FROM semantic_version
  WHERE status = 'PUBLISHED'
  ORDER BY published_at DESC
  LIMIT 1
),
scope_fields AS (
  SELECT f.field_id
  FROM asset_field f
  JOIN asset_table t ON t.table_id = f.table_id
  WHERE 1=1
    -- 可选过滤：datasource_id / db / schema / table_id / updated_at in window
),
covered_fields AS (
  SELECT s.field_id
  FROM field_semantic_snapshot s
  JOIN active_version v ON v.version_id = s.version_id
  WHERE s.role_code IS NOT NULL
    AND s.term_id IS NOT NULL
)
SELECT
  (SELECT COUNT(*) FROM covered_fields)::float
  / NULLIF((SELECT COUNT(*) FROM scope_fields), 0) AS field_semantic_coverage,
  (SELECT COUNT(*) FROM covered_fields) AS covered_cnt,
  (SELECT COUNT(*) FROM scope_fields) AS total_cnt;
```

---

## 1.3 API 伪代码

### REST

* `GET /api/governance/overview?range=30d&datasourceId=...`
* 返回中包含 `fieldSemantic.coverageRate/covered/total`

```pseudo
function getOverview(range, scopeFilters):
  versionId = getActiveVersionId()
  totalFields = countScopeFields(scopeFilters)
  coveredFields = countCoveredFields(versionId, scopeFilters, requireTerm=true, requireRole=true)
  coverageRate = coveredFields / max(totalFields, 1)
  return { fieldSemantic: { coverageRate, coveredFields, totalFields } }
```

---

# 2) KPI-2 质量 Gate 通过率（Quality Gate Pass Rate）

## 2.1 口径定义（推荐：表级 Gate）

**质量 Gate 通过率 = Gate 通过的表数 / 参与 Gate 的表数**

* 参与 Gate 的表：在当前版本中纳管且绑定了质量规则，或者在最近一次检查 run 中出现的表
* Gate 失败表：存在 `dq_check_result.pass=false AND severity in (BLOCKER)` 的结果（可按你们严重级别映射）

> 你现在页面上展示 “质量与规则 82% 冲突5待治理”，非常像这个口径。

---

## 2.2 SQL（伪 SQL）

### 取“最近一次质量检查 run（当前版本）”

```sql
WITH active_version AS (
  SELECT version_id
  FROM semantic_version
  WHERE status='PUBLISHED'
  ORDER BY published_at DESC
  LIMIT 1
),
latest_check_run AS (
  SELECT check_run_id
  FROM dq_check_run r
  JOIN active_version v ON v.version_id = r.version_id
  WHERE r.status='FINISHED'
  ORDER BY r.finished_at DESC
  LIMIT 1
)
SELECT * FROM latest_check_run;
```

### Gate 通过率（表级）

```sql
WITH active_version AS (
  SELECT version_id
  FROM semantic_version
  WHERE status='PUBLISHED'
  ORDER BY published_at DESC
  LIMIT 1
),
latest_check_run AS (
  SELECT check_run_id
  FROM dq_check_run r
  JOIN active_version v ON v.version_id = r.version_id
  WHERE r.status='FINISHED'
  ORDER BY r.finished_at DESC
  LIMIT 1
),
tables_in_scope AS (
  SELECT DISTINCT t.table_id
  FROM asset_table t
  -- 可选：过滤 scope（datasource/db/schema/业务域）
),
table_gate_fail AS (
  SELECT DISTINCT
    CASE
      WHEN res.target_type='TABLE' THEN res.target_id
      WHEN res.target_type='FIELD' THEN f.table_id
      ELSE NULL
    END AS table_id
  FROM dq_check_result res
  JOIN latest_check_run cr ON cr.check_run_id = res.check_run_id
  LEFT JOIN asset_field f ON (res.target_type='FIELD' AND f.field_id = res.target_id)
  WHERE res.pass = FALSE
    AND res.severity IN ('BLOCKER')  -- 你们可用枚举/数值比较
),
table_gate_pass AS (
  SELECT t.table_id
  FROM tables_in_scope t
  LEFT JOIN table_gate_fail fail ON fail.table_id = t.table_id
  WHERE fail.table_id IS NULL
)
SELECT
  (SELECT COUNT(*) FROM table_gate_pass)::float
  / NULLIF((SELECT COUNT(*) FROM tables_in_scope), 0) AS gate_pass_rate,
  (SELECT COUNT(*) FROM table_gate_pass) AS pass_table_cnt,
  (SELECT COUNT(*) FROM tables_in_scope) AS total_table_cnt,
  (SELECT COUNT(*) FROM table_gate_fail) AS blocker_table_cnt;
```

> “阻塞表数量”= `blocker_table_cnt`

---

## 2.3 API 伪代码

```pseudo
function calcQualityGate(versionId, scope):
  checkRunId = getLatestFinishedDQRun(versionId, scope)
  totalTables = listTables(scope)
  failTables = listGateFailTables(checkRunId, severity=BLOCKER)
  passRate = (totalTables.count - failTables.count) / max(totalTables.count,1)
  return { passRate, totalTables: totalTables.count, blockerTables: failTables.count }
```

---

# 3) KPI-3 安全分级完成率（Security Classification Completion Rate）

## 3.1 口径定义（字段级）

**安全分级完成率 = 已完成分级的字段数 / 需要分级的字段数**

关键点：**什么叫“需要分级”**
建议由语义标签/字段角色驱动（与你们“语义是治理语言”一致）：

* 需要分级字段 = 当前版本下满足任一条件的字段：

  * `tags_json` 含敏感类标签（PII/敏感/证件/手机号等）
  * `role_code` 属于标识类（ID/证件号/手机号/账号/地址等）
  * 或者你们已有规则：`sec_required=true`

完成分级 = `sec_classification.status='DONE'` 且 `level` 非空

---

## 3.2 SQL（伪 SQL）

```sql
WITH active_version AS (
  SELECT version_id
  FROM semantic_version
  WHERE status='PUBLISHED'
  ORDER BY published_at DESC
  LIMIT 1
),
required_fields AS (
  SELECT s.field_id
  FROM field_semantic_snapshot s
  JOIN active_version v ON v.version_id = s.version_id
  WHERE
    -- 伪条件：tags_json contains 'PII' or role_code in (...)
    (s.role_code IN ('ID_CARD','PHONE','ACCOUNT','ADDRESS')
     OR s.tags_json::text ILIKE '%PII%'
     OR s.tags_json::text ILIKE '%敏感%')
),
done_fields AS (
  SELECT c.field_id
  FROM sec_classification c
  JOIN active_version v ON v.version_id = c.version_id
  WHERE c.status='DONE'
    AND c.level IS NOT NULL
)
SELECT
  (SELECT COUNT(*) FROM done_fields)::float
  / NULLIF((SELECT COUNT(*) FROM required_fields), 0) AS sec_classification_completion,
  (SELECT COUNT(*) FROM done_fields) AS done_cnt,
  (SELECT COUNT(*) FROM required_fields) AS required_cnt;
```

### 高敏未处理数量（用于总览阻塞项）

```sql
WITH active_version AS (
  SELECT version_id FROM semantic_version
  WHERE status='PUBLISHED' ORDER BY published_at DESC LIMIT 1
),
high_required AS (
  SELECT s.field_id
  FROM field_semantic_snapshot s
  JOIN active_version v ON v.version_id=s.version_id
  WHERE s.tags_json::text ILIKE '%高敏%' OR s.tags_json::text ILIKE '%PII%'
),
high_undone AS (
  SELECT r.field_id
  FROM high_required r
  LEFT JOIN sec_classification c
    ON c.field_id=r.field_id AND c.version_id=(SELECT version_id FROM active_version)
  WHERE c.field_id IS NULL OR c.status<>'DONE'
)
SELECT COUNT(*) AS high_sensitive_undone FROM high_undone;
```

---

## 3.3 API 伪代码

```pseudo
function calcSecurityCompletion(versionId, scope):
  requiredFields = listFieldsRequiringClassification(versionId, scope) // by tags/roles
  done = countSecClassificationDone(versionId, requiredFields)
  highUndone = countHighSensitiveUndone(versionId, scope)
  rate = done / max(requiredFields.count,1)
  return { completionRate: rate, required: requiredFields.count, done, highUndone }
```

---

# 4) KPI-4 当前治理风险等级（Governance Risk Level）

## 4.1 口径定义（统一、可解释、可扩展）

风险等级不是拍脑袋，建议由**阻塞项**计算，且与前端 C 区完全一致：

* `语义阻塞数`：关键字段未确认（阻塞发布）
* `质量阻塞表数`：Gate 未通过（BLOCKER）
* `高敏未分级数`：高敏字段未分级

### 风险规则（建议）

* 高风险：任一条件满足

  * 语义阻塞 ≥ 1（关键字段阻塞）
  * 或 质量阻塞表 ≥ 1
  * 或 高敏未分级 ≥ 1
* 中风险：

  * 非阻塞，但存在 WARNING/严重2等（你们可扩展）
* 低风险：

  * 阻塞=0 且 warning 很少（或为0）

> 这套规则可以 100% 对齐你总览页的“阻塞与风险”卡片与红黄绿。

---

## 4.2 SQL（伪 SQL）

```sql
WITH metrics AS (
  SELECT
    :semantic_blockers AS semantic_blockers,
    :dq_blocker_tables AS dq_blocker_tables,
    :sec_high_undone AS sec_high_undone,
    :dq_warning_tables AS dq_warning_tables
)
SELECT
  CASE
    WHEN semantic_blockers >= 1 OR dq_blocker_tables >= 1 OR sec_high_undone >= 1 THEN 'HIGH'
    WHEN dq_warning_tables >= 1 THEN 'MEDIUM'
    ELSE 'LOW'
  END AS risk_level
FROM metrics;
```

> 实际实现上，`:semantic_blockers` 等由前面 1~3 的查询结果直接带入，避免重复扫描。

---

# 5) 主线进度（B 区）需要的口径（否则 KPI 有了但进度条没法画）

你 B 区的五步：`逻辑视图 → 字段语义理解 → 数据质量 → 数据安全 → 语义版本`

建议每步都返回：

* `status`: `NOT_STARTED|IN_PROGRESS|DONE`
* `done/total`
* `blockerCount`
* `ctaText/ctaLink`

### 5.1 字段语义理解步骤

* total = scope_fields
* done = covered_fields（同 KPI-1）
* status：

  * done=0 → NOT_STARTED
  * 0<done<total → IN_PROGRESS
  * done=total → DONE
* blockerCount = “关键字段未确认”（下一节给口径）

### 5.2 数据质量步骤

* totalTables = tables_in_scope
* doneTables = totalTables（只要检查 run 完成）或 passTables（看你定义）
* status：

  * 无检查 run → NOT_STARTED
  * 有 run 但 blocker>0 → IN_PROGRESS（或 BLOCKED）
  * blocker=0 → DONE

### 5.3 数据安全步骤

* requiredFields = KPI-3 分母
* doneFields = KPI-3 分子
* status 同上

### 5.4 语义版本步骤

* status = 是否存在 PUBLISHED 版本
* done=1/1 或显示版本号
* blockerCount = 语义/质量/安全阻塞是否为0（决定“可发布”）

---

# 6) C 区阻塞项口径（必须做，否则风险/CTA 不成立）

## 6.1 语义阻塞：关键字段未确认

你需要定义“关键字段”的来源（建议二选一）：

* A：字段角色属于关键类（ID/主标识/外键/状态/时间）
* B：你们逻辑视图已识别：主键/标识/必填（截图里就有“主键/标识”“必填字段”）

### SQL（按角色/必填/主键）

```sql
WITH active_version AS (
  SELECT version_id FROM semantic_version
  WHERE status='PUBLISHED' ORDER BY published_at DESC LIMIT 1
),
key_fields AS (
  SELECT f.field_id
  FROM asset_field f
  -- 假设你们已有字段画像表 field_profile 标记 is_pk/is_required/is_identifier
  JOIN field_profile p ON p.field_id=f.field_id
  WHERE p.is_pk=TRUE OR p.is_identifier=TRUE OR p.is_required=TRUE
),
undecided_key_fields AS (
  SELECT k.field_id
  FROM key_fields k
  LEFT JOIN field_semantic_snapshot s
    ON s.field_id=k.field_id AND s.version_id=(SELECT version_id FROM active_version)
  WHERE s.field_id IS NULL
     OR s.role_code IS NULL
     OR s.term_id IS NULL
)
SELECT COUNT(*) AS semantic_blockers FROM undecided_key_fields;
```

---

## 6.2 质量阻塞：Gate 未通过表

= KPI-2 中 `blocker_table_cnt`

---

## 6.3 安全风险：高敏字段未分级

= KPI-3 中 `high_sensitive_undone`

---

# 7) 总览 API 设计（推荐“一次请求返回全部”）

## 7.1 API 列表

* `GET /api/governance/overview`
* `GET /api/governance/overview/blockers`（可选拆分）
* `GET /api/governance/overview/drilldown`（点 KPI 进入列表）

### 7.2 `GET /api/governance/overview` 响应结构（建议）

```json
{
  "timeRange": "30d",
  "scope": { "datasourceId": "xxx", "domainId": "xxx" },
  "activeVersion": {
    "versionId": "v_243",
    "versionName": "v2.4.3",
    "publishedAt": "2026-01-12T10:00:00Z"
  },
  "kpis": {
    "fieldSemantic": { "coverageRate": 0.68, "covered": 680, "total": 1000 },
    "qualityGate": { "passRate": 0.82, "passTables": 82, "totalTables": 100, "blockerTables": 5 },
    "security": { "completionRate": 0.74, "done": 740, "required": 1000, "highUndone": 3 },
    "risk": { "level": "MEDIUM", "reasons": ["DQ_BLOCKER_TABLES"] }
  },
  "pipeline": [
    { "step": "LOGICAL_VIEW", "status": "DONE", "done": 100, "total": 100, "blockers": 0, "cta": { "text": "查看逻辑视图", "link": "/logical-views" } },
    { "step": "FIELD_SEMANTIC", "status": "IN_PROGRESS", "done": 680, "total": 1000, "blockers": 2, "cta": { "text": "继续字段语义理解", "link": "/field-semantics?filter=pending" } },
    { "step": "QUALITY", "status": "IN_PROGRESS", "done": 82, "total": 100, "blockers": 5, "cta": { "text": "处理质量阻塞项", "link": "/quality?filter=gate_failed" } },
    { "step": "SECURITY", "status": "IN_PROGRESS", "done": 740, "total": 1000, "blockers": 3, "cta": { "text": "完成高敏字段分级", "link": "/security?filter=high_undone" } },
    { "step": "VERSION", "status": "DONE", "done": 1, "total": 1, "blockers": 0, "cta": { "text": "查看语义版本", "link": "/semantic-versions/v_243" } }
  ],
  "blockers": {
    "semantic": { "count": 2, "topItems": [{ "fieldId": "f1", "table": "t_order", "field": "order_status" }] },
    "quality": { "count": 5, "topItems": [{ "tableId": "t1", "table": "t_payment" }] },
    "security": { "count": 3, "topItems": [{ "fieldId": "f9", "table": "t_user", "field": "id_card_no" }] }
  }
}
```

---

## 7.3 服务端聚合伪代码（单次查询 + 缓存建议）

```pseudo
function getGovernanceOverview(range, scope):
  versionId = getActiveVersionId()

  // 1) field semantic
  totalFields = countScopeFields(scope)
  coveredFields = countCoveredFields(versionId, scope, requireTerm=true, requireRole=true)

  // 2) dq gate
  dqRunId = getLatestFinishedDQRun(versionId, scope)
  totalTables = countScopeTables(scope)
  dqBlockerTables = countDQBlockerTables(dqRunId, scope)
  dqPassTables = totalTables - dqBlockerTables

  // 3) security
  requiredFields = countSecRequiredFields(versionId, scope)      // by tags/roles
  secDone = countSecDone(versionId, scope)
  secHighUndone = countHighSensitiveUndone(versionId, scope)

  // 4) semantic blockers (key fields)
  semanticBlockers = countUndecidedKeyFields(versionId, scope)

  // 5) risk
  risk = calcRisk(semanticBlockers, dqBlockerTables, secHighUndone, dqWarnings=...)

  // 6) pipeline statuses
  pipeline = buildPipeline(totalFields, coveredFields, totalTables, dqPassTables, requiredFields, secDone, semanticBlockers, dqBlockerTables, secHighUndone)

  // 7) top blocker items for drilldown
  blockers = loadTopBlockers(versionId, dqRunId, scope)

  return assembleResponse(...)
```

---

# 8) 你落地时最容易踩的两个坑（我直接帮你规避）

1. **覆盖率口径不要用“有 suggestion 就算覆盖”**
   否则覆盖率会虚高，治理无法闭环。必须以 **decision/快照**为准。

2. **质量/安全必须绑定版本**
   否则总览页无法回答“当前版本是否可用”。
   最小要求：`dq_check_run.version_id`、`sec_classification.version_id` 必须存在。

---
