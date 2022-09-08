import CMInlineMarkerHelperV2 from "../../../utils/CMInlineMarkerHelperV2";
import {HTML_MARK_REG, HTML_MARK_STYLE_REG} from "./regexps";
import {renderStrToDom} from "../../../utils/string-render";


const ENHANCED_HTML_MARK_MARKER = 'enhancement-html-mark-marker';


export function createHtmlTagMarkRenderMarker(context, cm, renderBlock: boolean = false) {
    return new CMInlineMarkerHelperV2(cm, HTML_MARK_REG, function (match, from, to) {
        const markEl = document.createElement('mark');
        markEl.classList.add(ENHANCED_HTML_MARK_MARKER);
        markEl.innerHTML = renderStrToDom(match[1]);

        const styleMatch = HTML_MARK_STYLE_REG.exec(match[0]);
        if (styleMatch) {
            let cssText = '';
            for (const style of styleMatch[1].split(';')) {
                if (style.length > 0) {
                    cssText += style + ' !important;';
                }
            }

            markEl.style.cssText = cssText;
        }

        return markEl;
    }, ENHANCED_HTML_MARK_MARKER);
}
