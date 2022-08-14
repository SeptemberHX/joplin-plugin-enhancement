import {CMBlockMarkerHelperV2} from "../../../utils/CMBlockMarkerHelperV2";
import {CODE_BLOCK_END, CODE_BLOCK_START} from "./regexps";

export const ENHANCED_CODE_BLOCK_MARKER = 'enhancement-code-block-marker';
const NOT_RENDERED = 'paper|mermaid|pseudocode';

const hljs = require('highlight.js');


export function createCodeBlockMarker(context, cm) {
    return new CMBlockMarkerHelperV2(cm, null, CODE_BLOCK_START, CODE_BLOCK_END, (beginMatch, endMatch, content, fromLine, toLine) => {
        const markEl = document.createElement('div');

        markEl.innerHTML = hljs.highlight(content, {language: beginMatch[1]}).value;

        return markEl;
    }, () => {
        const span = document.createElement('span');
        span.textContent = '===> Folded Code Block <===';
        span.style.cssText = 'color: lightgray; font-size: smaller; font-style: italic;';
        return span;
    }, ENHANCED_CODE_BLOCK_MARKER, true, false, (cm, line, match) => {
        if (match[1]) {
            return !NOT_RENDERED.includes(match[1].toLowerCase()) && hljs.getLanguage(match[1]);
        } else {
            return true;
        }
    }, (content, e) => {

    });
}
