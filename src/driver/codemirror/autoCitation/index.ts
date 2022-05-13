import InsertCitation from "./insertCitation";

module.exports = {
    default: function(_context) {
        return {
            plugin: function (CodeMirror) {
                CodeMirror.defineOption("enhancement_autoCitation", [], async function(cm, val, old) {
                    const commandBridge = new InsertCitation(cm);
                    CodeMirror.defineExtension('enhancement_insertCitation', commandBridge.insertItems.bind(commandBridge));
                });
            },
            codeMirrorOptions: { 'enhancement_autoCitation': true },
            assets: function() {
                return [ ];
            }
        }
    },
}
