import CMMarkerHelper from "../../../utils/CMMarkerHelper";

const ENHANCED_LINK_MARKER = 'enhancement-folded-link';
const ENHANCED_LINK_MARKER_ICON = 'enhancement-folded-link-icon';
const ENHANCED_LINK_MARKER_TEXT = 'enhancement-folded-link-text';

const ENHANCED_MARKER_LIST = [
    ENHANCED_LINK_MARKER,
];

const regexList = [
    /(?<!\!)\[([^\[]*?)\]\(.*?\)/g,                 // link
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
                            textEl.textContent = match[1];
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
