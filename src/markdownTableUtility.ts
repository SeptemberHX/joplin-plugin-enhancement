// implemented by takumisoft68 at https://github.com/takumisoft68/vscode-markdown-table/blob/master/src/markdownTableUtility.ts

/**
 * 1行分の文字列を列データ配列に分解する
 * 指定した列数に満たない行は 埋め文字 で埋める
 * @param linestr 1行分の文字列
 * @param columnNum 列数
 * @param fillstr 埋め文字
 */
export function splitline(linestr: string, columnNum: number, fillstr: string = '') {
    // 先頭と末尾の|を削除
    linestr = linestr.trim();
    if (linestr.startsWith('|')) {
        linestr = linestr.slice(1);
    }
    if (linestr.endsWith('|')) {
        linestr = linestr.slice(0, -1);
    }

    // |で分割
    let linedatas: string[] = [];
    let startindex = 0;
    let endindex = 0;
    let isEscaping = false;
    let isInInlineCode = false;
    for (let i = 0; i < linestr.length; ++i) {
        if (isEscaping) {
            // エスケープ文字の次の文字は|かどうか判定しない
            isEscaping = false;
            endindex++;
            continue;
        }

        const chara = linestr.charAt(i);
        if (chara === '\`') {
            // `の間はインラインコード
            isInInlineCode = !isInInlineCode;
            endindex++;
            continue;
        }
        if (isInInlineCode) {
            // インラインコード中は|かどうか判定しない
            endindex++;
            continue;
        }

        if (chara === '\\') {
            // \はエスケープ文字
            isEscaping = true;
            endindex++;
            continue;
        }

        if (chara !== '|') {
            // | 以外だったら継続
            endindex++;
            continue;
        }

        // | だったら分割
        let cellstr = linestr.slice(startindex, endindex);
        linedatas.push(cellstr);
        startindex = i + 1;
        endindex = i + 1;
    }
    linedatas.push(linestr.slice(startindex));

    // データ数分を''で埋めておく
    let datas: string[] = new Array(columnNum).fill(fillstr);
    // 行文字列から取得したデータに置き換える
    for (let i = 0; i < linedatas.length; i++) {
        datas[i] = linedatas[i];
    }
    return datas;
};



// 半角文字は1文字、全角文字は2文字として文字数をカウントする
export function getLen(str: string): number {
    let length = 0;
    for (let i = 0; i < str.length; i++) {
        let chp = str.codePointAt(i);
        if (chp === undefined) {
            continue;
        }
        let chr = chp as number;
        if (doesUse0Space(chr)) {
            length += 0;
        }
        else if (doesUse3Spaces(chr)) {
            length += 3;
        }
        else if (doesUse2Spaces(chr)) {
            // 全角文字の場合は2を加算
            length += 2;
        }
        else {
            //それ以外の文字の場合は1を加算
            length += 1;
        }

        let chc = str.charCodeAt(i);
        if (chc >= 0xD800 && chc <= 0xDBFF) {
            // サロゲートペアの時は1文字読み飛ばす
            i++;
        }

        // if( (chr >= 0x00 && chr <= 0x80) ||
        //     (chr >= 0xa0 && chr <= 0xff) ||
        //     (chr === 0xf8f0) ||
        //     (chr >= 0xff61 && chr <= 0xff9f) ||
        //     (chr >= 0xf8f1 && chr <= 0xf8f3)){
        //     //半角文字の場合は1を加算
        //     length += 1;
        // }else{
        //     //それ以外の文字の場合は2を加算
        //     length += 2;
        // }
    }
    //結果を返す
    return length;
};

function doesUse0Space(charCode: number): boolean {
    if ((charCode === 0x02DE) ||
        (charCode >= 0x0300 && charCode <= 0x036F) ||
        (charCode >= 0x0483 && charCode <= 0x0487) ||
        (charCode >= 0x0590 && charCode <= 0x05CF)) {
        return true;
    }
    return false;
}

function doesUse2Spaces(charCode: number): boolean {
    if ((charCode >= 0x2480 && charCode <= 0x24FF) ||
        (charCode >= 0x2600 && charCode <= 0x27FF) ||
        (charCode >= 0x2900 && charCode <= 0x2CFF) ||
        (charCode >= 0x2E00 && charCode <= 0xFF60) ||
        (charCode >= 0xFFA0)) {
        return true;
    }
    return false;
}

function doesUse3Spaces(charCode: number): boolean {
    if (charCode >= 0x1F300 && charCode <= 0x1FBFF) {
        return true;
    }
    return false;
}
