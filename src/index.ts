import joplin from 'api';
import {ContentScriptType, MenuItemLocation, ToolbarButtonLocation} from "api/types";

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

		// I don't like too many items on the toolbar. :)

		// await joplin.commands.register({
		// 	name: 'insertColumnLeft',
		// 	label: 'Insert a new column to left',
		// 	iconName: 'fas fa-arrow-left',
		// 	execute: async () => {
		// 		await joplin.commands.execute('editor.execCommand', {
		// 			name: 'insertColumnLeft',
		// 			args: []
		// 		});
		// 	},
		// });
		//
		// await joplin.views.toolbarButtons.create(
		// 	'insert-column-left',
		// 	'insertColumnLeft',
		// 	ToolbarButtonLocation.EditorToolbar,
		// );
		//
		// await joplin.commands.register({
		// 	name: 'insertColumnRight',
		// 	label: 'Insert a new column to right',
		// 	iconName: 'fas fa-arrow-right',
		// 	execute: async () => {
		// 		await joplin.commands.execute('editor.execCommand', {
		// 			name: 'insertColumnRight',
		// 			args: []
		// 		});
		// 	},
		// });
		//
		// await joplin.views.toolbarButtons.create(
		// 	'insert-column-right',
		// 	'insertColumnRight',
		// 	ToolbarButtonLocation.EditorToolbar,
		// );
	},
});
