// implemented according to https://github.com/ylc395/joplin-plugin-note-link-system/blob/main/src/driver/codeMirror/QuickLinker.ts

import {Editor, Position} from "codemirror";
import CodeMirror from "codemirror";
import PlantumlHints from './PlantumlHints'
import {getDateHints} from "./DateHints";
import MermaidHints from "./MermaidHints";

const TRIGGER_SYMBOL = '/';
const HINT_ITEM_CLASS = 'quick-commands-hint';
const HINT_ITEM_PATH_CLASS = 'quick-commands-hint-path';

// @see https://codemirror.net/doc/manual.html#addon_show-hint
export interface Hint {
    text: string;
    displayText?: string;
    className?: string;
    description?: string;
    render?: (container: Element, completion: Completion, hint: Hint) => void;
    // hint?: (cm: typeof CodeMirror, completion: Completion, hint: Hint) => void;
    inline: boolean;
}

let customHints: Hint[] = [
    {
        text: '|     |     |     |\r\n| --- | --- | --- |\r\n|     |     |     |',
        displayText: '/table',
        description: 'markdown table',
        inline: false
    }
]

customHints = customHints.concat(PlantumlHints)
customHints = customHints.concat(MermaidHints);

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

        if (chars === TRIGGER_SYMBOL && !/\S/.test(this.doc.getRange(pos, {line: pos.line, ch: pos.ch + 1}))) {
            this.symbolRange = { from: symbolRange[0], to: symbolRange[1] };
            this.editor.showHint({
                closeCharacters: /[()\[\]{};:>,/ ]/,
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

    private getCommandHints(keyword: string, indent: string) : Hint[] {
        let hints = [];

        let commandTextIndent = '';
        const matchIndex = indent.search(/\S/);
        if (matchIndex > 0) {
            commandTextIndent = indent.substr(matchIndex);
        }

        // add indent when there exists 'tab' before or add a new line for non-inline hints
        for (let customHint of customHints.concat(getDateHints(this.editor.state.enhancement.settings.dateFormat))) {
            // filter the hints by keyword
            if (customHint.displayText.includes(keyword)) {
                let indentText = '';
                if (!customHint.inline) {
                    if (commandTextIndent.length != 0 || (commandTextIndent.length == 0 && indent.length != 0)) {
                        indentText += '\n';
                    }

                    let lines = customHint.text.split('\n');
                    for (let i = 0; i < lines.length; ++i) {
                        indentText += commandTextIndent + lines[i] + '\n';
                    }
                } else {
                    indentText = customHint.text;
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

        return hints.sort((h1: Hint, h2: Hint) => {
            if (h1.displayText > h2.displayText) {
                return 1;
            } else if (h1.displayText < h2.displayText) {
                return -1;
            } else {
                return 0;
            }
        });
    }
}
