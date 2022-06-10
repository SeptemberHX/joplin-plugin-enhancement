import BlockquoteEnhancedFolder from "./blockquoteEnhancedFolder";

module.exports = {
    default: function(_context) {
        return {
            plugin: function (CodeMirror) {
                CodeMirror.defineOption("quoteFolder", [], async function(cm, val, old) {
                    await new BlockquoteEnhancedFolder(_context, cm);
                });
            },
            codeMirrorOptions: { 'quoteFolder': true },
            assets: function() {
                return [ ];
            }
        }
    },
}
