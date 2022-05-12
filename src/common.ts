export const ENABLE_TABLE_FORMATTER = 'enableTableFormatter';
export const ENABLE_MERMAID_FOLDER = 'enableMermaidFolder';
export const ENABLE_LOCAL_PDF_PREVIEW = 'enableLocalPDFPreview';
export const ENABLE_IMAGE_ENHANCEMENT = 'enableImageEnhancement';
export const ENABLE_QUICK_COMMANDS = 'enableQuickCommands';
export const ENABLE_PAPERS = 'enablePapers';
export const PAPERS_COOKIE = 'papersCookie';
export const ENABLE_AUTO_ANNOTATION_FETCH = 'enableAutoAnnotationFetch';
export const ENABLE_PSEUDOCODE = 'enablePseudocode';

export const PAPERS_FOLDER_NAME = 'ReadCube Papers';

export const AUTO_NOTE_LINK_PLUGIN_ID = 'enhancement_auto_note_link_render';


export type Request =
    | QueryAllNoteId2TitleRequest;

export interface QueryAllNoteId2TitleRequest {
    event: 'queryAllNoteId2Title';
}

export enum MarkdownViewEvents {
    NoteDidUpdate = 'NoteDidUpdate',
    NewNoteOpen = 'NewNoteOpen',
}
