// code implemented by takumisoft68 at https://github.com/takumisoft68/vscode-markdown-table/blob/master/src/markdowntable.tssss

import MarkdownTableData from './markdownTableData';
import * as Utility from './markdownTableUtility';


/**
 * テーブルを表すマークダウンテキストを MarkdownTableData に変換する
 * @param tableText テーブルを表すマークダウンテキスト
 */
export function stringToTableData(tableText: string): MarkdownTableData {
    let lines = tableText.split(/\r\n|\n|\r/);

    let getIndent = (linestr: string) => {
        if (linestr.trim().startsWith('|')) {
            let linedatas = linestr.split('|');
            return linedatas[0];
        }
        else {
            return '';
        }
    };

    // 1行目
    let columns = Utility.splitline(lines[0], 0);
    let columnNum = columns.length;
    let indent = getIndent(lines[0]);

    // 2行目の寄せ記号
    let aligns: [string, string][] = new Array();
    let aligndatas = Utility.splitline(lines[1], columnNum, '---').map((v) => v.trim());
    for (let i = 0; i < columnNum; i++) {
        let celldata = aligndatas[i];
        aligns[i] = [celldata[0], celldata.slice(-1)];
    }

    // セルの値を取得
    let cells: string[][] = new Array();
    let leftovers: string[] = new Array();
    let cellrow = -1;
    for (let row = 2; row < lines.length; row++) {
        cellrow++;

        let linedatas = Utility.splitline(lines[row], columnNum);
        cells[cellrow] = linedatas.slice(0, columnNum);

        // あまりデータを収集する
        leftovers[cellrow] = '';
        if (linedatas.length > columnNum) {
            let leftoverdatas = linedatas.slice(columnNum, linedatas.length);
            leftovers[cellrow] = leftoverdatas.join('|');
        }
    }

    return new MarkdownTableData(tableText, aligns, columns, cells, leftovers, indent);
}

/**
 * タブ区切りテキストを MarkdownTableData に変換する
 * @param tableText タブ区切りテキスト
 */
export function tsvToTableData(tsvText: string): MarkdownTableData {
    // 入力データを行ごとに分割する
    let lines = tsvText.split(/\r\n|\n|\r/);
    // カラムデータ
    let columns: string[] = new Array();
    let columntexts = lines[0].split('\t');
    // カラム数
    let columnCount = columntexts.length;

    for (let i = 0; i < columnCount; i++) {
        columns[i] = columntexts[i].trim();
    }

    // 入力データから改行とタブで分割した2次元配列を生成する
    let cells: string[][] = new Array();
    // カラム数よりもはみ出たデータ
    let leftovers: string[] = new Array();
    for (let row = 1; row < lines.length; row++) {
        // 各セルの値
        cells[row - 1] = new Array();
        // 行内のデータが足りない場合に備えて空白文字で埋める
        for (let column = 0; column < columnCount; column++) {
            cells[row - 1][column] = ' ';
        }

        // 余りデータを初期化
        leftovers[row - 1] = '';

        // 行データをタブで分割
        let lineValues = lines[row].split('\t');

        // 実際の値に置き換える
        for (let column = 0; column < lineValues.length; column++) {
            if (column >= columnCount) {
                // カラムヘッダーよりも多い場合ははみ出しデータ配列に保存
                leftovers[row - 1] += '\t' + lineValues[column];
                continue;
            }
            cells[row - 1][column] = lineValues[column].trim();
        }
    }

    // 表の寄せ記号
    let aligns: [string, string][] = new Array();
    for (let column = 0; column < columnCount; column++) {
        // 全部左寄せ
        aligns[column] = [':', '-'];
    }

    const table = new MarkdownTableData("", aligns, columns, cells, leftovers, '');
    return new MarkdownTableData(toFormatTableStr(table), aligns, columns, cells, leftovers, '');
}


/**
 * MarkdownTableData に行を追加
 * @param tableData
 * @param insertAt
 * @returns
 */
