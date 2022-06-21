// implemented according to https://github.com/ylc395/joplin-plugin-note-link-system/blob/main/src/driver/codeMirror/UrlFolder.ts

import { debounce } from "ts-debounce";
import clickAndClear from "./click-and-clear";

interface MarkerMatch {
    regIndex: number;
    match;
}

export default class CMInlineMarkerHelper {
    lastCursor;
    renderer: (match, regIndex: number, from, to, innerDomEleCopy, lastMatchFrom, lastMatchTo) => any;
    lineFilter: (line: string, lineToken: []) => boolean;
    regexList;
    MARKER_CLASS_NAMES: string[];

    constructor(private readonly context, private readonly editor, regexList, renderer, MARKER_CLASS_NAMES, lineFilter?) {
        this.regexList = regexList;
        this.renderer = renderer;
        this.lineFilter = lineFilter;
        this.MARKER_CLASS_NAMES = MARKER_CLASS_NAMES;
        setTimeout(this.init.bind(this), 100);
    }

    private async init() {
        await this.foldAll();
        // this.editor.on('cursorActivity', this.unfoldAtCursor.bind(this));
        this.editor.on('cursorActivity', debounce(this.onCursorActivity.bind(this), 100));
        this.editor.on('change', async function (cm, changeObjs) {
            if (changeObjs.origin === 'setValue') {
                await this.foldAll();
            }
        }.bind(this));
    }

    private async onCursorActivity() {
        const cursor = this.editor.getCursor();
        // check whether the regex exists between last cursor and current cursor because the cursor index can jump due to copy & paste & selection
        const doc = this.editor.getDoc();
        let fromLine = Math.min(this.lastCursor.line, cursor.line);
        let toLine = Math.max(this.lastCursor.line, cursor.line);
        await this.foldBetweenLines(doc, fromLine, toLine + 1, cursor);

        this.lastCursor = cursor;
    }

    private async foldBetweenLines(doc, fromLine, toLine, currentCursor) {
        this.editor.operation(async function () {
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

                // sort all the matches according to the matched from index
                lineMatches.sort(function (a, b) {
                    if (a.match.index < b.match.index) {
                        return -1;
                    } else if (a.match.index > b.match.index) {
                        return 1;
                    } else {  // it should be impossible, otherwise there exist conflicts in the regList.
                        return 0;
                    }
                })

                // process independent matches separately: ==Hello, **world**==!, *Cheers*
                //                                         |     part 1        |  part 2 |
                let startIndex = 0;
                for (let currIndex = 1; currIndex < lineMatches.length; ++currIndex) {
                    if (lineMatches[currIndex].match.index >=
                        lineMatches[startIndex].match.index + lineMatches[startIndex].match[0].length) {
                        await this.processGroupedMatch(lineMatches.slice(startIndex, currIndex), doc, lineNo, currentCursor);
                        startIndex = currIndex;
                    }
                }
                if (startIndex < lineMatches.length) {
                    await this.processGroupedMatch(lineMatches.slice(startIndex, lineMatches.length), doc, lineNo, currentCursor);
                }
            }
        }.bind(this));
    }

    /*
     * The matches [1:] should be contained in the matches[0]
     */
    private async processGroupedMatch(markerMatches: MarkerMatch[], doc, lineNo, cursor) {
        // we need to process from inside out, which means we need to process them in reverse order
        let innerDomEleCopy = null;
        let lastMatchFrom = null;
        let lastMatchTo = null;
        for (let currIndex = markerMatches.length - 1; currIndex >= 0; --currIndex) {
            const markerMatch = markerMatches[currIndex];
            innerDomEleCopy = await this.foldByMatch(doc, lineNo, cursor, markerMatch.match, markerMatch.regIndex, innerDomEleCopy, lastMatchFrom, lastMatchTo);
            lastMatchFrom = markerMatch.match.index;
            lastMatchTo = markerMatch.match.index + markerMatch.match[0].length;
        }
    }

    public async foldAll() {
        const doc = this.editor.getDoc();
        const cursor = this.editor.getCursor();
        this.lastCursor = cursor;
        await this.foldBetweenLines(doc, 0, doc.lineCount(), cursor);
    }

    private async foldByMatch(doc, lineNo, cursor, match, regIndex, innerDomEleCopy, lastMatchFrom, lastMatchTo) {
        if (match) {
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
                const element = await this.renderer(match, regIndex, from, to, innerDomEleCopy, lastMatchFrom, lastMatchTo);
                const textMarker = doc.markText(
                    from,
                    to,
                    {
                        replacedWith: element,
                        handleMouseEvents: true,
                        className: this.MARKER_CLASS_NAMES[regIndex], // class name is not renderer in DOM
                        clearOnEnter: true,
                        inclusiveLeft: false,
                        inclusiveRight: false
                    },
                );

                element.onclick = (e) => {
                    clickAndClear(textMarker, this.editor)(e);
                };

                return element.cloneNode(true);
            }
        }
        return null;
    }
}
