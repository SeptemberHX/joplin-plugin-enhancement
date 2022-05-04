import QuickCommands, {ExtendedEditor} from "./quickCommands";
import {Editor} from "codemirror";

module.exports = {
    default: function(_context) {
        return {
            plugin: function (CodeMirror) {
                CodeMirror.defineOption("quickCommands", [], async function(cm, val, old) {
                    new QuickCommands(_context, cm as ExtendedEditor & Editor, CodeMirror);
                });
            },
            codeMirrorOptions: { 'quickCommands': true },
            assets: function() {
                return [ {name: 'quickCommands.css'} ];
            }
        }
    },
}
