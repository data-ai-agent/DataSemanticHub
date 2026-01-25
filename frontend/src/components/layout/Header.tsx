import { useState } from 'react';
import {
    Search, Bell, HelpCircle, Settings, Grid,
    Headphones, FileText, ChevronDown, LogOut, User
} from 'lucide-react';
import { clearAuthInfo, getCurrentUser } from '../../utils/authUtils';

interface HeaderProps {
    activeModule: string;
    setActiveModule: (module: string) => void;
}

const Header = ({ activeModule, setActiveModule }: HeaderProps) => {
    const [showUserMenu, setShowUserMenu] = useState(false);
    const currentUser = getCurrentUser();

    // Initial generation logic
    const displayName = currentUser
        ? [currentUser.first_name, currentUser.last_name].filter(Boolean).join(' ').trim()
        : '';
    const displayEmail = currentUser?.email || '';
    const initials = (() => {
        const base = displayName || displayEmail;
        if (!base) return 'AI';
        const parts = base.trim().split(/\s+/);
        const letters = parts.map(part => part[0]).join('');
        return letters.slice(0, 2).toUpperCase();
    })();

    const handleLogout = () => {
        clearAuthInfo();
        setActiveModule('auth');
    };

    return (
        <header className="h-14 bg-white border-b border-[#DEE0E3] flex items-center justify-between px-4 shadow-sm z-30 relative">
            {/* Left: App Switcher / Title - Cleared as requested */}
            <div className="flex items-center gap-3 w-64">
                {/* Empty for layout balance or future use */}
            </div>

            {/* Center: Global Search */}
            <div className="flex-1 max-w-2xl px-4">
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search size={16} className="text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-1.5 bg-[#F2F3F5] border border-transparent rounded-md text-sm text-[#1F2329] placeholder-gray-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                        placeholder="搜索功能导航、组织数据、角色详情等"
                    />
                </div>
            </div>

            {/* Right: Toolbar & User Profile */}
            <div className="flex items-center gap-1 w-auto justify-end">
                {/* Icons */}
                {[
                    { icon: Headphones, title: '客服' },
                    { icon: FileText, title: '文档' },
                    { icon: Bell, title: '通知' },
                    { icon: HelpCircle, title: '帮助' },
                ].map((item, idx) => (
                    <button
                        key={idx}
                        className="p-2 text-[#646A73] hover:text-[#1F2329] hover:bg-[#F2F3F5] rounded-md transition-colors"
                        title={item.title}
                    >
                        <item.icon size={18} />
                    </button>
                ))}

                <div className="h-4 w-px bg-gray-300 mx-2"></div>

                {/* Removed Grid Icon as requested */}

                {/* User Avatar */}
                <div className="relative ml-1">
                    <button
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        className="flex items-center gap-2 rounded-full hover:bg-gray-100 p-1 pr-2 transition-colors"
                    >
                        <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-xs text-white font-medium">
                            {initials}
                        </div>
                        <div className="flex flex-col items-start leading-none">
                            <span className="text-xs font-medium text-[#1F2329]">AI</span>
                            <span className="text-[10px] text-[#8F959E] scale-90 origin-left">创建人</span>
                        </div>
                        <ChevronDown size={12} className="text-[#646A73]" />
                    </button>

                    {/* Dropdown Menu */}
                    {showUserMenu && (
                        <>
                            <div
                                className="fixed inset-0 z-10"
                                onClick={() => setShowUserMenu(false)}
                            />
                            <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-[#DEE0E3] py-2 z-20">
                                {/* User Info */}
                                <div className="px-4 py-3 border-b border-gray-100">
                                    <p className="text-sm font-medium text-[#1F2329]">{displayName || '未登录'}</p>
                                    <p className="text-xs text-[#8F959E] mt-1">{displayEmail || '—'}</p>
                                </div>

                                {/* Menu Items */}
                                <div className="py-1">
                                    <button className="w-full px-4 py-2 text-left text-sm text-[#1F2329] hover:bg-[#F2F3F5] flex items-center gap-3">
                                        <User size={16} />
                                        <span>个人资料</span>
                                    </button>
                                    <button className="w-full px-4 py-2 text-left text-sm text-[#1F2329] hover:bg-[#F2F3F5] flex items-center gap-3">
                                        <Settings size={16} />
                                        <span>系统设置</span>
                                    </button>
                                </div>

                                {/* Logout */}
                                <div className="border-t border-gray-100 pt-1">
                                    <button
                                        onClick={handleLogout}
                                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"
                                    >
                                        <LogOut size={16} />
                                        <span>退出登录</span>
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
