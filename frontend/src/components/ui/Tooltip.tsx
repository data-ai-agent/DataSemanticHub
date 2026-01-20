import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle, Info } from 'lucide-react';

interface TooltipProps {
    content: React.ReactNode;
    children: React.ReactNode;
    position?: 'top' | 'bottom' | 'left' | 'right';
    delay?: number;
    className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
    content,
    children,
    position = 'top',
    delay = 200,
    className = ''
}) => {
    const [visible, setVisible] = useState(false);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const showTooltip = () => {
        timeoutRef.current = setTimeout(() => setVisible(true), delay);
    };

    const hideTooltip = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setVisible(false);
    };

    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    const positionClasses = {
        top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
        bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
        left: 'right-full top-1/2 -translate-y-1/2 mr-2',
        right: 'left-full top-1/2 -translate-y-1/2 ml-2'
    };

    const arrowClasses = {
        top: 'top-full left-1/2 -translate-x-1/2 border-t-slate-800 border-x-transparent border-b-transparent',
        bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-slate-800 border-x-transparent border-t-transparent',
        left: 'left-full top-1/2 -translate-y-1/2 border-l-slate-800 border-y-transparent border-r-transparent',
        right: 'right-full top-1/2 -translate-y-1/2 border-r-slate-800 border-y-transparent border-l-transparent'
    };

    return (
        <div className={`relative inline-flex ${className}`} onMouseEnter={showTooltip} onMouseLeave={hideTooltip}>
            {children}
            {visible && (
                <div className={`absolute z-50 ${positionClasses[position]} animate-fade-in`}>
                    <div className="bg-slate-800 text-white text-xs px-3 py-2 rounded-lg shadow-xl max-w-xs whitespace-normal">
                        {content}
                    </div>
                    <div className={`absolute w-0 h-0 border-4 ${arrowClasses[position]}`} />
                </div>
            )}
        </div>
    );
};

// Specialized hint with icon
interface HintTooltipProps {
    title: string;
    description: string;
    example?: string;
    className?: string;
}

export const HintTooltip: React.FC<HintTooltipProps> = ({
    title,
    description,
    example,
    className = ''
}) => {
    return (
        <Tooltip
            content={
                <div className="space-y-1.5">
                    <div className="font-semibold text-white">{title}</div>
                    <div className="text-slate-300 text-[11px]">{description}</div>
                    {example && (
                        <div className="text-emerald-400 text-[11px] mt-1.5 pt-1.5 border-t border-slate-700">
                            📌 例如：{example}
                        </div>
                    )}
                </div>
            }
            position="right"
            className={className}
        >
            <HelpCircle size={14} className="text-slate-400 hover:text-slate-600 cursor-help transition-colors" />
        </Tooltip>
    );
};

// Terminology hints for business modeling
export const TERMINOLOGY_HINTS = {
    business_object: {
        title: '核心数据实体',
        description: '业务流程中需要管理的主要数据对象，通常对应一张数据表或API实体',
        example: '入学申请单、订单、合同'
    },
    state_machine: {
        title: '流程状态流转',
        description: '业务对象从创建到完成经历的各个阶段及其转换规则',
        example: '草稿 → 已提交 → 审核中 → 已通过'
    },
    actions: {
        title: '关键操作步骤',
        description: '用户或系统执行的具体业务动作，会触发状态变化',
        example: '提交申请、审批通过、退回修改'
    },
    roles: {
        title: '参与角色',
        description: '业务流程中涉及的人员或系统角色',
        example: '申请人、审批人、主管部门'
    },
    artifacts: {
        title: '材料与数据',
        description: '流程中需要提交的文件材料或需要核验的数据',
        example: '身份证、营业执照、户籍信息核验'
    },
    rules: {
        title: '业务规则',
        description: '决定流程走向的判断条件和约束',
        example: '年满18周岁、材料齐全、余额充足'
    },
    constraints: {
        title: '时限与约束',
        description: '法定承诺时限、补正时限等业务约束条件',
        example: '5个工作日内审核、补正期限7天'
    },
    confidence: {
        title: 'AI 置信度',
        description: 'AI 对识别结果的确信程度，越高表示越准确',
        example: '95% = 高度确信，< 70% 建议人工复核'
    },
    coverage: {
        title: '识别覆盖率',
        description: '模板要求的建模项中已识别到的比例',
        example: '92% = 大部分要素已识别'
    }
};

export default Tooltip;
