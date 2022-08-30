import {debounce} from "ts-debounce";
import {LineHandle} from "codemirror";

import {createBlockLinkMarker, createInlineLinkMarker, ENHANCED_BLOCK_LINK_MARKER} from "./linkMarker";
import {createBlockImageMarker, createInlineImageMarker, ENHANCED_BLOCK_IMAGE_MARKER} from "./imageMarker";
import {createInlineFootnoteMarker} from "./footnoteMarker";
import {createCodeBlockMarker, ENHANCED_CODE_BLOCK_MARKER} from "./codeMarker";
import {createBlockMathMarker, createInlineMathMarker, ENHANCEMENT_MATH_BLOCK_SPAN_MARKER_CLASS} from "./mathMaker";


const ENHANCEMENT_BLOCK_IMAGE_SPAN_MARKER_LINE_CLASS = 'enhancement-block-image-marker-span-line';
const ENHANCEMENT_BLOCK_LINK_SPAN_MARKER_LINE_CLASS = 'enhancement-block-link-marker-span-line';
const ENHANCEMENT_BLOCK_CODE_SPAN_MARKER_LINE_CLASS = 'enhancement-code-block-marker-span-line';
const ENHANCEMENT_MATH_BLOCK_SPAN_MARKER_LINE_CLASS = 'enhancement-math-block-marker-line';


export async function linkFolderOptionFunc(_context, cm, val, old) {
    const inlineLinkMarker = createInlineLinkMarker(_context, cm);
    const blockLinkMarker = createBlockLinkMarker(_context, cm);

    const inlineImageMarker = createInlineImageMarker(_context, cm);
    const blockImageMarker = createBlockImageMarker(_context, cm);

    const codeBlockMarker = createCodeBlockMarker(_context, cm)

    const blockMathMarker = createBlockMathMarker(_context, cm);
    const inlineMathMarker = createInlineMathMarker(_context, cm);

    cm.on('renderLine', (editor, line: LineHandle, element: Element) => {
        if (element.getElementsByClassName(ENHANCED_BLOCK_IMAGE_MARKER).length > 0) {
            element.classList.add(ENHANCEMENT_BLOCK_IMAGE_SPAN_MARKER_LINE_CLASS);
        } else if (element.getElementsByClassName(ENHANCED_BLOCK_LINK_MARKER).length > 0) {
            element.classList.add(ENHANCEMENT_BLOCK_LINK_SPAN_MARKER_LINE_CLASS);
        } else if (element.getElementsByClassName(ENHANCED_CODE_BLOCK_MARKER).length > 0) {
            element.classList.add(ENHANCEMENT_BLOCK_CODE_SPAN_MARKER_LINE_CLASS);
        } else if (element.getElementsByClassName(ENHANCEMENT_MATH_BLOCK_SPAN_MARKER_CLASS).length > 0) {
            element.classList.add(ENHANCEMENT_MATH_BLOCK_SPAN_MARKER_LINE_CLASS);
        }
    });

    const footnoteMarker = createInlineFootnoteMarker(_context, cm);

    function process(full: boolean) {
        cm.startOperation();

        if (cm.state.enhancement) {
            if (cm.state.enhancement.settings.linkFolder) {
                inlineLinkMarker.process(full);
                blockImageMarker.process(full);
                footnoteMarker.process(full);
                inlineImageMarker.process(full);
                blockLinkMarker.process(full);
            }

            if (cm.state.enhancement.settings.codeBlockHL) {
                codeBlockMarker.process(full);
            }

            if (cm.state.enhancement.settings.mathCmRender) {
                inlineMathMarker.process(full);
                blockMathMarker.process(full);
            }
        } else {
            inlineLinkMarker.process(full);
            blockImageMarker.process(full);
            footnoteMarker.process(full);
            inlineImageMarker.process(full);
            blockLinkMarker.process(full);
            codeBlockMarker.process(full);

            inlineMathMarker.process(full);
            blockMathMarker.process(full);
        }
        cm.endOperation();
    }

    const foldDebounce = debounce(() => {
        process(true);
    }, 100)
    cm.on('cursorActivity', foldDebounce);
    cm.on('viewportChange', foldDebounce);
    cm.on('change', function (cm, changeObjs) {
        if (changeObjs.origin === 'setValue') {
            process(true);
        }
    });
}
