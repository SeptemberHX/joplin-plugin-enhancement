import CMInlineMarkerHelperV2 from "../../../utils/CMInlineMarkerHelperV2";
import {INLINE_FOOTNOTE_REG} from "./regexps";

const ENHANCED_FOOTNOTE_MARKER = 'enhancement-footnote-marker';
const ENHANCED_FOOTNOTE_MARKER_TEXT = 'enhancement-footnote-marker-text';


export function createInlineFootnoteMarker(context, cm) {
    return new CMInlineMarkerHelperV2(cm, INLINE_FOOTNOTE_REG, function (match, from, to) {
        const markEl = document.createElement('span');
        markEl.classList.add(ENHANCED_FOOTNOTE_MARKER);
        const textEl = document.createElement('span');
        textEl.classList.add(ENHANCED_FOOTNOTE_MARKER_TEXT);
        textEl.textContent = match[2];
        markEl.appendChild(textEl);

        const typesStr = cm.getTokenTypeAt(from);
        if (typesStr) {
            for (const typeStr of typesStr.split(' ')) {
                markEl.classList.add(`cm-${typeStr}`);
            }
        }
        return markEl;
    }, ENHANCED_FOOTNOTE_MARKER);
}
