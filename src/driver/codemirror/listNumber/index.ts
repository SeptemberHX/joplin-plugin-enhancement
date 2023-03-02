const listLineReg = /^\s*[\d|a-z]\./;


export function listNumberCorrector(context, cm: CodeMirror.Editor) {
    cm.on('cursorActivity', fixListNumber);
}

export function fixListNumber(cm: CodeMirror.Editor) {
    let currLineNumber = cm.getCursor().line;
    if (!currLineNumber) {
        return;
    }

    if (!listLineReg.test(cm.getLine(currLineNumber))) {
        return;
    }

    let listFromLineN = currLineNumber;
    for (let lineN = currLineNumber - 1; lineN >= 0; --lineN) {
        const lineStr = cm.getLine(lineN);
        if (!lineStr) {
            break;
        }

        if (!listLineReg.test(lineStr)) {
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

        if (!listLineReg.test(lineStr)) {
            break;
        }

        listToLineN = lineN;
    }

    console.log('Current list lines ' + listFromLineN + '-' + listToLineN);

    let lastIndexMap = {0: 0};
    let listIndexType = 1;  // 1: number; 2: a b c
    let currIndent = 0;
    let currIndexN = 0;
    for (let lineN = listFromLineN; lineN <= listToLineN; ++lineN) {
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
        }

        currIndent = indent;
        lastIndexMap[indent] = currIndexN;
        console.log('Correct line ' + lineN + ' with list number ' + currIndexN);
    }
}

function listNumberCorrect (cm: CodeMirror.Editor, pre: string, post: string, tokentype?: string): void {
    // Is something selected?
    if (!cm.somethingSelected()) {
        // TODO: Check token type state at the cursor position to leave the
        // mode if already in the mode.
        let currentToken = cm.getTokenAt(cm.getCursor()).type
        if (tokentype !== undefined && currentToken !== null && currentToken?.includes(tokentype)) { // -- the tokentypes can be multiple (spell-error, e.g.)
            // We are, indeed, currently in this token. So let's check *how*
            // we are going to leave the state.
            let to = { 'line': cm.getCursor().line, 'ch': cm.getCursor().ch + post.length }
            if (cm.getRange(cm.getCursor(), to) === post) {
                cm.setCursor(to)
            } else {
                // No sign in sight -> insert it. Cursor will automatically move forward
                cm.replaceSelection(post)
            }
        } else {
            // Not in the mode -> simply do the standard.
            cm.replaceSelection(pre + '' + post, 'start')
            // Move cursor forward (to the middle of the insertion)
            const cur = cm.getCursor()
            cur.ch = cur.ch + pre.length
            cm.setCursor(cur)
        }
        return
    }

    // Build the regular expression by first escaping problematic characters
    let preregex = pre.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    let postregex = post.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

    let re = new RegExp('^' + preregex + '.+?' + postregex + '$', 'g')

    const replacements = []
    for (const selection of cm.getSelections()) {
        if (re.test(selection)) {
            // We got something so unformat.
            replacements.push(selection.substr(pre.length, selection.length - pre.length - post.length))
        } else {
            // TODO: Check whether the user just selected the text itself and
            // not the formatting marks!

            // NOTE: Since the user can triple-click a line, that selection will
            // extend beyond the line. So check if the last char of selection is
            // a newline, and, if so, pluck that and push it after post.
            if (selection[selection.length - 1] === '\n') {
                replacements.push(pre + String(selection).substr(0, selection.length - 1) + post + '\n')
            } else {
                replacements.push(pre + selection + post)
            }
        }
    }

    // Replace with changes selections
    cm.replaceSelections(replacements, 'around')
}
