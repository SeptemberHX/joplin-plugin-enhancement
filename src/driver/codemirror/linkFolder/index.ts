import CMInlineMarkerHelperV2 from "../../../utils/CMInlineMarkerHelperV2";
import {debounce} from "ts-debounce";
import {CMBlockMarkerHelperV2} from "../../../utils/CMBlockMarkerHelperV2";
import {LineHandle} from "codemirror";

const ENHANCED_LINK_MARKER = 'enhancement-link-marker';
const ENHANCED_IMAGE_MARKER = 'enhancement-image-marker';
const ENHANCED_FOOTNOTE_MARKER = 'enhancement-footnote-marker';

const ENHANCED_LINK_MARKER_ICON = 'enhancement-link-marker-icon';
const ENHANCED_LINK_MARKER_TEXT = 'enhancement-link-marker-text';
const ENHANCEMENT_LINK_SPAN_MARKER_LINE_CLASS = 'enhancement-link-marker-span-line';

const ENHANCED_FOOTNOTE_MARKER_TEXT = 'enhancement-footnote-marker-text';

const ENHANCED_MARKER_LIST = [
    ENHANCED_LINK_MARKER,
    ENHANCED_IMAGE_MARKER,
    ENHANCED_FOOTNOTE_MARKER
];

const regexList = [
    /(?<!\!)\[([^\[]*?)\]\((.*?)\)/g,                 // link
    /^\s*\!\[([^\[]*?)\]\((.*?)\)(\{.*?\})?\s*$/,     // image
    /(?<!(^\s*))\[\^(.*?)\]/g,                      // footnote
];

module.exports = {
    default: function (_context) {
        return {
            plugin: function (CodeMirror) {
                CodeMirror.defineOption("enhancementLinkFolder", [], async function (cm, val, old) {
                    const linkMarker = new CMInlineMarkerHelperV2(_context, cm, regexList[0], function (match, from, to) {
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
                    }, ENHANCED_MARKER_LIST[0], null, async function (match, e) {
                        // open url
                        await _context.postMessage({
                            type: 'openUrl',
                            content: match[2]
                        });
                    });

                    const imageMarker = new CMBlockMarkerHelperV2(cm, null, regexList[1], null, (beginMatch, endMatch, content, fromLine, toLine) => {
                        const markEl = document.createElement('figure');
                        const imgEl = document.createElement('img');

                        let imgUrl = beginMatch[2] ? beginMatch[2] : '';
                        if (imgUrl.startsWith(':/')) {
                            _context.postMessage({
                                type: 'imgPath',
                                content: beginMatch[2]
                            }).then((path) => {
                                imgEl.src = path;
                            })
                        } else {
                            imgEl.src = imgUrl;
                        }
                        markEl.appendChild(imgEl);

                        if (beginMatch[1]) {
                            const captionEl = document.createElement('figcaption');
                            captionEl.textContent = beginMatch[1];
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
                    }, ENHANCED_MARKER_LIST[1], true, false);

                    cm.on('renderLine', (editor, line: LineHandle, element: Element) => {
                        if (element.getElementsByClassName(ENHANCED_MARKER_LIST[1]).length > 0) {
                            element.classList.add(ENHANCEMENT_LINK_SPAN_MARKER_LINE_CLASS);
                        }
                    })

                    const footnoteMarker = new CMInlineMarkerHelperV2(_context, cm, regexList[2], function (match, from, to) {
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
                    }, ENHANCED_MARKER_LIST[2]);

                    function process(full: boolean) {
                        cm.startOperation();
                        linkMarker.process(full);
                        imageMarker.process(full);
                        footnoteMarker.process(full);
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
                });
            },
            codeMirrorOptions: {'enhancementLinkFolder': true},
            assets: function () {
                return [
                    {
                        name: 'linkFolder.css'
                    }
                ];
            }
        }
    },
}
