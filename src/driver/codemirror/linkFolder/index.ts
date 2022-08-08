import CMInlineMarkerHelperV2 from "../../../utils/CMInlineMarkerHelperV2";
import {debounce} from "ts-debounce";

const ENHANCED_LINK_MARKER = 'enhancement-link-marker';
const ENHANCED_IMAGE_MARKER = 'enhancement-image-marker';
const ENHANCED_FOOTNOTE_MARKER = 'enhancement-footnote-marker';

const ENHANCED_LINK_MARKER_ICON = 'enhancement-link-marker-icon';
const ENHANCED_LINK_MARKER_TEXT = 'enhancement-link-marker-text';

const ENHANCED_FOOTNOTE_MARKER_TEXT = 'enhancement-footnote-marker-text';

const ENHANCED_IMAGE_MARKER_ICON = 'enhancement-image-marker-icon';
const ENHANCED_IMAGE_MARKER_TEXT = 'enhancement-image-marker-text';
const ENHANCED_IMAGE_SIZE_TEXT = 'enhancement-image-size-text';

const ENHANCED_MARKER_LIST = [
    ENHANCED_LINK_MARKER,
    ENHANCED_IMAGE_MARKER,
    ENHANCED_FOOTNOTE_MARKER
];

const regexList = [
    /(?<!\!)\[([^\[]*?)\]\((.*?)\)/g,                 // link
    /\!\[([^\[]*?)\]\((.*?)\)(\{.*?\})?/g,            // image
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

                    const imageMarker = new CMInlineMarkerHelperV2(_context, cm, regexList[1], function (match, from, to) {
                        const markEl = document.createElement('span');

                        markEl.classList.add(ENHANCED_IMAGE_MARKER);
                        const iconEl = document.createElement('i');
                        iconEl.classList.add(ENHANCED_IMAGE_MARKER_ICON, 'fas', 'fa-image');
                        markEl.appendChild(iconEl);

                        const textEl = document.createElement('span');
                        textEl.classList.add(ENHANCED_IMAGE_MARKER_TEXT);
                        textEl.textContent = match[1];
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
                    }, ENHANCED_MARKER_LIST[1]);

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
