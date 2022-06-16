import {debounce} from "ts-debounce";
import {markdownRenderMath} from "./render-math";
var katex = require("katex");


module.exports = {
    default: function(_context) {
        return {
            plugin: function (CodeMirror) {
                CodeMirror.defineOption("mathRender", [], async function(cm, val, old) {
                    // While taskHandle is undefined, there's no task scheduled. Else, there is.
                    let taskHandle: number|undefined

                    const callback = function (cm: CodeMirror.Editor): void {
                        if (taskHandle !== undefined) {
                            return // Already a task registered
                        }

                        // @ts-ignore
                        taskHandle = requestIdleCallback(function () {
                            renderElements(cm)
                            taskHandle = undefined // Next task can be scheduled now
                        }, { timeout: 1000 }) // Don't wait more than 1 sec before executing this
                    }

                    cm.on('cursorActivity', callback)
                    cm.on('viewportChange', callback) // renderElements)
                    cm.on('optionChange', callback)
                });
            },
            codeMirrorOptions: { 'mathRender': true },
            assets: function() {
                return [
                    {
                        name: 'katex.min.css'
                    }
                ];
            }
        }
    },
}

function renderElements (cm: CodeMirror.Editor): void {
    cm.operation(function() {
        markdownRenderMath(cm);
    })
}
