import {markdownRenderTasks} from "./taskRender";
import {markdownRenderHTags} from "./render-h-tags";
import {markdownRenderTables} from "./render-tables";
import {debounce} from "ts-debounce";


export function taskAndHeaderRender(cm) {
    // While taskHandle is undefined, there's no task scheduled. Else, there is.
    let taskHandle: number|undefined

    const callback = function (cm: CodeMirror.Editor): void {
        if (taskHandle !== undefined) {
            return // Already a task registered
        }

        debounce(() => {
            renderElements(cm, true);
        }, 500)();
    }

    cm.on('change', async function (cm, changeObjs) {
        if (changeObjs.origin === 'setValue') {
            renderElements(cm, false);
        }
    });

    cm.on('cursorActivity', callback)
    cm.on('viewportChange', callback) // renderElements)
    cm.on('optionChange', callback)

    callback(cm);
}

function renderElements (cm: CodeMirror.Editor, viewPort: boolean): void {
    if (cm.state.enhancement) {
        if (cm.state.enhancement.settings.taskCmRender) {
            markdownRenderTasks(cm, viewPort);
        }

        if (cm.state.enhancement.settings.headerHashRender) {
            markdownRenderHTags(cm, viewPort);
        }

        if (cm.state.enhancement.settings.tableCmRender) {
            markdownRenderTables(cm);
        }
    } else {
        markdownRenderTasks(cm, viewPort);
        markdownRenderHTags(cm, viewPort);
        markdownRenderTables(cm);
    }
}
