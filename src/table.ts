import {navigateCell} from "./tableCommands";

function plugin(CodeMirror) {
    CodeMirror.defineOption("tableFormatter", [], async function(cm, val, old) {
        if (old && old != CodeMirror.Init) {
            cm.off('keyup', tabPressed);
        }
        cm.on('keyup', tabPressed);
    });

    function tabPressed(cm, event) {
        console.log(event.code);
        if (event.code === 'Tab' && !event.shiftKey) {
            console.log('Tab pressed');
            navigateCell(cm, true, false);
        } else if (event.code === 'Tab' && event.shiftKey) {
            console.log('Shift-Tab pressed');
            navigateCell(cm, true, true);
        }
    }
}

module.exports = {
    default: function(_context) {
        return {
            plugin: plugin,
            codeMirrorOptions: { 'tableFormatter': true },
            assets: function() {
                return [ ];
            }
        }
    },
}
