import { ReactNode } from 'react';

interface PageHeaderProps {
    title: string;
    description?: string;
    actions?: ReactNode;
}

const PageHeader = ({ title, description, actions }: PageHeaderProps) => (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
            <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
            {description && <p className="text-slate-500 mt-1">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
);

export default PageHeader;
