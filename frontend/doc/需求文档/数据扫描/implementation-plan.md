# 资产扫描页面重构实施计划

## 核心变更

### 1. 移除功能
- ❌ 删除"生成候选"按钮和相关逻辑 (handleGenerateCandidates)
- ❌ 删除详情抽屉底部的"选中并生成候选"按钮

### 2. 数据模型扩展
```typescript
interface ScanAsset {
    id: string;
    name: string;
    comment: string;
    rows: string;
    updateTime: string;
    status: 'new' | 'changed' | 'synced' | 'removed' | 'error';  // 新增 removed/error
    reviewState: 'unreviewed' | 'reviewed' | 'ignored';  // 新增处理进度
    sourceId: string;
    sourceName: string;
    sourceType: string;
    healthScore?: number;  // 新增健康分 0-100
    owner?: string;  // 新增责任人
    semanticTags?: string[];  // 新增语义标签
    columns: ColumnInfo[];
}
```

### 3. Header 区域优化
- ✅ 保留"开始扫描"按钮
- ✅ 新增"自动扫描配置"按钮
- ✅ 新增"扫描历史"按钮

### 4. KPI 卡片调整
- ✅ 保留: 发现表总数、新增、变更、已选中
- ✅ 新增: 缺失(Removed)、失败(Error)

### 5. 筛选与视图
- ✅ 新增视图切换器 (List View / Tree View)
- ✅ 新增保存的视图下拉
- ✅ 新增 Tab: 关注(Watchlist)
- ✅ 新增筛选: ReviewState (未确认/已确认/已忽略)

### 6. 表格列优化
**新增列:**
- SemanticProfile (语义画像)
- HealthScore (健康分，带颜色指示灯)
- Owner (责任人)
- ReviewState Badge

**保留列:**
- Select, AssetName, CnComment, DataSource, Schema, RowCount, Status, ChangeSummary, ScanAt, Actions

### 7. 批量操作增强
- ✅ 标记已确认/忽略
- ✅ 批量分配责任人
- ✅ 批量打标
- ✅ 导出、重扫

### 8. 详情抽屉 Tabs
- ✅ 概览 (新增健康分、影响分析)
- ✅ 字段结构 (新增敏感度标记)
- ✅ 数据质量预览 (新增 Tab)
- ✅ 变更 Diff
- ✅ 扫描日志
- ✅ 协作讨论 (新增 Tab)
- ✅ 数据源信息

## 实施步骤

### Phase 1: 数据模型与状态 (优先级: 高)
1. 扩展 ScanAsset 接口
2. 更新 mock 数据
3. 添加新的状态配置

### Phase 2: Header 与 KPI (优先级: 高)
1. 移除"生成候选"按钮
2. 添加"自动扫描配置"和"扫描历史"按钮
3. 更新 KPI 卡片

### Phase 3: 筛选与视图 (优先级: 中)
1. 实现视图切换器
2. 实现保存的视图
3. 添加 Watchlist Tab

### Phase 4: 表格列更新 (优先级: 高)
1. 添加健康分列
2. 添加责任人列
3. 添加语义画像列
4. 添加处理进度列

### Phase 5: 批量操作 (优先级: 中)
1. 实现批量分配责任人
2. 实现批量打标
3. 更新批量操作栏

### Phase 6: 详情抽屉增强 (优先级: 低)
1. 添加数据质量预览 Tab
2. 添加协作讨论 Tab
3. 更新概览 Tab (健康分、影响分析)
4. 移除底部"生成候选"按钮

## 技术注意事项
- 保持现有动画和交互体验
- 确保响应式布局
- 使用现有的设计系统颜色和间距
- Mock 数据优先,预留 API 集成接口
