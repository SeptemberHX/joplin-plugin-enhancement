module.exports = {
    default: function(_context) {
        return {
            plugin: function (CodeMirror) {
                const ignoreOverlay = {
                    token: function (stream, state) {
                        stream.next()
                        return null
                    }
                };

                CodeMirror.defineMode('markmap', function (config, modeConfig) {
                    return CodeMirror.getMode(config, 'joplin-markdown');
                });

                CodeMirror.defineMode('pseudocode', function (config, modeConfig) {
                    return CodeMirror.getMode(config, { name: 'stex', inMathMode: false });
                });
            },
            assets: function() {
                return [ ];
            }
        }
    },
}
