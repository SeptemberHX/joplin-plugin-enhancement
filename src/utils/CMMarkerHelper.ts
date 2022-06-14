// implemented according to https://github.com/ylc395/joplin-plugin-note-link-system/blob/main/src/driver/codeMirror/UrlFolder.ts

import { debounce } from "ts-debounce";


export default class CMMarkerHelper {
    lastCursor;
    renderer: (match, regIndex: number, from, to) => any;
    lineFilter: (line: string, lineToken: []) => boolean;
    options: {
        prefixLength: number,
        suffixLength: number
    };
    regexList;
    MARKER_CLASS_NAMES: string[];

    constructor(private readonly context, private readonly editor, regexList, renderer, MARKER_CLASS_NAMES, options, lineFilter?) {
        this.regexList = regexList;
        this.renderer = renderer;
        this.lineFilter = lineFilter;
        this.options = options;
        this.MARKER_CLASS_NAMES = MARKER_CLASS_NAMES;
        setTimeout(this.init.bind(this), 100);
    }

    private async init() {
        await this.foldAll();
        this.editor.on('cursorActivity', this.unfoldAtCursor.bind(this));
        this.editor.on('cursorActivity', debounce(this.onCursorActivity.bind(this), 200));
        this.editor.on('change', function (cm, changeObjs) {
            if (changeObjs.origin === 'setValue') {
                this.foldAll();
            }
        }.bind(this));
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
        this.editor.operation(function () {
            for (let lineNo = fromLine; lineNo <= toLine; ++lineNo) {
                const line = doc.getLine(lineNo);
                const lineTokens = this.editor.getLineTokens(lineNo);
                if (this.lineFilter) {
                    if (!this.lineFilter(line, lineTokens)) {
                        continue;
                    }
                }

                // todo: 需要大改这块逻辑。由于会有嵌套的情况存在，需要从里到外排序处理才行
                //  比如 ==Hello, **World**== 需要先处理 **World**，同时保存起止位置，复制 replacedWith 的 dom 节点数据
                //  然后在处理 == == 的时候，在 ** ** 范围内，直接使用已有的 dom 节点数据替代
                for (let regIndex = 0; regIndex < this.regexList.length; ++regIndex) {
                    let match = this.regexList[regIndex].exec(line);
                    while (match) {
                        this.foldByMatch(doc, lineNo, currentCursor, match, regIndex);
                        match = this.regexList[regIndex].exec(line);
                    }
                }
            }
        }.bind(this));
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
            this.editor.findMarksAt({line: lineNo, ch: match.index}).find((marker) => {
                if (marker.className === this.MARKER_CLASS_NAMES[regIndex]) {
                    marker.clear();
                }
            });

            const from = {line: lineNo, ch: match.index + this.options.prefixLength};
            const to = {line: lineNo, ch: match.index + match[0].length - this.options.suffixLength};

            // not fold when the cursor is in the block
            if (!(cursor.line === lineNo && cursor.ch >= from.ch - 1 && cursor.ch <= to.ch)) {
                doc.markText(
                    from,
                    to,
                    {
                        replacedWith: this.renderer(match, regIndex, from, to),
                        handleMouseEvents: true,
                        className: this.MARKER_CLASS_NAMES[regIndex], // class name is not renderer in DOM
                    },
                );
            }
        }
    }

    private unfoldAtCursor() {
        const cursor = this.editor.getCursor();
        const markers = this.editor.findMarksAt(cursor);

        for (const marker of markers) {
            if (marker.className in this.MARKER_CLASS_NAMES) {
                marker.clear();
            }
        }
    }
}
