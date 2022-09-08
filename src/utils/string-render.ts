var md = require('markdown-it')()
            .use(require('markdown-it-mark'));

/*
 * Use markdown-it until joplin provides APIs for string rendering
 */
export function renderStrToDom(str: string) {
    return md.renderInline(str);
}
