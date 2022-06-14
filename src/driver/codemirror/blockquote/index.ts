import CMMarkerHelper from "../../../utils/CMMarkerHelper";
import {debounce} from "ts-debounce";

const ENHANCED_QUOTE_MARKER = 'enhancement-folded-blockquotes';
const ENHANCED_QUOTE_MARKER_NAME = 'enhancement-folded-blockquotes-name';
const ENHANCED_QUOTE_MARKER_DATE = 'enhancement-folded-blockquotes-date';

const regexList = [
    /(?<=\[)color=(.*?)(?=\])/g,
    /(?<=\[)name=(.*?)(?=\])/g,
    /(?<=\[)date=(.*?)(?=\])/g,
]

module.exports = {
    default: function (_context) {
        return {
            plugin: function (CodeMirror) {
                CodeMirror.defineOption("quoteFolder", [], async function (cm, val, old) {
                    const mathMarkerHelper = new CMMarkerHelper(_context, cm, regexList, function (match, regIndex: number, from, to, innerDomEleCopy, lastMatchFrom, lastMatchTo) {
                        const markEl = document.createElement('span');
                        markEl.classList.add(ENHANCED_QUOTE_MARKER);
                        switch (regIndex) {
                            case 0:
                                markEl.textContent = `■`;
                                markEl.style.cssText = `color: ${match[1]}; font-size: large; vertical-align: middle;`
                                break;
                            case 1:
                                markEl.classList.add('fas', 'fa-user', ENHANCED_QUOTE_MARKER_NAME);
                                break;
                            case 2:
                                markEl.classList.add('fas', 'fa-clock', ENHANCED_QUOTE_MARKER_DATE);
                                break;
                            default:
                                console.log(regIndex);
                                console.log(regIndex === 2);
                                break;
                        }
                        if (regIndex !== 0) {
                            markEl.style.cssText = 'color: darkgray;';
                        }
                        return markEl;
                    }, [ENHANCED_QUOTE_MARKER, ENHANCED_QUOTE_MARKER_NAME, ENHANCED_QUOTE_MARKER_DATE],  function (line, lineTokens) {
                        for (const [tokenIndex, token] of lineTokens.entries()) {
                            if (token.type?.includes('quote')) {
                                return true;
                            }
                        }
                        return false;
                    });
                });
            },
            codeMirrorOptions: {'quoteFolder': true},
            assets: function () {
                return [
                    {
                        name: "blockquote.css"
                    }
                ];
            }
        }
    },
}
