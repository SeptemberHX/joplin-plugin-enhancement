import {navigateCell, isCurrSelectionInTable, insertColumn} from "./tableCommands";


module.exports = {
    default: function(_context) {
        return {
            plugin: function (CodeMirror) {
                CodeMirror.defineOption("tableFormatter", [], async function(cm, val, old) {
                    if (old && old != CodeMirror.Init) {
                        cm.off('keyup', tabPressed);
                    }
                    cm.on('keyup', tabPressed);
                });

                function tabPressed(cm, event) {
                    if (event.code === 'Tab' && !event.shiftKey) {
                        navigateCell(cm, true, false);
                    } else if (event.code === 'Tab' && event.shiftKey) {
                        navigateCell(cm, true, true);
                    } else if (event.shiftKey && event.ctrlKey) {
                        console.log(event.code);
                        switch (event.code) {
                            case 'ArrowLeft':
                                insertColumn(cm, true);
                                break;
                            case 'ArrowRight':
                                insertColumn(cm, false);
                                break;
                            case 'ArrowUp':
                                break;
                            case 'ArrowDown':
                                break;
                            default:break;
                        }
                    }
                }
            },
            codeMirrorOptions: { 'tableFormatter': true },
            assets: function() {
                return [ ];
            }
        }
    },
}
