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
    Info, HelpCircle, AlertCircle, CheckCircle2, XCircle as XCircleIcon, Minus, Plus as PlusIcon,
    // 新增图标（只包含真实存在的）
    Cloud, CloudUpload, CloudDownload, Files, FileCode, FileJson, BookOpen,
    Wrench, Hammer, Plug, PlugZap,
    MessageSquare, Fingerprint, UserPlus, UserMinus, UserX, UserCheck, UserCircle,
    Rocket, Target, Compass, Map, Earth, GitCommit, GitPullRequest, GitCompare, GitFork,
    FolderTree, FolderPlus, FolderMinus, Package2, Boxes,
    Lightbulb,
    Play, Pause, Repeat, Shuffle, Volume2, VolumeX, Headphones, Mic, MicOff,
    ShoppingBag, ShoppingBasket, CreditCard, Receipt, QrCode, Barcode,
    Clipboard, ClipboardCheck, ClipboardList, ClipboardCopy, StickyNote, Notebook,
    PenTool, Palette, Layers2, Layers3,
    Grid3x3, Columns, AlignLeft, AlignCenter, AlignRight,
    Bold, Italic, Underline, List, ListOrdered,
    Hash, AtSign, Percent,
    ArrowUp, ArrowDown, ArrowLeft, Move, Maximize, Minimize,
    RotateCw, RotateCcw, Crop, Scissors, Eraser, Filter, Sliders,
    ChevronUp, ChevronLeft, MoreVertical,
    Copy, ExternalLink,
    Code,
    HardDrive, Router,
    Sun, Moon, Briefcase,
    Car,
    Circle, Square, Triangle,
    Sparkle, Bolt,
    Usb, Navigation, Pin,
    Scan, KeyRound, KeySquare, Ruler
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// 常用图标列表（按分类组织）
const ICON_CATEGORIES = {
    '常用': [
        { name: 'Layout', icon: Layout, key: 'Layout' },
        { name: 'LayoutGrid', icon: LayoutGrid, key: 'LayoutGrid' },
        { name: 'Activity', icon: Activity, key: 'Activity' },
        { name: 'Settings', icon: Settings, key: 'Settings' },
        { name: 'Search', icon: Search, key: 'Search' },
        { name: 'FileText', icon: FileText, key: 'FileText' },
        { name: 'Database', icon: Database, key: 'Database' },
        { name: 'Users', icon: Users, key: 'Users' },
        { name: 'UserCog', icon: UserCog, key: 'UserCog' },
        { name: 'Building2', icon: Building2, key: 'Building2' },
        { name: 'Shield', icon: Shield, key: 'Shield' },
        { name: 'Home', icon: Home, key: 'Home' },
        { name: 'Menu', icon: Menu, key: 'Menu' },
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
        { name: 'Activity', icon: Activity, key: 'Activity' },
    ],
    '用户': [
        { name: 'User', icon: User, key: 'User' },
        { name: 'Users', icon: Users, key: 'Users' },
        { name: 'UserCog', icon: UserCog, key: 'UserCog' },
        { name: 'UserPlus', icon: UserPlus, key: 'UserPlus' },
        { name: 'UserMinus', icon: UserMinus, key: 'UserMinus' },
        { name: 'UserX', icon: UserX, key: 'UserX' },
        { name: 'UserCheck', icon: UserCheck, key: 'UserCheck' },
        { name: 'UserCircle', icon: UserCircle, key: 'UserCircle' },
        { name: 'Fingerprint', icon: Fingerprint, key: 'Fingerprint' },
    ],
    '系统': [
        { name: 'Settings', icon: Settings, key: 'Settings' },
        { name: 'Shield', icon: Shield, key: 'Shield' },
        { name: 'ShieldCheck', icon: ShieldCheck, key: 'ShieldCheck' },
        { name: 'ShieldAlert', icon: ShieldAlert, key: 'ShieldAlert' },
        { name: 'Lock', icon: Lock, key: 'Lock' },
        { name: 'Key', icon: Key, key: 'Key' },
        { name: 'KeyRound', icon: KeyRound, key: 'KeyRound' },
        { name: 'KeySquare', icon: KeySquare, key: 'KeySquare' },
        { name: 'Unlock', icon: Unlock, key: 'Unlock' },
    ],
    '操作': [
        { name: 'Plus', icon: Plus, key: 'Plus' },
        { name: 'Edit', icon: Edit, key: 'Edit' },
        { name: 'Trash2', icon: Trash2, key: 'Trash2' },
        { name: 'Save', icon: Save, key: 'Save' },
        { name: 'Download', icon: Download, key: 'Download' },
        { name: 'Upload', icon: Upload, key: 'Upload' },
        { name: 'Copy', icon: Copy, key: 'Copy' },
        { name: 'ClipboardCheck', icon: ClipboardCheck, key: 'ClipboardCheck' },
        { name: 'RefreshCw', icon: RefreshCw, key: 'RefreshCw' },
        { name: 'RotateCw', icon: RotateCw, key: 'RotateCw' },
        { name: 'RotateCcw', icon: RotateCcw, key: 'RotateCcw' },
    ],
    '文件': [
        { name: 'File', icon: File, key: 'File' },
        { name: 'FileText', icon: FileText, key: 'FileText' },
        { name: 'Files', icon: Files, key: 'Files' },
        { name: 'FileCode', icon: FileCode, key: 'FileCode' },
        { name: 'FileJson', icon: FileJson, key: 'FileJson' },
        { name: 'FileImage', icon: Image, key: 'Image' },
        { name: 'FileVideo', icon: Video, key: 'Video' },
        { name: 'FolderOpen', icon: FolderOpen, key: 'FolderOpen' },
        { name: 'FolderTree', icon: FolderTree, key: 'FolderTree' },
        { name: 'FolderPlus', icon: FolderPlus, key: 'FolderPlus' },
        { name: 'FolderMinus', icon: FolderMinus, key: 'FolderMinus' },
        { name: 'Book', icon: Book, key: 'Book' },
        { name: 'BookOpen', icon: BookOpen, key: 'BookOpen' },
    ],
    '导航': [
        { name: 'Home', icon: Home, key: 'Home' },
        { name: 'Menu', icon: Menu, key: 'Menu' },
        { name: 'Layout', icon: Layout, key: 'Layout' },
        { name: 'LayoutGrid', icon: LayoutGrid, key: 'LayoutGrid' },
        { name: 'Network', icon: Network, key: 'Network' },
        { name: 'Link', icon: Link, key: 'Link' },
        { name: 'ExternalLink', icon: ExternalLink, key: 'ExternalLink' },
        { name: 'Compass', icon: Compass, key: 'Compass' },
        { name: 'Map', icon: Map, key: 'Map' },
        { name: 'MapPin', icon: MapPin, key: 'MapPin' },
        { name: 'Navigation', icon: Navigation, key: 'Navigation' },
    ],
    '工作流': [
        { name: 'GitBranch', icon: GitBranch, key: 'GitBranch' },
        { name: 'GitMerge', icon: GitMerge, key: 'GitMerge' },
        { name: 'GitCommit', icon: GitCommit, key: 'GitCommit' },
        { name: 'GitPullRequest', icon: GitPullRequest, key: 'GitPullRequest' },
        { name: 'GitCompare', icon: GitCompare, key: 'GitCompare' },
        { name: 'GitFork', icon: GitFork, key: 'GitFork' },
        { name: 'Layers', icon: Layers, key: 'Layers' },
        { name: 'Layers2', icon: Layers2, key: 'Layers2' },
        { name: 'Layers3', icon: Layers3, key: 'Layers3' },
    ],
    '状态': [
        { name: 'CheckCircle', icon: CheckCircle, key: 'CheckCircle' },
        { name: 'CheckCircle2', icon: CheckCircle2, key: 'CheckCircle2' },
        { name: 'XCircle', icon: XCircle, key: 'XCircle' },
        { name: 'AlertTriangle', icon: AlertTriangle, key: 'AlertTriangle' },
        { name: 'AlertCircle', icon: AlertCircle, key: 'AlertCircle' },
        { name: 'Info', icon: Info, key: 'Info' },
        { name: 'HelpCircle', icon: HelpCircle, key: 'HelpCircle' },
        { name: 'Check', icon: Check, key: 'Check' },
        { name: 'X', icon: X, key: 'X' },
        { name: 'Minus', icon: Minus, key: 'Minus' },
    ],
    '云存储': [
        { name: 'Cloud', icon: Cloud, key: 'Cloud' },
        { name: 'CloudUpload', icon: CloudUpload, key: 'CloudUpload' },
        { name: 'CloudDownload', icon: CloudDownload, key: 'CloudDownload' },
        { name: 'HardDrive', icon: HardDrive, key: 'HardDrive' },
        { name: 'Server', icon: Server, key: 'Server' },
        { name: 'Database', icon: Database, key: 'Database' },
    ],
    '设备': [
        { name: 'Monitor', icon: Monitor, key: 'Monitor' },
        { name: 'Laptop', icon: Laptop, key: 'Laptop' },
        { name: 'Smartphone', icon: Smartphone, key: 'Smartphone' },
        { name: 'Tablet', icon: Tablet, key: 'Tablet' },
        { name: 'Printer', icon: Printer, key: 'Printer' },
        { name: 'Camera', icon: Camera, key: 'Camera' },
        { name: 'Router', icon: Router, key: 'Router' },
        { name: 'Wifi', icon: Wifi, key: 'Wifi' },
        { name: 'Bluetooth', icon: Bluetooth, key: 'Bluetooth' },
        { name: 'Usb', icon: Usb, key: 'Usb' },
    ],
    '工具': [
        { name: 'Wrench', icon: Wrench, key: 'Wrench' },
        { name: 'Hammer', icon: Hammer, key: 'Hammer' },
        { name: 'Tool', icon: Settings, key: 'Settings' },
        { name: 'Plug', icon: Plug, key: 'Plug' },
        { name: 'PlugZap', icon: PlugZap, key: 'PlugZap' },
        { name: 'Scissors', icon: Scissors, key: 'Scissors' },
        { name: 'Crop', icon: Crop, key: 'Crop' },
        { name: 'Eraser', icon: Eraser, key: 'Eraser' },
        { name: 'Ruler', icon: Ruler, key: 'Ruler' },
    ],
    '其他': [
        { name: 'Book', icon: Book, key: 'Book' },
        { name: 'BookOpen', icon: BookOpen, key: 'BookOpen' },
        { name: 'Tag', icon: Tag, key: 'Tag' },
        { name: 'Bookmark', icon: Bookmark, key: 'Bookmark' },
        { name: 'MessageCircle', icon: MessageCircle, key: 'MessageCircle' },
        { name: 'MessageSquare', icon: MessageSquare, key: 'MessageSquare' },
        { name: 'Bell', icon: Bell, key: 'Bell' },
        { name: 'Mail', icon: Mail, key: 'Mail' },
        { name: 'Phone', icon: Phone, key: 'Phone' },
        { name: 'Calendar', icon: Calendar, key: 'Calendar' },
        { name: 'Clock', icon: Clock, key: 'Clock' },
        { name: 'Rocket', icon: Rocket, key: 'Rocket' },
        { name: 'Target', icon: Target, key: 'Target' },
        { name: 'Zap', icon: Zap, key: 'Zap' },
        { name: 'Bolt', icon: Bolt, key: 'Bolt' },
        { name: 'Sparkle', icon: Sparkle, key: 'Sparkle' },
        { name: 'Star', icon: Star, key: 'Star' },
        { name: 'Heart', icon: Heart, key: 'Heart' },
        { name: 'Trophy', icon: Trophy, key: 'Trophy' },
        { name: 'Award', icon: Award, key: 'Award' },
    ],
};

