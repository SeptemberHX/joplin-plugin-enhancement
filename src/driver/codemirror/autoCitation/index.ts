import InsertCitation from "./insertCitation";

module.exports = {
    default: function(_context) {
        return {
            plugin: function (CodeMirror) {
                CodeMirror.defineOption("enhancement_autoCitation", [], async function(cm, val, old) {
                    const commandBridge = new InsertCitation(cm);
                    CodeMirror.defineExtension('enhancement_insertCitation', commandBridge.insertPaperCitations.bind(commandBridge));
                    CodeMirror.defineExtension('enhancement_insertAnnotation', commandBridge.insertAnnotationCitations.bind(commandBridge));
                });
            },
            codeMirrorOptions: { 'enhancement_autoCitation': true },
            assets: function() {
                return [ ];
            }
        }
    },
}
