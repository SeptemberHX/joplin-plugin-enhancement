// code from https://github.com/codemirror/CodeMirror/pull/6426/files

const admonitionTypes = '(note|abstract|info|tip|success|question|warning|failure|danger|bug|example|quote|NOTE|ABSTRACT|INFO|TIP|SUCCESS|QUESTION|WARNING|FAILURE|DANGER|BUG|EXAMPLE|QUOTE)';

module.exports = {
    default: function(_context) {
        return {
            plugin: function (CodeMirror) {
                CodeMirror.defineMode("gfm-joplin-markdown", function(config, modeConfig) {
                    function blankLine(state) {
                        if(state.isAdmonition) {
                            return `line-admonition line-content line-background-admonition line-background-${state.admonitionType} admonition ${state.admonitionType} `;
                        }
                        return null;
                    }

                    function createAdmonitionOverlay(token, single_token) {
                        return {
                            startState: function() {
                                return {
                                    isAdmonition: false,
                                    admonitionType:"none"
                                };
                            },
                            copyState: function(s) {
                                return {
                                    isAdmonition: s.isAdmonition,
                                    admonitionType: s.admonitionType,
                                };
                            },
                            token: function(stream, state) {
                                if(stream.sol()){
                                    if(!state.isAdmonition) {
                                        if (stream.match(new RegExp(token + "\\s*" + admonitionTypes), false)) {
                                            stream.eatWhile(single_token);
                                            stream.eatWhile(' ');
                                            state.admonitionType = stream.match(new RegExp('^' + admonitionTypes))[0].toLowerCase();
                                            state.isAdmonition = true;
                                            return `line-admonition line-background-admonition line-background-header line-background-${state.admonitionType} admonition admonition-type ${state.admonitionType}`
                                        }
                                        stream.skipToEnd();
                                        return null;
                                    } else {
                                        if(stream.match(new RegExp(token + "(?=\\s*)$"), true)) {
                                            state.isAdmonition = false;
                                            stream.skipToEnd();
                                            return `line-admonition line-background-admonition line-background-${state.admonitionType} admonition admonition-end ${state.admonitionType}`;
                                        }
                                        stream.skipToEnd();
                                        return `line-admonition line-content line-background-admonition line-background-${state.admonitionType} admonition ${state.admonitionType} `;
                                    }
                                } else {
                                    stream.skipToEnd();
                                    return null;
                                }
                            },
                            blankLine: blankLine
                        };
                    }

                    var gfmAdmonitionOverlay = createAdmonitionOverlay('!!!', '!');
                    var gfmAdmonitionColonOverlay = createAdmonitionOverlay(':::', ':');

                    const mode1 = CodeMirror.overlayMode(CodeMirror.getMode(config, modeConfig.backdrop || 'joplin-markdown'), gfmAdmonitionColonOverlay, true);
                    return CodeMirror.overlayMode(mode1, gfmAdmonitionOverlay, true);
                });

                CodeMirror.defineOption("gfm-joplin-markdown", [], async function(cm, val, old) {
                    cm.setOption('mode', 'gfm-joplin-markdown');

                    cm.addOverlay({
                        requiredSettings: ['extraCSS'],
                        token: function (stream: any) {
                            const match = exec(/(?<=(!\[.*]\(.*\)))(\{.*\})/g, stream);

                            const baseToken = stream.baseToken();
                            if (baseToken?.type && (
                                baseToken.type.includes("jn-inline-code") ||
                                baseToken.type.includes("comment") ||
                                baseToken.type.includes("katex"))) {
                                stream.pos += baseToken.size;
                            } else if (match && match.index === stream.pos) {
                                // advance
                                stream.pos += match[0].length || 1;
                                return 'enhancement-image-size';
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
                            const match = exec(/(?<!\$)\$(.+?)\$(?!\$)/g, stream);

                            const baseToken = stream.baseToken();
                            if (baseToken?.type && (
                                baseToken.type.includes("jn-inline-code") ||
                                baseToken.type.includes("comment"))) {
                                stream.pos += baseToken.size;
                            } else if (match && match.index === stream.pos) {
                                // advance
                                stream.pos += match[0].length || 1;
                                return 'enhancement-katex-inline-math';
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
            codeMirrorResources: ['addon/mode/overlay'],
            codeMirrorOptions: { 'gfm-joplin-markdown': true },
            assets: function() {
                return [
                    {
                        name: "admonition.css"
                    }
                ];
            }
        }
    },
}

function exec(query: RegExp, stream: any) {
    query.lastIndex = stream.pos;
    return query.exec(stream.string);
}
