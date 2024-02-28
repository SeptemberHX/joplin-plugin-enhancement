/**
 * @ignore
 * BEGIN HEADER
 *
 * Contains:        CodeMirror formatting bar hook
 * CVM-Role:        CodeMirror plugin
 * Maintainer:      Hendrik Erz
 * License:         GNU GPL v3
 *
 * Description:     The formatting bar allows users to quickly apply some
 *                  formatting to a selection using their mouse instead of the
 *                  keyboard.
 *
 * END HEADER
 */

import CodeMirror from 'codemirror'
import tippy, { Instance } from 'tippy.js'
import {ContextMsgType} from "../../../../common";

/**
 * The formatting bar is shown while there is a selection
 *
 * @var {Instance|undefined}
 */
let formattingBar: Instance|undefined

/**
 * Contains the HTML contents of the formatting bar that will be shown.
 */
const FORMATTING_BAR_HTML = `<div class="editor-formatting-bar">
<div class="button" data-command="markdownBold"><i class="fas fa-bold in-button"></i></div>
<div class="button" data-command="markdownItalic"><i class="fas fa-italic in-button"></i></div>
<div class="button" data-command="markdownLink"><i class="fas fa-link in-button"></i></div>
<div class="button" data-command="markdownCode"><i class="fas fa-code in-button"></i></div>
<div class="button" data-command="markdownHL1"><i class="fas fa-circle color1 in-button"></i></div>
<div class="button" data-command="markdownHL2"><i class="fas fa-circle color2 in-button"></i></div>
<div class="button" data-command="markdownHL3"><i class="fas fa-circle color3 in-button"></i></div>
<div class="button" data-command="markdownHL4"><i class="fas fa-circle color4 in-button"></i></div>
<div class="button" data-command="markdownHL5"><i class="fas fa-circle color5 in-button"></i></div>
<div class="button" data-command="markdownHL6"><i class="fas fa-circle color6 in-button"></i></div>
<div class="button" data-command="markdownHL7"><i class="fas fa-circle color7 in-button"></i></div>
</div>`

export default function formattingBarHook (context, cm: CodeMirror.Editor): void {
    cm.on('cursorActivity', (cm) => {
        // Whenever we have a single selection, display a nice tooltip with some
        // fundamental formatting options
        const selections = cm.listSelections()
        if (Boolean(cm.somethingSelected()) && selections.length === 1) {
            // We have exactly one selection and it isn't just the cursor.
            // We have to retrieve the corresponding element. NOTE we have to delay
            // this, since at the point cursorActivity is fired, the selection will
            // not yet be rendered.
            setTimeout(() => {
                showFormattingBar(context, cm)
            }, 100)
        } else {
            // We either have multiple selections, or no selected text at all. In this
            // case, we should make sure that a possibly existing formatting bar is
            // being removed properly again.
            maybeHideFormattingBar()
        }
    })
}

/**
 * Hides the formatting bar if it is currently being shown.
 */
function maybeHideFormattingBar (): void {
    if (formattingBar !== undefined) {
        formattingBar.destroy()
        formattingBar = undefined
    }
}

/**
 * Shows the formatting bar attached to the current selection element.
 *
 * @param   {CodeMirror.Editor}  cm  The CodeMirror instance
 */
function showFormattingBar (context, cm: CodeMirror.Editor): void {
    const selection = cm.getWrapperElement().querySelector('.CodeMirror-selected')

    maybeHideFormattingBar()

    if (selection === null) {
        return // Selection is gone or already has a tippy shown
    }

    if (cm.isReadOnly()) {
        return // The instance is readonly, so we can't edit anything either way.
    }

    formattingBar = tippy(selection, {
        content: FORMATTING_BAR_HTML,
        allowHTML: true,
        animation: 'shift-toward',
        interactive: true,
        interactiveBorder: 100, // Do not close the popup when the mouse stays within 100px of the tooltip
        showOnCreate: true, // Immediately show the tooltip
        appendTo: cm.getWrapperElement(), // Necessary so that the tooltip isn't hidden by other DIVs
        onHidden: (instance) => {
            if (formattingBar !== undefined) {
                formattingBar.destroy()
                formattingBar = undefined
            }
        },
        theme: 'no-padding'
    })

    /**
     * Detects clicks on the formatting bar and issues corresponding commands.
     *
     * @param   {MouseEvent}  event  The fired event
     */
    formattingBar.popper.onclick = (event) => {
        if (event.target === null) {
            return // There should always be a target but you never know.
        }

        const target = event.target as HTMLElement

        if (target.tagName === 'I') {
            context.postMessage({
                type: ContextMsgType.SHORTCUT,
                content: target.parentElement?.dataset.command as string
            });
            ;(formattingBar as Instance).destroy()
            formattingBar = undefined
        } else if (target.classList.contains('button')) {
            console.log('====> Clicked', target.dataset.command as string);
            context.postMessage({
                type: ContextMsgType.SHORTCUT,
                content: target.dataset.command as string
            });
            ;(formattingBar as Instance).destroy()
            formattingBar = undefined
        } // Else: Clicked slightly outside
    }
}
