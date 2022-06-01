import {Transformer} from "markmap-lib";
import {escape} from "querystring";

export function mindmapFenceRenderer(markdownIt, _options) {
    const defaultRender = markdownIt.renderer.rules.fence || function (tokens, idx, options, env, self) {
        return self.renderToken(tokens, idx, options, env, self);
    };

    markdownIt.renderer.rules.fence = function (tokens, idx, options, env, self) {
        // console.log(tokens, idx);
        const token = tokens[idx];
        if (token.info !== 'markmap') {
            return defaultRender(tokens, idx, options, env, self);
        }

        console.log(token);
        try {
            const transformer = new Transformer();

            // 1. transform markdown
            const {root, features} = transformer.transform(token.content);
            // 2. get assets
            const {styles, scripts} = transformer.getUsedAssets(features);

            return `<svg class="markmap-svg" style="height: 300px">${escape(JSON.stringify({root: root, styles: styles, scripts: scripts}))}</svg>`;
        } catch (err) {
            return defaultRender(tokens, idx, options, env, self);
        }

        return '<p> Errors in pseudocode </p>';
    }
}
