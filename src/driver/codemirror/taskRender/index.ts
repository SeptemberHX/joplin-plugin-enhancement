import {markdownRenderTasks} from "./taskRender";
import {debounce} from "ts-debounce";
import {markdownRenderHTags} from "./render-h-tags";

module.exports = {
    default: function (_context) {
        return {
            plugin: function (CodeMirror) {
                CodeMirror.defineOption("enhancementTaskRender", [], async function (cm, val, old) {
                    const debounceRender = debounce(() => {renderElements(cm)}, 100);
                    cm.on('cursorActivity', debounceRender)
                    cm.on('viewportChange', debounceRender)
                    cm.on('optionChange', debounceRender)
                    cm.on('change', async function (cm, changeObjs) {
                        if (changeObjs.origin === 'setValue') {
                            renderElements(cm);
                        }
                    });
                });
            },
            codeMirrorOptions: {'enhancementTaskRender': true},
            assets: function () {
                return [
                    {
                        name: 'taskRender.css'
                    }
                ];
            }
        }
    },
}

function renderElements (cm: CodeMirror.Editor): void {
    markdownRenderTasks(cm);
    markdownRenderHTags(cm);
}
