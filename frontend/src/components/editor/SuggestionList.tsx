import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';

interface SuggestionListProps {
    items: any[];
    command: (item: any) => void;
}

export const SuggestionList = forwardRef((props: SuggestionListProps, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const selectItem = (index: number) => {
        const item = props.items[index];
        if (item) {
            props.command(item);
        }
    };

    const upHandler = () => {
        setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
    };

    const downHandler = () => {
        setSelectedIndex((selectedIndex + 1) % props.items.length);
    };

    const enterHandler = () => {
        selectItem(selectedIndex);
    };

    useEffect(() => {
        setSelectedIndex(0);
    }, [props.items]);

    useImperativeHandle(ref, () => ({
        onKeyDown: ({ event }: { event: KeyboardEvent }) => {
            if (event.key === 'ArrowUp') {
                upHandler();
                return true;
            }

            if (event.key === 'ArrowDown') {
                downHandler();
                return true;
            }

            if (event.key === 'Enter') {
                enterHandler();
                return true;
            }

            return false;
        },
    }));

    if (props.items.length === 0) {
        return null;
    }

    return (
        <div className="items bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden min-w-[180px] py-1 animate-in fade-in zoom-in-95 duration-100">
            {props.items.length ? (
                props.items.map((item, index) => (
                    <button
                        className={`
              w-full text-left px-3 py-2 text-sm transition-colors flex items-center justify-between
              ${index === selectedIndex ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50'}
            `}
                        key={index}
                        onClick={() => selectItem(index)}
                    >
                        <span className="font-medium">{item.label || item}</span>
                        {item.category && (
                            <span className="text-[10px] uppercase tracking-wider text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                {item.category}
                            </span>
                        )}
                    </button>
                ))
            ) : (
                <div className="item p-2 text-sm text-gray-500">No results</div>
            )}
        </div>
    );
});

SuggestionList.displayName = 'SuggestionList';
