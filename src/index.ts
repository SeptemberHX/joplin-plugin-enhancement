import joplin from 'api';
import {ContentScriptType, MenuItemLocation} from "api/types";

joplin.plugins.register({
	onStart: async function() {
		const COMMANDS = joplin.commands;
		await COMMANDS.register({
			name: 'insertColumnLeft',
			label: 'Insert Column Left',
			iconName: 'fas fa-left-long',
			enabledCondition: 'someNotesSelected',
			execute: async (noteIds: string[], targetId?: string) => {

			}
		});

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
		await joplin.views.menuItems.create('editorContextMenuPinNote', 'insertColumnLeft', MenuItemLocation.EditorContextMenu);
	},
});
