import React, { useState, useMemo } from 'react';
import {
    LayoutGrid, List, Sliders, ArrowUp, ArrowDown, Plus,
    Box, FileText, Globe, Book, Search, X
} from 'lucide-react';
import { Asset, FilterOptions, SavedFilter, SearchMode, SortBy, ViewMode, DetailTab, ActiveTab } from './components/data-catalog/types';
import { SearchBar } from './components/data-catalog/SearchBar';
import { AdvancedFilter } from './components/data-catalog/AdvancedFilter';
import { AssetCard } from './components/data-catalog/AssetCard';
import { AssetList } from './components/data-catalog/AssetList';
import { AssetDetail } from './components/data-catalog/AssetDetail';

export const DataCatalogView: React.FC = () => {
    // 状态管理
    const [viewMode, setViewMode] = useState<ViewMode>('card');
    const [searchTerm, setSearchTerm] = useState('');
    const [searchMode, setSearchMode] = useState<SearchMode>('keyword');
    const [sortBy, setSortBy] = useState<SortBy>('relevance');
    const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
    const [selectedAssetIds, setSelectedAssetIds] = useState<Set<string>>(new Set());
    const [activeTab, setActiveTab] = useState<ActiveTab>('all');
    const [isBatchMode, setIsBatchMode] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isSearching, setIsSearching] = useState(false);

    // 详情页状态
    const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
    const [detailTab, setDetailTab] = useState<DetailTab>('basic');
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    // 收藏状态
    const [favorites, setFavorites] = useState<string[]>([]);

    // 搜索历史
    const [searchHistory, setSearchHistory] = useState<string[]>(['人口数据', 'type:业务对象', 'owner:卫健委']);

    // 筛选条件
    const [filterOptions, setFilterOptions] = useState<FilterOptions>({
        qualityRange: { min: 0, max: 100 },
        owners: [],
        categories: [],
        accessLevels: [],
        updateFreqs: [],
        tags: [],
        hasSensitiveFields: false,
        hasPrimaryKey: false,
        applications: []
    });

    const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([
        { id: '1', name: '高质量核心资产', filters: { qualityRange: { min: 90, max: 100 }, tags: ['核心资产'] } }
    ]);

    // Mock Data
    const mockCatalogAssets: Asset[] = [
        {
            id: 'AS_001',
            name: '新生儿基础信息资产',
            type: 'Data Asset',
            categoryType: 'business_object',
            code: 'asset_newborn_basic',
            owner: '卫健委数据中心',
            quality: 98,
            status: 'Published',
            tags: ['核心资产', '人口数据', '实时更新'],
            lastUpdate: '2024-05-20',
            description: '包含新生儿基础身份信息的核心数据资产，支持多维度查询和分析。',
            category: '人口库',
            dataVolume: '1.2亿',
            updateFreq: '实时',
            accessLevel: '受限',
            format: 'JSON/Table',
            lineage: ['原始出生医学证明库', '人口基础信息库', '新生儿资产表'],
            applications: ['新生儿落户', '医保登记', '疫苗接种'],
            fields: [
                { name: '出生医学证明号', code: 'birth_cert_no', type: 'VARCHAR', businessType: '证件号', length: 20, nullable: false, primaryKey: true, sensitive: true, description: '唯一标识' },
                { name: '新生儿姓名', code: 'newborn_name', type: 'VARCHAR', businessType: '姓名', length: 50, nullable: false, primaryKey: false, sensitive: false, description: '新生儿登记姓名' },
                { name: '性别', code: 'gender', type: 'CHAR', businessType: '性别', length: 1, nullable: false, primaryKey: false, sensitive: false, description: '1:男, 2:女' },
                { name: '出生时间', code: 'birth_time', type: 'DATETIME', businessType: '时间', nullable: false, primaryKey: false, sensitive: false, description: '精确到分钟' },
                { name: '父亲姓名', code: 'father_name', type: 'VARCHAR', businessType: '姓名', length: 50, nullable: true, primaryKey: false, sensitive: true, description: '' },
                { name: '母亲姓名', code: 'mother_name', type: 'VARCHAR', businessType: '姓名', length: 50, nullable: false, primaryKey: false, sensitive: true, description: '' },
                { name: '家庭住址', code: 'address', type: 'VARCHAR', businessType: '地址', length: 200, nullable: true, primaryKey: false, sensitive: true, description: '详细居住地址' }
            ]
        },
        {
            id: 'AS_002',
            name: '婚姻登记业务视图',
            type: 'Logical View',
            categoryType: 'logical_view',
            code: 'view_marriage_registry',
            owner: '民政局',
            quality: 95,
            status: 'Published',
            tags: ['婚姻', '民政', '高频使用'],
            lastUpdate: '2024-05-19',
            description: '整合了婚姻登记、离婚登记及补领证件等全流程业务数据的逻辑视图。',
            category: '法人库',
            dataVolume: '5000万',
            updateFreq: '准实时',
            accessLevel: '内部',
            format: 'View',
            lineage: ['民政业务库', '婚姻登记视图'],
            applications: ['购房资格审核', '生育登记'],
            fields: [
                { name: '登记证号', code: 'cert_no', type: 'VARCHAR', businessType: '证件号', length: 30, nullable: false, primaryKey: true, sensitive: false },
                { name: '男方姓名', code: 'male_name', type: 'VARCHAR', businessType: '姓名', length: 50, nullable: false, primaryKey: false, sensitive: true },
                { name: '女方姓名', code: 'female_name', type: 'VARCHAR', businessType: '姓名', length: 50, nullable: false, primaryKey: false, sensitive: true },
                { name: '登记日期', code: 'reg_date', type: 'DATE', businessType: '日期', nullable: false, primaryKey: false, sensitive: false },
                { name: '登记类型', code: 'reg_type', type: 'VARCHAR', businessType: '类型', length: 10, nullable: false, primaryKey: false, sensitive: false, description: '结婚/离婚/补领' }
            ]
        },
        {
            id: 'AS_003',
            name: '不动产登记接口',
            type: 'API Interface',
            categoryType: 'interface',
            code: 'api_real_estate',
            owner: '自然资源局',
            quality: 89,
            status: 'Maintenance',
            tags: ['房产', '资产', 'API'],
            lastUpdate: '2024-05-18',
            description: '提供不动产登记信息的查询接口，包括产权人、房屋坐落、面积等信息。',
            category: '自然资源库',
            dataVolume: 'API调用',
            updateFreq: '实时',
            accessLevel: '受限',
            format: 'REST API',
            applications: ['入学资格审核', '公积金提取'],
            fields: [
                { name: '不动产单元号', code: 'unit_no', type: 'VARCHAR', businessType: '编码', length: 28, nullable: false, primaryKey: true, sensitive: false },
                { name: '权利人', code: 'owner_name', type: 'VARCHAR', businessType: '姓名', length: 100, nullable: false, primaryKey: false, sensitive: true },
                { name: '坐落', code: 'location', type: 'VARCHAR', businessType: '地址', length: 200, nullable: false, primaryKey: false, sensitive: true },
                { name: '建筑面积', code: 'area', type: 'DECIMAL', businessType: '数值', nullable: false, primaryKey: false, sensitive: false }
            ]
        },
        {
            id: 'AS_004',
            name: '企业工商信用信息',
            type: 'Data Asset',
            categoryType: 'business_object',
            code: 'asset_company_credit',
            owner: '市场监管局',
            quality: 92,
            status: 'Published',
            tags: ['企业', '信用', '法人'],
            lastUpdate: '2024-05-20',
            description: '汇集企业基础工商信息及行政处罚、经营异常等信用信息。',
            category: '法人库',
            dataVolume: '8000万',
            updateFreq: '日更新',
            accessLevel: '公开',
            format: 'Table',
            lineage: ['工商局业务库', '信用中国', '企业信用表'],
            applications: ['企业信贷', '招投标资格审查'],
            fields: [
                { name: '统一社会信用代码', code: 'credit_code', type: 'VARCHAR', businessType: '证件号', length: 18, nullable: false, primaryKey: true, sensitive: false },
                { name: '企业名称', code: 'ent_name', type: 'VARCHAR', businessType: '企业名', length: 100, nullable: false, primaryKey: false, sensitive: false },
                { name: '法定代表人', code: 'legal_rep', type: 'VARCHAR', businessType: '姓名', length: 50, nullable: false, primaryKey: false, sensitive: false },
                { name: '成立日期', code: 'est_date', type: 'DATE', businessType: '日期', nullable: false, primaryKey: false, sensitive: false },
                { name: '经营状态', code: 'status', type: 'VARCHAR', businessType: '状态', length: 20, nullable: false, primaryKey: false, sensitive: false }
            ]
        },
        {
            id: 'AS_005',
            name: '社保缴纳记录视图',
            type: 'Logical View',
            categoryType: 'logical_view',
            code: 'view_social_security',
            owner: '人社局',
            quality: 96,
            status: 'Published',
            tags: ['社保', '民生', '资金'],
            lastUpdate: '2024-05-19',
            description: '个人及单位社保缴纳历史记录查询视图。',
            category: '人口库',
            dataVolume: '20亿',
            updateFreq: '月更新',
            accessLevel: '受限',
            format: 'View',
            applications: ['退休金计算', '购房资格审核'],
            fields: [
                { name: '个人编号', code: 'person_id', type: 'VARCHAR', businessType: '编码', length: 20, nullable: false, primaryKey: true, sensitive: true },
                { name: '缴费年月', code: 'payment_month', type: 'VARCHAR', businessType: '日期', length: 6, nullable: false, primaryKey: true, sensitive: false },
                { name: '险种类型', code: 'ins_type', type: 'VARCHAR', businessType: '类型', length: 20, nullable: false, primaryKey: false, sensitive: false },
                { name: '缴费基数', code: 'base_amount', type: 'DECIMAL', businessType: '金额', nullable: false, primaryKey: false, sensitive: true },
                { name: '单位缴费', code: 'comp_amount', type: 'DECIMAL', businessType: '金额', nullable: false, primaryKey: false, sensitive: false },
                { name: '个人缴费', code: 'pers_amount', type: 'DECIMAL', businessType: '金额', nullable: false, primaryKey: false, sensitive: false }
            ]
        },
        {
            id: 'AS_006',
            name: '地址标准化服务',
            type: 'API Interface',
            categoryType: 'interface',
            code: 'api_address_std',
            owner: '大数据局',
            quality: 85,
            status: 'Published',
            tags: ['工具', '基础服务', '标准化'],
            lastUpdate: '2024-05-15',
            description: '提供非标准地址的清洗、标准化及结构化解析服务。',
            category: '基础库',
            dataVolume: 'API调用',
            updateFreq: '季度更新',
            accessLevel: '内部',
            format: 'REST API',
            applications: ['物流配送', '网格化管理'],
            fields: [
                { name: '原始地址', code: 'raw_address', type: 'VARCHAR', businessType: '文本', length: 200, nullable: false, primaryKey: false, sensitive: false },
                { name: '标准地址', code: 'std_address', type: 'VARCHAR', businessType: '文本', length: 200, nullable: false, primaryKey: false, sensitive: false },
                { name: '行政区划代码', code: 'district_code', type: 'VARCHAR', businessType: '编码', length: 12, nullable: true, primaryKey: false, sensitive: false }
            ]
        }
    ];

    // 辅助函数
    const getCategoryIcon = (categoryType: string) => {
        switch (categoryType) {
            case 'business_object': return <Box size={24} className="text-blue-600" />;
            case 'logical_view': return <FileText size={24} className="text-purple-600" />;
            case 'interface': return <Globe size={24} className="text-emerald-600" />;
            default: return <Book size={24} className="text-slate-600" />;
        }
    };

    const getCategoryColor = (categoryType: string) => {
        switch (categoryType) {
            case 'business_object': return 'bg-blue-100 border-blue-200';
            case 'logical_view': return 'bg-purple-100 border-purple-200';
            case 'interface': return 'bg-emerald-100 border-emerald-200';
            default: return 'bg-slate-100 border-slate-200';
        }
    };

    // 筛选和排序逻辑
    const filteredAssets = useMemo(() => {
        let result = mockCatalogAssets;

        // Tab筛选
        if (activeTab !== 'all') {
            result = result.filter(asset => asset.categoryType === activeTab);
        }

        // 搜索筛选
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(asset =>
                asset.name.toLowerCase().includes(term) ||
                asset.code.toLowerCase().includes(term) ||
                asset.description.toLowerCase().includes(term) ||
                asset.tags.some(tag => tag.toLowerCase().includes(term))
            );
        }

        // 高级筛选
        if (filterOptions.owners.length > 0) {
            result = result.filter(asset => filterOptions.owners.includes(asset.owner));
        }
        if (filterOptions.categories.length > 0) {
            result = result.filter(asset => filterOptions.categories.includes(asset.category));
        }
        if (filterOptions.accessLevels.length > 0) {
            result = result.filter(asset => filterOptions.accessLevels.includes(asset.accessLevel));
        }
        if (filterOptions.updateFreqs.length > 0) {
            result = result.filter(asset => filterOptions.updateFreqs.includes(asset.updateFreq));
        }
        if (filterOptions.qualityRange.min > 0 || filterOptions.qualityRange.max < 100) {
            result = result.filter(asset => asset.quality >= filterOptions.qualityRange.min && asset.quality <= filterOptions.qualityRange.max);
        }
        if (filterOptions.tags.length > 0) {
            result = result.filter(asset => asset.tags.some(tag => filterOptions.tags.includes(tag)));
        }
        if (filterOptions.applications.length > 0) {
            result = result.filter(asset => asset.applications.some(app => filterOptions.applications.includes(app)));
        }
        if (filterOptions.hasSensitiveFields) {
            result = result.filter(asset => asset.fields?.some(f => f.sensitive));
        }
        if (filterOptions.hasPrimaryKey) {
            result = result.filter(asset => asset.fields?.some(f => f.primaryKey));
        }

        // 排序
        result = [...result].sort((a, b) => {
            switch (sortBy) {
                case 'quality': return b.quality - a.quality;
                case 'updateTime': return new Date(b.lastUpdate).getTime() - new Date(a.lastUpdate).getTime();
                // case 'usage': return (b.usageCount || 0) - (a.usageCount || 0); // Mock data doesn't have usageCount yet
                default: return 0; // Relevance default (no change)
            }
        });

        return result;
    }, [activeTab, searchTerm, filterOptions, sortBy]);

    // 事件处理函数
    const handleSearch = (query: string) => {
        setIsSearching(true);
        // 模拟API搜索延迟
        setTimeout(() => {
            setSearchTerm(query);
            setIsSearching(false);
            if (query && !searchHistory.includes(query)) {
                setSearchHistory(prev => [query, ...prev].slice(0, 10));
            }
        }, 500);
    };

    const handleApplyFilterPreset = (preset: SavedFilter) => {
        setFilterOptions(prev => ({ ...prev, ...preset.filters }));
    };

    const handleDeleteFilterPreset = (id: string) => {
        setSavedFilters(prev => prev.filter(f => f.id !== id));
    };

    const handleSaveFilterPreset = () => {
        // 简化逻辑：直接保存当前筛选为一个名为"自定义筛选"的预设
        const newPreset: SavedFilter = {
            id: Date.now().toString(),
            name: `自定义筛选 ${savedFilters.length + 1}`,
            filters: { ...filterOptions }
        };
        setSavedFilters(prev => [...prev, newPreset]);
    };

    const toggleAssetSelection = (asset: Asset) => {
        const newSelected = new Set(selectedAssetIds);
        if (newSelected.has(asset.id)) {
            newSelected.delete(asset.id);
        } else {
            newSelected.add(asset.id);
        }
        setSelectedAssetIds(newSelected);
    };

    const toggleFavorite = (assetId: string) => {
        setFavorites(prev =>
            prev.includes(assetId)
                ? prev.filter(id => id !== assetId)
                : [...prev, assetId]
        );
    };

    const generateSampleData = (asset: Asset, count: number) => {
        if (!asset.fields) return [];
        return Array.from({ length: count }).map((_, i) => {
            const row: any = {};
            asset.fields!.forEach(field => {
                if (field.primaryKey && field.name.includes('ID')) row[field.name] = `${1000 + i}`;
                else if (field.businessType === '姓名') row[field.name] = ['张三', '李四', '王五'][i % 3] + i;
                else if (field.type === 'DATE' || field.businessType === '日期') row[field.name] = '2024-05-20';
                else if (field.type === 'DECIMAL' || field.businessType === '金额') row[field.name] = (Math.random() * 10000).toFixed(2);
                else row[field.name] = `示例数据${i}`;
            });
            return row;
        });
    };

    // 获取所有可用选项用于筛选器
    const allOwners = Array.from(new Set(mockCatalogAssets.map(a => a.owner)));
    const allCategories = Array.from(new Set(mockCatalogAssets.map(a => a.category)));
    const allAccessLevels = Array.from(new Set(mockCatalogAssets.map(a => a.accessLevel)));
    const allUpdateFreqs = Array.from(new Set(mockCatalogAssets.map(a => a.updateFreq)));
    const allTags = Array.from(new Set(mockCatalogAssets.flatMap(a => a.tags)));
    const allApplications = Array.from(new Set(mockCatalogAssets.flatMap(a => a.applications || [])));

    return (
        <div className="flex flex-col h-full bg-slate-50 relative overflow-hidden">
            {/* Header Area */}
            <div className="flex-none px-6 py-5 bg-white border-b border-slate-200 z-20">
                <div className="flex items-center gap-8 mb-4">
                    {/* Left: Title Area */}
                    <div className="flex items-center gap-4 min-w-[280px]">
                        <div className="p-3 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-2xl shadow-lg shadow-blue-300/40">
                            <Search size={26} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">
                                找数
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5">
                                快速发现和获取数据资产
                            </p>
                        </div>
                    </div>

                    {/* Center: Search Bar */}
                    <div className="flex-1">
                        <SearchBar
                            searchTerm={searchTerm}
                            setSearchTerm={setSearchTerm}
                            searchMode={searchMode}
                            setSearchMode={setSearchMode}
                            searchSuggestions={['新生儿', '婚姻登记', '企业信用']}
                            showSuggestions={showSuggestions}
                            setShowSuggestions={setShowSuggestions}
                            searchHistory={searchHistory}
                            setSearchHistory={setSearchHistory}
                            isSearching={isSearching}
                            onSearch={handleSearch}
                        />
                    </div>
                </div>

                {/* Toolbar */}
                <div className="flex items-center justify-between">
                    <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
                        {[
                            { id: 'all', label: '全部资产' },
                            { id: 'business_object', label: '业务对象', icon: Box },
                            { id: 'logical_view', label: '逻辑视图', icon: FileText },
                            { id: 'interface', label: '接口服务', icon: Globe },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as ActiveTab)}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === tab.id
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                                    }`}
                            >
                                {tab.icon && <tab.icon size={16} />}
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg">
                            <ArrowUp size={14} className="text-slate-400" />
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as SortBy)}
                                className="text-sm border-none focus:ring-0 text-slate-600 bg-transparent pr-8 cursor-pointer"
                            >
                                <option value="relevance">相关度排序</option>
                                <option value="quality">质量评分排序</option>
                                <option value="updateTime">更新时间排序</option>
                            </select>
                        </div>

                        <div className="h-6 w-px bg-slate-200 mx-2"></div>

                        <button
                            onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}
                            className={`p-2 rounded-lg transition-colors relative ${showAdvancedFilter
                                ? 'bg-blue-50 text-blue-600'
                                : 'text-slate-500 hover:bg-slate-100'
                                }`}
                            title="高级筛选"
                        >
                            <Sliders size={20} />
                            {(filterOptions.owners.length > 0 || filterOptions.categories.length > 0) && (
                                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                            )}
                        </button>

                        <div className="flex bg-slate-100 rounded-lg p-1 border border-slate-200">
                            <button
                                onClick={() => setViewMode('card')}
                                className={`p-1.5 rounded-md transition-all ${viewMode === 'card'
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                <LayoutGrid size={18} />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-1.5 rounded-md transition-all ${viewMode === 'list'
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                <List size={18} />
                            </button>
                        </div>

                        <button
                            onClick={() => {
                                setIsBatchMode(!isBatchMode);
                                setSelectedAssetIds(new Set());
                            }}
                            className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors ${isBatchMode
                                ? 'bg-blue-50 border-blue-200 text-blue-700'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                        >
                            {isBatchMode ? '退出批量' : '批量管理'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Advanced Filter Panel */}
            {showAdvancedFilter && (
                <div className="flex-none px-6 pt-2 pb-4 z-10">
                    <AdvancedFilter
                        filterOptions={filterOptions}
                        setFilterOptions={setFilterOptions}
                        savedFilters={savedFilters}
                        setSavedFilters={setSavedFilters}
                        allOwners={allOwners}
                        allCategories={allCategories}
                        allAccessLevels={allAccessLevels}
                        allUpdateFreqs={allUpdateFreqs}
                        allTags={allTags}
                        allApplications={allApplications}
                        onClose={() => setShowAdvancedFilter(false)}
                        onApplyFilterPreset={handleApplyFilterPreset}
                        onDeleteFilterPreset={handleDeleteFilterPreset}
                        onSaveFilterPreset={handleSaveFilterPreset}
                    />
                </div>
            )}

            {/* Content Area */}
            <div className={`flex-1 overflow-y-auto px-6 py-4 custom-scrollbar ${isBatchMode ? 'pb-20' : ''}`}>
                {filteredAssets.length > 0 ? (
                    viewMode === 'card' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                            {filteredAssets.map(asset => (
                                <AssetCard
                                    key={asset.id}
                                    asset={asset}
                                    isSelected={selectedAssetIds.has(asset.id)}
                                    isBatchMode={isBatchMode}
                                    isFavorite={favorites.includes(asset.id)}
                                    onSelect={() => toggleAssetSelection(asset)}
                                    onToggleFavorite={() => toggleFavorite(asset.id)}
                                    onViewDetail={() => {
                                        setSelectedAsset(asset);
                                        setIsDrawerOpen(true);
                                    }}
                                    getCategoryIcon={getCategoryIcon}
                                    getCategoryColor={getCategoryColor}
                                />
                            ))}
                        </div>
                    ) : (
                        <AssetList
                            assets={filteredAssets}
                            isBatchMode={isBatchMode}
                            selectedAssetIds={selectedAssetIds}
                            favorites={favorites}
                            onSelect={toggleAssetSelection}
                            onToggleFavorite={toggleFavorite}
                            onViewDetail={(asset) => {
                                setSelectedAsset(asset);
                                setIsDrawerOpen(true);
                            }}
                            getCategoryIcon={getCategoryIcon}
                            getCategoryColor={getCategoryColor}
                        />
                    )
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 pb-20">
                        <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                            <Search size={40} className="text-slate-300" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-600 mb-2">未找到相关资产</h3>
                        <p className="text-sm max-w-sm text-center">
                            试试调整筛选条件，或者使用更通用的关键词搜索
                        </p>
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setFilterOptions({
                                    qualityRange: { min: 0, max: 100 },
                                    owners: [],
                                    categories: [],
                                    accessLevels: [],
                                    updateFreqs: [],
                                    tags: [],
                                    hasSensitiveFields: false,
                                    hasPrimaryKey: false,
                                    applications: []
                                });
                            }}
                            className="mt-6 px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 text-sm hover:bg-slate-50 transition-colors"
                        >
                            重置所有筛选
                        </button>
                    </div>
                )}
            </div>

            {/* Batch Operation Bar */}
            {isBatchMode && selectedAssetIds.size > 0 && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white backdrop-blur-md px-6 py-3 rounded-full shadow-2xl z-30 flex items-center gap-6 animate-in slide-in-from-bottom-4">
                    <span className="font-medium">已选择 {selectedAssetIds.size} 项</span>
                    <div className="h-4 w-px bg-white/20"></div>
                    <div className="flex items-center gap-2">
                        <button className="px-3 py-1.5 hover:bg-white/10 rounded-lg transition-colors text-sm">
                            批量导出
                        </button>
                        <button className="px-3 py-1.5 hover:bg-white/10 rounded-lg transition-colors text-sm">
                            申请权限
                        </button>
                        <button className="px-3 py-1.5 hover:bg-white/10 rounded-lg transition-colors text-sm text-red-300 hover:text-red-200">
                            删除
                        </button>
                    </div>
                    <button
                        onClick={() => setSelectedAssetIds(new Set())}
                        className="ml-2 p-1 hover:bg-white/10 rounded-full"
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* Detail Drawer/Modal */}
            <AssetDetail
                asset={selectedAsset || {} as Asset}
                isOpen={!!selectedAsset && isDrawerOpen}
                onClose={() => {
                    setIsDrawerOpen(false);
                    setTimeout(() => setSelectedAsset(null), 300);
                }}
                mode="drawer"
                detailTab={detailTab}
                setDetailTab={setDetailTab}
                getCategoryIcon={getCategoryIcon}
                getCategoryColor={getCategoryColor}
                generateSampleData={generateSampleData}
            />
        </div>
    );
};
