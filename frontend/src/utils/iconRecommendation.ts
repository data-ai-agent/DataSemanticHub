import { LayoutGrid, Database, Settings, Users, Building2, FileText, Search, Activity, Shield, Book, Network, Layers, Link2, Folder, Layout } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/**
 * 根据菜单名称或编码推荐图标
 * @param name 菜单名称
 * @param code 菜单编码
 * @param type 菜单类型
 * @returns 推荐的图标名称
 */
export function recommendIconByName(name: string, code?: string, type?: string): string {
    const nameLower = name.toLowerCase();
    const codeLower = (code || '').toLowerCase();
    const combined = `${nameLower} ${codeLower}`;

    // 根据关键词匹配推荐图标
    if (combined.includes('用户') || combined.includes('user') || combined.includes('人员')) {
        return 'Users';
    }
    if (combined.includes('组织') || combined.includes('org') || combined.includes('部门') || combined.includes('dept')) {
        return 'Building2';
    }
    if (combined.includes('菜单') || combined.includes('menu')) {
        return 'Menu';
    }
    if (combined.includes('权限') || combined.includes('permission') || combined.includes('角色') || combined.includes('role')) {
        return 'Shield';
    }
    if (combined.includes('设置') || combined.includes('setting') || combined.includes('配置') || combined.includes('config')) {
        return 'Settings';
    }
    if (combined.includes('数据') || combined.includes('data')) {
        if (combined.includes('服务') || combined.includes('service')) {
            return 'Server';
        }
        if (combined.includes('连接') || combined.includes('connect') || combined.includes('连接')) {
            return 'Network';
        }
        if (combined.includes('目录') || combined.includes('catalog')) {
            return 'Database';
        }
        return 'Database';
    }
    if (combined.includes('语义') || combined.includes('semantic')) {
        if (combined.includes('资产') || combined.includes('asset')) {
            return 'Book';
        }
        if (combined.includes('建模') || combined.includes('modeling')) {
            return 'Layers';
        }
        return 'Activity';
    }
    if (combined.includes('工作流') || combined.includes('workflow')) {
        return 'GitBranch';
    }
    if (combined.includes('审批') || combined.includes('approval') || combined.includes('审核') || combined.includes('audit')) {
        return 'FileCheck';
    }
    if (combined.includes('日志') || combined.includes('log') || combined.includes('审计')) {
        return 'FileText';
    }
    if (combined.includes('搜索') || combined.includes('search') || combined.includes('查找')) {
        return 'Search';
    }
    if (combined.includes('场景') || combined.includes('scenario') || combined.includes('编排') || combined.includes('orchestration')) {
        return 'Layers';
    }
    if (combined.includes('智能体') || combined.includes('agent')) {
        return 'Cpu';
    }
    if (combined.includes('模板') || combined.includes('template')) {
        return 'FileText';
    }
    if (combined.includes('工具') || combined.includes('tool')) {
        return 'Settings';
    }
    if (combined.includes('知识') || combined.includes('knowledge')) {
        return 'Book';
    }
    if (combined.includes('外链') || combined.includes('external') || combined.includes('链接') || combined.includes('link')) {
        return 'Link2';
    }
    if (type === '目录' || type === 'directory') {
        return 'Folder';
    }
    if (type === '页面' || type === 'page') {
        return 'FileText';
    }

    // 默认推荐
    return 'LayoutGrid';
}
