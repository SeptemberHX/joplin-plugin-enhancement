import joplin from 'api';
import {ContentScriptType, ToolbarButtonLocation} from "api/types";
import {settings} from "./settings";
import {
	ENABLE_ADMONITION_CM_RENDER,
	ENABLE_COLORFUL_QUOTE,
	ENABLE_FOCUS_MODE,
	ENABLE_FRONT_MATTER,
	ENABLE_IMAGE_ENHANCEMENT, ENABLE_INDENT_BORDER,
	ENABLE_INLINE_MARKER,
	ENABLE_LINK_FOLDER,
	ENABLE_LOCAL_PDF_PREVIEW, ENABLE_MATH_RENDER, ENABLE_MERMAID_RENDER,
	ENABLE_PSEUDOCODE,
	ENABLE_QUICK_COMMANDS,
	ENABLE_SEARCH_REPLACE,
	ENABLE_TABLE_FORMATTER,
	ENABLE_TASK_RENDER, EnhancementConfig,
} from "./common";

joplin.plugins.register({
	onStart: async function() {

		await settings.register();
		const enhancementConfig = await getConfig();

		if (enhancementConfig.imageEnhancement) {
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

		if (enhancementConfig.localPdfPreview) {
			await joplin.contentScripts.register(
				ContentScriptType.MarkdownItPlugin,
				'enhancement_preview_renderer',
				'./driver/markdownItRenderer/filePreview/index.js'
			);
		}

		if (enhancementConfig.quickCommands) {
			await joplin.contentScripts.register(
				ContentScriptType.CodeMirrorPlugin,
				'enhancement_quick_commands',
				'./driver/codemirror/quickCommands/index.js'
			);
		}

		if (enhancementConfig.pseudocode) {
			await joplin.contentScripts.register(
				ContentScriptType.MarkdownItPlugin,
				'enhancement_pseudocode_renderer',
				'./driver/markdownItRenderer/pseudocode/index.js'
			);
		}

		if (enhancementConfig.tableFormatter) {
			await initTableFormatter();
		}

		await joplin.contentScripts.register(
			ContentScriptType.CodeMirrorPlugin,
			'enhancement_codemirror_mode',
			'./driver/codemirror/mode/index.js'
		);

		if (enhancementConfig.admonitionCmRender) {
			await joplin.contentScripts.register(
				ContentScriptType.CodeMirrorPlugin,
				'cm_admonition_renderer',
				'./driver/codemirror/admonition/index.js'
			);
		}

		if (enhancementConfig.frontMatterRender) {
			await joplin.contentScripts.register(
				ContentScriptType.MarkdownItPlugin,
				'enhancement_front_matter',
				'./driver/markdownItRuler/frontMatter/index.js'
			);
		}

		if (enhancementConfig.colorfulQuote) {
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

		if (enhancementConfig.linkFolder) {
			await joplin.contentScripts.register(
				ContentScriptType.CodeMirrorPlugin,
				'enhancement_link_folder',
				'./driver/codemirror/linkFolder/index.js'
			);

			await joplin.contentScripts.onMessage(
				'enhancement_link_folder',
				async (msg) => {
					if (msg.type === 'openUrl' && msg.content && msg.content !== '') {
						return await joplin.commands.execute('openItem', msg.content);
					} else if (msg.type === 'imgPath' && msg.content && msg.content !== '') {
						return await joplin.data.resourcePath(msg.content.substr(2));
					}
				}
			);
		}

		if (enhancementConfig.searchReplace) {
			await joplin.contentScripts.register(
				ContentScriptType.CodeMirrorPlugin,
				'enhancement_search_replace',
				'./driver/codemirror/searchReplace/index.js'
			);
		}

		if (enhancementConfig.inlineMarker) {
			await joplin.contentScripts.register(
				ContentScriptType.CodeMirrorPlugin,
				'enhancement_inline_marker',
				'./driver/codemirror/inlineMarker/index.js'
			);
		}

		if (enhancementConfig.indentBorder) {
			await joplin.contentScripts.register(
				ContentScriptType.CodeMirrorPlugin,
				'enhancement_indent_broder',
				'./driver/codemirror/indentBorder/index.js'
			);
		}

		if (enhancementConfig.taskCmRender) {
			await joplin.contentScripts.register(
				ContentScriptType.CodeMirrorPlugin,
				'enhancement_task_render',
				'./driver/codemirror/taskRender/index.js'
			);
		}

		if (enhancementConfig.mathCmRender) {
			await joplin.contentScripts.register(
				ContentScriptType.CodeMirrorPlugin,
				'enhancement_math_render',
				'./driver/codemirror/mathRender/index.js'
			);
		}

		if (enhancementConfig.mermaidCmRender) {
			await joplin.contentScripts.register(
				ContentScriptType.CodeMirrorPlugin,
				'enhancement_mermaid_render',
				'./driver/codemirror/mermaidRender/index.js'
			);
		}

		if (enhancementConfig.focusMode) {
			await joplin.contentScripts.register(
				ContentScriptType.CodeMirrorPlugin,
				'enhancement_focus_mode',
				'./driver/codemirror/focusMode/index.js'
			);

			await joplin.commands.register({
				name: 'toggleSideBarAndNoteList',
				label: 'Toggle Side Bar and Note List',
				iconName: 'fa fa-bullseye',
				execute: async () => {
					await joplin.commands.execute('toggleSideBar', { });
					await joplin.commands.execute('toggleNoteList', { });
				},
			})

			await joplin.views.toolbarButtons.create(
				'enhancement_focus_mode',
				'toggleSideBarAndNoteList',
				ToolbarButtonLocation.NoteToolbar
			)
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

async function getConfig(): Promise<EnhancementConfig> {
	const config = new EnhancementConfig();
	config.tableFormatter = await joplin.settings.value(ENABLE_TABLE_FORMATTER);
	config.localPdfPreview = await joplin.settings.value(ENABLE_LOCAL_PDF_PREVIEW);
	config.imageEnhancement = await joplin.settings.value(ENABLE_IMAGE_ENHANCEMENT);
	config.quickCommands = await joplin.settings.value(ENABLE_QUICK_COMMANDS);
	config.pseudocode = await joplin.settings.value(ENABLE_PSEUDOCODE);
	config.admonitionCmRender = await joplin.settings.value(ENABLE_ADMONITION_CM_RENDER);
	config.frontMatterRender = await joplin.settings.value(ENABLE_FRONT_MATTER);
	config.colorfulQuote = await joplin.settings.value(ENABLE_COLORFUL_QUOTE);
	config.linkFolder = await joplin.settings.value(ENABLE_LINK_FOLDER);
	config.searchReplace = await joplin.settings.value(ENABLE_SEARCH_REPLACE);
	config.inlineMarker = await joplin.settings.value(ENABLE_INLINE_MARKER);
	config.focusMode = await joplin.settings.value(ENABLE_FOCUS_MODE);
	config.indentBorder = await joplin.settings.value(ENABLE_INDENT_BORDER);
	config.taskCmRender = await joplin.settings.value(ENABLE_TASK_RENDER);
	config.mathCmRender = await joplin.settings.value(ENABLE_MATH_RENDER);
	config.mermaidCmRender = await joplin.settings.value(ENABLE_MERMAID_RENDER);
	return config;
}
