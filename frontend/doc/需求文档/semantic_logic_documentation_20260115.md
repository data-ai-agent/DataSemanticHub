# 语义理解逻辑与流程文档

本文档详细描述了当前的语义理解引擎（Semantic Understanding Engine）的核心逻辑、评分规则及处理流程。

## 1. 核心处理流程 (Process Workflow)

语义理解的过程分为三个主要阶段：**规则拦截 (Gatekeeper)** -> **综合评分 (Scoring)** -> **结论生成 (Conclusion)**。

### 1.1 状态流转
*   **Idle (待分析)**: 初始状态，仅展示基础字段列表，隐藏高级分析视图。
*   **Analyzing (分析中)**: 用户触发分析后，前端模拟异步调用（1.5s 延迟）。
*   **Done (分析完成)**: 展示完整的语义结论、评分透视及详细分析报告。

### 1.2 整体架构
*   **逻辑层 (Logic Layer)**: `src/logic/semantic/rules.ts` & `scoring.ts`
    *   执行确定性的硬规则校验。
    *   计算基于统计特征的基础评分。
*   **AI 服务层 (AI Service Layer)**: `src/services/mockAiService.ts`
    *   模拟 LLM 推理，提供业务语义推断（业务名、描述、场景）。
    *   提供字段级的语义角色建议。
*   **融合层 (Fusion Layer)**:
    *   结合规则评分与 AI 评分，生成最终置信度。

---

## 2. 逻辑规则详情

### 2.1 规则拦截器 (Gatekeeper Rules)
在深入分析前，先执行硬规则过滤，快速识别不适合进行资产化的表。

*   **执行位置**: `checkGatekeeper` in `rules.ts`
*   **规则列表**:
    1.  **T-04 表类型排除**:
        *   若表名包含 `log`, `trace`, `history`, `tmp`, `temp`, `bak`, `_rel`, `detail` 等关键词。
        *   **结果**: 直接标记为 `REJECT` (规则拦截)。
    2.  **T-02 主键校验**:
        *   检查是否包含 `primaryKey` 属性，或字段名匹配 `id`, `*_id`。
        *   **影响**: 若缺失，标记为 `REVIEW` (需复核)。
    3.  **T-03 生命周期校验**:
        *   检查是否包含时间字段 (`create_time`, `update_time`, `*_at`, `*_date`)。
        *   **影响**: 若缺失，标记为 `REVIEW` (需复核)。
*   **拦截结果**:
    *   **PASS**: 通过所有硬规则。
    *   **REVIEW**: 缺失关键规范（如主键/时间），但允许继续。
    *   **REJECT**: 命中排除列表，建议直接排除。

### 2.2 字段语义分析 (Field Analysis)
对每个字段进行规则特征提取。

*   **执行位置**: `analyzeField` in `rules.ts`
*   **分类逻辑**:
    *   **L4 (机密)**: `password`, `secret`, `pwd`, `token`
    *   **L3 (敏感)**: `mobile`, `phone`, `id_card`, `bank_card`
    *   **L2 (内部)**: `name`, `email`, `address`
    *   **审计字段**: `create_by`, `update_by`, `is_deleted`
    *   **标识符**: `id`, `*_id` (且为主键)
    *   **状态位**: `status`, `state`, `flag`

---

## 3. 评分模型 (Scoring Model)

最终得分由 **规则评分 (45%)** 和 **AI 评分 (55%)** 融合而成。

### 3.1 规则评分 (Rule Score)
基于表结构的规范性进行打分。
*   **命名规范 (30%)**: 表名长度 > 3 字符即视为及格 (0.8分)。
*   **行为密度 (30%)**:
    *   计算“行为字段”占比 (含 `time`, `date`, `operator`, `action`)。
    *   若占比 < 40%，视为实体表 (Entity)，得分 0.9 (结构稳定)。
    *   若占比高，视为行为表，得分 0.4 (结构易变)。
*   **注释覆盖 (40%)**:
    *   有表注释且长度 > 2: 得分 1.0。
    *   无注释: 得分 0.5。

### 3.2 AI 评分 (AI Score)
模拟 LLM 对表语义的可解释性打分 (Mock Logic)。
*   **特殊场景 (HR Demo)**:
    *   `t_hr_employee`: 0.96 (高置信度)
    *   `t_hr_department`: 0.92
    *   `t_hr_position`: 0.95
    *   *注：针对特定演示表返回预设高分。*
*   **通用场景**:
    *   基于 `0.75 + random(0.2)` 生成随机分数 (0.75 ~ 0.95)。
    *   若识别为日志表 (`log` 等)，固定低分 0.25。

### 3.3 融合公式
```typescript
FinalScore = (0.55 * AIScore) + (0.45 * ((TableScore + FieldScore)/2))
```

---

## 4. 结论生成 (Conclusion Generation)

### 4.1 业务身份识别
AI 负责推断表的业务身份 (Business Identity)。
*   **推断逻辑** (`inferObjectType`):
    *   **行为 (Event)**: `log`, `flow`, `record`
    *   **规则 (Rule)**: `dict`, `config`, `enum`
    *   **状态 (State)**: `status`, `snapshot`
    *   **属性 (Attribute)**: `tag`, `summary`
    *   **主体 (Entity)**: 默认类型，或含 `base`, `profile`。

### 4.2 业务域归属
基于表名关键词推断归属域 (`inferBusinessDomain`)：
*   **交易域**: `order`, `trade`, `pay`
*   **用户域**: `user`, `member`
*   **商品域**: `product`, `item`
*   ... (包含 供应链、财务、客服 等)

### 4.3 置信度提升建议 (Confidence Boosting)
当 AI 置信度 < 0.7 时，触发提升任务 (`generateBoostingTasks`)：
1.  **字段注释**: 若覆盖率低，建议 "批量生成注释"。
2.  **主键语义**: 若未识别到主键，建议 "指定语义主键"。
3.  **特殊字段**: 若存在 `json`, `ext_` 字段，建议 "识别 JSON 结构"。
4.  **时间维度**: 检查是否有生命周期字段。

---

## 5. UI 呈现逻辑

### 5.1 综合结论组件 (SemanticConclusionCard)
*   **置顶展示**: 核心结论（业务名称、对象类型、业务域）最优先展示。
*   **证据仪表盘**:
    *   **生命周期**: 展示保留策略 (基于规则推断)。
    *   **质量画像**: 展示填充率与主键唯一性。
    *   **安全合规**: 展示最高敏感等级 (L1-L4) 及 PII 字段统计。
*   **关键操作**:
    *   若 Gatekeeper 拒绝 -> 显示 "确认排除"。
    *   若通过 -> 显示 "加入候选业务对象" (生成 BO)。

### 5.2 引擎详情组件 (SemanticAnalysisCard)
*   **展示**: 具体的评分雷达图、维度得分详情。
*   **定位**: 作为结论的支撑证据，位于结论下方。

此文档反映了截止 `2026-01-15` 的代码实现逻辑。
