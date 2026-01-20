import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
    id: number;
    type: ToastType;
    message: string;
    duration?: number;
}

interface ToastContextType {
    showToast: (type: ToastType, message: string, duration?: number) => void;
    success: (message: string, duration?: number) => void;
    error: (message: string, duration?: number) => void;
    info: (message: string, duration?: number) => void;
    warning: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Toast Item Component
const ToastItem: React.FC<{ toast: Toast; onClose: (id: number) => void }> = ({ toast, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose(toast.id);
        }, toast.duration || 3000);

        return () => clearTimeout(timer);
    }, [toast, onClose]);

    const getIcon = () => {
        switch (toast.type) {
            case 'success': return <CheckCircle size={18} className="text-emerald-500" />;
            case 'error': return <AlertCircle size={18} className="text-red-500" />;
            case 'warning': return <AlertTriangle size={18} className="text-amber-500" />;
            case 'info': return <Info size={18} className="text-blue-500" />;
        }
    };

    const getStyles = () => {
        switch (toast.type) {
            case 'success': return 'bg-emerald-50 border-emerald-200 text-emerald-800';
            case 'error': return 'bg-red-50 border-red-200 text-red-800';
            case 'warning': return 'bg-amber-50 border-amber-200 text-amber-800';
            case 'info': return 'bg-blue-50 border-blue-200 text-blue-800';
        }
    };

    return (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg animate-in fade-in slide-in-from-top-2 mb-2 min-w-[300px] max-w-md pointer-events-auto ${getStyles()}`}>
            {getIcon()}
            <p className="flex-1 text-sm font-medium">{toast.message}</p>
            <button onClick={() => onClose(toast.id)} className="opacity-60 hover:opacity-100 transition-opacity">
                <X size={14} />
            </button>
        </div>
    );
};

// Toast Provider Component
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const showToast = useCallback((type: ToastType, message: string, duration?: number) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, type, message, duration }]);
    }, []);

    const helpers = {
        success: (msg: string, dur?: number) => showToast('success', msg, dur),
        error: (msg: string, dur?: number) => showToast('error', msg, dur),
        info: (msg: string, dur?: number) => showToast('info', msg, dur),
        warning: (msg: string, dur?: number) => showToast('warning', msg, dur),
    };

    return (
        <ToastContext.Provider value={{ showToast, ...helpers }}>
            {children}
            {/* Toast Container - Fixed Position */}
            <div className="fixed top-4 right-4 z-[9999] flex flex-col items-end pointer-events-none p-4">
                {toasts.map(toast => (
                    <ToastItem key={toast.id} toast={toast} onClose={removeToast} />
                ))}
            </div>
        </ToastContext.Provider>
    );
};

// Hook
export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