export function insertRow(tableData: MarkdownTableData, insertAt: number): MarkdownTableData {
    const columns = tableData.columns;
    const aligns = tableData.aligns;
    const cells = tableData.cells;
    const leftovers = tableData.leftovers;
    const column_num = tableData.columns.length;
    const indent = tableData.indent;

    cells.splice(insertAt, 0, Array.from({ length: column_num }, () => '  '));
    leftovers.splice(insertAt, 0, '');

    const table = new MarkdownTableData("", aligns, columns, cells, leftovers, indent);
    return new MarkdownTableData(toFormatTableStr(table), aligns, columns, cells, leftovers, indent);
}

export function deleteColumn(tableData: MarkdownTableData, deleteAt: number): MarkdownTableData {
    let columns = tableData.columns;
    let aligns = tableData.aligns;
    let cells = tableData.cells;
    let leftovers = tableData.leftovers;
    let column_num = tableData.columns.length;
    let indent = tableData.indent;

    columns.splice(deleteAt, 1);
    aligns.splice(deleteAt, 1);
    for (let i = 0; i < cells.length; i++) {
        cells[i].splice(deleteAt, 1);
    }

    const table = new MarkdownTableData("", aligns, columns, cells, leftovers, indent);
    return new MarkdownTableData(toFormatTableStr(table), aligns, columns, cells, leftovers, indent);
}

export function insertColumn(tableData: MarkdownTableData, insertAt: number): MarkdownTableData {
    let columns = tableData.columns;
    let aligns = tableData.aligns;
    let cells = tableData.cells;
    let leftovers = tableData.leftovers;
    let column_num = tableData.columns.length;
    let indent = tableData.indent;

    columns.splice(insertAt, 0, '');
    aligns.splice(insertAt, 0, ['-', '-']);
    for (let i = 0; i < cells.length; i++) {
        cells[i].splice(insertAt, 0, '');
    }

    const table = new MarkdownTableData("", aligns, columns, cells, leftovers, indent);
    return new MarkdownTableData(toFormatTableStr(table), aligns, columns, cells, leftovers, indent);
}



