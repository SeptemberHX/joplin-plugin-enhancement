import {filePreviewRenderer} from "./filePreviewRenderer";

export default function (context) {
    return {
        plugin: function (markdownIt, _options) {
            const pluginId = context.pluginId;

            filePreviewRenderer(markdownIt, _options);
        },
        assets: function() {
            return [
            ];
        },
    }
}