import CMInlineMarkerHelperV2 from "../../../utils/CMInlineMarkerHelperV2";
import {CMBlockMarkerHelperV2} from "../../../utils/CMBlockMarkerHelperV2";
import path from "path";
import {BLOCK_LINK_REG, INLINE_LINK_REG} from "./regexps";
import {findLineWidgetAtLine} from "../../../utils/cm-utils";
import {ContextMsgType} from "../../../common";

const mime = require('mime-types')

const ENHANCED_LINK_MARKER = 'enhancement-link-marker';
const ENHANCED_LINK_MARKER_ICON = 'enhancement-link-marker-icon';
const ENHANCED_LINK_MARKER_TEXT = 'enhancement-link-marker-text';
const ENHANCED_LINK_USER_LABEL = 'enhancement-link-user-label';
export const ENHANCED_BLOCK_LINK_MARKER = 'enhancement-block-link-marker';

const PDF_PAGE_REG = /#(\d+)$/;

enum LinkType {
    NOTE,
    OTHER
}

export function createInlineLinkMarker(context, cm, renderBlock: boolean = false) {
    return new CMInlineMarkerHelperV2(cm, INLINE_LINK_REG, function (match, from, to) {
        const markEl = document.createElement('span');
        markEl.classList.add(ENHANCED_LINK_MARKER);

        if (match[2].startsWith(':/')) {
            const joplinIcon = document.createElement('span');
            joplinIcon.classList.add(ENHANCED_LINK_MARKER_ICON, 'enhancement-joplin-icon');
            markEl.appendChild(joplinIcon);
        } else if (match[2].startsWith('#')) {
            // do nothing for link to current note
        } else {
            const iconEl = document.createElement('i');
            iconEl.classList.add(ENHANCED_LINK_MARKER_ICON, 'fas', 'fa-link');
            markEl.appendChild(iconEl);
        }

        const textEl = document.createElement('a');
        textEl.classList.add(ENHANCED_LINK_MARKER_TEXT);
        markEl.appendChild(textEl);

        let regularLinkCaption = match[1];
        regularLinkCaption = regularLinkCaption.replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>')
        regularLinkCaption = regularLinkCaption.replace(/__([^_]+?)__/g, '<strong>$1</strong>')
        regularLinkCaption = regularLinkCaption.replace(/\*([^*]+?)\*/g, '<em>$1</em>')
        regularLinkCaption = regularLinkCaption.replace(/\s_([^_]+?)_/g, ' <em>$1</em>')
        regularLinkCaption = regularLinkCaption.replace(/^_([^_]+?)_/, '<em>$1</em>')
        regularLinkCaption = regularLinkCaption.replace(/~~([^~]+?)~~/g, '<del>$1</del>')
        regularLinkCaption = regularLinkCaption.replace(/`([^`]+?)`/g, '<code>$1</code>')
        regularLinkCaption = regularLinkCaption.replace(/==([^=]+?)==/g, '<mark>$1</mark>')
        regularLinkCaption = regularLinkCaption.replace(/\+\+([^\+]+?)\+\+/g, '<ins>$1</ins>')
        textEl.innerHTML = regularLinkCaption;
        textEl.title = match[2];

        const typesStr = cm.getTokenTypeAt(from);
        if (typesStr) {
            for (const typeStr of typesStr.split(' ')) {
                markEl.classList.add(`cm-${typeStr}`);
            }
        }
        return markEl;
    }, ENHANCED_LINK_MARKER, function (line) {
        return renderBlock ? true : !BLOCK_LINK_REG.test(line);
    }, async function (match, e) {
        // open url
        await context.postMessage({
            type: ContextMsgType.OPEN_URL,
            content: match[2]
        });
    });
}

export function createBlockLinkMarker(context, cm) {
    return new CMBlockMarkerHelperV2(cm, null, BLOCK_LINK_REG, null, (beginMatch, endMatch, content, fromLine, toLine) => {
        const markEl = document.createElement('div');

        function renderByPath(userLabel, filePath, pdfPageNum?) {
            const mimeType = mime.contentType(path.extname(filePath));
            if (mimeType) {
                if (mimeType.startsWith('video/')) {
                    const videoEl = document.createElement('video');
                    const source = document.createElement('source');
                    source.setAttribute('src', filePath);
                    source.setAttribute('type', mimeType);
                    videoEl.appendChild(source);
                    videoEl.autoplay = false;
                    videoEl.controls = true;
                    videoEl.muted = false;

                    markEl.appendChild(videoEl);
                } else if (mimeType.startsWith('audio/')) {
                    const audioEl = document.createElement('audio');
                    const source = document.createElement('source');
                    source.setAttribute('src', filePath);
                    source.setAttribute('type', mimeType);
                    audioEl.appendChild(source);
                    audioEl.autoplay = false;
                    audioEl.controls = true;

                    markEl.appendChild(audioEl);
                } else if (mimeType === 'application/pdf') {
                    const iframeEl = document.createElement('iframe');
                    iframeEl.classList.add('enhancement-pdf-iframe');
                    iframeEl.src = filePath + '#toolbar=0';
                    if (pdfPageNum) {
                        iframeEl.src += `&page=${pdfPageNum}`
                    }
                    iframeEl.width = '100%';
                    iframeEl.height = '500px';
                    markEl.appendChild(iframeEl);
                } else {
                    const spanEl = document.createElement('span');
                    spanEl.textContent = filePath;
                    markEl.appendChild(spanEl);
                }
            } else {
                const spanEl = document.createElement('span');
                spanEl.textContent = filePath;
                markEl.appendChild(spanEl);
            }

            if (userLabel && userLabel.length > 0) {
                const labelEl = document.createElement('div');
                labelEl.classList.add(ENHANCED_LINK_USER_LABEL);
                labelEl.textContent = userLabel;
                markEl.appendChild(labelEl);
            }
        }

        if (beginMatch[4].startsWith('file://')) {
            const pdfPageMatch = PDF_PAGE_REG.exec(beginMatch[4]);
            if (pdfPageMatch) {
                renderByPath(beginMatch[2], beginMatch[4].substring(0, pdfPageMatch.index), pdfPageMatch[1]);
            } else {
                renderByPath(beginMatch[2], beginMatch[4]);
            }
        } else if (beginMatch[4].startsWith(':/')) {
            const pdfPageMatch = PDF_PAGE_REG.exec(beginMatch[4]);
            let resourceId = beginMatch[4];
            if (pdfPageMatch) {
                resourceId = resourceId.substring(0, pdfPageMatch.index);
            }

            context.postMessage({
                type: ContextMsgType.RESOURCE_PATH,
                content: resourceId
            }).then((filePath) => {
                if (pdfPageMatch) {
                    renderByPath(beginMatch[2], filePath, pdfPageMatch[1]);
                } else {
                    if (filePath) {
                        renderByPath(beginMatch[2], filePath);
                    } else {
                        markEl.appendChild(renderBlockNoteLink(beginMatch[2], beginMatch[4]));
                    }
                }
                const lineWidget = findLineWidgetAtLine(cm, fromLine, ENHANCED_BLOCK_LINK_MARKER + '-line-widget');
                if (lineWidget) {
                    setTimeout(() => {lineWidget.changed()}, 50);
                }
            })
        } else {
            markEl.appendChild(renderBlockNormalLink(beginMatch[2], beginMatch[4]));
        }

        return markEl;
    }, () => {
        const span = document.createElement('span');
        span.textContent = '===> Folded Link Block <===';
        span.style.cssText = 'color: lightgray; font-size: smaller; font-style: italic;';
        return span;
    }, ENHANCED_BLOCK_LINK_MARKER, true, false, null, (content, e) => {
        const match = BLOCK_LINK_REG.exec(content);
        let link = match[4];
        const pdfPageMatch = PDF_PAGE_REG.exec(link);
        if (pdfPageMatch) {
            link = link.substring(0, pdfPageMatch.index);
        }

        context.postMessage({
            type: ContextMsgType.OPEN_URL,
            content: link
        });
    });
}

function renderBlockNoteLink(title, link) {
    return renderBlockLink(title, link, LinkType.NOTE);
}

function renderBlockNormalLink(title, link) {
    return renderBlockLink(title, link, LinkType.OTHER);
}

function renderBlockLink(title, link, type: LinkType) {
    const result = document.createElement('div');
    result.classList.add('enhancement-link-block');
    const iconDiv = document.createElement('div');
    iconDiv.classList.add('enhancement-link-block-icon');
    if (type === LinkType.NOTE) {
        const joplinIcon = document.createElement('span');
        joplinIcon.classList.add(ENHANCED_LINK_MARKER_ICON, 'enhancement-joplin-icon');
        iconDiv.appendChild(joplinIcon);
    } else if (type === LinkType.OTHER) {
        const iconEl = document.createElement('span');
        iconEl.classList.add(ENHANCED_LINK_MARKER_ICON, 'enhancement-www-icon');
        iconDiv.appendChild(iconEl);
    }
    result.appendChild(iconDiv);

    const textDiv = document.createElement('div');
    textDiv.classList.add('enhancement-link-block-text');

    const textSpanEl = document.createElement('span');
    textSpanEl.classList.add('enhancement-link-block-title');

    const urlSpanEl = document.createElement('span');
    urlSpanEl.classList.add('enhancement-link-block-url');

    textDiv.appendChild(textSpanEl);
    textDiv.appendChild(urlSpanEl);

    if (title.length === 0) {
        textSpanEl.textContent = 'Everything is empty!';
        textSpanEl.classList.add('enhancement-link-block-title-warning');
    } else {
        textSpanEl.textContent = `${title}`;
    }

    if (link.length !== 0) {
        urlSpanEl.textContent = link;
    } else {
        urlSpanEl.textContent = 'Empty link address';
        urlSpanEl.classList.add('enhancement-link-block-url-warning');
    }

    result.appendChild(textDiv);
    return result;
}
