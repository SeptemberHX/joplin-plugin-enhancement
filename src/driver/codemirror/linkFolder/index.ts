import CMMarkerHelper from "../../../utils/CMMarkerHelper";

const ENHANCED_LINK_MARKER = 'enhancement-folded-link';
const ENHANCED_LINK_MARKER_ICON = 'enhancement-folded-link-icon';
const ENHANCED_LINK_MARKER_TEXT = 'enhancement-folded-link-text';

const ENHANCED_HIGHLIGHT_MARKER = 'enhancement-highlight-marker';
const ENHANCED_INSERT_MARKER = 'enhancement-insert-marker';
const ENHANCED_EMPHASIS_MARKER = 'enhancement-emphasis-marker';
const ENHANCED_STRIKETHROUGH_MARKER = 'enhancement-strikethrough-marker';
const ENHANCED_SUB_MARKER = 'enhancement-sub-marker';
const ENHANCED_SUP_MARKER = 'enhancement-sup-marker';
const ENHANCED_ITALIC_MARKER = 'enhancement-italic-marker';
const ENHANCED_HEADER_MARKER = 'enhancement-header-marker';

const ENHANCED_MARKER_LIST = [
    ENHANCED_LINK_MARKER,
    ENHANCED_HIGHLIGHT_MARKER,
    ENHANCED_INSERT_MARKER,
    ENHANCED_EMPHASIS_MARKER,
    ENHANCED_STRIKETHROUGH_MARKER,
    ENHANCED_SUB_MARKER,
    ENHANCED_SUP_MARKER,
    ENHANCED_ITALIC_MARKER,
    ENHANCED_HEADER_MARKER
];

const regexList = [
    /(?<!\!)\[([^\[]*?)\]\(.*?\)/g,                 // link
    /(?<!\\)==(?=[^\s])([^=]*[^=\s\\])==/g,         // highlight from CalebJohn@joplin-rich-markdown
    /(?<!\\)\+\+(?=[^\s])([^\+]*[^\+\s\\])\+\+/g,   // insert    from CalebJohn@joplin-rich-markdown
    /(?<!\\)\*\*(?=[^\s])([^\*]*[^\*\s\\])\*\*/g,   // emphasis
    /(?<!\\)~~(?=[^\s])([^~]*[^~\s\\])~~/g,         // strikethrough
    /(?<![\\~])~(?=[^\s])([^~]*[^~\s\\])~/g,        // sub       from CalebJohn@joplin-rich-markdown
    /(?<![\\[])\^(?=[^\s])([^\^]*[^\^\s\\[])\^/g,   // sup       from CalebJohn@joplin-rich-markdown
    /(?<![\\\*])\*(?=[^\s])([^\*]*[^\*\s\\])\*/g,   // italic
    /^\s*(#+.*?)$/g,                                // header
];

module.exports = {
    default: function (_context) {
        return {
            plugin: function (CodeMirror) {
                CodeMirror.defineOption("enhancementLinkFolder", [], async function (cm, val, old) {
                    const mathMarkerHelper = new CMMarkerHelper(_context, cm, regexList, function (match, regIndex: number, from, to) {
                        let markEl;
                        if (regIndex === 0) {  // link
                            markEl = document.createElement('span');
                            markEl.classList.add(ENHANCED_LINK_MARKER);
                            const iconEl = document.createElement('i');
                            iconEl.classList.add(ENHANCED_LINK_MARKER_ICON, 'fas', 'fa-link');
                            markEl.appendChild(iconEl);

                            const textEl = document.createElement('span');
                            textEl.classList.add(ENHANCED_LINK_MARKER_TEXT);
                            markEl.appendChild(textEl);
                            textEl.textContent = match[1];
                        } else if (regIndex === 1) {  // highlight
                            markEl = document.createElement('span');
                            markEl.classList.add(ENHANCED_HIGHLIGHT_MARKER);
                            markEl.textContent = match[1];
                            markEl.style.cssText = 'background-color: var(--joplin-search-marker-background-color) !important;';
                        } else if (regIndex === 2) {  // insert
                            markEl = document.createElement('span');
                            markEl.classList.add(ENHANCED_INSERT_MARKER);
                            markEl.textContent = match[1];
                            markEl.style.cssText = 'text-decoration: underline;';
                        } else if (regIndex === 3) {  // emphasis
                            markEl = document.createElement('span');
                            markEl.classList.add(ENHANCED_EMPHASIS_MARKER);
                            markEl.textContent = match[1];
                            markEl.style.cssText = 'font-weight: bold;';
                        } else if (regIndex === 4) {  // strikethrough
                            markEl = document.createElement('span');
                            markEl.classList.add(ENHANCED_STRIKETHROUGH_MARKER);
                            markEl.textContent = match[1];
                            markEl.style.cssText = 'text-decoration: line-through;';
                        } else if (regIndex === 5) {  // sub
                            markEl = document.createElement('span');
                            markEl.classList.add(ENHANCED_SUB_MARKER);
                            markEl.textContent = match[1];
                            markEl.style.cssText = 'vertical-align: sub; font-size: smaller';
                        } else if (regIndex === 6) {  // sub
                            markEl = document.createElement('span');
                            markEl.classList.add(ENHANCED_SUP_MARKER);
                            markEl.textContent = match[1];
                            markEl.style.cssText = 'vertical-align: super; font-size: smaller';
                        } else if (regIndex === 7) {  // italic
                            markEl = document.createElement('span');
                            markEl.classList.add(ENHANCED_ITALIC_MARKER);
                            markEl.textContent = match[1];
                            markEl.style.cssText = 'font-style: italic;';
                        } else if (regIndex === 8) {  // headers
                            markEl = document.createElement('span');
                            markEl.classList.add(ENHANCED_HEADER_MARKER, 'cm-header');
                            let startIndex = 0;
                            for (let i = 0; i < match[1].length; ++i) {
                                if (match[1][i] !== '#') {
                                    startIndex = i;
                                    break;
                                }
                            }

                            markEl.textContent = match[1].substr(startIndex).trim();
                            markEl.classList.add(`cm-header-${startIndex}`);
                        }

                        const typesStr = cm.getTokenTypeAt(from);
                        if (typesStr) {
                            for (const typeStr of typesStr.split(' ')) {
                                markEl.classList.add(`cm-${typeStr}`);
                            }
                        }

                        return markEl;
                    }, ENHANCED_MARKER_LIST,
                        {prefixLength: 0, suffixLength: 0}, function (line, lineTokens) {
                        for (const [tokenIndex, token] of lineTokens.entries()) {
                            if (token.type?.includes('katex')) {
                                return false;
                            }
                        }
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
