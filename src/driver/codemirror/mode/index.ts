export function initCodeMode(context, CodeMirror) {
    // FIXME(cm6): For now, not supported in CM6
    if (CodeMirror.cm6) {
        return;
    }

    CodeMirror.defineMode('pseudocode', function (config, modeConfig) {
        return CodeMirror.getMode(config, { name: 'stex', inMathMode: false });
    });
}
