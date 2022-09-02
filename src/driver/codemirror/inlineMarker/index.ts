import {exec} from "../../../utils/reg";

const markerTagsReg = /(?<=\()\S+(?=::[^)]+\))/g;
const markerColons = /(?<=\(\S+)::(?=[^)]+\))/g;
const markerLeftOpen = /\((?=\S+::[^)]+\))/g;
const markerRightClose = /(?<=\(\S+::[^)]+)\)/g;
const markerText = /(?<=\(\S+::)[^)]+(?=\))/g;

module.exports = {
    default: function(_context) {
        return {
            plugin: function (CodeMirror) {
                CodeMirror.defineOption("enhancementInlineMarker", [], async function(cm, val, old) {

                    cm.addOverlay({
                        requiredSettings: ['extraCSS'],
                        token: function (stream: any) {
                            const match = exec(markerTagsReg, stream);

                            const baseToken = stream.baseToken();
                            if (baseToken?.type && (
                                baseToken.type.includes("jn-inline-code") ||
                                baseToken.type.includes("comment") ||
                                baseToken.type.includes("katex"))) {
                                stream.pos += baseToken.size;
                            } else if (match && match.index === stream.pos) {
                                // advance
                                stream.pos += match[0].length || 1;
                                return `editor-marker-keyword editor-marker-keyword-${match[0]}`;
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
                            const match = exec(markerColons, stream);

                            const baseToken = stream.baseToken();
                            if (baseToken?.type && (
                                baseToken.type.includes("jn-inline-code") ||
                                baseToken.type.includes("comment") ||
                                baseToken.type.includes("katex"))) {
                                stream.pos += baseToken.size;
                            } else if (match && match.index === stream.pos) {
                                // advance
                                stream.pos += match[0].length || 1;
                                return `editor-marker editor-marker-colons`;
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
                            const match = exec(markerLeftOpen, stream);

                            const baseToken = stream.baseToken();
                            if (baseToken?.type && (
                                baseToken.type.includes("jn-inline-code") ||
                                baseToken.type.includes("comment") ||
                                baseToken.type.includes("katex"))) {
                                stream.pos += baseToken.size;
                            } else if (match && match.index === stream.pos) {
                                // advance
                                stream.pos += match[0].length || 1;
                                return `editor-marker editor-marker-left-open`;
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
                            const match = exec(markerRightClose, stream);

                            const baseToken = stream.baseToken();
                            if (baseToken?.type && (
                                baseToken.type.includes("jn-inline-code") ||
                                baseToken.type.includes("comment") ||
                                baseToken.type.includes("katex"))) {
                                stream.pos += baseToken.size;
                            } else if (match && match.index === stream.pos) {
                                // advance
                                stream.pos += match[0].length || 1;
                                return `editor-marker editor-marker-right-close`;
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
                            const match = exec(markerText, stream);

                            const baseToken = stream.baseToken();
                            if (baseToken?.type && (
                                baseToken.type.includes("jn-inline-code") ||
                                baseToken.type.includes("comment") ||
                                baseToken.type.includes("katex"))) {
                                stream.pos += baseToken.size;
                            } else if (match && match.index === stream.pos) {
                                // advance
                                stream.pos += match[0].length || 1;
                                return `editor-marker editor-marker-text`;
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
