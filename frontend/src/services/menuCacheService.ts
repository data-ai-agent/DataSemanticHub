import { MenuGroup, ProductId } from '../config/menuConfig';
import { Menu } from './menuService';

const MENU_CACHE_KEY_PREFIX = 'sidebar_menus_cache_';
const CACHE_TTL = 5 * 60 * 1000; // 5分钟

interface CachedMenuData {
    data: MenuGroup[];
    timestamp: number;
    productId: ProductId;
}

/**
 * 获取缓存的菜单数据
 */
export function getCachedMenus(productId: ProductId): MenuGroup[] | null {
    try {
        const cacheKey = `${MENU_CACHE_KEY_PREFIX}${productId}`;
        const cached = localStorage.getItem(cacheKey);
        
        if (!cached) {
            return null;
        }
        
        const cachedData: CachedMenuData = JSON.parse(cached);
        
        // 检查是否过期
        if (Date.now() - cachedData.timestamp > CACHE_TTL) {
            localStorage.removeItem(cacheKey);
            return null;
        }
        
        // 检查产品ID是否匹配
        if (cachedData.productId !== productId) {
            return null;
        }
        
        return cachedData.data;
    } catch (error) {
        console.error('Failed to get cached menus:', error);
        return null;
    }
}

/**
 * 缓存菜单数据
 */
export function setCachedMenus(productId: ProductId, menus: MenuGroup[]): void {
    try {
        const cacheKey = `${MENU_CACHE_KEY_PREFIX}${productId}`;
        const cachedData: CachedMenuData = {
            data: menus,
            timestamp: Date.now(),
            productId,
        };
        
        localStorage.setItem(cacheKey, JSON.stringify(cachedData));
    } catch (error) {
        console.error('Failed to cache menus:', error);
        // 如果存储失败（如存储空间不足），忽略错误
    }
}

/**
 * 清除缓存的菜单数据
 */
export function clearCachedMenus(productId?: ProductId): void {
    try {
        if (productId) {
            const cacheKey = `${MENU_CACHE_KEY_PREFIX}${productId}`;
            localStorage.removeItem(cacheKey);
        } else {
            // 清除所有菜单缓存
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith(MENU_CACHE_KEY_PREFIX)) {
                    localStorage.removeItem(key);
                }
            });
        }
    } catch (error) {
        console.error('Failed to clear cached menus:', error);
    }
}

/**
 * 清除所有过期的缓存
 */
export function clearExpiredCaches(): void {
    try {
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith(MENU_CACHE_KEY_PREFIX)) {
                const cached = localStorage.getItem(key);
                if (cached) {
                    try {
                        const cachedData: CachedMenuData = JSON.parse(cached);
                        if (Date.now() - cachedData.timestamp > CACHE_TTL) {
                            localStorage.removeItem(key);
                        }
                    } catch {
                        // 如果解析失败，删除该缓存
                        localStorage.removeItem(key);
                    }
                }
            }
        });
    } catch (error) {
        console.error('Failed to clear expired caches:', error);
    }
}
