import {CMBlockMarkerHelperV2} from "../../../utils/CMBlockMarkerHelperV2";
import katex from 'katex'
import CMInlineMarkerHelperV2 from "../../../utils/CMInlineMarkerHelperV2";

export const ENHANCEMENT_MATH_BLOCK_SPAN_MARKER_CLASS = 'enhancement-math-block-marker';

export function createInlineMathMarker(context, cm) {
    return new CMInlineMarkerHelperV2(cm, /(?<!\$)\$([^\$]+)\$/g, (match, from, to) => {
        const markEl = document.createElement('span');
        katex.render(match[1], markEl, { throwOnError: false, displayMode: false, output: 'html' })
        return markEl;
    }, 'enhancement-inline-math-marker');
}

export function createBlockMathMarker(context, cm) {
    return new CMBlockMarkerHelperV2(cm, null, /^\s*\$\$\s*$/, /^\s*\$\$\s*$/, (beginMatch, endMatch, content: string, fromLine, toLine) => {
        let divElement = document.createElement("div");
        let spanElement = document.createElement('span');
        if (content.trim().length > 0) {
            let cCount = 0;
            for (let i = content.length - 1; i >= 0; i--) {
                if (content[i] === '\\') {
                    cCount++;
                } else {
                    break;
                }
            }

            katex.render(cCount % 2 !== 0 ? content.substring(0, content.length - 1) : content,
                spanElement, { throwOnError: false, strict: false, displayMode: true, output: 'html' })
        } else {
            spanElement.textContent = 'Empty Math Block';
        }
        divElement.appendChild(spanElement);
        divElement.style.cssText = 'text-align: center;'
        return divElement;
    }, () => {
        const span = document.createElement('span');
        span.textContent = '===> Folded Math Block <===';
        span.style.cssText = 'color: lightgray; font-size: smaller; font-style: italic;';
        return span;
    },ENHANCEMENT_MATH_BLOCK_SPAN_MARKER_CLASS, true, true, (editor, line, match) => {
        return !editor.getTokenTypeAt({line: line, ch: match.index}).includes('jn-monospace');
    });
}
