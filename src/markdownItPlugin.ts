export default function (context) {
    return {
        plugin: function (markdownIt, _options) {
            const pluginId = context.pluginId;

            const defaultRender = markdownIt.renderer.rules.image || function (tokens, idx, options, env, self) {
                console.log(tokens, idx);
                return self.renderToken(tokens, idx, options, env, self);
            };

            markdownIt.renderer.rules.image = function (tokens, idx, options, env, self) {
                console.log(tokens, idx);
                const token = tokens[idx];
                let result = defaultRender(tokens, idx, options, env, self);

                let styleStr = "";
                for (let attr of token.attrs) {
                    console.log(attr);
                    if (attr[0] == 'title') {
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
                console.log(result);
                return result
            }
        },
        assets: function() {
            return [
                { name: 'markdownItPlugin.css' }
            ];
        },
    }
}