// implemented according to https://github.com/ylc395/joplin-plugin-note-link-system/blob/main/src/driver/codeMirror/QuickLinker.ts

import {Editor, Position} from "codemirror";
import CodeMirror = require("codemirror");

const TRIGGER_SYMBOL = '/';
const HINT_ITEM_CLASS = 'quick-commands-hint';
const HINT_ITEM_PATH_CLASS = 'quick-commands-hint-path';

// @see https://codemirror.net/doc/manual.html#addon_show-hint
interface Hint {
    text: string;
    displayText?: string;
    className?: string;
    description?: string;
    render?: (container: Element, completion: Completion, hint: Hint) => void;
    // hint?: (cm: typeof CodeMirror, completion: Completion, hint: Hint) => void;
}

let customHints = [
    {
        text: '|     |     |     |\r\n| --- | --- | --- |\r\n|     |     |     |',
        displayText: '/table',
        description: 'markdown table',
    },
    {
        text: '```mermaid\n' +
            'graph\n' +
            '\n' +
            '```',
        displayText: '/flowchart',
        description: 'mermaid flowchart',
    },
    {
        text: '```mermaid\n' +
            'sequenceDiagram\n' +
            '\n' +
            '```',
        displayText: '/sequenceDiagram',
        description: 'mermaid sequence diagram',
    },
    {
        text: '```mermaid\n' +
            'gantt\n' +
            '\n' +
            '```',
        displayText: '/gantt',
        description: 'mermaid gantt diagram',
    },
    {
        text: '```mermaid\n' +
            'classDiagram\n' +
            '\n' +
            '```',
        displayText: '/classDiagram',
        description: 'mermaid class diagram',
    },
    {
        text: '```mermaid\n' +
            'erDiagram\n' +
            '\n' +
            '```',
        displayText: '/erDiagram',
        description: 'mermaid entity relationship diagram',
    },
    {
        text: '```mermaid\n' +
            'journey\n' +
            '\n' +
            '```',
        displayText: '/journey',
        description: 'mermaid journey diagram',
    }
]

interface Completion {
    from: Position;
    to: Position;
    list: Hint[];
    selectedHint?: number;
}

export type ExtendedEditor = {
    showHint(options: {
        completeSingle: boolean;
        closeCharacters: RegExp;
        closeOnUnfocus: boolean;
        hint: (cm: Editor) => Completion | undefined | Promise<Completion | undefined>;
    }): void;
};

export default class QuickCommands {
    constructor(private readonly context, private readonly editor: ExtendedEditor & Editor, private readonly cm: typeof CodeMirror) {
        this.editor.on('cursorActivity', this.triggerHints.bind(this));
        setTimeout(this.init.bind(this), 100);
    }

    private async init() {

    }

    private readonly doc = this.editor.getDoc();
    private symbolRange?: { from: Position; to: Position };
    private linkToElementEnabled?: boolean;
    private createNoteEnabled?: boolean;
    private isUrlOnly?: boolean;

    private triggerHints() {
        const pos = this.doc.getCursor();
        const symbolRange = [{ line: pos.line, ch: pos.ch - TRIGGER_SYMBOL.length }, pos] as const;
        const chars = this.doc.getRange(...symbolRange);

        if (chars === TRIGGER_SYMBOL) {
            this.symbolRange = { from: symbolRange[0], to: symbolRange[1] };
            this.editor.showHint({
                closeCharacters: /[()\[\]{};:>, ]/,
                closeOnUnfocus: true,
                completeSingle: false,
                hint: this.getCommandCompletion.bind(this),
            });
        }
    }

    private async getCommandCompletion() : Promise<Completion | undefined> {
        if (!this.symbolRange) {
            throw new Error('no symbolRange');
        }

        const { line, ch } = this.symbolRange.to;
        const { line: cursorLine, ch: cursorCh } = this.doc.getCursor();

        if (cursorLine < line || cursorCh < ch) {
            return;
        }

        const keyword = this.doc.getRange({ line, ch }, { line: cursorLine, ch: cursorCh });
        const { from: completionFrom } = this.symbolRange;
        const completionTo = { line, ch: ch + keyword.length };
        const completion: Completion = {
            from: completionFrom,
            to: completionTo,
            list: this.getCommandHints(
                keyword,
                this.doc.getRange({line: cursorLine, ch: 0}, {line: cursorLine, ch: cursorCh - 1}) // string before '/'
            ),
        };
        return completion;
    }

    private getCommandHints(keyword: string, indent) : Hint[] {
        let hints = [];

        // add indent when there exists 'tab' before or add a new line
        let indentText = '';
        if (indent.trim().length != 0) {
            indent = indent.replace(indent.trim(), '');
            indentText += '\n';
        }

        for (let customHint of customHints) {
            // filter the hints by keyword
            if (customHint.displayText.includes(keyword)) {
                let lines = customHint.text.split('\n');
                for (let i = 0; i < lines.length; ++i) {
                    indentText += indent + lines[i] + '\n';
                }

                hints.push({
                    text: indentText,
                    displayText: customHint.displayText,
                    className: HINT_ITEM_CLASS,
                    render(container) {
                        container.innerHTML =
                            customHint.displayText + `<span class="${HINT_ITEM_PATH_CLASS}">${customHint.description}</span>`;
                    },
                })
            }
        }
        return hints;
    }
}
