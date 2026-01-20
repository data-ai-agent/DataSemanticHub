import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    action?: React.ReactNode;
    secondaryAction?: React.ReactNode;
    className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    icon,
    title,
    description,
    action,
    secondaryAction,
    className = ''
}) => {
    return (
        <div className={`flex flex-col items-center justify-center p-8 text-center bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 ${className}`}>
            <div className="p-4 bg-white rounded-full shadow-sm mb-4 text-slate-400">
                {icon}
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">
                {title}
            </h3>
            <p className="text-slate-500 text-sm max-w-sm mb-6">
                {description}
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
                {action}
                {secondaryAction}
            </div>
        </div>
    );
};
