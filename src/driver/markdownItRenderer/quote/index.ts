import {quoteRenderer} from "./quoteRender";

export default function (context) {
    return {
        plugin: function (markdownIt, _options) {
            const pluginId = context.pluginId;

            quoteRenderer(markdownIt, _options);
        },
        assets: function() {
            return [
                {
                    name: 'quoteRender.css'
                }
            ];
        },
    }
}
