import joplin from 'api';
import {ContentScriptType, MenuItemLocation} from "api/types";

joplin.plugins.register({
	onStart: async function() {

		await joplin.contentScripts.register(
			ContentScriptType.MarkdownItPlugin,
			'enhancement_figure_name',
			'./markdownItPlugin.js'
		);

		await joplin.contentScripts.register(
			ContentScriptType.MarkdownItPlugin,
			'enhancement_image_size',
			'./image.js'
		);

		await joplin.contentScripts.register(
			ContentScriptType.MarkdownItPlugin,
			'enhancement_file_preview',
			'./filePreview.js'
		);

		await joplin.contentScripts.register(
			ContentScriptType.CodeMirrorPlugin,
			'enhancement_table_formatter',
			'./table.js'
		);
	},
});
