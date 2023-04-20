import {debounce} from "ts-debounce";

const listLineReg = /^\s*[\d|a-z]+\./;
const dotListLineReg = /^\s+[\*\-\+]\s/;
const indentLineReg = /^\s+/;


export function listNumberCorrector(context, cm: CodeMirror.Editor) {
    const fixListNumberDebounce = debounce((cm) => {
        fixListNumber(cm);
    }, 50);
    cm.on('cursorActivity', fixListNumberDebounce);
}

export function fixListNumber(cm: CodeMirror.Editor) {
    let currLineNumber = cm.getCursor().line;
    if (!currLineNumber) {
        return;
    }

    const currLine = cm.getLine(currLineNumber);
    if (!listLineReg.test(currLine) && !dotListLineReg.test(currLine)) {
        return;
    }

    // check list range starts
    let listFromLineN = currLineNumber;
    for (let lineN = currLineNumber - 1; lineN >= 0; --lineN) {
        const lineStr = cm.getLine(lineN);
        if (!lineStr) {
            break;
        }

        if (!listLineReg.test(lineStr) && !dotListLineReg.test(lineStr) && !indentLineReg.test(lineStr)) {
            break;
        }

        listFromLineN = lineN;
    }

    let listToLineN = currLineNumber;
    for (let lineN = currLineNumber + 1; lineN < cm.lineCount(); ++lineN) {
        const lineStr = cm.getLine(lineN);
        if (!lineStr) {
            break;
        }

        if (!listLineReg.test(lineStr) && !dotListLineReg.test(lineStr) && !indentLineReg.test(lineStr)) {
            break;
        }

        listToLineN = lineN;
    }
    // check list range ends

    let lastIndexMap = {0: 0};
    let listIndexType = 1;  // 1: number; 2: a b c
    let listIndexTypeMap = {};
    let currIndent = 0;
    let currIndexN = 0;
    for (let lineN = listFromLineN; lineN <= listToLineN; ++lineN) {
        // ignore stuff in codeblocks
        const token = cm.getTokenTypeAt({line: lineN, ch: 0});
        if (token && token.includes('jn-monospace')) {
            continue;
        }

        const lineStr = cm.getLine(lineN);
        const indent = lineStr.length - lineStr.trimStart().length;

        if (indent > currIndent) {
            currIndexN = 1;
        } else if (indent == currIndent) {
            currIndexN += 1;
        } else if (indent < currIndent) {
            if (indent in lastIndexMap) {
                currIndexN = lastIndexMap[indent] + 1;
            } else {
                currIndexN = 1;
            }

            for (let child of Object.keys(lastIndexMap)) {
                if (Number(child) > indent) {
                    delete lastIndexMap[child];
                }
            }

            for (let child of Object.keys(listIndexTypeMap)) {
                if (Number(child) > indent) {
                    delete listIndexTypeMap[child];
                }
            }
        }

        currIndent = indent;
        lastIndexMap[indent] = currIndexN;

        const regResult = listLineReg.exec(lineStr);

        if (!regResult) {
            continue;
        }

        const numberStr = regResult[0].substr(indent, regResult[0].length - indent);
        if (!(indent in listIndexTypeMap)) {
            if (/\d+\./.test(numberStr)) {
                listIndexTypeMap[indent] = 1;
            } else if (/[a-z]+\./.test(numberStr)) {
                listIndexTypeMap[indent] = 2;
            } else {
                listIndexTypeMap[indent] = 1;
            }
        }

        listIndexType = listIndexTypeMap[indent];
        let replacement = '';
        switch (listIndexType) {
            case 1:
                replacement = `${currIndexN}.`;
                break;
            case 2:
                replacement = `${convertToNumberingScheme(currIndexN)}.`;
                break;
            default:
                break;
        }

        if (numberStr == replacement) {
            continue;
        }

        cm.replaceRange(replacement, {'line': lineN, 'ch': indent}, {'line': lineN, 'ch': regResult[0].length});
    }
}

function convertToNumberingScheme(number) {
    var baseChar = ("a").charCodeAt(0),
        letters  = "";

    do {
        number -= 1;
        letters = String.fromCharCode(baseChar + (number % 26)) + letters;
        number = (number / 26) >> 0; // quick `floor`
    } while(number > 0);

    return letters;
}
