// implemented according to https://github.com/ylc395/joplin-plugin-note-link-system/blob/main/src/driver/codeMirror/UrlFolder.ts

import { debounce } from "ts-debounce";

const MARKER_CLASS_NAME = 'enhancement-folded-quote';

const colorRegex = /\[color=(.*?)\]/;
const nameRegex = /\[name=(.*?)\]/;
const dateRegex = /\[date=(.*?)\]/;

export default class BlockquoteEnhancedFolder {
    constructor(private readonly context, private readonly editor) {
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

        doc.eachLine((line) => {
            let meetBlockquote = false;
            const lineNo = doc.getLineNumber(line);
            if (lineNo === null) {
                return;
            }

            const lineTokens = this.editor.getLineTokens(lineNo);
            for (const [tokenIndex, token] of lineTokens.entries()) {
                console.log(token);
                if (token.type?.includes('quote')) {
                    meetBlockquote = true;
                    break;
                }
            }

            if (meetBlockquote) {
                this.foldByMatch(doc, lineNo, cursor, colorRegex.exec(line.text), 'color');
                this.foldByMatch(doc, lineNo, cursor, nameRegex.exec(line.text), 'name');
                this.foldByMatch(doc, lineNo, cursor, dateRegex.exec(line.text), 'date');
            }
        });
    }

    private foldByMatch(doc, lineNo, cursor, match, type) {
        if (match) {
            // not fold when it is folded ?
            if (!this.editor
                .findMarksAt({line: lineNo, ch: match.index})
                .find((marker) => marker.className === MARKER_CLASS_NAME)) {

                const from = {line: lineNo, ch: match.index};
                const to = {line: lineNo, ch: match.index + match[0].length};
                let color = match[1];

                // not fold when the cursor is in the block
                if (!(cursor.line <= lineNo && cursor.line >= from.line)) {
                    doc.markText(
                        from,
                        to,
                        {
                            replacedWith: this.createFoldMarker(type),
                            handleMouseEvents: true,
                            className: MARKER_CLASS_NAME, // class name is not renderer in DOM
                        },
                    );
                }
            }
        }
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

    private createFoldMarker(type) {
        const markEl = document.createElement('span');
        markEl.classList.add(MARKER_CLASS_NAME);
        switch (type) {
            case 'color':
                markEl.textContent = `[🎨]`;
                break;
            case 'name':
                markEl.textContent = `[🐹]`;
                break;
            case 'date':
                markEl.textContent = `[🕰]`;
                break;
        }
        markEl.style.cssText = 'color: darkgray;';
        return markEl;
    }
}