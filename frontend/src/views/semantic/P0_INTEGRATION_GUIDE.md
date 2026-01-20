# 逻辑视图 P0 优化 - 组件集成指南

## 新增组件

### 1. GateFailureAlertCard - Gate 失败警告卡片
**文件**: `src/views/semantic/GateFailureAlertCard.tsx`

**功能**:
- 显示 Gate 失败项的警告卡片
- 展示具体的 SQL 补救模板
- 提供一键复制 SQL 功能
- 支持高优先级标记

**使用方式**:

#### 在 DataSemanticUnderstandingView.tsx 的概览 tab 中集成:

```tsx
// 1. 导入组件
import { GateFailureAlertCard } from './semantic/GateFailureAlertCard';

// 2. 在 Overview tab 的渲染逻辑中（result-key-evidence 之前）添加:
{resultTab === 'overview' && (
    <div className="space-y-4">
        {/* P0-2: Gate Failure Alert Card */}
        {gateReviewable && semanticProfile.gateResult && (
            <GateFailureAlertCard
                gateResult={semanticProfile.gateResult}
                onNavigateToEvidence={() => setResultTab('evidence')}
            />
        )}
        
        {/* 原有的 result-key-evidence 区域 */}
        <div id="result-key-evidence" ...>
            ...
        </div>
    </div>
)}
```

**插入位置**: 大约在 DataSemanticUnderstandingView.tsx 的 **1937 行**附近（在 `<div className="space-y-4">` 之后）

---

### 2. FieldFilterBar - 字段快速筛选器
**文件**: `src/views/semantic/FieldFilterBar.tsx`

**功能**:
- 提供 "全部字段"、"问题字段"、"敏感字段" 三种快速筛选
- 实时显示各筛选器的字段计数
- 支持一键清除筛选

**使用方式**:

#### 在 DeepAnalysisTabs 组件中集成（字段分析 tab）:

```tsx
// 1. 导入组件和工具函数
import { FieldFilterBar, FieldFilterType, filterFields } from './FieldFilterBar';

// 2. 添加状态管理
const [fieldFilter, setFieldFilter] = useState<FieldFilterType>('all');

// 3. 在字段列表渲染之前添加筛选栏
<FieldFilterBar
    fields={semanticProfile.fields || []}
    activeFilter={fieldFilter}
    onFilterChange={setFieldFilter}
/>

// 4. 过滤字段列表
const filteredFields = filterFields(
    semanticProfile.fields || [],
    fieldFilter
);

// 5. 使用 filteredFields 进行渲染
{filteredFields.map(field => (
    // ... 渲染字段
))}
```

**插入位置**: 在 DeepAnalysisTabs 组件的字段 tab 内容顶部

---

## 快速集成步骤

### Step 1: 导入新组件
在 `DataSemanticUnderstandingView.tsx` 顶部添加:
```tsx
import { GateFailureAlertCard } from './semantic/GateFailureAlertCard';
```

### Step 2: 在概览 tab 集成 GateFailureAlertCard
找到 `{resultTab === 'overview' && (` 这一行（约 1936 行），在其下方的 `<div className="space-y-4">` 内部最前面插入:

```tsx
{gateReviewable && semanticProfile.gateResult && (
    <GateFailureAlertCard
        gateResult={semanticProfile.gateResult}
        onNavigateToEvidence={() => setResultTab('evidence')}
    />
)}
```

### Step 3: 在 DeepAnalysisTabs 中集成 FieldFilterBar
打开 `src/views/semantic/DeepAnalysisTabs.tsx`，按上述方式集成字段筛选器。

---

## 测试验证

1. **测试 GateFailureAlertCard**:
   - 选择一个缺少主键或生命周期字段的表
   - 点击"开始语义理解"
   - 切换到"概览" tab
   - 应该在顶部看到红色警告卡片，展示 SQL 模板
   - 点击"复制 SQL"按钮测试复制功能

2. **测试 FieldFilterBar**:
   - 切换到"字段" tab
   - 点击"问题字段"应只显示低质量/低置信度字段
   - 点击"敏感字段"应只显示 L3/L4 敏感字段
   - 点击"清除筛选"恢复全部字段

---

## 组件 Props 说明

### GateFailureAlertCard
| Prop | 类型 | 必填 | 说明 |
|------|------|------|------|
| gateResult | SemanticGateResult | ✓ | Gate 检查结果，包含 actionItems |
| onNavigateToEvidence | () => void | - | 点击"查看完整证据"的回调 |

### FieldFilterBar
| Prop | 类型 | 必填 | 说明 |
|------|------|------|------|
| fields | FieldSemanticProfile[] | ✓ | 字段列表 |
| activeFilter | FieldFilterType | ✓ | 当前激活的筛选器 |
| onFilterChange | (filter) => void | ✓ | 筛选器切换回调 |

---

## 样式说明

两个组件都使用了项目现有的 Tailwind CSS 样式系统，无需额外样式配置。

颜色方案:
- **警告卡片**: 红色系 (red-50/red-200/red-600/red-800)
- **筛选器激活态**: 蓝色系 (blue-600)
- **SQL 代码块**: 深色背景 (slate-900)

---

## 后续优化建议

1. **Toast 通知**: 在复制 SQL 后显示 Toast 提示（目前仅按钮文字变化）
2. **筛选器持久化**: 将字段筛选状态保存到 localStorage
3. **批量操作**: 在筛选后支持批量接受/拒绝字段建议
