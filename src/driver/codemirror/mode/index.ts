export function initCodeMode(context, CodeMirror) {
    CodeMirror.defineMode('markmap', function (config, modeConfig) {
        return CodeMirror.getMode(config, 'joplin-markdown');
    });

    CodeMirror.defineMode('pseudocode', function (config, modeConfig) {
        return CodeMirror.getMode(config, { name: 'stex', inMathMode: false });
    });
}
