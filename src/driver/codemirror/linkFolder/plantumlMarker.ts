import {CMBlockMarkerHelperV2} from "../../../utils/CMBlockMarkerHelperV2";
var plantumlEncoder = require('plantuml-encoder')

export const ENHANCEMENT_PLANTUML_SPAN_MARKER_CLASS = 'enhancement-plantuml-block-marker';


export default function createPlantumlMarker(context, cm) {
    return new CMBlockMarkerHelperV2(cm, null, /^\s*```plantuml\s*$/, /^\s*```\s*$/, (beginMatch, endMatch, content: string, fromLine, toLine) => {
        let divElement = document.createElement("div");
        let imgElement = document.createElement('img');
        const encoded = plantumlEncoder.encode(content);
        imgElement.src = `http://www.plantuml.com/plantuml/img/${encoded}`;
        divElement.appendChild(imgElement);
        divElement.style.cssText = 'text-align: center;'
        return divElement;
    }, () => {
        const span = document.createElement('span');
        span.textContent = '===> Folded Plantuml Block <===';
        span.style.cssText = 'color: lightgray; font-size: smaller; font-style: italic;';
        return span;
    }, ENHANCEMENT_PLANTUML_SPAN_MARKER_CLASS, true, false);
}
