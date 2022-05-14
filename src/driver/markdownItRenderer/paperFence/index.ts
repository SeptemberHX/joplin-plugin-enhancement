import {paperFenceRenderer} from "./paperFenceRenderer";

export default function (context) {
    return {
        plugin: function (markdownIt, _options) {
            const pluginId = context.pluginId;

            paperFenceRenderer(markdownIt, _options);
        },
        assets: function() {
            return [
                { name: 'paperFence.css' }
            ];
        },
    }
}