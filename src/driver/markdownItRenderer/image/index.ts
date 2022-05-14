import {imageRenderer} from "./imageRenderer";

export default function (context) {
    return {
        plugin: function (markdownIt, _options) {
            const pluginId = context.pluginId;

            imageRenderer(markdownIt, _options);
        },
        assets: function() {
            return [
                { name: 'markdownItPlugin.css' }
            ];
        },
    }
}