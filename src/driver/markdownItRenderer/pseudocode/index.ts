import {pseudocodeFenceRenderer} from "./pseudocode";

var mime = require('mime-types')

export default function (context) {
    return {
        plugin: function (markdownIt, _options) {
            const pluginId = context.pluginId;

            pseudocodeFenceRenderer(markdownIt, _options);
        },
        assets: function() {
            return [
                { name: 'pseudocode.min.css' }
            ];
        },
    }
}