export function toFormatTableStr(tableData: MarkdownTableData): string {
    let alignData = true;
    let alignHeader = true;
    let columnNum = tableData.columns.length;

    // 各列の最大文字数を調べる
    let maxWidths: number[] = new Array();
    // コラムヘッダーの各項目の文字数
    for (let i = 0; i < tableData.columns.length; i++) {
        let cellLength = Utility.getLen(tableData.columns[i].trim());
        // 表の寄せ記号行は最短で半角3文字なので、各セル最低でも半角3文字
        maxWidths[i] = (3 > cellLength) ? 3 : cellLength;
    }

    for (let row = 0; row < tableData.cells.length; row++) {
        let cells = tableData.cells[row];
        for (let i = 0; i < cells.length; i++) {
            if (i > columnNum) { break; }
            let cellLength = Utility.getLen(cells[i].trim());
            maxWidths[i] = (maxWidths[i] > cellLength) ? maxWidths[i] : cellLength;
        }
    }

    let formatted: string[] = new Array();

    // 列幅をそろえていく
    for (let row = 0; row < tableData.cells.length; row++) {
        formatted[row] = '';
        formatted[row] += tableData.indent;
        let cells = tableData.cells[row];
        for (let i = 0; i < columnNum; i++) {
            let celldata = '';
            if (i < cells.length) {
                celldata = cells[i].trim();
            }
            let celldata_length = Utility.getLen(celldata);

            // | の後にスペースを入れる
            formatted[row] += '| ';
            if (alignData) {
                let [front, end] = tableData.aligns[i];
                if (front === ':' && end === ':') {
                    // 中央ぞろえ
                    for (let n = 0; n < (maxWidths[i] - celldata_length) / 2 - 0.5; n++) {
                        formatted[row] += ' ';
                    }
                    formatted[row] += celldata;
                    for (let n = 0; n < (maxWidths[i] - celldata_length) / 2; n++) {
                        formatted[row] += ' ';
                    }
                }
                else if (front === '-' && end === ':') {
                    // 右揃え
                    for (let n = 0; n < maxWidths[i] - celldata_length; n++) {
                        formatted[row] += ' ';
                    }
                    formatted[row] += celldata;
                }
                else {
                    // 左揃え
                    formatted[row] += celldata;
                    for (let n = 0; n < maxWidths[i] - celldata_length; n++) {
                        formatted[row] += ' ';
                    }
                }
            }
            else {
                // データ
                formatted[row] += celldata;
                // 余白を半角スペースで埋める
                for (let n = celldata_length; n < maxWidths[i]; n++) {
                    formatted[row] += ' ';
                }
            }
            // | の前にスペースを入れる
            formatted[row] += ' ';
        }
        formatted[row] += '|';

        // あまりデータを末尾に着ける
        if (tableData.leftovers[row].length > 0) {
            formatted[row] += tableData.leftovers[row];
        }
    }

    // 1行目を成形する
    let columnHeader = '';
    columnHeader += tableData.indent;
    for (let i = 0; i < columnNum; i++) {
        const columnText = tableData.columns[i].trim();
        const columnHeader_length = Utility.getLen(columnText);

        columnHeader += '| ';
        if (alignHeader) {
            let [front, end] = tableData.aligns[i];
            if (front === ':' && end === ':') {
                // 中央ぞろえ
                for (let n = 0; n < (maxWidths[i] - columnHeader_length) / 2 - 0.5; n++) {
                    columnHeader += ' ';
                }
                columnHeader += columnText;
                for (let n = 0; n < (maxWidths[i] - columnHeader_length) / 2; n++) {
                    columnHeader += ' ';
                }
            }
            else if (front === '-' && end === ':') {
                // 右揃え
                for (let n = 0; n < maxWidths[i] - columnHeader_length; n++) {
                    columnHeader += ' ';
                }
                columnHeader += columnText;
            }
            else {
                // 左揃え
                columnHeader += columnText;
                for (let n = 0; n < maxWidths[i] - columnHeader_length; n++) {
                    columnHeader += ' ';
                }
            }

        }
        else {
            columnHeader += columnText;
            // 余白を-で埋める
            for (let n = columnHeader_length; n < maxWidths[i]; n++) {
                columnHeader += ' ';
            }
        }
        columnHeader += ' ';
    }
    columnHeader += '|';


    // 2行目を成形する
    let tablemark = '';
    tablemark += tableData.indent;
    for (let i = 0; i < columnNum; i++) {
        let [front, end] = tableData.aligns[i];
        tablemark += '| ' + front;

        // 余白を-で埋める
        for (let n = 1; n < maxWidths[i] - 1; n++) {
            tablemark += '-';
        }
        tablemark += end + ' ';
    }
    tablemark += '|';

    formatted.splice(0, 0, columnHeader);
    formatted.splice(1, 0, tablemark);

    return formatted.join('\r\n');
}



// return [line, character]
export function getPositionOfCell(tableData: MarkdownTableData, cellRow: number, cellColumn: number): [number, number] {
    let line = (cellRow <= 0) ? 0 : cellRow;

    let lines = tableData.originalText.split(/\r\n|\n|\r/);
    let linestr = lines[cellRow];

    let cells = Utility.splitline(linestr, tableData.columns.length);

    let character = 0;
    character += tableData.indent.length;
    character += 1;
    for (let i = 0; i < cellColumn; i++) {
        character += cells[i].length;
        character += 1;
    }

    return [line, character];
}

// return [row, column]
export function getCellAtPosition(tableData: MarkdownTableData, line: number, character: number): [number, number] {
    let row = (line <= 0) ? 0 : line;

    let lines = tableData.originalText.split(/\r\n|\n|\r/);
    let linestr = lines[row];

    let cells = Utility.splitline(linestr, tableData.columns.length);

    let column = -1;
    let cell_end = tableData.indent.length;
    for (let cell of cells) {
        column++;
        cell_end += 1 + cell.length;

        if (character <= cell_end) {
            break;
        }
    }

    return [row, column];
}

export function getCellData(tableData: MarkdownTableData, cellRow: number, cellColumn: number): string {
    if (cellRow === 0) {
        return (tableData.columns.length > cellColumn) ? tableData.columns[cellColumn] : "";
    }
    if (cellRow === 1) {
        if (tableData.aligns.length <= cellColumn) {
            return "---";
        }
        let [front, end] = tableData.aligns[cellColumn];
        return ' ' + front + '-' + end + ' ';
    }
    if (cellRow >= tableData.cells.length + 2) {
        return "";
    }

    return tableData.cells[cellRow - 2][cellColumn];
}
