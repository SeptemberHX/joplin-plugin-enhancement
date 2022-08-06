import {CMBlockMarkerHelper} from "../../../utils/CMBlockMarkerHelper";
import CMInlineMarkerHelper from "../../../utils/CMInlineMarkerHelper";
import katex from 'katex'
import {LineHandle} from "codemirror";

const ENHANCEMENT_MATH_BLOCK_SPAN_MARKER_CLASS = 'enhancement-math-block-marker';
const ENHANCEMENT_MATH_BLOCK_SPAN_MARKER_LINE_CLASS = 'enhancement-math-block-marker-line';

module.exports = {
    default: function(_context) {
        return {
            plugin: function (CodeMirror) {
                CodeMirror.defineOption("enhancementMathRender", [], async function(cm, val, old) {
                    // Block Katex Math Render
                    new CMBlockMarkerHelper(cm, null, /^\s*\$\$\s*$/, /^\s*\$\$\s*$/, (beginMatch, endMatch, content, fromLine, toLine) => {
                            let spanElement = document.createElement('span');
                            katex.render(content, spanElement, { throwOnError: false, displayMode: true, output: 'html' })
                            return spanElement;
                    }, () => {
                        const span = document.createElement('span');
                        span.textContent = '===> Folded Math Block <===';
                        span.style.cssText = 'color: lightgray; font-size: smaller; font-style: italic;';
                        return span;
                    },ENHANCEMENT_MATH_BLOCK_SPAN_MARKER_CLASS, true);

                    cm.on('renderLine', (editor, line: LineHandle, element: Element) => {
                        if (element.getElementsByClassName(ENHANCEMENT_MATH_BLOCK_SPAN_MARKER_CLASS).length > 0) {
                            element.classList.add(ENHANCEMENT_MATH_BLOCK_SPAN_MARKER_LINE_CLASS);
                        }
                    })

                    // inline Katex Math Render
                    new CMInlineMarkerHelper(_context, cm, [/(?<!\$)\$([^\$]+)\$/g], (match, regIndex: number, from, to, innerDomEleCopy, lastMatchFrom, lastMatchTo) => {
                        const markEl = document.createElement('span');
                        katex.render(match[1], markEl, { throwOnError: false, displayMode: false, output: 'html' })
                        return markEl;
                    }, 'enhancement-inline-math-marker', null);
                });
            },
            codeMirrorOptions: {
                'enhancementMathRender': true,
            },
            assets: function() {
                return [
                    {
                        name: 'katex.min.css'
                    }
                ];
            }
        }
    },
}