// 图标名称到组件的映射
const ICON_NAME_MAP: Record<string, LucideIcon> = {
    // 原有图标
    'Layout': Layout,
    'Database': Database,
    'GitMerge': GitMerge,
    'Server': Server,
    'Layers': Layers,
    'Search': Search,
    'FileText': FileText,
    'Activity': Activity,
    'Cpu': Cpu,
    'Link': Link,
    'RefreshCw': RefreshCw,
    'ChevronRight': ChevronRight,
    'Shield': Shield,
    'CheckSquare': CheckSquare,
    'Plus': Plus,
    'Upload': Upload,
    'FileCheck': FileCheck,
    'TrendingUp': TrendingUp,
    'MoreHorizontal': MoreHorizontal,
    'X': X,
    'AlertTriangle': AlertTriangle,
    'User': User,
    'Users': Users,
    'Clock': Clock,
    'MessageCircle': MessageCircle,
    'Send': Send,
    'Book': Book,
    'Tag': Tag,
    'CheckCircle': CheckCircle,
    'ArrowRight': ArrowRight,
    'Sparkles': Sparkles,
    'Box': Box,
    'Edit': Edit,
    'XCircle': XCircle,
    'ZoomIn': ZoomIn,
    'ZoomOut': ZoomOut,
    'Eye': Eye,
    'Share2': Share2,
    'Network': Network,
    'GitBranch': GitBranch,
    'Table': Table,
    'Globe': Globe,
    'ChevronDown': ChevronDown,
    'Check': Check,
    'ScanText': ScanText,
    'Verified': Verified,
    'Lock': Lock,
    'History': History,
    'Bookmark': Bookmark,
    'LayoutGrid': LayoutGrid,
    'Building2': Building2,
    'UserCog': UserCog,
    'PanelLeftClose': PanelLeftClose,
    'Grip': Grip,
    'Settings': Settings,
    'BarChart3': BarChart3,
    'PieChart': PieChart,
    'FileBarChart': FileBarChart,
    'LineChart': LineChart,
    'TrendingDown': TrendingDown,
    'Home': Home,
    'Menu': Menu,
    'Save': Save,
    'Download': Download,
    'Trash2': Trash2,
    'Archive': Archive,
    'Star': Star,
    'Heart': Heart,
    'ThumbsUp': ThumbsUp,
    'Flag': Flag,
    'Award': Award,
    'Trophy': Trophy,
    'Zap': Zap,
    'Power': Power,
    'Battery': Battery,
    'Wifi': Wifi,
    'Bluetooth': Bluetooth,
    'Radio': Radio,
    'Tv': Tv,
    'Monitor': Monitor,
    'Smartphone': Smartphone,
    'Tablet': Tablet,
    'Laptop': Laptop,
    'Printer': Printer,
    'Key': Key,
    'Unlock': Unlock,
    'EyeOff': EyeOffIcon,
    'ShieldCheck': ShieldCheck,
    'ShieldAlert': ShieldAlert,
    'Info': Info,
    'HelpCircle': HelpCircle,
    'AlertCircle': AlertCircle,
    'CheckCircle2': CheckCircle2,
    'Minus': Minus,
    'Calendar': Calendar,
    'Bell': Bell,
    'Mail': Mail,
    'Phone': Phone,
    'MapPin': MapPin,
    'Camera': Camera,
    'Image': Image,
    'Video': Video,
    'Music': Music,
    'File': File,
    'FolderOpen': FolderOpen,
    // 新增图标
    'Cloud': Cloud,
    'CloudUpload': CloudUpload,
    'CloudDownload': CloudDownload,
    'Files': Files,
    'FileCode': FileCode,
    'FileJson': FileJson,
    'BookOpen': BookOpen,
    'Wrench': Wrench,
    'Hammer': Hammer,
    'Plug': Plug,
    'PlugZap': PlugZap,
    'MessageSquare': MessageSquare,
    'Fingerprint': Fingerprint,
    'UserPlus': UserPlus,
    'UserMinus': UserMinus,
    'UserX': UserX,
    'UserCheck': UserCheck,
    'UserCircle': UserCircle,
    'Rocket': Rocket,
    'Target': Target,
    'Compass': Compass,
    'Map': Map,
    'Earth': Earth,
    'GitCommit': GitCommit,
    'GitPullRequest': GitPullRequest,
    'GitCompare': GitCompare,
    'GitFork': GitFork,
    'FolderTree': FolderTree,
    'FolderPlus': FolderPlus,
    'FolderMinus': FolderMinus,
    'Package2': Package2,
    'Boxes': Boxes,
    'Lightbulb': Lightbulb,
    'Play': Play,
    'Pause': Pause,
    'Volume2': Volume2,
    'VolumeX': VolumeX,
    'Headphones': Headphones,
    'Mic': Mic,
    'MicOff': MicOff,
    'ShoppingBag': ShoppingBag,
    'ShoppingBasket': ShoppingBasket,
    'CreditCard': CreditCard,
    'Receipt': Receipt,
    'QrCode': QrCode,
    'Barcode': Barcode,
    'Clipboard': Clipboard,
    'ClipboardCheck': ClipboardCheck,
    'ClipboardList': ClipboardList,
    'ClipboardCopy': ClipboardCopy,
    'StickyNote': StickyNote,
    'Notebook': Notebook,
    'PenTool': PenTool,
    'Palette': Palette,
    'Layers2': Layers2,
    'Layers3': Layers3,
    'Grid3x3': Grid3x3,
    'Columns': Columns,
    'AlignLeft': AlignLeft,
    'AlignCenter': AlignCenter,
    'AlignRight': AlignRight,
    'Bold': Bold,
    'Italic': Italic,
    'Underline': Underline,
    'List': List,
    'ListOrdered': ListOrdered,
    'Hash': Hash,
    'AtSign': AtSign,
    'Percent': Percent,
    'DollarSign': DollarSign,
    'ArrowUp': ArrowUp,
    'ArrowDown': ArrowDown,
    'ArrowLeft': ArrowLeft,
    'Move': Move,
    'Maximize': Maximize,
    'Minimize': Minimize,
    'RotateCw': RotateCw,
    'RotateCcw': RotateCcw,
    'Crop': Crop,
    'Scissors': Scissors,
    'Eraser': Eraser,
    'Filter': Filter,
    'Sliders': Sliders,
    'ChevronUp': ChevronUp,
    'ChevronLeft': ChevronLeft,
    'MoreVertical': MoreVertical,
    'Copy': Copy,
    'ExternalLink': ExternalLink,
    'Code': Code,
    'HardDrive': HardDrive,
    'Router': Router,
    'Sun': Sun,
    'Moon': Moon,
    'Briefcase': Briefcase,
    'Car': Car,
    'Circle': Circle,
    'Square': Square,
    'Triangle': Triangle,
    'Sparkle': Sparkle,
    'Bolt': Bolt,
    'Usb': Usb,
    'Navigation': Navigation,
    'Pin': Pin,
    'Scan': Scan,
    'KeyRound': KeyRound,
    'KeySquare': KeySquare,
    'Ruler': Ruler,
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
                                            className={`px-2.5 py-1 text-xs rounded whitespace-nowrap transition-colors ${activeCategory === category
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
                                                        className={`p-2 rounded-lg border transition-colors ${value === name
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
                                                    className={`p-2 rounded-lg border transition-colors ${value === name
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
