import {markdownRenderTasks} from "./taskRender";
import {markdownRenderHTags} from "./render-h-tags";

module.exports = {
    default: function (_context) {
        return {
            plugin: function (CodeMirror) {
                CodeMirror.defineOption("enhancementTaskRender", [], async function (cm, val, old) {
                    // While taskHandle is undefined, there's no task scheduled. Else, there is.
                    let taskHandle: number|undefined

                    const callback = function (cm: CodeMirror.Editor): void {
                        if (taskHandle !== undefined) {
                            return // Already a task registered
                        }

                        taskHandle = requestIdleCallback(function () {
                            renderElements(cm, true)
                            taskHandle = undefined // Next task can be scheduled now
                        }, { timeout: 1000 }) // Don't wait more than 1 sec before executing this
                    }

                    cm.on('change', async function (cm, changeObjs) {
                        if (changeObjs.origin === 'setValue') {
                            renderElements(cm, false);
                        }
                    });
                    cm.on('cursorActivity', callback)
                    cm.on('viewportChange', callback) // renderElements)
                    cm.on('optionChange', callback)
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

function renderElements (cm: CodeMirror.Editor, viewPort: boolean): void {
    markdownRenderTasks(cm, viewPort);
    markdownRenderHTags(cm, viewPort);
}
