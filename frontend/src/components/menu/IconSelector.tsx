import { useState } from 'react';
import {
    Layout, Database, GitMerge, Server, Layers,
    Search, FileText, Activity, Cpu, Link,
    RefreshCw, ChevronRight, Shield, CheckSquare,
    Plus, Upload, FileCheck, TrendingUp, MoreHorizontal, X, AlertTriangle, User, Users, Clock, MessageCircle, Send,
    Book, Tag, CheckCircle, ArrowRight, Sparkles, Box, Edit, XCircle, ZoomIn, ZoomOut, Eye, Share2, Network, GitBranch, Table, Globe, ChevronDown, Check,
    ScanText, Verified, Lock, History, Bookmark, LayoutGrid, Building2, UserCog, PanelLeftClose, Grip, Settings,
    BarChart3, PieChart, FileBarChart, LineChart, TrendingDown, DollarSign, ShoppingCart, Package, Home, Menu,
    Calendar, Clock as ClockIcon, Bell, Mail, Phone, MapPin, Camera, Image, Video, Music, File, FolderOpen,
    Save, Download, Upload as UploadIcon, Trash2, Archive, Star, Heart, ThumbsUp, Flag, Award, Trophy,
    Zap, Power, Battery, Wifi, Bluetooth, Radio, Tv, Monitor, Smartphone, Tablet, Laptop, Printer,
    Key, Lock as LockIcon, Unlock, Eye as EyeIcon, EyeOff as EyeOffIcon, ShieldCheck, ShieldAlert,
    Info, HelpCircle, AlertCircle, CheckCircle2, XCircle as XCircleIcon, Minus, Plus as PlusIcon
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// 常用图标列表（按分类组织）
const ICON_CATEGORIES = {
    '常用': [
        { name: 'Layout', icon: Layout, key: 'Layout' },
        { name: 'Activity', icon: Activity, key: 'Activity' },
        { name: 'Settings', icon: Settings, key: 'Settings' },
        { name: 'Search', icon: Search, key: 'Search' },
        { name: 'FileText', icon: FileText, key: 'FileText' },
        { name: 'Database', icon: Database, key: 'Database' },
        { name: 'Users', icon: Users, key: 'Users' },
        { name: 'UserCog', icon: UserCog, key: 'UserCog' },
        { name: 'Building2', icon: Building2, key: 'Building2' },
        { name: 'Shield', icon: Shield, key: 'Shield' },
    ],
    '数据': [
        { name: 'Database', icon: Database, key: 'Database' },
        { name: 'Table', icon: Table, key: 'Table' },
        { name: 'BarChart3', icon: BarChart3, key: 'BarChart3' },
        { name: 'PieChart', icon: PieChart, key: 'PieChart' },
        { name: 'LineChart', icon: LineChart, key: 'LineChart' },
        { name: 'FileBarChart', icon: FileBarChart, key: 'FileBarChart' },
        { name: 'TrendingUp', icon: TrendingUp, key: 'TrendingUp' },
        { name: 'TrendingDown', icon: TrendingDown, key: 'TrendingDown' },
    ],
    '用户': [
        { name: 'User', icon: User, key: 'User' },
        { name: 'Users', icon: Users, key: 'Users' },
        { name: 'UserCog', icon: UserCog, key: 'UserCog' },
        { name: 'UserPlus', icon: Plus, key: 'Plus' },
    ],
    '系统': [
        { name: 'Settings', icon: Settings, key: 'Settings' },
        { name: 'Cog', icon: Settings, key: 'Settings' },
        { name: 'Shield', icon: Shield, key: 'Shield' },
        { name: 'Lock', icon: Lock, key: 'Lock' },
        { name: 'Key', icon: Key, key: 'Key' },
        { name: 'ShieldCheck', icon: ShieldCheck, key: 'ShieldCheck' },
    ],
    '操作': [
        { name: 'Plus', icon: Plus, key: 'Plus' },
        { name: 'Edit', icon: Edit, key: 'Edit' },
        { name: 'Trash2', icon: Trash2, key: 'Trash2' },
        { name: 'Save', icon: Save, key: 'Save' },
        { name: 'Download', icon: Download, key: 'Download' },
        { name: 'Upload', icon: Upload, key: 'Upload' },
    ],
    '导航': [
        { name: 'Home', icon: Home, key: 'Home' },
        { name: 'Menu', icon: Menu, key: 'Menu' },
        { name: 'Layout', icon: Layout, key: 'Layout' },
        { name: 'LayoutGrid', icon: LayoutGrid, key: 'LayoutGrid' },
        { name: 'Network', icon: Network, key: 'Network' },
        { name: 'Link', icon: Link, key: 'Link' },
    ],
    '状态': [
        { name: 'CheckCircle', icon: CheckCircle, key: 'CheckCircle' },
        { name: 'XCircle', icon: XCircle, key: 'XCircle' },
        { name: 'AlertTriangle', icon: AlertTriangle, key: 'AlertTriangle' },
        { name: 'Info', icon: Info, key: 'Info' },
        { name: 'HelpCircle', icon: HelpCircle, key: 'HelpCircle' },
    ],
    '其他': [
        { name: 'Book', icon: Book, key: 'Book' },
        { name: 'Tag', icon: Tag, key: 'Tag' },
        { name: 'Bookmark', icon: Bookmark, key: 'Bookmark' },
        { name: 'MessageCircle', icon: MessageCircle, key: 'MessageCircle' },
        { name: 'Bell', icon: Bell, key: 'Bell' },
        { name: 'Mail', icon: Mail, key: 'Mail' },
    ],
};

// 图标名称到组件的映射
const ICON_NAME_MAP: Record<string, LucideIcon> = {
    Layout, Database, GitMerge, Server, Layers,
    Search, FileText, Activity, Cpu, Link,
    RefreshCw, ChevronRight, Shield, CheckSquare,
    Plus, Upload, FileCheck, TrendingUp, MoreHorizontal, X, AlertTriangle, User, Users, Clock, MessageCircle, Send,
    Book, Tag, CheckCircle, ArrowRight, Sparkles, Box, Edit, XCircle, ZoomIn, ZoomOut, Eye, Share2, Network, GitBranch, Table, Globe, ChevronDown, Check,
    ScanText, Verified, Lock, History, Bookmark, LayoutGrid, Building2, UserCog, PanelLeftClose, Grip, Settings,
    BarChart3, PieChart, FileBarChart, LineChart, TrendingDown, DollarSign, ShoppingCart, Package, Home, Menu,
    Calendar, ClockIcon, Bell, Mail, Phone, MapPin, Camera, Image, Video, Music, File, FolderOpen,
    Save, Download, UploadIcon, Trash2, Archive, Star, Heart, ThumbsUp, Flag, Award, Trophy,
    Zap, Power, Battery, Wifi, Bluetooth, Radio, Tv, Monitor, Smartphone, Tablet, Laptop, Printer,
    Key, LockIcon, Unlock, EyeIcon, EyeOffIcon, ShieldCheck, ShieldAlert,
    Info, HelpCircle, AlertCircle, CheckCircle2, XCircleIcon, Minus, PlusIcon
};

interface IconSelectorProps {
    value?: string; // 图标名称（如 'Layout', 'Database'）
    onChange: (iconName: string) => void;
    label?: string;
}

export const IconSelector: React.FC<IconSelectorProps> = ({ value, onChange, label = '图标' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState<string>('常用');

    // 获取当前选中的图标组件
    const SelectedIcon = value && ICON_NAME_MAP[value] ? ICON_NAME_MAP[value] : Layout;

    // 过滤图标
    const filteredIcons = Object.entries(ICON_CATEGORIES).reduce((acc, [category, icons]) => {
        if (searchTerm) {
            const filtered = icons.filter(icon => 
                icon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                icon.key.toLowerCase().includes(searchTerm.toLowerCase())
            );
            if (filtered.length > 0) {
                acc[category] = filtered;
            }
        } else {
            acc[category] = icons;
        }
        return acc;
    }, {} as Record<string, typeof ICON_CATEGORIES['常用']>);

    const categoriesToShow = searchTerm 
        ? Object.keys(filteredIcons) 
        : Object.keys(ICON_CATEGORIES);

    return (
        <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">{label}</label>
            <div className="relative">
                {/* 当前选中的图标显示 */}
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full flex items-center gap-3 px-3 py-2 border border-slate-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors"
                >
                    <div className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded bg-white">
                        <SelectedIcon size={18} className="text-slate-600" />
                    </div>
                    <span className="flex-1 text-left text-sm text-slate-700 font-mono">
                        {value || 'Layout'}
                    </span>
                    <ChevronDown 
                        size={16} 
                        className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
                    />
                </button>

                {/* 图标选择弹窗 */}
                {isOpen && (
                    <>
                        <div 
                            className="fixed inset-0 z-40" 
                            onClick={() => setIsOpen(false)}
                        />
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-50 max-h-96 overflow-hidden flex flex-col">
                            {/* 搜索框 */}
                            <div className="p-3 border-b border-slate-100">
                                <div className="relative">
                                    <Search size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="搜索图标..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:border-indigo-500 focus:outline-none"
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </div>
                            </div>

                            {/* 分类标签 */}
                            {!searchTerm && (
                                <div className="px-3 py-2 border-b border-slate-100 flex gap-1 overflow-x-auto">
                                    {Object.keys(ICON_CATEGORIES).map(category => (
                                        <button
                                            key={category}
                                            onClick={() => setActiveCategory(category)}
                                            className={`px-2.5 py-1 text-xs rounded whitespace-nowrap transition-colors ${
                                                activeCategory === category
                                                    ? 'bg-indigo-100 text-indigo-700 font-medium'
                                                    : 'text-slate-600 hover:bg-slate-100'
                                            }`}
                                        >
                                            {category}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* 图标列表 */}
                            <div className="flex-1 overflow-y-auto p-3">
                                {searchTerm ? (
                                    // 搜索模式：显示所有匹配的图标
                                    categoriesToShow.map(category => (
                                        <div key={category} className="mb-4 last:mb-0">
                                            <h4 className="text-xs font-semibold text-slate-500 mb-2">{category}</h4>
                                            <div className="grid grid-cols-8 gap-2">
                                                {filteredIcons[category].map(({ name, icon: Icon, key }) => (
                                                    <button
                                                        key={key}
                                                        type="button"
                                                        onClick={() => {
                                                            onChange(name);
                                                            setIsOpen(false);
                                                            setSearchTerm('');
                                                        }}
                                                        className={`p-2 rounded-lg border transition-colors ${
                                                            value === name
                                                                ? 'border-indigo-500 bg-indigo-50'
                                                                : 'border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30'
                                                        }`}
                                                        title={name}
                                                    >
                                                        <Icon size={18} className="text-slate-600 mx-auto" />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    // 分类模式：只显示当前分类
                                    <div>
                                        <h4 className="text-xs font-semibold text-slate-500 mb-2">{activeCategory}</h4>
                                        <div className="grid grid-cols-8 gap-2">
                                            {ICON_CATEGORIES[activeCategory as keyof typeof ICON_CATEGORIES].map(({ name, icon: Icon, key }) => (
                                                <button
                                                    key={key}
                                                    type="button"
                                                    onClick={() => {
                                                        onChange(name);
                                                        setIsOpen(false);
                                                    }}
                                                    className={`p-2 rounded-lg border transition-colors ${
                                                        value === name
                                                            ? 'border-indigo-500 bg-indigo-50'
                                                            : 'border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30'
                                                    }`}
                                                    title={name}
                                                >
                                                    <Icon size={18} className="text-slate-600 mx-auto" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
