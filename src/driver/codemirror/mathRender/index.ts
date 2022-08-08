import CMInlineMarkerHelper from "../../../utils/CMInlineMarkerHelper";
import katex from 'katex'
import {LineHandle} from "codemirror";
import {CMBlockMarkerHelperV2} from "../../../utils/CMBlockMarkerHelperV2";

const ENHANCEMENT_MATH_BLOCK_SPAN_MARKER_CLASS = 'enhancement-math-block-marker';
const ENHANCEMENT_MATH_BLOCK_SPAN_MARKER_LINE_CLASS = 'enhancement-math-block-marker-line';

module.exports = {
    default: function(_context) {
        return {
            plugin: function (CodeMirror) {
                CodeMirror.defineOption("enhancementMathRender", [], async function(cm, val, old) {
                    // Block Katex Math Render
                    new CMBlockMarkerHelperV2(cm, null, /^\s*\$\$\s*$/, /^\s*\$\$\s*$/, (beginMatch, endMatch, content, fromLine, toLine) => {
                            let divElement = document.createElement("div");
                            let spanElement = document.createElement('span');
                            let cCount = 0;
                            for (let i = content.length - 1; i >= 0; i--) {
                                if (content[i] === '\\') {
                                    cCount++;
                                } else {
                                    break;
                                }
                            }

                            katex.render(cCount % 2 !== 0 ? content.substring(0, content.length - 1) : content,
                                spanElement, { throwOnError: false, strict: false, displayMode: true, output: 'html' })
                            divElement.appendChild(spanElement);
                            divElement.style.cssText = 'text-align: center;'
                            return divElement;
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
                    new CMInlineMarkerHelper(_context, cm, [/(?<!\$)\$([^\$]+)\$/g], (match, regIndex: number, from, to) => {
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
