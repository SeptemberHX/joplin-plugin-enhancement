import CMInlineMarkerHelperV2 from "../../../utils/CMInlineMarkerHelperV2";
import {CMBlockMarkerHelperV2} from "../../../utils/CMBlockMarkerHelperV2";
import {BLOCK_IMAGE_REG, INLINE_IMAGE_REG} from "./regexps";
import {findLineWidgetAtLine} from "../../../utils/cm-utils";
import {ContextMsgType} from "../../../common";
import {renderStrToDom} from "../../../utils/string-render";


const ENHANCED_IMAGE_MARKER = 'enhancement-image-marker';
export const ENHANCED_BLOCK_IMAGE_MARKER = 'enhancement-block-image-marker';

const ENHANCED_IMAGE_MARKER_ICON = 'enhancement-image-marker-icon';
const ENHANCED_IMAGE_MARKER_TEXT = 'enhancement-image-marker-text';
const ENHANCED_IMAGE_SIZE_TEXT = 'enhancement-image-size-text';

export function createInlineImageMarker(context, cm) {
    return new CMInlineMarkerHelperV2(cm, INLINE_IMAGE_REG, function (match, from, to) {
        const markEl = document.createElement('span');

        markEl.classList.add(ENHANCED_IMAGE_MARKER);
        const iconEl = document.createElement('i');
        iconEl.classList.add(ENHANCED_IMAGE_MARKER_ICON, 'fas', 'fa-image');
        markEl.appendChild(iconEl);

        const textEl = document.createElement('span');
        textEl.classList.add(ENHANCED_IMAGE_MARKER_TEXT);
        textEl.innerHTML = renderStrToDom(match[1]);
        markEl.appendChild(textEl);

        if (match[3]) {
            const sizeEl = document.createElement('span');
            sizeEl.classList.add(ENHANCED_IMAGE_SIZE_TEXT);
            sizeEl.textContent = match[3].substr(1, match[3].length - 2);
            markEl.appendChild(sizeEl);
        }

        const typesStr = cm.getTokenTypeAt(from);
        if (typesStr) {
            for (const typeStr of typesStr.split(' ')) {
                markEl.classList.add(`cm-${typeStr}`);
            }
        }
        return markEl;
    }, ENHANCED_IMAGE_MARKER, function (line) {
        return !BLOCK_IMAGE_REG.test(line);
    });
}

export function createBlockImageMarker(context, cm) {
    return new CMBlockMarkerHelperV2(cm, null, BLOCK_IMAGE_REG, null, (beginMatch, endMatch, content, fromLine, toLine) => {
        const markEl = document.createElement('figure');
        const imgEl = document.createElement('img');

        let imgUrl = beginMatch[2] ? beginMatch[2] : '';
        if (imgUrl.startsWith(':/')) {
            context.postMessage({
                type: ContextMsgType.RESOURCE_PATH,
                content: beginMatch[2]
            }).then((path) => {
                imgEl.src = path;
                const lineWidget = findLineWidgetAtLine(cm, fromLine, ENHANCED_BLOCK_IMAGE_MARKER + '-line-widget');
                if (lineWidget) {
                    setTimeout(() => {lineWidget.changed()}, 50);
                }
            })
        } else {
            imgEl.src = imgUrl;
        }
        markEl.appendChild(imgEl);

        if (beginMatch[1]) {
            const captionEl = document.createElement('figcaption');
            captionEl.innerHTML = renderStrToDom(beginMatch[1]);
            markEl.appendChild(captionEl);
        }

        if (beginMatch[3]) {
            const widthMatch = /\{width=(\d+)(px|%|)\}/.exec(beginMatch[3]);
            if (widthMatch) {
                imgEl.style.width = widthMatch[1] + (widthMatch[2].length === 0 ? 'px' : widthMatch[2]);
            }
        }
        return markEl;
    }, () => {
        const span = document.createElement('span');
        span.textContent = '===> Folded Image Block <===';
        span.style.cssText = 'color: lightgray; font-size: smaller; font-style: italic;';
        return span;
    }, ENHANCED_BLOCK_IMAGE_MARKER, true, false, null, (content, e) => {
        const match = BLOCK_IMAGE_REG.exec(content);
        context.postMessage({
            type: ContextMsgType.OPEN_URL,
            content: match[2]
        });
    });
}
