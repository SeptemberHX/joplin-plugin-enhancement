// implemented according to https://github.com/ylc395/joplin-plugin-note-link-system/blob/main/src/driver/codeMirror/UrlFolder.ts

import { debounce } from "ts-debounce";
import clickAndClear from "./click-and-clear";

interface MarkerMatch {
    regIndex: number;
    match;
}

export default class CMInlineMarkerHelper {
    lastCursor;
    renderer: (match, regIndex: number, from, to) => any;
    lineFilter: (line: string, lineToken: []) => boolean;
    clicked: (match, regIndex: number, e: MouseEvent) => void;
    regexList;
    MARKER_CLASS_NAMES: string[];

    constructor(private readonly context, private readonly editor, regexList, renderer, MARKER_CLASS_NAMES, lineFilter?, clicked?) {
        this.regexList = regexList;
        this.renderer = renderer;
        this.lineFilter = lineFilter;
        this.clicked = clicked;
        this.MARKER_CLASS_NAMES = MARKER_CLASS_NAMES;
        this.init();
    }

    private init() {
        const foldDebounce = debounce(() => {
            // todo: decide whether to set afterSetValue to false for better response when switching notes
            this.process(true);
        }, 100)
        this.editor.on('cursorActivity', foldDebounce);
        this.editor.on('viewportChange', foldDebounce);
        this.editor.on('change', function (cm, changeObjs) {
            if (changeObjs.origin === 'setValue') {
                this.process(true);
            }
        }.bind(this));
    }

    private process(afterSetValue: boolean = false) {
        this.editor.operation(function () {
            const viewport = this.editor.getViewport()
            const doc = this.editor.getDoc();
            const currentCursor = this.editor.getCursor();

            let fromLine = viewport.from;
            let toLine = viewport.to;

            if (afterSetValue) {
                fromLine = 0;

                // improve user experience;
                // todo: decide whether use smaller number or not
                toLine = this.editor.lineCount();
            }

            for (let lineNo = fromLine; lineNo < toLine; ++lineNo) {
                const line = doc.getLine(lineNo);
                if (!line) {
                    continue;
                }

                const lineTokens = this.editor.getLineTokens(lineNo);
                if (this.lineFilter) {
                    if (!this.lineFilter(line, lineTokens)) {
                        continue;
                    }
                }

                // to process the situations like ==Hello **World**== correctly
                //   we need to get all match and process with specific orders
                let lineMatches: MarkerMatch[] = [];
                for (let regIndex = 0; regIndex < this.regexList.length; ++regIndex) {
                    for (const match of line.matchAll(this.regexList[regIndex])) {
                        lineMatches.push({
                            regIndex: regIndex,
                            match: match
                        });
                    }
                }

                // we need to process from inside out, which means we need to process them in reverse order
                for (let currIndex = lineMatches.length - 1; currIndex >= 0; --currIndex) {
                    const markerMatch = lineMatches[currIndex];
                    this.foldByMatch(doc, lineNo, markerMatch.match, markerMatch.regIndex);
                }
            }
        }.bind(this));
    }

    private foldByMatch(doc, lineNo, match, regIndex) {
        if (match) {
            const cursor = this.editor.getCursor();
            // not fold when it is folded ?
            this.editor.findMarksAt({line: lineNo, ch: match.index}).find((marker) => {
                if (marker.className === this.MARKER_CLASS_NAMES[regIndex]) {
                    marker.clear();
                }
            });

            const from = {line: lineNo, ch: match.index};
            const to = {line: lineNo, ch: match.index + match[0].length};

            // not fold when the cursor is in the block
            if (!(cursor.line === lineNo && cursor.ch >= from.ch - 1 && cursor.ch <= to.ch)) {
                const element = this.renderer(match, regIndex, from, to);
                const textMarker = doc.markText(
                    from,
                    to,
                    {
                        replacedWith: element,
                        className: this.MARKER_CLASS_NAMES[regIndex], // class name is not renderer in DOM
                        clearOnEnter: true,
                        inclusiveLeft: false,
                        inclusiveRight: false
                    },
                );

                element.onclick = (e) => {
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        if (this.clicked) {
                            this.clicked(match, regIndex, e);
                        }
                    } else {
                        clickAndClear(textMarker, this.editor)(e);
                    }
                };
            }
        }
    }
}
