import {CMBlockMarkerHelper} from "../../../utils/CMBlockMarkerHelper";
import mermaid from 'mermaid'
import {LineHandle} from "codemirror";

const ENHANCEMENT_MERMAID_SPAN_MARKER_CLASS = 'enhancement-mermaid-block-marker';
const ENHANCEMENT_MERMAID_SPAN_MARKER_LINE_CLASS = 'enhancement-mermaid-block-marker-line';

// Initialise the mermaid API. Note the "as any" cast, since the mermaid types
// are wrong.
mermaid.initialize({ startOnLoad: false, theme: 'dark' as any })

module.exports = {
    default: function(_context) {
        return {
            plugin: function (CodeMirror) {
                CodeMirror.defineOption("enhancementMermaidRender", [], async function(cm, val, old) {
                    // Block Katex Math Render
                    new CMBlockMarkerHelper(cm, null, /^\s*```mermaid\s*$/, /^\s*```\s*$/, (beginMatch, endMatch, content, fromLine, toLine) => {
                        // code from zettlr
                        let svg = document.createElement('span')
                        svg.classList.add('mermaid-chart')
                        try {
                            svg.innerHTML = mermaid.render(`graphDivL${fromLine}-L${toLine}${Date.now()}`, content)
                        } catch (err: any) {
                            svg.classList.add('error')
                            // TODO: Localise!
                            svg.innerText = `Could not render Graph:\n\n${err.message as string}`
                        }
                        return svg;
                    }, () => {
                        const span = document.createElement('span');
                        span.textContent = '===> Folded Mermaid Code Block <===';
                        span.style.cssText = 'color: lightgray; font-size: smaller; font-style: italic;';
                        return span;
                    },ENHANCEMENT_MERMAID_SPAN_MARKER_CLASS, true);

                    cm.on('renderLine', (editor, line: LineHandle, element: Element) => {
                        if (element.getElementsByClassName(ENHANCEMENT_MERMAID_SPAN_MARKER_CLASS).length > 0) {
                            element.classList.add(ENHANCEMENT_MERMAID_SPAN_MARKER_LINE_CLASS);
                        }
                    })
                });
            },
            codeMirrorOptions: {
                'enhancementMermaidRender': true,
            },
            assets: function() {
                return [
                    {
                        name: 'mermaid.css'
                    }
                ];
            }
        }
    },
}
