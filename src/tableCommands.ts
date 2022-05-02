// code from https://github.com/takumisoft68/vscode-markdown-table/blob/master/src/commands.ts
import * as mdt from './markdowntable';

/**
 * merge navigateNextCell() and navigatePrevCell() into one function
 * migrate from vscode editor to codemirror
 */
export function navigateCell(cm, withFormat: boolean, prev=false) {
    // ドキュメント取得
    const doc = cm.getDoc();
    // 選択範囲取得
    const cur_selection = doc.listSelections()[0];

    // 表を探す
    let startLine = cur_selection.anchor.line;
    let endLine = cur_selection.anchor.line;

    while (startLine - 1 >= 0) {
        const line_text = doc.getLine(startLine);
        if (!isInTable(line_text)) {
            startLine++;
            break;
        }
        startLine--;
    }
    while (endLine + 1 < doc.lineCount()) {
        const line_text = doc.getLine(endLine + 1);
        if (!isInTable(line_text)) {
            break;
        }
        endLine++;
    }
    const table_selection = {
        'anchor': {'line': startLine, 'ch': 0},
        'head': {'line': endLine, 'ch': 10000}
    };
    doc.setSelection(table_selection.anchor, table_selection.head);
    const table_text = doc.getSelection();

    // 元のカーソル位置を取得
    const [prevline, prevcharacter] = [cur_selection.head.line - startLine, cur_selection.head.ch];

    // テーブルをTableDataにシリアライズ
    let tableData = mdt.stringToTableData(table_text);
    if (tableData.aligns[0][0] === undefined) {
        return;
    }

    // 元のカーソル位置のセルを取得
    const [prevRow, prevColumn] = mdt.getCellAtPosition(tableData, prevline, prevcharacter);

    // only used for navigating forward ->
    let isNextRow = false;

    // return if there is no previous cell when navigating backward <-
    if (prev) {
        // 先頭セルだったら何もしない
        if (prevColumn <= 0 && prevRow <= 0) {
            return;
        }
    } else {  // append a new line if necessary when navigating forward ->
        // 次のセルが新しい行になるかどうか
        isNextRow = (prevColumn + 1 >= tableData.columns.length);
        const isInsertNewRow = (
            // カラム行、または寄せ記号行の場合は3行目を作成する
            (prevRow <= 1 && tableData.cells.length === 0) ||
            // 現在の行が最終行で、かつ次の行に進む場合は末尾に1行追加する
            (isNextRow && prevRow >= tableData.cells.length + 1)
        );

        // 次の行が必要なら追加する
        if (isInsertNewRow === true) {
            tableData = mdt.insertRow(tableData, tableData.cells.length);
        }
    }

    // テーブルをフォーマットしたテキストを取得
    const new_text = withFormat ? mdt.toFormatTableStr(tableData) : tableData.originalText;
    const tableDataFormatted = mdt.stringToTableData(new_text);

    //エディタ選択範囲にテキストを反映
    doc.replaceRange(new_text, table_selection.anchor, table_selection.head);

    // 新しいカーソル位置を計算
    // character の +1 は表セル内の|とデータの間の半角スペース分
    let newColumn, newRow;
    if (prev) {
        newColumn = (prevColumn > 0) ? prevColumn - 1 : tableDataFormatted.columns.length - 1;
        newRow = (prevColumn > 0) ? prevRow : prevRow - 1;
    } else {
        newColumn = (isNextRow === true) ? 0 : prevColumn + 1;
        newRow = (isNextRow === true) ? prevRow + 1 : prevRow;
    }
    const [newline, newcharacter] = mdt.getPositionOfCell(tableDataFormatted, newRow, newColumn);
    const newPosition = {
        'line': table_selection.anchor.line + newline,
        'ch': table_selection.anchor.ch + newcharacter + 1
    };

    // カーソル位置を移動
    doc.setSelection(newPosition);
}

function isInTable(text: string) :boolean {
    return text.trim().startsWith('|');
}
