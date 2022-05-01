export default function (context) {
    return {
        plugin: function (markdownIt, _options) {
            const pluginId = context.pluginId;

            const defaultRender = markdownIt.renderer.rules.fence || function(tokens, idx, options, env, self) {
                return self.renderToken(tokens, idx, options, env, self);
            };

            markdownIt.renderer.rules.fence = function(tokens, idx, options, env, self) {
                const token = tokens[idx];
                console.log(token);
                if (token.info !== 'tabulator') return defaultRender(tokens, idx, options, env, self);

                return `<div id="testTable"></div><style onload="initTestTable('testTable', '${escape(token.content)}')"></style>`;
            };
        },
        assets: function() {
            return [
                { name: 'tabulator.min.css' },
                { name: 'tabulator.min.js' },
                { name: 'table.js'}
            ];
        },
    }
}