import CMMarkerHelper from "../../../utils/CMMarkerHelper";
import clickAndClear from "../../../utils/click-and-clear";

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
    /(?<!\!)\[([^\[]*?)\]\(.*?\)/g,                 // link
    /\!\[([^\[]*?)\]\(.*?\)(\{.*?\})?/g,            // image
    /(?<!(^\s*))\[\^(.*?)\]/g,                      // footnote
];

module.exports = {
    default: function (_context) {
        return {
            plugin: function (CodeMirror) {
                CodeMirror.defineOption("enhancementLinkFolder", [], async function (cm, val, old) {
                    const mathMarkerHelper = new CMMarkerHelper(_context, cm, regexList, function (match, regIndex: number, from, to, innerDomEleCopy, lastMatchFrom, lastMatchTo) {
                        const markEl = document.createElement('span');
                        if (regIndex === 0) {  // link
                            markEl.classList.add(ENHANCED_LINK_MARKER);
                            const iconEl = document.createElement('i');
                            iconEl.classList.add(ENHANCED_LINK_MARKER_ICON, 'fas', 'fa-link');
                            markEl.appendChild(iconEl);

                            const textEl = document.createElement('span');
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
                        } else if (regIndex === 1) {
                            markEl.classList.add(ENHANCED_IMAGE_MARKER);
                            const iconEl = document.createElement('i');
                            iconEl.classList.add(ENHANCED_IMAGE_MARKER_ICON, 'fas', 'fa-image');
                            markEl.appendChild(iconEl);

                            const textEl = document.createElement('span');
                            textEl.classList.add(ENHANCED_IMAGE_MARKER_TEXT);
                            textEl.textContent = match[1];
                            markEl.appendChild(textEl);

                            if (match[2]) {
                                const sizeEl = document.createElement('span');
                                sizeEl.classList.add(ENHANCED_IMAGE_SIZE_TEXT);
                                sizeEl.textContent = match[2].substr(1, match[2].length - 2);
                                markEl.appendChild(sizeEl);
                            }
                        } else if (regIndex === 2) {
                            markEl.classList.add(ENHANCED_FOOTNOTE_MARKER);
                            const textEl = document.createElement('span');
                            textEl.classList.add(ENHANCED_FOOTNOTE_MARKER_TEXT);
                            textEl.textContent = match[2];
                            markEl.appendChild(textEl);
                        }

                        const typesStr = cm.getTokenTypeAt(from);
                        if (typesStr) {
                            for (const typeStr of typesStr.split(' ')) {
                                markEl.classList.add(`cm-${typeStr}`);
                            }
                        }

                        return markEl;
                    }, ENHANCED_MARKER_LIST, function (line, lineTokens) {
                        // for (const [tokenIndex, token] of lineTokens.entries()) {
                        //     if (token.type?.includes('katex')) {
                        //         return false;
                        //     }
                        // }
                        return true;
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
