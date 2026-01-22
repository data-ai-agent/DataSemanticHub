import { Extension } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';
import { ReactRenderer } from '@tiptap/react';
import tippy from 'tippy.js';
import { SuggestionList } from '../SuggestionList';

const DEFAULT_SUGGESTION_ITEMS = [
    { label: '提交申请', category: '动作' },
    { label: '审核通过', category: '动作' },
    { label: '审核不通过', category: '动作' },
    { label: '补正材料', category: '动作' },
    { label: '发放证照', category: '动作' },
    { label: '归档备案', category: '动作' },
    { label: '身份证', category: '材料' },
    { label: '营业执照', category: '材料' },
    { label: '户口簿', category: '材料' },
    { label: '申请表', category: '材料' },
    { label: '授权委托书', category: '材料' },
    { label: '受理中', category: '状态' },
    { label: '已办结', category: '状态' },
    { label: '待补正', category: '状态' },
];

export const SmartCompletion = Extension.create({
    name: 'smartCompletion',

    addOptions() {
        return {
            items: DEFAULT_SUGGESTION_ITEMS,
            suggestion: {
                char: '/',
                command: ({ editor, range, props }: any) => {
                    editor
                        .chain()
                        .focus()
                        .deleteRange(range)
                        .insertContent(`${props.label}`)
                        .run();
                },
            },
        };
    },

    addProseMirrorPlugins() {
        return [
            Suggestion({
                editor: this.editor,
                ...this.options.suggestion,
                items: ({ query }) => {
                    return this.options.items.filter((item: any) =>
                        item.label.toLowerCase().includes(query.toLowerCase())
                    ).slice(0, 5);
                },
                render: () => {
                    let component: ReactRenderer;
                    let popup: any;

                    return {
                        onStart: (props) => {
                            component = new ReactRenderer(SuggestionList, {
                                props,
                                editor: props.editor,
                            });

                            if (!props.clientRect) {
                                return;
                            }

                            popup = tippy('body', {
                                getReferenceClientRect: props.clientRect as any,
                                appendTo: () => document.body,
                                content: component.element,
                                showOnCreate: true,
                                interactive: true,
                                trigger: 'manual',
                                placement: 'bottom-start',
                            });
                        },

                        onUpdate(props) {
                            component.updateProps(props);

                            if (!props.clientRect) {
                                return;
                            }

                            popup[0].setProps({
                                getReferenceClientRect: props.clientRect,
                            });
                        },

                        onKeyDown(props) {
                            if (props.event.key === 'Escape') {
                                popup[0].hide();
                                return true;
                            }

                            return (component.ref as any)?.onKeyDown?.(props) || false;
                        },

                        onExit() {
                            popup[0].destroy();
                            component.destroy();
                        },
                    };
                },
            }),
        ];
    },
});
