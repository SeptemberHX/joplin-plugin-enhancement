import MermaidFolder from "./mermaidFolder";

module.exports = {
    default: function(_context) {
        return {
            plugin: function (CodeMirror) {
                CodeMirror.defineOption("mermaidFolder", [], async function(cm, val, old) {
                    await new MermaidFolder(_context, cm);
                });
            },
            codeMirrorOptions: { 'mermaidFolder': true },
            assets: function() {
                return [ ];
            }
        }
    },
}
