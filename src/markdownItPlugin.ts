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
                for (let attr of token.attrs) {
                    console.log(attr);
                    if (attr[0] !== 'title') continue;
                    result = `
                        ${result}
                        <figcaption>${attr[1]}</figcaption>
                    `
                    break;
                }

                result = `
                <figure>
                    ${result}
                </figure>
                `;
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