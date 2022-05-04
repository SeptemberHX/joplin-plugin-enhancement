import {alignColumns, deleteColume, insertColumn, insertRow} from "./tableCommands";

export default class TableFormatterBridge {
    constructor(private readonly editor) {}
    private readonly doc = this.editor.getDoc();
    insertColumnLeft() {
        insertColumn(this.editor, true);
    }

    insertColumnRight() {
        insertColumn(this.editor, false);
    }

    insertRowAbove() {
        insertRow(this.editor, true);
    }

    insertRowBelow() {
        insertRow(this.editor, false);
    }

    deleteColumn() {
        deleteColume(this.editor);
    }

    alignColumnsCommand(options) {
        alignColumns(this.editor, options);
    }
}
