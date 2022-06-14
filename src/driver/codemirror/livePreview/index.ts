import CMMarkerHelper from "../../../utils/CMMarkerHelper";

const ENHANCED_HIGHLIGHT_MARKER = 'enhancement-highlight-marker';
const ENHANCED_INSERT_MARKER = 'enhancement-insert-marker';
const ENHANCED_EMPHASIS_MARKER = 'enhancement-emphasis-marker';
const ENHANCED_STRIKETHROUGH_MARKER = 'enhancement-strikethrough-marker';
const ENHANCED_SUB_MARKER = 'enhancement-sub-marker';
const ENHANCED_SUP_MARKER = 'enhancement-sup-marker';
const ENHANCED_ITALIC_MARKER = 'enhancement-italic-marker';
const ENHANCED_HEADER_MARKER = 'enhancement-header-marker';

const ENHANCED_MARKER_LIST = [
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
    /(?<!\\)==(?=[^\s])([^=]*[^=\s\\])==/g,         // highlight from CalebJohn@joplin-rich-markdown
    /(?<!\\)\+\+(?=[^\s])([^\+]*[^\+\s\\])\+\+/g,   // insert    from CalebJohn@joplin-rich-markdown
    /(?<!\\)\*\*(?=[^\s])([^\*]*[^\*\s\\])\*\*/g,   // emphasis
    /(?<!\\)~~(?=[^\s])([^~]*[^~\s\\])~~/g,         // strikethrough
    /(?<![\\~])~(?=[^\s])([^~]*[^~\s\\])~/g,        // sub       from CalebJohn@joplin-rich-markdown
    /(?<![\\[])\^(?=[^\s])([^\^]*[^\^\s\\[])\^/g,   // sup       from CalebJohn@joplin-rich-markdown
    /(?<![\\\*])\*(?=[^\s])([^\*]*[^\*\s\\])\*/g,   // italic
    /^\s*(#+.*?)$/g,                                // header
];

const TOKEN_SIZE = [
    [2, 2],
    [2, 2],
    [2, 2],
    [2, 2],
    [1, 1],
    [1, 1],
    [1, 1],
    [0, 0]
];

module.exports = {
    default: function (_context) {
        return {
            plugin: function (CodeMirror) {
                CodeMirror.defineOption("enhancementLivePreview", [], async function (cm, val, old) {
                    const mathMarkerHelper = new CMMarkerHelper(_context, cm, regexList, function (match, regIndex: number, from, to, innerDomEleCopy, lastMatchFrom, lastMatchTo) {
                        const markEl = document.createElement('span');
                        if (regIndex === 0) {  // highlight
                            markEl.style.cssText = 'background-color: var(--joplin-search-marker-background-color) !important;';
                        } else if (regIndex === 1) {  // insert
                            markEl.style.cssText = 'text-decoration: underline;';
                        } else if (regIndex === 2) {  // emphasis
                            markEl.style.cssText = 'font-weight: bold;';
                        } else if (regIndex === 3) {  // strikethrough
                            markEl.style.cssText = 'text-decoration: line-through;';
                        } else if (regIndex === 4) {  // sub
                            markEl.style.cssText = 'vertical-align: sub; font-size: smaller';
                        } else if (regIndex === 5) {  // sub
                            markEl.style.cssText = 'vertical-align: super; font-size: smaller';
                        } else if (regIndex === 6) {  // italic
                            markEl.style.cssText = 'font-style: italic;';
                        } else if (regIndex === 7) {  // headers
                            markEl.classList.add(ENHANCED_MARKER_LIST[regIndex], 'cm-header');
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

                        if (regIndex !== 7) {
                            markEl.classList.add(ENHANCED_MARKER_LIST[regIndex]);
                            if (innerDomEleCopy) {
                                const leftEl = document.createElement('span');
                                leftEl.textContent = match[1].substr(0, lastMatchFrom - from.ch - TOKEN_SIZE[regIndex][0]);  // 2 is the highlight token length

                                const rightEl = document.createElement('span');
                                rightEl.textContent = match[1].substr(lastMatchTo - from.ch - TOKEN_SIZE[regIndex][0]);

                                markEl.appendChild(leftEl);
                                markEl.appendChild(innerDomEleCopy);
                                markEl.appendChild(rightEl);
                            } else {
                                markEl.textContent = match[1];
                            }
                        }

                        const typesStr = cm.getTokenTypeAt(from);
                        if (typesStr) {
                            for (const typeStr of typesStr.split(' ')) {
                                markEl.classList.add(`cm-${typeStr}`);
                            }
                        }

                        return markEl;
                    }, ENHANCED_MARKER_LIST, function (line, lineTokens) {
                        for (const [tokenIndex, token] of lineTokens.entries()) {
                            if (token.type?.includes('katex')) {
                                return false;
                            }
                        }
                        return true;
                    });
                });
            },
            codeMirrorOptions: {'enhancementLivePreview': true},
            assets: function () {
                return [
                ];
            }
        }
    },
}
