import {navigateCell, insertColumn, insertRow, deleteColume} from "./tableCommands";
import TableFormatterBridge from "./tableFormatterBridge";
import MermaidFolder from "../mermaidFolder/mermaidFolder";


module.exports = {
    default: function(_context) {
        return {
            plugin: function (CodeMirror) {
                CodeMirror.defineOption("tableFormatter", [], async function(cm, val, old) {
                    if (old && old != CodeMirror.Init) {
                        cm.off('keyup', tabPressed);
                    }
                    cm.on('keyup', tabPressed);

                    const commandBridge = new TableFormatterBridge(cm);
                    CodeMirror.defineExtension('insertColumnLeft', commandBridge.insertColumnLeft.bind(commandBridge));
                    CodeMirror.defineExtension('insertColumnRight', commandBridge.insertColumnRight.bind(commandBridge));
                    CodeMirror.defineExtension('insertRowAbove', commandBridge.insertRowAbove.bind(commandBridge));
                    CodeMirror.defineExtension('insertRowBelow', commandBridge.insertRowBelow.bind(commandBridge));
                    CodeMirror.defineExtension('deleteColumn', commandBridge.deleteColumn.bind(commandBridge));
                    CodeMirror.defineExtension('alignColumns', commandBridge.alignColumnsCommand.bind(commandBridge));

                    new MermaidFolder(_context, cm);
                });

                function tabPressed(cm, event) {
                    if (event.code === 'Tab' && !event.shiftKey) {
                        navigateCell(cm, true, false);
                    } else if (event.code === 'Tab' && event.shiftKey) {
                        navigateCell(cm, true, true);
                    } else if (event.shiftKey && event.ctrlKey && !event.metaKey) {
                        switch (event.code) {
                            case 'ArrowLeft':
                                insertColumn(cm, true);
                                break;
                            case 'ArrowRight':
                                insertColumn(cm, false);
                                break;
                            case 'ArrowUp':
                                insertRow(cm, true);
                                break;
                            case 'ArrowDown':
                                insertRow(cm, false);
                                break;
                            case 'Backspace':
                                deleteColume(cm);
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
