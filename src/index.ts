import joplin from 'api';
import {ContentScriptType} from "api/types";

joplin.plugins.register({
	onStart: async function() {
		console.info('Hello world. Markdown Fence Test plugin started!');

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
	},
});
