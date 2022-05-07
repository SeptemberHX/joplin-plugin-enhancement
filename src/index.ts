import joplin from 'api';
import {ContentScriptType, MenuItemLocation, ToolbarButtonLocation} from "api/types";
import {settings} from "./settings";
import {
	ENABLE_IMAGE_ENHANCEMENT,
	ENABLE_LOCAL_PDF_PREVIEW,
	ENABLE_MERMAID_FOLDER, ENABLE_PAPERS, ENABLE_QUICK_COMMANDS,
	ENABLE_TABLE_FORMATTER
} from "./common";
import {syncAllPaperItems, updateAnnotations} from "./driver/papers/papersUtils";
import {debounce} from "ts-debounce";

joplin.plugins.register({
	onStart: async function() {

		await settings.register();
		const enableTableFormatter = await joplin.settings.value(ENABLE_TABLE_FORMATTER);
		const enableMermaidFolder = await joplin.settings.value(ENABLE_MERMAID_FOLDER);
		const enableLocalPDFPreview = await joplin.settings.value(ENABLE_LOCAL_PDF_PREVIEW);
		const enableImageEnhancement = await joplin.settings.value(ENABLE_IMAGE_ENHANCEMENT);
		const enableQuickCommands = await joplin.settings.value(ENABLE_QUICK_COMMANDS);
		const enablePapers = await joplin.settings.value(ENABLE_PAPERS);

		if (enablePapers) {
			let syncAllPaperItemsDebounce = debounce(syncAllPaperItems, 5000);
			let updateAnnotationsDebounce = debounce(updateAnnotations, 1000);

			await joplin.commands.register({
				name: "enhancement_papers_syncAll",
				label: "Sync All Files from PapersLib",
				execute: async () => {
					try {
						await syncAllPaperItemsDebounce();
					} catch (err) {
						if (err.message.code === 'ETIMEDOUT') {
							console.log("ETIMEDOUT in syncAllPaperItems()");
						}
					}
				},
			});

			await joplin.commands.register({
				name: "enhancement_papers_getAnnotations",
				label: "Get Annotations for current paper",
				iconName: "fas fa-sync",
				execute: async () => {
					const currNote = await joplin.workspace.selectedNote();
					try {
						await updateAnnotationsDebounce(currNote.id, currNote.body);
					} catch (err) {
						if (err.message.code === 'ETIMEDOUT') {
							console.log("ETIMEDOUT in updateAnnotations()");
						}
					}
				}
			})

			await joplin.views.menuItems.create(
				"syncAllFilesFromPapersLib",
				"enhancement_papers_syncAll",
				MenuItemLocation.Tools
			);

			await joplin.views.toolbarButtons.create(
				'getAnnotationsForCurrentPaper',
				'enhancement_papers_getAnnotations',
				ToolbarButtonLocation.EditorToolbar,
			);
		}

		if (enableImageEnhancement) {
			await joplin.contentScripts.register(
				ContentScriptType.MarkdownItPlugin,
				'enhancement_figure_name',
				'./driver/markdownItRuler/index.js'
			);
		}

		if (enableLocalPDFPreview) {
			await joplin.contentScripts.register(
				ContentScriptType.MarkdownItPlugin,
				'enhancement_renderer',
				'./driver/markdownItRenderer/index.js'
			);
		}

		if (enableMermaidFolder) {
			await joplin.contentScripts.register(
				ContentScriptType.CodeMirrorPlugin,
				'enhancement_mermaid_folder',
				'./driver/codemirror/mermaidFolder/index.js'
			);

		}

		if (enableQuickCommands) {
			await joplin.contentScripts.register(
				ContentScriptType.CodeMirrorPlugin,
				'enhancement_quick_commands',
				'./driver/codemirror/quickCommands/index.js'
			);
		}

		if (enableTableFormatter) {
			await joplin.contentScripts.register(
				ContentScriptType.CodeMirrorPlugin,
				'enhancement_table_formatter',
				'./driver/codemirror/tableFormatter/index.js'
			);

			await joplin.commands.register({
				name: 'alignColumnLeft',
				label: 'Align current column to left',
				iconName: 'fas fa-align-left',
				execute: async () => {
					await joplin.commands.execute('editor.execCommand', {
						name: 'alignColumns',
						args: [[':', '-']]
					});
				},
			});

			await joplin.commands.register({
				name: 'alignColumnRight',
				label: 'Align current column to right',
				iconName: 'fas fa-align-right',
				execute: async () => {
					await joplin.commands.execute('editor.execCommand', {
						name: 'alignColumns',
						args: [['-', ':']]
					});
				},
			});

			await joplin.commands.register({
				name: 'alignColumnCenter',
				label: 'Align current column to center',
				iconName: 'fas fa-align-center',
				execute: async () => {
					await joplin.commands.execute('editor.execCommand', {
						name: 'alignColumns',
						args: [[':', ':']]
					});
				},
			});

			await joplin.commands.register({
				name: 'alignColumnSlash',
				label: 'Remove the alignment of current column',
				iconName: 'fas fa-align-justify',
				execute: async () => {
					await joplin.commands.execute('editor.execCommand', {
						name: 'alignColumns',
						args: [['-', '-']]
					});
				},
			});

			await joplin.views.toolbarButtons.create(
				'align-column-left',
				'alignColumnLeft',
				ToolbarButtonLocation.EditorToolbar,
			);

			await joplin.views.toolbarButtons.create(
				'align-column-center',
				'alignColumnCenter',
				ToolbarButtonLocation.EditorToolbar,
			);

			await joplin.views.toolbarButtons.create(
				'align-column-right',
				'alignColumnRight',
				ToolbarButtonLocation.EditorToolbar,
			);

			await joplin.views.toolbarButtons.create(
				'align-column-slash',
				'alignColumnSlash',
				ToolbarButtonLocation.EditorToolbar,
			);
		}
	},
});
