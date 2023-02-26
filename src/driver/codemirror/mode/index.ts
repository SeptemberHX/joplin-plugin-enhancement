export function initCodeMode(context, CodeMirror) {
    CodeMirror.defineMode('pseudocode', function (config, modeConfig) {
        return CodeMirror.getMode(config, { name: 'stex', inMathMode: false });
    });
}
