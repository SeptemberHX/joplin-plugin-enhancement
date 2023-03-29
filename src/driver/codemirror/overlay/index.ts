// This part mainly comes from https://github.com/CalebJohn/joplin-rich-markdown.
//    Some parts of the Enhancement plugin depends on the overlays of joplin-rich-markdown.
//    However, some features are conflict with joplin-rich-markdown (image, link, etc.).
//    Thus, codes below are copied from joplin-rich-markdown


import {exec} from "../../../utils/reg";
import * as IndentHandlers from './indent';
import {enhancement_overlay_option} from "../common";

export const highlight_regex = /(?<!\\)==(?=[^\s])[^=]*[^=\s\\]==/g;
export const insert_regex = /(?<!\\)\+\+(?=[^\s])[^\+]*[^\+\s\\]\+\+/g;
export const sub_regex = /(?<![\\~])~(?=[^\s])[^~]*[^~\s\\]~/g;
export const sup_regex = /(?<![\\[])\^(?=[^\s])[^\^]*[^\^\s\\[]\^/g;
export const emph_star_regex = /(?<![\\\*])\*(?!\*)/g;
export const emph_underline_regex = /(?<![\\\_])\_(?!\_)/g;
export const strong_star_regex = /(?<![\\\*])\*\*(?!\*)/g;
export const strong_underline_regex = /(?<![\\\_])\_\_(?!\_)/g;
export const highlight_token_regex = /(?<![\\=])==(?!=)/g;
export const insert_token_regex = /(?<![\\\+])\+\+(?!\+)/g;
export const sub_token_regex = /(?<![\\~])~(?!~)/g;
export const sup_token_regex = /(?<![\\\^])\^(?!\^)/g;
export const strike_token_regex = /(?<![\\~])~~(?!~~)/g;
export const header_regex = /^\s*#+\s/g;
// Taken from codemirror/addon/edit/continuelist.js
export const list_token_regex = /^(\s*)([*+-] ?=(\[[Xx ]\]\s)|[*+->]\s|(\d+)([.)]\s))(\s*)/g;
export const single_list_token_regex = /^(\s*)([*+-](?=( \[[Xx ]\]\s))|[*+->](?=\s))(\s*?)/g;
// Taken from codemirror/mode/markdown/markdown.js
export const hr_regex = /^([*\-_])(?:\s*\1){2,}\s*$/;
export const blockquote_regex = /^\s*\>+\s/g;
export const blockquote_token_regex = /^(\s*)>(?=(\s+.*))/g;

export const todo_priority_regex = /(?<=(-\s\[[xX\s]\].*\s))(!([1234]))/g;
export const todo_project_regex = /(?<=(-\s\[[xX\s]\].*\s))(@\S+)/g;
export const todo_tag_regex = /(?<=(-\s\[[xX\s]\].*\s))(\+\S+)/g;
export const todo_date_regex = /(?<=(-\s\[[xX\s]\].*\s))(\/\/\S+)/g;

const WRAP_CLASS = "CodeMirror-activeline";


export function initOverlayOption(_context, CodeMirror) {

    CodeMirror.defineExtension('initializeEnhancementOverlay', function() {
        function regexOverlay(cm, className, reg) {
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

        function todoPriorityRegexOverlay(cm, className, reg) {
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
                        return className + '-' + match[3];
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

        let cm = this;

        regexOverlay(cm, 'enhancement-image-size', /(?<=(!\[.*]\(.*\)))(\{.*\})/g);
        regexOverlay(cm, 'enhancement-katex-inline-math', /(?<!\$)\$(.+?)\$(?!\$)/g);
        regexOverlay(cm, 'enhancement-finished-task', /- \[[x|X]\]\s+.*/g);
        regexOverlay(cm, 'rm-single-list-token', single_list_token_regex);
        regexOverlay(cm, 'rm-ins', insert_regex);
        // regexOverlay(cm, 'rm-sub', sub_regex);
        // regexOverlay(cm, 'rm-sup', sup_regex);
        regexOverlay(cm, 'rm-header-token', header_regex);
        regexOverlay(cm, 'line-cm-rm-blockquote', blockquote_regex);
        regexOverlay(cm, 'rm-em-token', emph_star_regex);
        regexOverlay(cm, 'rm-em-token', emph_underline_regex);
        regexOverlay(cm, 'rm-strong-token', strong_star_regex);
        regexOverlay(cm, 'rm-strong-token', strong_underline_regex);
        regexOverlay(cm, 'rm-highlight', highlight_regex);
        regexOverlay(cm, 'rm-highlight-token', highlight_token_regex);
        regexOverlay(cm, 'rm-ins-token', insert_token_regex);
        regexOverlay(cm, 'rm-sub-token', sub_token_regex);
        regexOverlay(cm, 'rm-sup-token', sup_token_regex);
        regexOverlay(cm, 'rm-strike-token', strike_token_regex);
        regexOverlay(cm, 'rm-hr line-cm-rm-hr', hr_regex);
        regexOverlay(cm, 'rm-blockquote-token', blockquote_token_regex);

        regexOverlay(cm, 'rm-todo-project', todo_project_regex);
        regexOverlay(cm, 'rm-todo-tag', todo_tag_regex);
        regexOverlay(cm, 'rm-todo-date', todo_date_regex);
        todoPriorityRegexOverlay(cm, 'rm-todo-priority', todo_priority_regex);

        function on_renderLine(cm: any, line: any, element: HTMLElement) {
            IndentHandlers.onRenderLine(cm, line, element, CodeMirror);
        }

        cm.on('renderLine', on_renderLine);
        IndentHandlers.calculateSpaceWidth(cm);
    });

    CodeMirror.defineOption(enhancement_overlay_option, [], async function(cm, val, old) {
        cm.initializeEnhancementOverlay();
    });

    CodeMirror.defineOption("styleActiveLine", false, function(cm, val, old) {
        var prev = old && old != CodeMirror.Init;
        if (!prev) {
            updateActiveLine(cm);
            cm.on("cursorActivity", updateActiveLine);
        } else if (!val && prev) {
            cm.off("cursorActivity", updateActiveLine);
            clearActiveLine(cm);
            delete cm._activeLine;
        }
    });

    function clearActiveLine(cm) {
        if ("_activeLine" in cm) {
            cm.removeLineClass(cm._activeLine, "wrap", WRAP_CLASS);
        }
    }

    function updateActiveLine(cm) {
        var line = cm.getLineHandle(cm.getCursor().line);
        if (cm._activeLine == line) return;
        clearActiveLine(cm);
        cm.addLineClass(line, "wrap", WRAP_CLASS);
        cm._activeLine = line;
    }
}
