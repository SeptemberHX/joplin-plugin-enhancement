import {Editor, Position} from "codemirror";

export function isRangeSelected(from: Position, to: Position, cm: Editor): boolean {
    let selected = false;
    for (let selection of cm.getDoc().listSelections()) {
        if (from.line < selection.from().line || (from.line === selection.from().line && from.ch < selection.from().ch)
            || to.line > selection.to().line || (to.line === selection.to().line && to.ch > selection.to().ch)) {
            ;
        } else {
            selected = true;
            break;
        }
    }
    return selected;
}

export function isCursorOutRange(cursorPos: Position, from: Position, to: Position) {
    return cursorPos.line < from.line || cursorPos.line > to.line
        || (cursorPos.line === from.line && cursorPos.ch < from.ch)
        || (cursorPos.line === to.line && cursorPos.ch > to.ch);
}

export function findLineWidgetAtLine(editor: Editor, lineNumber: number, className: string) {
    // check whether there exists rendered line widget
    const line = editor.lineInfo(lineNumber);
    if (line.widgets) {
        for (const wid of line.widgets) {
            if (wid.className === className) {
                return wid;
            }
        }
    }
    return null;
}
