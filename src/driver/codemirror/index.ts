import {initCodeMode} from "./mode";
import {ContextMsgType, EnhancementConfig} from "../../common";
import {initOverlayOption} from "./overlay";
import {linkFolderOptionFunc} from "./linkFolder";
import QuickCommands, {ExtendedEditor} from "./quickCommands/quickCommands";
import {Editor} from "codemirror";
import {taskAndHeaderRender} from "./taskRender";


module.exports = {
    default: function(context) {

        /**
         * Send message to get plugin settings
         */
        async function get_settings(): Promise<EnhancementConfig> {
            return await context.postMessage({
                type: ContextMsgType.GET_SETTINGS
            });
        }

        return {
            plugin: function (CodeMirror) {

                initCodeMode(context, CodeMirror);

                // Default overlays. Others can depend on this. Cannot be turned off
                initOverlayOption(context, CodeMirror);

                CodeMirror.defineOption('enable-enhancement-codemirror', false, async function(cm, val, old) {
                    // Get plugin settings. From joplin-rich-markdown
                    // There is a race condition in the Joplin initialization code
                    // Sometimes the settings aren't ready yet and will return `undefined`
                    // This code will perform an exponential backoff and poll settings
                    // until something is returned
                    async function backoff(timeout: number) {
                        const settings = await get_settings();

                        if (!settings) {
                            setTimeout(backoff, timeout * 2, timeout * 2);
                        }
                        else {
                            cm.state.enhancement = {
                                settings
                            };
                            await linkFolderOptionFunc(context, cm, val, old);

                            if (settings.quickCommands) {
                                new QuickCommands(context, cm as ExtendedEditor & Editor, CodeMirror);
                            }

                            if (settings.taskCmRender || settings.headerHashRender) {
                                taskAndHeaderRender(cm);
                            }
                        }
                    }
                    // Set the first timeout to 50 because settings are usually ready immediately
                    // Set the first backoff to (100*2) to give a little extra time
                    setTimeout(backoff, 50, 100);
                });
            },
            codeMirrorResources: [
                'addon/mode/overlay',                           // Enable ./overlay
                'addon/hint/show-hint',                         // Enable ./quickCommands
            ],
            codeMirrorOptions: {
                'enable-enhancement-codemirror': true,
                enhancement_overlay_option: true,               // Enable ./overlay
                styleActiveLine: true
            },
            assets: function() {
                return [
                    {
                        name: './overlay/overlay.css'
                    },
                    {
                        name: './linkFolder/linkFolder.css'
                    },
                    {
                        name: './linkFolder/default.min.css'
                    },
                    {
                        name: './linkFolder/katex.min.css'
                    },
                    {
                        name: './quickCommands/quickCommands.css'
                    },
                    {
                        name: './taskRender/taskRender.css'
                    }
                ];
            }
        }
    },
}
