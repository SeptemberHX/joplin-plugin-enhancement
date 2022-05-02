import joplin from 'api';
import {ContentScriptType, MenuItemLocation} from "api/types";

joplin.plugins.register({
	onStart: async function() {

		await joplin.contentScripts.register(
			ContentScriptType.MarkdownItPlugin,
			'betterImage_figure',
			'./markdownItPlugin.js'
		);

		await joplin.contentScripts.register(
			ContentScriptType.MarkdownItPlugin,
			'betterImage_size',
			'./image.js'
		);

		await joplin.contentScripts.register(
			ContentScriptType.CodeMirrorPlugin,
			'tableFormatter',
			'./table.js'
		);
	},
});
