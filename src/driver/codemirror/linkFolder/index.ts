import CMMarkerHelper from "../../../utils/CMMarkerHelper";
import {debounce} from "ts-debounce";

const ENHANCED_LINK_MARKER = 'enhancement-folded-link';
const regexList = [
    /(?<=((?<!\!)\[.*?\]))\((.*?)\)/g,
]

module.exports = {
    default: function (_context) {
        return {
            plugin: function (CodeMirror) {
                CodeMirror.defineOption("enhancementLinkFolder", [], async function (cm, val, old) {
                    const mathMarkerHelper = new CMMarkerHelper(_context, cm, regexList, function (matched: string, regIndex: number) {
                        const markEl = document.createElement('span');
                        markEl.classList.add(ENHANCED_LINK_MARKER);
                        markEl.classList.add('fa', 'fa-ellipsis-h', 'fa-xs');
                        return markEl;
                    }, ENHANCED_LINK_MARKER, {prefixLength: 1, suffixLength: 1}, function (line, lineTokens) {
                        return true;
                    });

                    CodeMirror.defineExtension('cm-enhanced-link-marker', debounce(mathMarkerHelper.foldAll.bind(mathMarkerHelper), 50));
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
