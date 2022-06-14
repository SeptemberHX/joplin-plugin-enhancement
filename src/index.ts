import joplin from 'api';
import {ContentScriptType, ToolbarButtonLocation} from "api/types";
import {settings} from "./settings";
import {
	ENABLE_ADMONITION_CM_RENDER, ENABLE_INLINE_LIVE_PREVIEW, ENABLE_COLORFUL_QUOTE, ENABLE_FRONT_MATTER,
	ENABLE_IMAGE_ENHANCEMENT,
	ENABLE_LOCAL_PDF_PREVIEW,
	ENABLE_MERMAID_FOLDER,
	ENABLE_PSEUDOCODE,
	ENABLE_QUICK_COMMANDS,
	ENABLE_TABLE_FORMATTER, ENABLE_LINK_FOLDER,
} from "./common";

joplin.plugins.register({
	onStart: async function() {

		await settings.register();
		const enableTableFormatter = await joplin.settings.value(ENABLE_TABLE_FORMATTER);
		const enableMermaidFolder = await joplin.settings.value(ENABLE_MERMAID_FOLDER);
		const enableLocalPDFPreview = await joplin.settings.value(ENABLE_LOCAL_PDF_PREVIEW);
		const enableImageEnhancement = await joplin.settings.value(ENABLE_IMAGE_ENHANCEMENT);
		const enableQuickCommands = await joplin.settings.value(ENABLE_QUICK_COMMANDS);
		const enablePseudocode = await joplin.settings.value(ENABLE_PSEUDOCODE);
		const enableAdmonitionCmRender = await joplin.settings.value(ENABLE_ADMONITION_CM_RENDER);
		const enableFrontMatter = await joplin.settings.value(ENABLE_FRONT_MATTER);
		const enableColorfulQuote = await joplin.settings.value(ENABLE_COLORFUL_QUOTE);
		const enableLinkFolder = await joplin.settings.value(ENABLE_LINK_FOLDER);
		const enableLivePreview = await joplin.settings.value(ENABLE_INLINE_LIVE_PREVIEW);

		if (enableImageEnhancement) {
			await joplin.contentScripts.register(
				ContentScriptType.MarkdownItPlugin,
				'enhancement_figure_width',
				'./driver/markdownItRuler/image/index.js'
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

		if (enableTableFormatter) {
			await initTableFormatter();
		}

		await joplin.contentScripts.register(
			ContentScriptType.CodeMirrorPlugin,
			'enhancement_codemirror_mode',
			'./driver/codemirror/mode/index.js'
		);

		if (enableAdmonitionCmRender) {
			await joplin.contentScripts.register(
				ContentScriptType.CodeMirrorPlugin,
				'cm_admonition_renderer',
				'./driver/codemirror/admonition/index.js'
			);
		}

		if (enableFrontMatter) {
			await joplin.contentScripts.register(
				ContentScriptType.MarkdownItPlugin,
				'enhancement_front_matter',
				'./driver/markdownItRuler/frontMatter/index.js'
			);
		}

		if (enableColorfulQuote) {
			await joplin.contentScripts.register(
				ContentScriptType.MarkdownItPlugin,
				'enhancement_colorful_quote',
				'./driver/markdownItRenderer/quote/index.js'
			);
			await joplin.contentScripts.register(
				ContentScriptType.CodeMirrorPlugin,
				'enhancement_quote_folder',
				'./driver/codemirror/blockquote/index.js'
			);
		}

		if (enableLinkFolder) {
			await joplin.contentScripts.register(
				ContentScriptType.CodeMirrorPlugin,
				'enhancement_link_folder',
				'./driver/codemirror/linkFolder/index.js'
			);
		}

		if (enableLivePreview) {
			await joplin.contentScripts.register(
				ContentScriptType.CodeMirrorPlugin,
				'enhancement_link_folder',
				'./driver/codemirror/livePreview/index.js'
			);
		}
	},
});

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
