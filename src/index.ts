import joplin from 'api';
import {ContentScriptType, ModelType, ToolbarButtonLocation} from "api/types";
import {settings} from "./settings";
import {
	ContextMsg,
	ContextMsgType,
	ENABLE_ADMONITION_CM_RENDER, ENABLE_BLOCK_IMAGE_CAPTION,
	ENABLE_BLOCK_IMAGE_FOLDER,
	ENABLE_BLOCK_LINK_FOLDER, ENABLE_BULLET_LIST_RENDER,
	ENABLE_CODEBLOCK_HL,
	ENABLE_COLORFUL_QUOTE,
	ENABLE_FOCUS_MODE, ENABLE_FORMATTING_BAR,
	ENABLE_FRONT_MATTER,
	ENABLE_HEADER_HASH_RENDER, ENABLE_HORIZONTAL_LINE_RENDER,
	ENABLE_IMAGE_ENHANCEMENT,
	ENABLE_INDENT_BORDER,
	ENABLE_INLINE_MARKER,
	ENABLE_LINK_FOLDER, ENABLE_LIST_NUMBER_AUTO_CORRECT,
	ENABLE_LOCAL_PDF_PREVIEW,
	ENABLE_MATH_RENDER,
	ENABLE_MERMAID_RENDER, ENABLE_PLANTUML_RENDER,
	ENABLE_PSEUDOCODE,
	ENABLE_QUICK_COMMANDS,
	ENABLE_SEARCH_REPLACE,
	ENABLE_TABLE_FORMATTER,
	ENABLE_TABLE_RENDER,
	ENABLE_TASK_RENDER,
	EnhancementConfig,
} from "./common";

joplin.plugins.register({
	onStart: async function() {

		await settings.register();
		const enhancementConfig = await getConfig();

		await joplin.contentScripts.register(
			ContentScriptType.CodeMirrorPlugin,
			'enhancement_codemirror_items',
			'./driver/codemirror/index.js'
		);

		if (enhancementConfig.admonitionCmRender) {
			await joplin.contentScripts.register(
				ContentScriptType.CodeMirrorPlugin,
				'cm_admonition_renderer',
				'./driver/codemirror/admonition/index.js'
			);
		}

		await joplin.contentScripts.onMessage(
			'enhancement_codemirror_items',
			async (msg: ContextMsg) => {
				if (msg.type === ContextMsgType.GET_SETTINGS) {
					return await getConfig();
				} else if (msg.type === ContextMsgType.OPEN_URL && msg.content && msg.content !== '') {
					return await joplin.commands.execute('openItem', msg.content);
				} else if (msg.type === ContextMsgType.RESOURCE_PATH && msg.content && msg.content !== '') {
					const itemType = await joplin.data.itemType(msg.content.substr(2));
					if (itemType === ModelType.Resource) {
						return await joplin.data.resourcePath(msg.content.substr(2));
					} else {
						return null;
					}
				} else if (msg.type === ContextMsgType.SHORTCUT) {
					switch (msg.content) {
						case 'markdownBold':
							await joplin.commands.execute('textBold');
							break;
						case 'markdownItalic':
							await joplin.commands.execute('textItalic');
							break;
						case 'markdownLink':
							await joplin.commands.execute('textLink');
							break;
						case 'markdownCode':
							await joplin.commands.execute('textCode');
							break;
						case 'markdownHLRed':
						case 'markdownHLGreen':
						case 'markdownHLBlue':
						case 'markdownHLYellow':
						case 'markdownHLPink':
						case 'markdownHLPurple':
						case 'markdownHLOrange':
							await joplin.commands.execute('editor.execCommand', {
								name: msg.content
							});
							break;
						default:
							break;
					}
				}
			}
		);

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

		if (enhancementConfig.searchReplace) {
			await joplin.contentScripts.register(
				ContentScriptType.CodeMirrorPlugin,
				'enhancement_search_replace',
				'./driver/codemirror/searchReplace/index.js'
			);
		}

		if (enhancementConfig.indentBorder) {
			await joplin.contentScripts.register(
				ContentScriptType.CodeMirrorPlugin,
				'enhancement_indent_broder',
				'./driver/codemirror/indentBorder/index.js'
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

		if (enhancementConfig.bulletListCmRender) {
			await joplin.contentScripts.register(
				ContentScriptType.CodeMirrorPlugin,
				'enhancement_bullet_cm_render',
				'./driver/codemirror/overlay/bulletList.js'
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
	config.blockLinkFolder = await joplin.settings.value(ENABLE_BLOCK_LINK_FOLDER);
	config.blockImageFolder = await joplin.settings.value(ENABLE_BLOCK_IMAGE_FOLDER);
	config.blockImageCaption = await joplin.settings.value(ENABLE_BLOCK_IMAGE_CAPTION);
	config.searchReplace = await joplin.settings.value(ENABLE_SEARCH_REPLACE);
	config.inlineMarker = await joplin.settings.value(ENABLE_INLINE_MARKER);
	config.focusMode = await joplin.settings.value(ENABLE_FOCUS_MODE);
	config.indentBorder = await joplin.settings.value(ENABLE_INDENT_BORDER);
	config.taskCmRender = await joplin.settings.value(ENABLE_TASK_RENDER);
	config.headerHashRender = await joplin.settings.value(ENABLE_HEADER_HASH_RENDER);
	config.tableCmRender = await joplin.settings.value(ENABLE_TABLE_RENDER);
	config.mathCmRender = await joplin.settings.value(ENABLE_MATH_RENDER);
	config.mermaidCmRender = await joplin.settings.value(ENABLE_MERMAID_RENDER);
	config.codeBlockHL = await joplin.settings.value(ENABLE_CODEBLOCK_HL);
	config.formattingBar = await joplin.settings.value(ENABLE_FORMATTING_BAR);
	config.dateFormat = await joplin.settings.globalValue('dateFormat');
	config.plantumlCmRender = await joplin.settings.value(ENABLE_PLANTUML_RENDER);
	config.bulletListCmRender = await joplin.settings.value(ENABLE_BULLET_LIST_RENDER);
	config.listNumberAutoCorrect = await joplin.settings.value(ENABLE_LIST_NUMBER_AUTO_CORRECT);
	config.horizontalLineRender = await joplin.settings.value(ENABLE_HORIZONTAL_LINE_RENDER);
	return config;
}
