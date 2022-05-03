import path = require("path");
import {filePreviewRenderer} from "./filePreviewRenderer";
import {imageRenderer} from "./imageRenderer";

var mime = require('mime-types')

export default function (context) {
    return {
        plugin: function (markdownIt, _options) {
            const pluginId = context.pluginId;

            filePreviewRenderer(markdownIt, _options);
            imageRenderer(markdownIt, _options);
        },
        assets: function() {
            return [
                { name: 'markdownItPlugin.css' }
            ];
        },
    }
}