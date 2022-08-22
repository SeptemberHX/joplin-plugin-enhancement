module.exports = {
    default: function(_context) {
        return {
            plugin: function (CodeMirror) { },
            codeMirrorResources: ['addon/selection/mark-selection.js'],
            assets: function() {
                return [
                    {
                        name: 'indentBorder.css'
                    }
                ];
            }
        }
    },
}
