import { useEffect } from 'react';

interface KeyboardShortcutHandlers {
    [key: string]: (e: KeyboardEvent) => void;
}

/**
 * Hook for handling keyboard shortcuts
 * 支持组合键: ctrl, meta (cmd), shift, alt
 * 格式示例: 'ctrl+s', 'meta+enter', 'shift+a'
 */
export const useKeyboardShortcuts = (handlers: KeyboardShortcutHandlers) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // 构建当前按键的标识符
            const modifiers = [];
            if (e.ctrlKey) modifiers.push('ctrl');
            if (e.metaKey) modifiers.push('meta'); // Mac Cmd
            if (e.altKey) modifiers.push('alt');
            if (e.shiftKey) modifiers.push('shift');

            const key = e.key.toLowerCase();

            // 跳过单独的修饰键
            if (['control', 'meta', 'alt', 'shift'].includes(key)) return;

            // 组合键标识符
            const shortcutId = [...modifiers, key].join('+');

            // 兼容 Mac Cmd 和 Windows Ctrl 互换 (以 ctrl+ 代表通用命令键)
            const genericCmdId = [...modifiers.map(m => m === 'meta' ? 'ctrl' : m), key].join('+');

            // 优先匹配精确的快捷键，然后是通用快捷键
            const handler = handlers[shortcutId] || handlers[genericCmdId] || handlers[key];

            if (handler) {
                // 如果是在输入框中，仅允许特定的快捷键（如保存）
                const target = e.target as HTMLElement;
                const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

                // 允许 Cmd+S, Cmd+Enter 等全局快捷键在输入框生效
                // 但阻止纯字母快捷键干扰输入
                if (isInput && modifiers.length === 0 && key.length === 1) {
                    return;
                }

                e.preventDefault();
                handler(e);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handlers]);
};
