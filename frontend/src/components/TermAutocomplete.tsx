import React, { useState, useRef, useEffect } from 'react';
import { Check, Sparkles } from 'lucide-react';

interface TermAutocompleteProps {
    value: string;
    onChange: (value: string, isStandard: boolean) => void;
    placeholder?: string;
    standardTerms: string[];
    aiSuggestion?: string;
    disabled?: boolean;
    className?: string;
}

export const TermAutocomplete: React.FC<TermAutocompleteProps> = ({
    value,
    onChange,
    placeholder = '请输入名称...',
    standardTerms,
    aiSuggestion,
    disabled = false,
    className = ''
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState(value);
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Sync with external value changes
    useEffect(() => {
        setInputValue(value);
    }, [value]);

    // Filter suggestions based on input
    const filteredSuggestions = standardTerms.filter(term =>
        term.toLowerCase().includes(inputValue.toLowerCase())
    ).slice(0, 10); // Limit to 10 suggestions

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node) &&
                inputRef.current &&
                !inputRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setInputValue(newValue);
        setIsOpen(true);
        setHighlightedIndex(0);
    };

    const handleSelectTerm = (term: string, isStandard: boolean) => {
        setInputValue(term);
        onChange(term, isStandard);
        setIsOpen(false);
    };

    const handleInputBlur = () => {
        // Delay to allow click on dropdown item
        setTimeout(() => {
            if (inputValue !== value) {
                const isStandard = standardTerms.includes(inputValue);
                onChange(inputValue, isStandard);
            }
            setIsOpen(false);
        }, 200);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
            setIsOpen(true);
            return;
        }

        if (!isOpen) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightedIndex(prev =>
                    prev < filteredSuggestions.length - 1 ? prev + 1 : prev
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex(prev => (prev > 0 ? prev - 1 : 0));
                break;
            case 'Enter':
                e.preventDefault();
                if (filteredSuggestions[highlightedIndex]) {
                    handleSelectTerm(filteredSuggestions[highlightedIndex], true);
                } else if (inputValue) {
                    handleSelectTerm(inputValue, false);
                }
                break;
            case 'Escape':
                e.preventDefault();
                setIsOpen(false);
                break;
        }
    };

    // Build placeholder text
    const placeholderText = aiSuggestion
        ? `${aiSuggestion} (AI建议)`
        : placeholder;

    return (
        <div className="relative flex-1">
            <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onFocus={() => !disabled && setIsOpen(true)}
                onBlur={handleInputBlur}
                onKeyDown={handleKeyDown}
                placeholder={placeholderText}
                disabled={disabled}
                className={`w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-200 outline-none text-sm ${disabled ? 'bg-slate-50 cursor-not-allowed' : ''
                    } ${className}`}
            />

            {/* Dropdown */}
            {isOpen && !disabled && filteredSuggestions.length > 0 && (
                <div
                    ref={dropdownRef}
                    className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                >
                    {filteredSuggestions.map((term, index) => {
                        const isHighlighted = index === highlightedIndex;
                        return (
                            <div
                                key={index}
                                className={`px-3 py-2 cursor-pointer flex items-center justify-between transition-colors ${isHighlighted
                                        ? 'bg-purple-50'
                                        : 'hover:bg-slate-50'
                                    }`}
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    handleSelectTerm(term, true);
                                }}
                                onMouseEnter={() => setHighlightedIndex(index)}
                            >
                                <span className="text-sm text-slate-700">{term}</span>
                                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-medium rounded-full flex items-center gap-1">
                                    <Check size={10} />
                                    标准术语
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Show info when user types something not in library */}
            {isOpen && !disabled && inputValue && filteredSuggestions.length === 0 && (
                <div
                    ref={dropdownRef}
                    className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg p-3"
                >
                    <div className="flex items-start gap-2 text-xs">
                        <Sparkles size={14} className="text-blue-500 mt-0.5" />
                        <div>
                            <p className="text-slate-600 font-medium">未找到匹配的标准术语</p>
                            <p className="text-slate-400 mt-1">
                                按 Enter 确认，系统将自动沉淀为新术语
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
