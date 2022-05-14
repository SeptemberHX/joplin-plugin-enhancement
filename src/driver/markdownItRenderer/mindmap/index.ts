import {mindmapFenceRenderer} from "./mindmapFenceRenderer";

export default function (context) {
    return {
        plugin: function (markdownIt, _options) {
            const pluginId = context.pluginId;

            mindmapFenceRenderer(markdownIt, _options);
        },
        assets: function() {
            return [
                { name: 'markmap-view.js' },
                { name: 'mindmap.js' }
            ];
        },
    }
}
