import { READONLY_HINT, READONLY_LABEL } from '../../contexts/VersionContext';

interface ReadOnlyBadgeProps {
    versionId?: string;
    className?: string;
}

export const ReadOnlyBadge = ({ versionId, className }: ReadOnlyBadgeProps) => (
    <span
        className={`px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600${className ? ` ${className}` : ''}`}
        title={READONLY_HINT}
    >
        {READONLY_LABEL}{versionId ? ` ${versionId}` : ''}
    </span>
);
