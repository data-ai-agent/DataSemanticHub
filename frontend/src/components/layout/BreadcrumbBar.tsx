import { ChevronRight } from 'lucide-react';
import { MenuGroup } from '../../config/menuConfig';

interface BreadcrumbBarProps {
    activeModule: string;
    menus: MenuGroup[];
}

const BreadcrumbBar = ({ activeModule, menus }: BreadcrumbBarProps) => {
    // 查找当前模块的路径
    const findPath = (targetId: string): { group: string; parent?: string; current: string } | null => {
        for (const group of menus) {
            for (const item of group.items) {
                // Check level 1
                if (item.id === targetId) {
                    return { group: group.title, current: item.label };
                }
                // Check level 2 (children)
                if (item.children) {
                    const child = item.children.find(c => c.id === targetId);
                    if (child) {
                        return {
                            group: group.title,
                            parent: item.label,
                            current: child.label
                        };
                    }
                }
            }
        }
        return null; // Should not happen if ID uses standard menus
    };

    const pathInfo = findPath(activeModule);

    if (!pathInfo) {
        // Fallback for non-menu modules (like auth or deep links)
        return null;
    }

    return (
        <div className="h-10 bg-white border-b border-[#DEE0E3] flex items-center justify-between px-4 shrink-0 transition-all">
            {/* Breadcrumb Items */}
            <div className="flex items-center text-sm text-[#646A73]">
                {/* Group Name always shown */}
                <span className="hover:text-[#1F2329] cursor-pointer transition-colors">{pathInfo.group}</span>
                <ChevronRight size={14} className="mx-2 text-[#8F959E]" />

                {/* Parent Item (if exists) */}
                {pathInfo.parent && (
                    <>
                        <span className="hover:text-[#1F2329] cursor-pointer transition-colors">{pathInfo.parent}</span>
                        <ChevronRight size={14} className="mx-2 text-[#8F959E]" />
                    </>
                )}

                {/* Current Item */}
                <span className="font-medium text-[#1F2329]">{pathInfo.current}</span>
            </div>

            {/* Right Side Actions removed as requested */}
        </div>
    );
};

export default BreadcrumbBar;
