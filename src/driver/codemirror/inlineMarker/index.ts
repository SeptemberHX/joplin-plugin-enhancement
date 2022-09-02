import {exec} from "../../../utils/reg";

const markerKeywordReg = /(?<=\()\S+::(?=[^\]]+\))/g;
const markerPart = /\((\S+)::[^\]]+\)/g;

module.exports = {
    default: function(_context) {
        return {
            plugin: function (CodeMirror) {
                CodeMirror.defineOption("enhancementInlineMarker", [], async function(cm, val, old) {

                    cm.addOverlay({
                        requiredSettings: ['extraCSS'],
                        token: function (stream: any) {
                            const match = exec(markerKeywordReg, stream);

                            const baseToken = stream.baseToken();
                            if (baseToken?.type && (
                                baseToken.type.includes("jn-inline-code") ||
                                baseToken.type.includes("comment") ||
                                baseToken.type.includes("katex"))) {
                                stream.pos += baseToken.size;
                            } else if (match && match.index === stream.pos) {
                                // advance
                                stream.pos += match[0].length || 1;
                                return `editor-marker-keyword editor-marker-keyword-${match[0].substr(0, match[0].length - 2)}`;
                            } else if (match) {
                                // jump to the next match
                                stream.pos = match.index;
                            } else {
                                stream.skipToEnd();
                            }

                            return null;
                        }
                    });

                    cm.addOverlay({
                        requiredSettings: ['extraCSS'],
                        token: function (stream: any) {
                            const match = exec(markerPart, stream);

                            const baseToken = stream.baseToken();
                            if (baseToken?.type && (
                                baseToken.type.includes("jn-inline-code") ||
                                baseToken.type.includes("comment") ||
                                baseToken.type.includes("katex"))) {
                                stream.pos += baseToken.size;
                            } else if (match && match.index === stream.pos) {
                                // advance
                                stream.pos += match[0].length || 1;
                                return `editor-marker editor-marker-${match[1]}`;
                            } else if (match) {
                                // jump to the next match
                                stream.pos = match.index;
                            } else {
                                stream.skipToEnd();
                            }

                            return null;
                        }
                    });
                });
            },
            codeMirrorOptions: { 'enhancementInlineMarker': true },
            assets: function() {
                return [
                    {
                        name: 'inlineMarkerStyle.css'
                    }
                ];
            }
        }
    },
}
