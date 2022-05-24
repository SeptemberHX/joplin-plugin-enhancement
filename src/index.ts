import joplin from 'api';
import {ContentScriptType, MenuItemLocation, ToolbarButtonLocation} from "api/types";
import {settings} from "./settings";
import {
	ENABLE_CUSTOM_STYLE,
	ENABLE_IMAGE_ENHANCEMENT,
	ENABLE_LOCAL_PDF_PREVIEW,
	ENABLE_MERMAID_FOLDER,
	ENABLE_PAPERS,
	ENABLE_PSEUDOCODE,
	ENABLE_QUICK_COMMANDS,
	ENABLE_TABLE_FORMATTER,
	PAPERS_COOKIE
} from "./common";
import {
	buildCitationForItem,
	buildRefName,
	createNewNotesForPapers,
	syncAllPaperItems
} from "./driver/papers/papersUtils";
import {selectAnnotationPopup, selectPapersPopup} from "./ui/citation-popup";
import {AnnotationItem, PaperItem, PapersLib} from "./lib/papers/papersLib";
import {getAllRecords, getPaperItemByNoteId, setupDatabase} from "./lib/papers/papersDB";
import {PapersWS} from "./lib/papers/papersWS";

joplin.plugins.register({
	onStart: async function() {

		await settings.register();
		const enableTableFormatter = await joplin.settings.value(ENABLE_TABLE_FORMATTER);
		const enableMermaidFolder = await joplin.settings.value(ENABLE_MERMAID_FOLDER);
		const enableLocalPDFPreview = await joplin.settings.value(ENABLE_LOCAL_PDF_PREVIEW);
		const enableImageEnhancement = await joplin.settings.value(ENABLE_IMAGE_ENHANCEMENT);
		const enableQuickCommands = await joplin.settings.value(ENABLE_QUICK_COMMANDS);
		const enablePapers = await joplin.settings.value(ENABLE_PAPERS);
		const enablePseudocode = await joplin.settings.value(ENABLE_PSEUDOCODE);
		const enableCustomStyle = await joplin.settings.value(ENABLE_CUSTOM_STYLE);

		if (enablePapers) {
			await initPapers();
		}

		if (enableImageEnhancement) {
			await joplin.contentScripts.register(
				ContentScriptType.MarkdownItPlugin,
				'enhancement_figure_width',
				'./driver/markdownItRuler/index.js'
			);

			await joplin.contentScripts.register(
				ContentScriptType.MarkdownItPlugin,
				'enhancement_figure_width_caption',
				'./driver/markdownItRenderer/image/index.js'
			);
		}

		if (enableLocalPDFPreview) {
			await joplin.contentScripts.register(
				ContentScriptType.MarkdownItPlugin,
				'enhancement_preview_renderer',
				'./driver/markdownItRenderer/filePreview/index.js'
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

		if (enablePseudocode) {
			await joplin.contentScripts.register(
				ContentScriptType.MarkdownItPlugin,
				'enhancement_pseudocode_renderer',
				'./driver/markdownItRenderer/pseudocode/index.js'
			);
		}

		if (enableCustomStyle) {
			await joplin.contentScripts.register(
				ContentScriptType.MarkdownItPlugin,
				'enhancement_paper_style',
				'./driver/style/index.js'
			);
		}

		if (enableTableFormatter) {
			await initTableFormatter();
		}
	},
});

async function initPapers() {
	// init the database
	await setupDatabase();
	await PapersLib.init(await joplin.settings.value(PAPERS_COOKIE));
	new PapersWS();

	await joplin.contentScripts.onMessage(
		'enhancement_paper_fence_renderer',
		async () => {
			const currNote = await joplin.workspace.selectedNote();
			if (currNote) {
				return await getPaperItemByNoteId(currNote.id);
			}
			return undefined;
		}
	);

	const dialogs = joplin.views.dialogs;
	const beforeHandle = await dialogs.create('BeforeSyncDialog');
	await dialogs.setHtml(beforeHandle, '<p>You are trying to sync with your papers library.</p>' +
		'<p>Click "Ok" button to begin the synchronization</p>' +
		'<p>After clicking the "Ok" button, this dialog disappears, and the dialog will show again when the synchronization is finished.</p>' +
		'<p>It can spend several minutes, depending on your library size and network condition.</p>' +
		'<p><mark>Please DO NOT try to sync again until next dialog appears again!</mark></p>');
	await dialogs.setButtons(beforeHandle, [{id: 'ok'}, {id: 'cancel'}]);

	const errHandle = await dialogs.create('errSyncDialog');
	await dialogs.setHtml(errHandle, '<p>Error happens during sync with your Papers library. Please check your papers cookie and network connection.</p>');
	await dialogs.setButtons(errHandle, [{id: 'ok'}]);

	const finishHandle = await dialogs.create('finishSyncDialog');
	await dialogs.setHtml(finishHandle, '<p>Syncing with your Papers library finished.</p>')
	await dialogs.setButtons(finishHandle, [{id: 'ok'}]);

	const copyErrHandle = await dialogs.create('copyErrDialog');
	await dialogs.setHtml(copyErrHandle, '<p>Ops. It seems you tried to operate on a non-paper note!</p>');
	await dialogs.setButtons(copyErrHandle, [{id: 'ok'}]);

	await joplin.contentScripts.register(
		ContentScriptType.CodeMirrorPlugin,
		'enhancement_autoCitation',
		'./driver/codemirror/autoCitation/index.js'
	);

	await joplin.contentScripts.register(
		ContentScriptType.MarkdownItPlugin,
		'enhancement_paper_fence_renderer',
		'./driver/markdownItRenderer/paperFence/index.js'
	);

	await joplin.commands.register({
		name: "enhancement_papers_syncAll",
		label: "Sync All Files from Papers",
		execute: async () => {
			try {
				const result = await dialogs.open(beforeHandle);
				if (result.id === 'ok') {
					await syncAllPaperItems();
					await dialogs.open(finishHandle);
				}
			} catch (err) {
				if (err.message.code === 'ETIMEDOUT') {
					console.log("ETIMEDOUT in syncAllPaperItems()");
				}
				console.log(err);
				await dialogs.open(errHandle);
				return;
			}
		},
	});

	await joplin.commands.register({
		name: "enhancement_papers_createNoteForPaper",
		label: "Create notes for papers",
		iconName: "fas fa-notes",
		execute: async () => {
			const items: PaperItem[] = await getAllRecords();
			let paperId2Item = {};
			for (let index in items) {
				paperId2Item[items[index].id] = items[index];
			}

			const selectedRefsIDs: string[] = await selectPapersPopup(items);

			if (selectedRefsIDs.length > 0) {
				const noteIds = await createNewNotesForPapers(selectedRefsIDs, items);
				await joplin.commands.execute('openNote', noteIds[0]);
			}
		}
	});

	await joplin.commands.register({
		name: 'enhancement_cite_papers',
		label: 'Cite your papers',
		iconName: 'fa fa-graduation-cap',
		execute: async () => {
			const items: PaperItem[] = await getAllRecords();
			let paperId2Item = {};
			for (let index in items) {
				paperId2Item[items[index].id] = items[index];
			}

			const selectedRefsIDs: string[] = await selectPapersPopup(items);
			const refNames = [];
			const citations = [];
			for (const id of selectedRefsIDs) {
				refNames.push(await buildRefName(paperId2Item[id]));
				citations.push(await buildCitationForItem(paperId2Item[id], ""));
			}
			await joplin.commands.execute('editor.execCommand', {
				name: 'enhancement_insertCitation',
				args: [[citations, refNames]]
			});
		}
	});

	await joplin.commands.register({
		name: 'enhancement_cite_paper_annotations',
		label: 'Cite your paper annotations',
		iconName: 'fa fa-quote-left',
		execute: async () => {
			const currNote = await joplin.workspace.selectedNote();
			if (currNote) {
				const paper = await getPaperItemByNoteId(currNote.id);
				if (paper) {
					const annotations: AnnotationItem[] = await PapersLib.getAnnotation(paper.collection_id, paper.id);
					let annoId2Anno = {};
					for (let index in annotations) {
						annoId2Anno[annotations[index].id] = annotations[index];
					}

					const annoIds = await selectAnnotationPopup(annotations);
					const annos = [];
					for (const id of annoIds) {
						annos.push(annoId2Anno[id]);
					}
					await joplin.commands.execute('editor.execCommand', {
						name: 'enhancement_insertAnnotation',
						args: [[annos]]
					});
				} else {
					await dialogs.open(copyErrHandle);
				}
			}
		}
	});

	await joplin.views.menuItems.create(
		"syncAllFilesFromPapersLib",
		"enhancement_papers_syncAll",
		MenuItemLocation.Tools
	);

	await joplin.views.menuItems.create(
		'createNoteForPaper',
		'enhancement_papers_createNoteForPaper',
		MenuItemLocation.Tools,
	);

	await joplin.views.toolbarButtons.create(
		'enhancementCitePapers',
		'enhancement_cite_papers',
		ToolbarButtonLocation.EditorToolbar
	);

	await joplin.views.toolbarButtons.create(
		'enhancementCitePaperAnnotation',
		'enhancement_cite_paper_annotations',
		ToolbarButtonLocation.EditorToolbar
	);
}

async function initTableFormatter() {
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
