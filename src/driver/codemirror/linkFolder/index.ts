import CMMarkerHelper from "../../../utils/CMMarkerHelper";
import {debounce} from "ts-debounce";

const ENHANCED_LINK_MARKER = 'enhancement-folded-link';
const ENHANCED_LINK_MARKER_ICON = 'enhancement-folded-link-icon';
const ENHANCED_LINK_MARKER_TEXT = 'enhancement-folded-link-text';
const regexList = [
    // /(?<=((?<!\!)\[.*?\]))\((.*?)\)/g,
    /(?<!\!)\[([^\[]*?)\]\(.*?\)/g
];

module.exports = {
    default: function (_context) {
        return {
            plugin: function (CodeMirror) {
                CodeMirror.defineOption("enhancementLinkFolder", [], async function (cm, val, old) {
                    const mathMarkerHelper = new CMMarkerHelper(_context, cm, regexList, function (matched: string, regIndex: number) {
                        const markEl = document.createElement('span');
                        markEl.classList.add(ENHANCED_LINK_MARKER);
                        const iconEl = document.createElement('i');
                        iconEl.classList.add(ENHANCED_LINK_MARKER_ICON, 'fas', 'fa-link');
                        markEl.appendChild(iconEl);

                        const textEl = document.createElement('span');
                        textEl.classList.add(ENHANCED_LINK_MARKER_TEXT);
                        markEl.appendChild(textEl);
                        textEl.textContent = matched;
                        return markEl;
                    }, ENHANCED_LINK_MARKER, {prefixLength: 0, suffixLength: 0}, function (line, lineTokens) {
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
