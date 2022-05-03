// implemented according to https://github.com/ylc395/joplin-plugin-note-link-system/blob/main/src/driver/codeMirror/UrlFolder.ts

import { debounce } from "ts-debounce";
import type { Editor, Token } from 'codemirror';

const MARKER_CLASS_NAME = 'enhancement-folded-mermaid';

export default class MermaidFolder {
    constructor(private readonly context, private readonly editor: Editor) {
        setTimeout(this.init.bind(this), 100);
    }

    private async init() {
        await this.foldAll();
        this.editor.on('cursorActivity', this.unfoldAtCursor.bind(this));
        this.editor.on('cursorActivity', debounce(this.foldAll.bind(this), 200));
    }

    private async foldAll() {
        const doc = this.editor.getDoc();
        const cursor = this.editor.getCursor();

        let meetMermaid = false;
        let from;
        doc.eachLine((line) => {
            const lineNo = doc.getLineNumber(line);
            if (lineNo === null) {
                return;
            }

            const lineTokens = this.editor.getLineTokens(lineNo);

            for (const [tokenIndex, token] of lineTokens.entries()) {
                if (!token.type?.includes('line-cm-jn-code-block')) {
                    if (!meetMermaid) {
                        continue;
                    }
                } else {
                    if (!meetMermaid) {
                        meetMermaid = true;
                        from = {line: lineNo, ch: token.start};
                    } else if (token.string.endsWith('```')) {
                        meetMermaid = false;

                        // not fold when it is folded ?
                        if (this.editor
                            .findMarksAt({line: lineNo, ch: token.start})
                            .find((marker) => marker.className === MARKER_CLASS_NAME)) {
                            break;
                        }

                        // not fold when the cursor is in the block
                        if (cursor.line <= lineNo && cursor.line >= from.line) {
                            break;
                        }

                        doc.markText(
                            { line: from.line, ch: 0 },
                            { line: lineNo, ch: token.end },
                            {
                                replacedWith: this.createFoldMarker(token.string),
                                handleMouseEvents: true,
                                className: MARKER_CLASS_NAME, // class name is not renderer in DOM
                            },
                        );
                    }
                }
            }
        });
    }

    private unfoldAtCursor() {
        const cursor = this.editor.getCursor();
        const markers = this.editor.findMarksAt(cursor);

        for (const marker of markers) {
            if (marker.className === MARKER_CLASS_NAME) {
                marker.clear();
            }
        }
    }

    private createFoldMarker(href: string) {
        const markEl = document.createElement('i');
        markEl.classList.add(MARKER_CLASS_NAME);
        markEl.textContent = '==> folded mermaid graph block <==';

        return markEl;
    }
}