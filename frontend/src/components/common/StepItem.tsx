import { CheckCircle } from 'lucide-react';

interface StepItemProps {
    status: 'done' | 'process';
    text: string;
}

const StepItem = ({ status, text }: StepItemProps) => (
    <div className="flex items-center gap-3">
        {status === 'done' ? (
            <div className="min-w-[20px] h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <CheckCircle size={12} />
            </div>
        ) : (
            <div className="min-w-[20px] h-5 rounded-full border-2 border-slate-200 border-t-blue-500 animate-spin"></div>
        )}
        <span className={`text-sm ${status === 'done' ? 'text-slate-600' : 'text-slate-800 font-medium'}`}>{text}</span>
    </div>
);

export default StepItem;
