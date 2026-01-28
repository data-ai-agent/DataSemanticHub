# Figma Frame 结构说明

## 页面：业务对象建模（治理增强版 v2.4）

---

## Frame 0｜Page Root

**Frame 名称**

```
SemanticModeling / BusinessObject / Index
```

**Layout**

* Direction：Vertical
* Padding：24
* Gap：16
* Width：Auto（页面宽）
* Height：Auto

---

## Frame 1｜Page Header（顶部标题区）

**Frame 名称**

```
Header / BusinessObjectTitle
```

### 子元素

1. **Breadcrumb**

   ```
   Breadcrumb
   数据语义治理 / 语义建模 / 业务对象建模
   ```

2. **Title + Description**

   ```
   H1：业务对象建模
   Text：定义核心业务实体、属性及其数据标准
   ```

3. **Primary Actions（右侧）**

   * Button（Primary）：`+ 新建对象`
   * Button（Primary / Disabled by Rule）：`发布语义版本`
   * IconButton：历史版本（可选）

> 🔒【设计规则】
>
> * `发布语义版本` 按钮状态由治理规则驱动
> * Disabled 时 Hover 显示阻塞原因 Tooltip

---

## Frame 2｜Governance Readiness Bar（治理就绪度条）⭐

**Frame 名称**

```
Governance / ReadinessBar
```

> **这是新增的治理核心 Frame**

### 状态 A：不可发布

```
Icon：🚫
Text（Bold）：当前语义版本：不可发布
List：
- 待确认对象：4
- 冲突未解决：1
- 映射完成度 < 80%：2
LinkButton：查看阻塞对象 →
```

### 状态 B：可发布

```
Icon：✅
Text（Bold）：当前语义版本：可发布
Text：所有对象满足发布条件
```

**交互**

* 点击「查看阻塞对象」：

  * 自动切换 Tabs →【待确认】
  * 应用阻塞原因 Filter

---

## Frame 3｜Object Status Tabs

**Frame 名称**

```
Tabs / ObjectLifecycle
```

### Tabs

* Tab：全部（14）
* Tab：候选中（4）
* Tab：待确认（0）
* Tab：已发布（9）

**规则**

* Tab 数量实时计算
* 切换 Tab 会：

  * 触发对象列表 Query（status）
  * 控制 Summary Bar 显隐

---

## Frame 4｜Summary Bar（候选 / 待确认专属）

**Frame 名称**

```
Governance / SummaryBar
```

**仅在以下 Tab 显示**

* 候选中
* 待确认

### 内容结构

```
MetricItem：总对象数 4
MetricItem：已接受 0
MetricItem：待确认 4
MetricItem：冲突项 0
MetricItem：平均置信度 75%
Spacer
Button（Ghost）：刷新识别建议
```

---

## Frame 5｜Toolbar（搜索 & 筛选）

**Frame 名称**

```
Toolbar / ObjectFilter
```

### 子组件

* SearchInput：搜索对象名或编码
* Select：状态（仅“全部”Tab 可见）
* Select：映射状态
* Select：对象类型
* Select：负责人
* Select：排序（最近更新）
* Text：共 X 个对象

---

## Frame 6｜Main Content Layout

**Frame 名称**

```
Layout / DomainTree + ObjectGrid
```

### Layout

* Horizontal
* Left Fixed / Right Fluid

---

### Frame 6.1｜Business Domain Tree（左侧）

**Frame 名称**

```
Sidebar / BusinessDomainTree
```

**结构**

* SearchInput：搜索业务域
* Tree：

  * 全部业务域（14）
  * 组织与人力资源
  * 供应链中心
  * 用户与交易
  * …

---

### Frame 6.2｜Object Grid（右侧核心）

**Frame 名称**

```
Content / ObjectCardGrid
```

**Layout**

* Grid（4 列）
* Gap：16

---

## Frame 7｜Object Card（通用卡片）

**Frame 名称**

```
Card / BusinessObject
```

### 7.1 Card Header

```
Checkbox（多选）
Icon：对象
Tag：主体 / 事件
Tag：状态（候选中 / 待确认 / 已发布）
```

---

### 7.2 Card Body

```
Title：对象名称
Code：biz_xxx
Description（1 行）
Meta：
- 业务域
- 字段数
- 映射进度条（%）
```

---

### 7.3 Governance Info Area（按状态变化）⭐

#### 候选中（Candidate）

```
Tag：92% 置信度
Text：来源 AI · t_med_birth_cert
Link：裁决建议 ✨
```

#### 待确认（Pending）

```
Alert（Warning）：
阻塞原因：
- 存在未解决冲突
- 缺少主键属性
Button：去解决问题 →
```

#### 已发布（Published）

```
（不显示治理信息）
```

---

### 7.4 Card Footer CTA

```
候选中 → Button：裁决建议
待确认 → Button：去解决问题
已发布 → Button：查看详情
```

---

## Frame 8｜Object Suggestion Drawer（裁决建议）⭐

**Frame 名称**

```
Drawer / ObjectSuggestion
```

### 内容区块

1. **Header**

   ```
   AI SUGGESTION · 92% 置信度
   对象名称
   ```

2. **基础信息建议**

   * 对象名称
   * 类型
   * 业务域
   * 描述

3. **识别依据**

   * 来源表
   * 关键字段

4. **属性映射建议表**

   * 业务属性
   * 语义角色
   * 来源字段
   * 风险提示

5. **影响提示（必有）**

   ```
   ⚠ 接受后将阻塞语义版本发布，直到完成映射
   ```

6. **Footer Actions**

   * Button：拒绝建议
   * Button：修改后接受
   * Button（Primary）：接受并生成

---

## Frame 9｜Conflict Resolution Drawer（冲突处理）

**Frame 名称**

```
Drawer / ConflictResolution
```

### 内容

* 冲突类型说明
* 涉及对象列表
* 推荐解决方案
* Button：

  * 确认合并
  * 保留其一
  * 取消

---

## Frame 10｜Batch Action Bar（批量治理）

**Frame 名称**

```
Floating / BatchActionBar
```

**触发**

* 勾选 ≥1 个对象

**内容**

```
Text：已选 3 个对象
Button：批量接受
Button：批量拒绝
Button：批量分配负责人（可选）
```

---

## Frame 命名规范（给设计 & 前端）

```
模块 / 子模块 / 语义名称
示例：
Governance / ReadinessBar
Card / BusinessObject
Drawer / ObjectSuggestion
```

---

## 最终一句总结（给你对外用）

> **这套 Figma Frame 不是“画页面”，
> 而是在把「语义治理的状态机」完整投射到 UI 结构里。**

---


