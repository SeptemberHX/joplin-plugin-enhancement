/**
 * @ignore
 * BEGIN HEADER
 *
 * Contains:        CodeMirror formatting bar hook
 * CVM-Role:        CodeMirror 6 plugin
 * License:         GNU GPL v3
 *
 * Description:     Provides a pop-up menu that allows users to quickly
 *                  execute commands with a mouse or touchscreen.
 *
 * END HEADER
 */

// Helpful documentation:
// - https://codemirror.net/examples/tooltip/

import { requireCodeMirrorState, requireCodeMirrorView } from '../../../../utils/cm-dynamic-require';
import type { EditorState } from '@codemirror/state';
import type { Tooltip } from '@codemirror/view';
import { ContentScriptContext } from 'api/types';
import { ContextMsgType } from '../../../../common';

interface CommandInfo {
    name: string;
    alt: string;

    /** Space-separated list of class names to give to the icon. */
    icon: string;
}

const commandInfos: CommandInfo[] = [
    {
        name: 'markdownBold',
        icon: 'fas fa-bold in-button',
        alt: 'Bold',
    },
    {
        name: 'markdownItalic',
        icon: 'fas fa-italic in-button',
        alt: 'Italic',
    },
    {
        name: 'markdownLink',
        icon: 'fas fa-link in-button',
        alt: 'Link',
    },
    {
        alt: 'Code',
        name: 'markdownCode',
        icon: 'fas fa-code in-button',
    },
    ...([1, 2, 3, 4, 5, 6, 7].map((i): CommandInfo => ({
        name: `markdownHL${i}`,
        icon: `fas fa-circle color${i} in-button`,
        alt: `Color ${i}`,
    }))),
];

const buildTooltips = (state: EditorState, context: ContentScriptContext): Tooltip[] => {
    return state.selection.ranges
        // Only show for non-empty selection ranges
        .filter(range => !range.empty)
        .map((range): Tooltip => {
            return {
                pos: range.from,
                above: true,
                arrow: false,
                create: (_view) => {
                    const container = document.createElement('div');
                    container.classList.add('cm-editor-formatting-bar');

                    for (const commandInfo of commandInfos) {
                        const commandButton = document.createElement('button');
                        commandButton.onclick = () => {
                            context.postMessage({
                                type: ContextMsgType.SHORTCUT,
                                content: commandInfo.name,
                            });
                        };

                        const commandIcon = document.createElement('i');
                        commandIcon.classList.add(...commandInfo.icon.split(' '));

                        commandButton.setAttribute('aria-label', commandInfo.alt);

                        commandButton.appendChild(commandIcon);
                        container.appendChild(commandButton);
                    }

                    return { dom: container };
                }
            };
        });
};

const formattingBarStateField = (context: ContentScriptContext) => {
    const { StateField } = requireCodeMirrorState();
    const { showTooltip } = requireCodeMirrorView();

    return StateField.define<readonly Tooltip[]>({
        // Initial state
        create: state => buildTooltips(state, context),

        update: (tooltips, tr) => {
            if (!tr.docChanged && !tr.selection) {
                return tooltips;
            }

            return buildTooltips(tr.state, context);
        },

        provide: (field) => {
            const deps = [ field ];
            return showTooltip.computeN(
                deps,
                state => state.field(field),
            );
        },
    });
};

const formattingBar = (context: ContentScriptContext) => {
    const { EditorView } = requireCodeMirrorView();

    return [
        formattingBarStateField(context),
        EditorView.baseTheme({
            '& .cm-tooltip.cm-editor-formatting-bar': {
                display: 'flex',
                'flex-direction': 'row',
                'border-radius': '5px',

                border: 'none',
                'background-color': 'rgba(51, 51,51, 0.85)',

                '& > button': {
                    'background-color': 'transparent',
                    border: 'none',
                    'flex-grow': 1,
                    padding: '4px 8px',
                    width: '35px',
                    height: '35px',
                    color: 'white',
                    transition: '0.3s all ease',

                    '&:hover, &:focus-visible': {
                        'background-color': 'rgb(120, 120, 120)',
                    },
                    '&:first-child': {
                        'border-top-left-radius': '4px',
                        'border-bottom-left-radius': '4px',
                    },
                    '&:last-child': {
                        'border-top-right-radius': '4px',
                        'border-bottom-right-radius': '4px',
                    },
                },
                '& i.fas': {
                    'font-family': "'Font Awesome 5 Free' !important",
                    '&.color1': {
                        color: '#ffd400',
                    },
                    '&.color2': {
                        color: '#ff6666',
                    },
                    '&.color3': {
                        color: '#5fb236',
                    },
                    '&.color4': {
                        color: '#2ea8e5',
                    },
                    '&.color5': {
                        color: '#a28ae5',
                    },
                    '&.color6': {
                        color: '#e56eee',
                    },
                    '&.color7': {
                        color: '#f19837',
                    },
                },
            },
        }),
    ];
};

export default formattingBar;