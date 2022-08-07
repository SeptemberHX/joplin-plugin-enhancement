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
