export function imageRenderer(markdownIt, _options) {
    const defaultRender = markdownIt.renderer.rules.image || function (tokens, idx, options, env, self) {
        return self.renderToken(tokens, idx, options, env, self);
    };

    markdownIt.renderer.rules.image = function (tokens, idx, options, env, self) {
        // console.log(tokens, idx);
        const token = tokens[idx];
        let result = defaultRender(tokens, idx, options, env, self);

        let styleStr = "";
        for (let attr of token.attrs) {
            if (attr[0] == 'alt' && attr[1].length > 0) {
                result = `
                        ${result}
                        <figcaption>${attr[1]}</figcaption>
                    `
            } else if (attr[0] == 'width') {
                styleStr += ` width="${attr[1]}" `;
            } else if (attr[0] == 'height') {
                styleStr += ` height="${attr[1]}" `;
            }
        }

        let imgTagRex = /<img/;
        const index = result.search(imgTagRex);
        result = result.substr(0, index + 4) + ` ${styleStr}` + result.substr(index + 4);
        result = `
                <figure>
                    ${result}
                </figure>
                `;
        return result
    }
}