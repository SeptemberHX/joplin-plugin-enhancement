import {exec} from "../../../utils/reg";

module.exports = {
    default: function(_context) {
        return {
            plugin: function (CodeMirror) {
                CodeMirror.defineOption("enhancement-overlay", [], async function(cm, val, old) {
                    function addOverlay(cm, reg, className) {
                        cm.addOverlay({
                            requiredSettings: ['extraCSS'],
                            token: function (stream: any) {
                                const match = exec(reg, stream);

                                const baseToken = stream.baseToken();
                                if (baseToken?.type && (
                                    baseToken.type.includes("jn-inline-code") ||
                                    baseToken.type.includes("comment") ||
                                    baseToken.type.includes("katex"))) {
                                    stream.pos += baseToken.size;
                                } else if (match && match.index === stream.pos) {
                                    // advance
                                    stream.pos += match[0].length || 1;
                                    return className;
                                } else if (match) {
                                    // jump to the next match
                                    stream.pos = match.index;
                                } else {
                                    stream.skipToEnd();
                                }

                                return null;
                            }
                        });
                    }

                    addOverlay(cm, /(?<=(!\[.*]\(.*\)))(\{.*\})/g, 'enhancement-image-size');
                    addOverlay(cm, /(?<!\$)\$(.+?)\$(?!\$)/g, 'enhancement-katex-inline-math');
                    addOverlay(cm, /- \[[x|X]\]\s+.*/g, 'enhancement-finished-task');
                });
            },
            codeMirrorResources: ['addon/mode/overlay'],
            codeMirrorOptions: { 'enhancement-overlay': true },
            assets: function() {
                return [ ];
            }
        }
    },
}
