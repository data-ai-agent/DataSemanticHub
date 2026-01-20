import { LucideIcon } from 'lucide-react';

interface StatCardProps {
    label: string;
    value: string;
    trend: string;
    icon: LucideIcon;
    color: 'blue' | 'emerald' | 'purple' | 'orange';
}

const StatCard = ({ label, value, trend, icon: Icon, color }: StatCardProps) => {
    const colorMap = {
        blue: "text-blue-600 bg-blue-50 border-blue-200",
        emerald: "text-emerald-600 bg-emerald-50 border-emerald-200",
        purple: "text-purple-600 bg-purple-50 border-purple-200",
        orange: "text-orange-600 bg-orange-50 border-orange-200",
    };

    return (
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
                    <h3 className="text-2xl font-bold text-slate-800 mt-1">{value}</h3>
                </div>
                <div className={`p-2 rounded-lg ${colorMap[color]}`}>
                    <Icon size={20} />
                </div>
            </div>
            <div className="mt-4 flex items-center text-xs">
                <span className="text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded mr-2">{trend}</span>
                <span className="text-slate-400">vs last week</span>
            </div>
        </div>
    );
};

export default StatCard;
