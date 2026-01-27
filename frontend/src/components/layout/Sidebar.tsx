import React, { useState } from 'react';
import {
    Layout, Database, GitMerge, Server, Layers,
    Search, FileText, Activity, Cpu, Link,
    RefreshCw, ChevronRight, Shield, CheckSquare,
    Plus, Upload, FileCheck, TrendingUp, MoreHorizontal, X, AlertTriangle, Users, Clock, MessageCircle, Send,
    Book, Tag, CheckCircle, ArrowRight, Sparkles, Box, Edit, XCircle, ZoomIn, ZoomOut, Eye, Share2, Network, GitBranch, Table, Globe, ChevronDown, Check,
    ScanText, Verified, Lock, History, Bookmark, LayoutGrid, Building2, UserCog, PanelLeftClose, Grip
} from 'lucide-react';

import { AppProduct, MenuGroup, ProductId } from '../../config/menuConfig';

interface SidebarProps {
    activeModule: string;
    setActiveModule: (module: string) => void;
    activeProduct: ProductId;
    setActiveProduct: (productId: ProductId) => void;
    menus: MenuGroup[];
    products: AppProduct[];
}

const Sidebar = ({
    activeModule,
    setActiveModule,
    activeProduct,
    setActiveProduct,
    menus,
    products
}: SidebarProps) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [expandedItems, setExpandedItems] = useState<string[]>(['semantic_modeling']);
    const [collapsedGroups, setCollapsedGroups] = useState<string[]>([]);
    const [showAppMenu, setShowAppMenu] = useState(false);

    const toggleExpand = (id: string) => {
        setExpandedItems(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const toggleGroup = (title: string) => {
        setCollapsedGroups(prev =>
            prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]
        );
    };

    const activeProductMeta = products.find(product => product.id === activeProduct);

    return (
        <aside className={`${isCollapsed ? 'w-16' : 'w-64'} bg-[#F7F8FA] flex flex-col border-r border-[#DEE0E3] z-20 transition-all duration-300 font-sans`}>
            {/* Logo Header */}
            <div className="h-14 flex items-center px-4 shrink-0 border-b border-[#DEE0E3] relative">
                <div className={`flex items-center w-full ${isCollapsed ? 'justify-center' : ''}`}>
                    {/* Brand Logo */}
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0 text-white cursor-pointer hover:bg-blue-700 transition-colors">
                        <Link size={18} />
                    </div>

                    {!isCollapsed && (
                        <>
                            {/* App Title */}
                            <div className="ml-2 overflow-hidden transition-opacity duration-300">
                                <h1 className="font-bold text-[#1F2329] tracking-tight whitespace-nowrap text-sm">{activeProductMeta?.name ?? '数据语义治理'}</h1>
                                <p className="text-[10px] text-[#8F959E] tracking-wider whitespace-nowrap">企业版</p>
                            </div>

                            {/* App Launcher Trigger - Moved to right of title */}
                            <button
                                className="ml-auto p-1.5 text-[#646A73] hover:bg-[#EBEDF0] hover:text-[#1F2329] rounded-md transition-colors relative"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowAppMenu(!showAppMenu);
                                }}
                            >
                                <Grip size={18} />
                            </button>
                        </>
                    )}
                </div>

                {/* App Launcher Menu */}
                {!isCollapsed && showAppMenu && (
                    <>
                        <div className="fixed inset-0 z-30" onClick={() => setShowAppMenu(false)} />
                        <div className="absolute top-12 left-4 right-4 bg-white rounded-lg shadow-xl border border-[#DEE0E3] p-4 z-40 animate-in fade-in zoom-in-95 duration-200">
                            <h3 className="text-xs font-medium text-[#8F959E] mb-3 px-1">产品导航</h3>
                            <div className="grid grid-cols-3 gap-y-4 gap-x-1">
                                {products.map((app, i) => (
                                    <div
                                        key={i}
                                        className={`flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-[#F2F3F5] cursor-pointer transition-colors group ${activeProduct === app.id ? 'bg-[#F2F3F5]' : ''}`}
                                        onClick={() => {
                                            setActiveProduct(app.id);
                                            setShowAppMenu(false);
                                        }}
                                    >
                                        <div className={`w-10 h-10 rounded-xl ${app.color} flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform`}>
                                            {(() => {
                                                const IconComponent = app.icon;
                                                if (!IconComponent) return null;
                                                if (typeof IconComponent === 'string') return null;
                                                try {
                                                    return React.createElement(IconComponent, {
                                                        size: 20,
                                                        strokeWidth: 1.5
                                                    });
                                                } catch (e) {
                                                    console.error('Error rendering app icon:', e, IconComponent);
                                                    return null;
                                                }
                                            })()}
                                        </div>
                                        <span className="text-[10px] text-[#1F2329] font-medium text-center leading-tight">{app.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Menu Items */}
            <div className="flex-1 overflow-y-auto py-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {menus.map((group, idx) => {
                    return (
                        <div key={idx} className={`mb-3 ${isCollapsed ? 'px-2' : 'px-3'}`}>
                            {!isCollapsed && (
                                <div
                                    className="flex items-center justify-between cursor-pointer mb-1 px-3 py-1 group"
                                    onClick={() => toggleGroup(group.title)}
                                >
                                    <h3 className="text-xs font-medium text-[#8F959E] group-hover:text-[#1F2329] transition-colors">
                                        {group.title}
                                    </h3>
                                    <ChevronRight
                                        size={12}
                                        className={`text-[#8F959E] transition-transform duration-200 ${collapsedGroups.includes(group.title) ? '' : 'rotate-90'} opacity-0 group-hover:opacity-100`}
                                    />
                                </div>
                            )}
                            {isCollapsed && idx > 0 && <div className="border-t border-[#DEE0E3] mx-2 my-2" />}

                            <div className={`space-y-1 transition-all duration-300 ${!isCollapsed && collapsedGroups.includes(group.title) ? 'hidden' : ''}`}>
                                {group.items.map(item => {
                                    const hasChildren = item.children && item.children.length > 0;
                                    const isExpanded = expandedItems.includes(item.id);
                                    const isActive = activeModule === item.id || (hasChildren && item.children?.some(child => child.id === activeModule));

                                    return (
                                        <div key={item.id}>
                                            <button
                                                onClick={() => {
                                                    if (hasChildren) {
                                                        toggleExpand(item.id);
                                                    } else {
                                                        setActiveModule(item.id);
                                                    }
                                                }}
                                                title={isCollapsed ? item.label : undefined}
                                                className={`w-full flex items-center relative group/item ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2.5 rounded-md text-sm transition-all duration-200 ${isActive
                                                    ? 'bg-[#EAEBEF] text-[#1F2329] font-medium'
                                                    : 'text-[#646A73] hover:bg-[#EBEDF0] hover:text-[#1F2329]'
                                                    }`}
                                            >
                                                {(() => {
                                                    const IconComponent = item.icon;

                                                    // Comprehensive validation
                                                    if (!IconComponent) {
                                                        console.warn('Icon is null/undefined for item:', item.id, item.label);
                                                        return null;
                                                    }

                                                    if (typeof IconComponent === 'string') {
                                                        console.warn('Icon is a string for item:', item.id, item.label, IconComponent);
                                                        return null;
                                                    }

                                                    // Check if it's a valid React component
                                                    const isFunction = typeof IconComponent === 'function';
                                                    const isObject = typeof IconComponent === 'object';
                                                    const hasRenderProp = isObject && 'render' in IconComponent;
                                                    const hasTypeof = isObject && '$$typeof' in IconComponent;

                                                    if (!isFunction && !hasRenderProp && !hasTypeof) {
                                                        console.error('Invalid icon component for item:', item.id, item.label, {
                                                            type: typeof IconComponent,
                                                            keys: Object.keys(IconComponent || {}),
                                                            IconComponent
                                                        });
                                                        return null;
                                                    }

                                                    // Use createElement for safer rendering
                                                    try {
                                                        return React.createElement(IconComponent, {
                                                            size: 18,
                                                            strokeWidth: 1.5,
                                                            className: `shrink-0 ${isActive ? 'text-[#1F2329]' : 'text-[#646A73] group-hover/item:text-[#1F2329]'}`
                                                        });
                                                    } catch (e) {
                                                        console.error('Error rendering icon for item:', item.id, item.label, e, {
                                                            IconComponent,
                                                            type: typeof IconComponent,
                                                            keys: Object.keys(IconComponent || {})
                                                        });
                                                        return null;
                                                    }
                                                })()}
                                                {!isCollapsed && <span className="truncate flex-1 text-left">{item.label}</span>}
                                                {!isCollapsed && hasChildren && (
                                                    <ChevronRight
                                                        size={14}
                                                        className={`text-[#8F959E] transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                                                    />
                                                )}
                                            </button>

                                            {/* Submenu */}
                                            {!isCollapsed && hasChildren && isExpanded && (
                                                <div className="mt-1 space-y-1">
                                                    {item.children?.map(child => (
                                                        <button
                                                            key={child.id}
                                                            onClick={() => setActiveModule(child.id)}
                                                            className={`w-full flex items-center gap-3 pl-10 pr-3 py-2 rounded-md text-sm transition-all duration-200 ${activeModule === child.id
                                                                ? 'text-[#1F2329] bg-[#EAEBEF] font-medium'
                                                                : 'text-[#646A73] hover:text-[#1F2329] hover:bg-[#EBEDF0]'
                                                                }`}
                                                        >
                                                            <span className="truncate">{child.label}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Footer / Toggle Button */}
            {/* Footer / Toggle Button */}
            <div className="px-3 py-3 border-t border-[#DEE0E3] shrink-0 bg-[#F7F8FA]">
                <div className="relative group/toggle">
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-3'} py-2 rounded-lg text-[#646A73] hover:bg-[#EBEDF0] hover:text-[#1F2329] transition-colors`}
                    >
                        {/* Custom Icon: Left Arrow + Lines */}
                        <div className={`transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M5 12L9 8V16L5 12Z" fill="currentColor" />
                                <path d="M11 7H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                <path d="M11 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                <path d="M11 17H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </div>

                        {!isCollapsed && <span className="text-sm font-medium">收起导航</span>}
                    </button>

                    {/* Tooltip */}
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-[#1F2329] text-white text-xs rounded opacity-0 invisible group-hover/toggle:opacity-100 group-hover/toggle:visible transition-all whitespace-nowrap z-50">
                        {isCollapsed ? '展开' : '收起'}
                        {/* Tooltip Arrow */}
                        <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-r-[4px] border-r-[#1F2329]"></div>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
