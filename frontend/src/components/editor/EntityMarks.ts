/**
 * Simple Highlighting Extension for Tiptap
 * 使用简单的 CSS 类而不是自定义 Mark 来避免类型问题
 */

import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export interface HighlightConfig {
    subjects: string[];
    actions: string[];
    objects: string[];
    states: string[];
}

export const EntityHighlight = Extension.create({
    name: 'entityHighlight',

    addOptions() {
        return {
            config: null as HighlightConfig | null,
        };
    },

    addProseMirrorPlugins() {
        const extensionThis = this;

        return [
            new Plugin({
                key: new PluginKey('entityHighlight'),

                state: {
                    init() {
                        return DecorationSet.empty;
                    },

                    apply(tr, oldState) {
                        const config = extensionThis.options.config;
                        if (!config) {
                            return DecorationSet.empty;
                        }

                        const decorations: Decoration[] = [];
                        const doc = tr.doc;
                        const text = doc.textContent;

                        // 高亮主体（蓝色）
                        config.subjects?.forEach((entity: string) => {
                            let index = 0;
                            while ((index = text.indexOf(entity, index)) !== -1) {
                                const from = index + 1;
                                const to = index + entity.length + 1;
                                decorations.push(
                                    Decoration.inline(from, to, {
                                        class: 'entity-subject bg-blue-100 text-blue-700 px-1 rounded',
                                    })
                                );
                                index += entity.length;
                            }
                        });

                        // 高亮行为（绿色）
                        config.actions?.forEach((entity: string) => {
                            let index = 0;
                            while ((index = text.indexOf(entity, index)) !== -1) {
                                const from = index + 1;
                                const to = index + entity.length + 1;
                                decorations.push(
                                    Decoration.inline(from, to, {
                                        class: 'entity-action bg-green-100 text-green-700 px-1 rounded',
                                    })
                                );
                                index += entity.length;
                            }
                        });

                        // 高亮客体（橙色）
                        config.objects?.forEach((entity: string) => {
                            let index = 0;
                            while ((index = text.indexOf(entity, index)) !== -1) {
                                const from = index + 1;
                                const to = index + entity.length + 1;
                                decorations.push(
                                    Decoration.inline(from, to, {
                                        class: 'entity-object bg-orange-100 text-orange-700 px-1 rounded',
                                    })
                                );
                                index += entity.length;
                            }
                        });

                        // 高亮状态（紫色）
                        config.states?.forEach((entity: string) => {
                            let index = 0;
                            while ((index = text.indexOf(entity, index)) !== -1) {
                                const from = index + 1;
                                const to = index + entity.length + 1;
                                decorations.push(
                                    Decoration.inline(from, to, {
                                        class: 'entity-state bg-purple-100 text-purple-700 px-1 rounded',
                                    })
                                );
                                index += entity.length;
                            }
                        });

                        return DecorationSet.create(doc, decorations);
                    },
                },

                props: {
                    decorations(state) {
                        return this.getState(state);
                    },
                },
            }),
        ];
    },
});
