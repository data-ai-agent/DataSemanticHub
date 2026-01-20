import { READONLY_HINT } from '../../contexts/VersionContext';

interface ReadOnlyNoticeProps {
    className?: string;
}

export const ReadOnlyNotice = ({ className }: ReadOnlyNoticeProps) => (
    <div className={`text-[11px] text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2${className ? ` ${className}` : ''}`}>
        {READONLY_HINT}
    </div>
);
