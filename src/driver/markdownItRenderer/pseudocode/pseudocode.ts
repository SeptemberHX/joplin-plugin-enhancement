import { renderToString } from 'pseudocode';

export function pseudocodeFenceRenderer(markdownIt, _options) {
    const defaultRender = markdownIt.renderer.rules.fence || function (tokens, idx, options, env, self) {
        return self.renderToken(tokens, idx, options, env, self);
    };

    markdownIt.renderer.rules.fence = function (tokens, idx, options, env, self) {
        // console.log(tokens, idx);
        const token = tokens[idx];
        if (token.info !== 'pseudocode') {
            return defaultRender(tokens, idx, options, env, self);
        }

        try {
            let result = renderToString(token.content, {lineNumber: true, captionCount: 1});
            return result.replace(/Algorithm \d/, 'Algorithm');
        } catch (e) {

        } finally {
        }

        return '<p> Errors in pseudocode </p>';
    }
}
