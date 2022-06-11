// implemented according to https://github.com/ylc395/joplin-plugin-note-link-system/blob/main/src/driver/codeMirror/UrlFolder.ts

import { debounce } from "ts-debounce";


export default class CMMarkerHelper {
    lastCursor;
    renderer: (matched: string, regIndex: number) => any;
    lineFilter: (line: string, lineToken: []) => boolean;
    options: {
        prefixLength: number,
        suffixLength: number
    };
    regexList;
    MARKER_CLASS_NAME;

    constructor(private readonly context, private readonly editor, regexList, renderer, MARKER_CLASS_NAME, options, lineFilter?) {
        this.regexList = regexList;
        this.renderer = renderer;
        this.lineFilter = lineFilter;
        this.options = options;
        this.MARKER_CLASS_NAME = MARKER_CLASS_NAME;
        setTimeout(this.init.bind(this), 100);
    }

    private async init() {
        await this.foldAll();
        this.editor.on('cursorActivity', this.unfoldAtCursor.bind(this));
        this.editor.on('cursorActivity', debounce(this.onCursorActivity.bind(this), 200));
    }

    private async onCursorActivity() {
        const cursor = this.editor.getCursor();
        // check whether the regex exists between last cursor and current cursor because the cursor index can jump due to copy & paste & selection
        const doc = this.editor.getDoc();
        let fromLine = Math.min(this.lastCursor.line, cursor.line);
        let toLine = Math.max(this.lastCursor.line, cursor.line);
        this.foldBetweenLines(doc, fromLine, toLine, cursor);

        this.lastCursor = cursor;
    }

    private foldBetweenLines(doc, fromLine, toLine, currentCursor) {
        for (let lineNo = fromLine; lineNo <= toLine; ++lineNo) {
            const line = doc.getLine(lineNo);
            const lineTokens = this.editor.getLineTokens(lineNo);
            if (this.lineFilter) {
                if (!this.lineFilter(line, lineTokens)) {
                    continue;
                }
            }

            for (let regIndex = 0; regIndex < this.regexList.length; ++regIndex) {
                let match = this.regexList[regIndex].exec(line);
                while (match) {
                    this.foldByMatch(doc, lineNo, currentCursor, match, regIndex);
                    match = this.regexList[regIndex].exec(line);
                }
            }
        }
    }

    public foldAll() {
        const doc = this.editor.getDoc();
        const cursor = this.editor.getCursor();
        this.lastCursor = cursor;
        this.foldBetweenLines(doc, 0, doc.lineCount(), cursor);
    }

    private foldByMatch(doc, lineNo, cursor, match, regIndex) {
        if (match) {
            // not fold when it is folded ?
            if (!this.editor
                .findMarksAt({line: lineNo, ch: match.index})
                .find((marker) => marker.className === this.MARKER_CLASS_NAME)) {

                const from = {line: lineNo, ch: match.index + this.options.prefixLength};
                const to = {line: lineNo, ch: match.index + match[0].length - this.options.suffixLength};
                let matched = match[1];

                // not fold when the cursor is in the block
                if (!(cursor.line === lineNo && cursor.ch >= from.ch - 1 && cursor.ch <= to.ch)) {
                    doc.markText(
                        from,
                        to,
                        {
                            replacedWith: this.renderer(matched, regIndex),
                            handleMouseEvents: true,
                            className: this.MARKER_CLASS_NAME, // class name is not renderer in DOM
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
            if (marker.className === this.MARKER_CLASS_NAME) {
                marker.clear();
            }
        }
    }
}
