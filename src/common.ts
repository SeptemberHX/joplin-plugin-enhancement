export const ENABLE_TABLE_FORMATTER = 'enableTableFormatter';
export const ENABLE_MERMAID_FOLDER = 'enableMermaidFolder';
export const ENABLE_LOCAL_PDF_PREVIEW = 'enableLocalPDFPreview';
export const ENABLE_IMAGE_ENHANCEMENT = 'enableImageEnhancement';
export const ENABLE_QUICK_COMMANDS = 'enableQuickCommands';
export const ENABLE_PAPERS = 'enablePapers';
export const PAPERS_COOKIE = 'papersCookie';
export const ENABLE_PSEUDOCODE = 'enablePseudocode';
export const ENABLE_CUSTOM_STYLE = 'enableCustomStyle';

export const PAPERS_FOLDER_NAME = 'ReadCube Papers';

export const CITATION_POPUP_ID = 'enhancement_citation_popup_id';

export const PAPERS_NOTEID_TO_PAPERID_TITLE = 'papers.db';
export const SOURCE_URL_PAPERS_PREFIX = 'papers_';

export const SOURCE_URL_DIDA_PREFIX = 'dida_';

export function extractInfo(data: string) {
    const splitResults = data.split(':');
    let info = {};
    for (const result of splitResults) {
        if (result.startsWith(SOURCE_URL_PAPERS_PREFIX)) {
            info[SOURCE_URL_PAPERS_PREFIX] = result.substr(SOURCE_URL_PAPERS_PREFIX.length);
        } else if (result.startsWith(SOURCE_URL_DIDA_PREFIX)) {
            info[SOURCE_URL_DIDA_PREFIX] = result.substr(SOURCE_URL_DIDA_PREFIX.length);
        }
    }
    return info;
}

export function updateInfo(raw, prefix, data) {
    let info = extractInfo(raw);
    info[prefix] = data;

    let newInfoStrs = [];
    for (let prefix in info) {
        newInfoStrs.push(`${prefix}${info[prefix]}`);
    }
    return newInfoStrs.join(':');
}