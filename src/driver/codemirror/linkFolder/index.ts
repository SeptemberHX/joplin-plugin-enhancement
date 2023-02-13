import {debounce} from "ts-debounce";
import {LineHandle} from "codemirror";

import {createBlockLinkMarker, createInlineLinkMarker, ENHANCED_BLOCK_LINK_MARKER} from "./linkMarker";
import {createBlockImageMarker, createInlineImageMarker, ENHANCED_BLOCK_IMAGE_MARKER} from "./imageMarker";
import {createInlineFootnoteMarker} from "./footnoteMarker";
import {createCodeBlockMarker, ENHANCED_CODE_BLOCK_MARKER} from "./codeMarker";
import {createBlockMathMarker, createInlineMathMarker, ENHANCEMENT_MATH_BLOCK_SPAN_MARKER_CLASS} from "./mathMaker";
import {createHtmlTagInsRenderMarker, createHtmlTagMarkRenderMarker} from "./htmlTagRender";
import createPlantumlMarker, {
    ENHANCEMENT_PLANTUML_SPAN_MARKER_CLASS
} from "./plantumlMarker";


const ENHANCEMENT_BLOCK_IMAGE_SPAN_MARKER_LINE_CLASS = 'enhancement-block-image-marker-span-line';
const ENHANCEMENT_BLOCK_LINK_SPAN_MARKER_LINE_CLASS = 'enhancement-block-link-marker-span-line';
const ENHANCEMENT_BLOCK_CODE_SPAN_MARKER_LINE_CLASS = 'enhancement-code-block-marker-span-line';
const ENHANCEMENT_MATH_BLOCK_SPAN_MARKER_LINE_CLASS = 'enhancement-math-block-marker-line';
const ENHANCEMENT_PLANTUML_SPAN_MARKER_LINE_CLASS = 'enhancement-plantuml-block-marker-line';


export async function linkFolderOptionFunc(_context, cm, val, old) {
    const renderBlockLink = cm.state.enhancement ? !cm.state.enhancement.settings.blockLinkFolder : false;
    const renderBlockImage = cm.state.enhancement ? cm.state.enhancement.settings.blockImageFolder : false;
    const renderBlockImageCaption = cm.state.enhancement ? cm.state.enhancement.settings.blockImageCaption : false;
    const inlineLinkMarker = createInlineLinkMarker(_context, cm, renderBlockLink);
    const blockLinkMarker = createBlockLinkMarker(_context, cm);

    const inlineImageMarker = createInlineImageMarker(_context, cm, renderBlockImage);
    const blockImageMarker = createBlockImageMarker(_context, cm, renderBlockImageCaption);

    const codeBlockMarker = createCodeBlockMarker(_context, cm)

    const blockMathMarker = createBlockMathMarker(_context, cm);
    const inlineMathMarker = createInlineMathMarker(_context, cm);

    const htmlMarkMarker = createHtmlTagMarkRenderMarker(_context, cm);
    const htmlInsMarker = createHtmlTagInsRenderMarker(_context, cm);

    const plantumlMarker = createPlantumlMarker(_context, cm);

    cm.on('renderLine', (editor, line: LineHandle, element: Element) => {
        if (element.getElementsByClassName(ENHANCED_BLOCK_IMAGE_MARKER).length > 0) {
            element.classList.add(ENHANCEMENT_BLOCK_IMAGE_SPAN_MARKER_LINE_CLASS);
        } else if (element.getElementsByClassName(ENHANCED_BLOCK_LINK_MARKER).length > 0) {
            element.classList.add(ENHANCEMENT_BLOCK_LINK_SPAN_MARKER_LINE_CLASS);
        } else if (element.getElementsByClassName(ENHANCED_CODE_BLOCK_MARKER).length > 0) {
            element.classList.add(ENHANCEMENT_BLOCK_CODE_SPAN_MARKER_LINE_CLASS);
        } else if (element.getElementsByClassName(ENHANCEMENT_MATH_BLOCK_SPAN_MARKER_CLASS).length > 0) {
            element.classList.add(ENHANCEMENT_MATH_BLOCK_SPAN_MARKER_LINE_CLASS);
        } else if (element.getElementsByClassName(ENHANCEMENT_PLANTUML_SPAN_MARKER_CLASS).length > 0) {
            element.classList.add(ENHANCEMENT_PLANTUML_SPAN_MARKER_LINE_CLASS);
        }
    });

    const footnoteMarker = createInlineFootnoteMarker(_context, cm);

    function process(full: boolean) {
        cm.startOperation();

        if (cm.state.enhancement) {
            if (cm.state.enhancement.settings.linkFolder) {
                inlineLinkMarker.process(full);
                footnoteMarker.process(full);
                inlineImageMarker.process(full);
            }

            if (cm.state.enhancement.settings.blockLinkFolder) {
                blockLinkMarker.process(full);
            }

            if (cm.state.enhancement.settings.blockImageFolder) {
                blockImageMarker.process(full);
            }

            if (cm.state.enhancement.settings.codeBlockHL) {
                codeBlockMarker.process(full);
            }

            if (cm.state.enhancement.settings.mathCmRender) {
                inlineMathMarker.process(full);
                blockMathMarker.process(full);
            }

            htmlMarkMarker.process(full);
            htmlInsMarker.process(full);

            if (cm.state.enhancement.settings.plantumlCmRender) {
                plantumlMarker.process(full);
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
            htmlMarkMarker.process(full);
            htmlInsMarker.process(full);

            plantumlMarker.process(full);
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

    await foldDebounce();
}
