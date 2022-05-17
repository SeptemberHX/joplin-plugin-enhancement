export default function (context) {
    return {
        plugin: function (markdownIt, _options) {
            const pluginId = context.pluginId;
        },
        assets: function() {
            return [
                { name: 'paperStyle.css' }
            ];
        },
    }
}