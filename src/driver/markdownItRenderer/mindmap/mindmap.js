/* global mindmap */
function d3Ready() {
    console.log(d3);
    return typeof d3 !== 'undefined' && d3 !== null && typeof d3 === 'object';
}

function mindmapInit() {
    const { Markmap, loadCSS, loadJS } = window.markmap;

    // Resetting elements size - see mermaid.ts
    const elements = document.getElementsByClassName('markmap-svg');
    for (const element of elements) {
        try {
            const markmapData = JSON.parse(unescape(element.innerHTML));
            loadCSS(markmapData.styles);
            loadJS(markmapData.scripts, {getMarkmap: () => window.markmap});
            const mm = Markmap.create(element, {
                autoFit: true,
                duration: 0
            }, markmapData.root);
        } catch (err) {

        }

        element.style.width = '100%';
    }
}

document.addEventListener('joplin-noteDidUpdate', () => {
    mindmapInit();
});

const initIID_Mindmap = setInterval(() => {
    const isD3Ready = d3Ready();
    if (isD3Ready) {
        clearInterval(initIID_Mindmap);
        mindmapInit();
    }
}, 100);
