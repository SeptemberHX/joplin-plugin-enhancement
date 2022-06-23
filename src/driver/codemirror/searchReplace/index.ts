import {searchReplace} from "./search";

module.exports = {
    default: function(_context) {
        return {
            plugin: function (CodeMirror) {
                searchReplace(CodeMirror);
            },
            codeMirrorOptions: { 'searchbox': true },
            codeMirrorResources: [
                'addon/search/searchcursor',
                'addon/scroll/annotatescrollbar',
                'addon/search/matchesonscrollbar'
            ],
            assets: function() {
                return [];
            }
        }
    },
}
