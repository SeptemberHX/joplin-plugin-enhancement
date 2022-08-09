// implemented according to https://github.com/ylc395/joplin-plugin-note-link-system/blob/main/src/driver/codeMirror/UrlFolder.ts

import { debounce } from "ts-debounce";
import clickAndClear from "./click-and-clear";
import {isRangeSelected} from "./cm-utils";

interface MarkerMatch {
    match;
}

export default class CMInlineMarkerHelperV2 {
    renderer: (match, from, to) => any;
    lineFilter: (line: string) => boolean;
    clicked: (match, e: MouseEvent) => void;
    regex;
    MARKER_CLASS_NAME: string;

    constructor(private readonly context, private readonly editor, regex, renderer, MARKER_CLASS_NAME, lineFilter?, clicked?) {
        this.regex = regex;
        this.renderer = renderer;
        this.lineFilter = lineFilter;
        this.clicked = clicked;
        this.MARKER_CLASS_NAME = MARKER_CLASS_NAME;
    }

    /**
     * This function should be in editor.operation()
     */
    public process(afterSetValue: boolean = false) {
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

            if (this.lineFilter) {
                if (!this.lineFilter(line)) {
                    continue;
                }
            }

            // to process the situations like ==Hello **World**== correctly
            //   we need to get all match and process with specific orders
            let lineMatches: MarkerMatch[] = [];
            for (const match of line.matchAll(this.regex)) {
                lineMatches.push({
                    match: match
                });
            }

            // we need to process from inside out, which means we need to process them in reverse order
            for (let currIndex = lineMatches.length - 1; currIndex >= 0; --currIndex) {
                const markerMatch = lineMatches[currIndex];
                this.foldByMatch(doc, lineNo, markerMatch.match);
            }
        }
    }

    private foldByMatch(doc, lineNo, match) {
        if (match) {
            const cursor = this.editor.getCursor();
            // not fold when it is folded ?
            this.editor.findMarksAt({line: lineNo, ch: match.index}).find((marker) => {
                if (marker.className === this.MARKER_CLASS_NAME) {
                    marker.clear();
                }
            });

            const from = {line: lineNo, ch: match.index};
            const to = {line: lineNo, ch: match.index + match[0].length};

            let selected = isRangeSelected(from, to, this.editor);

            if (!selected) {
                // not fold when the cursor is in the block
                if (!(cursor.line === lineNo && cursor.ch >= from.ch && cursor.ch <= to.ch)) {
                    const element = this.renderer(match, from, to);
                    const textMarker = doc.markText(
                        from,
                        to,
                        {
                            replacedWith: element,
                            className: this.MARKER_CLASS_NAME, // class name is not renderer in DOM
                            clearOnEnter: true,
                            inclusiveLeft: false,
                            inclusiveRight: false
                        },
                    );

                    element.onclick = (e) => {
                        if (e.ctrlKey || e.metaKey) {
                            e.preventDefault();
                            if (this.clicked) {
                                this.clicked(match, e);
                            }
                        } else {
                            clickAndClear(textMarker, this.editor)(e);
                        }
                    };
                }
            }
        }
    }
}
