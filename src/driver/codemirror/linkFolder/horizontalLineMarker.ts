import {CMBlockMarkerHelperV2} from "../../../utils/CMBlockMarkerHelperV2";
import {HORIZONTAL_LINE_REG} from "./regexps";

export const ENHANCED_HORIZONTAL_LINE_MARKER = 'enhancement-horizontal-line-marker';


export function createHorizontalLineMarker(context, cm) {
    return new CMBlockMarkerHelperV2(cm, null, HORIZONTAL_LINE_REG, null, (beginMatch, endMatch, content, fromLine, toLine) => {
        const hrEl = document.createElement('hr');
        return hrEl;
    }, () => {
        const span = document.createElement('span');
        span.textContent = '===> Folded Horizontal Line <===';
        span.style.cssText = 'color: lightgray; font-size: smaller; font-style: italic;';
        return span;
    }, ENHANCED_HORIZONTAL_LINE_MARKER, true, false, null, null, true);
}
