import PapersLib from "../../lib/papers/papersLib";
import joplin from "../../../api";
import {PAPERS_COOKIE, PAPERS_FOLDER_NAME} from "../../common";

export async function syncAllPaperItems() {
    console.log('Enhancement: In syncAllPaperItems...');
    const paperRootFolderId = await getOrCreatePaperRootFolder();
    const papersCookie = await joplin.settings.value(PAPERS_COOKIE);
    if (papersCookie.length === 0) {
        alert('Empty cookie for Papers. Please set it in the preferences.');
        return;
    }

    const papers = new PapersLib(papersCookie);
    let year2Items = {}
    for (let item of await papers.getAllItems()) {
        if (!(item.year in year2Items)) {
            year2Items[item.year] = [];
        }
        year2Items[item.year].push(item);
    }

    const name2FolderIds = await getOrCreatePaperYearFolder(paperRootFolderId, Object.keys(year2Items));
    for (let year in year2Items) {
        const notes = await joplin.data.get(['folders', name2FolderIds[year], 'notes']);

        let existPapers = {};
        for (let note of notes.items) {
            existPapers[note.title] = note.id;
        }

        for (let paperItem of year2Items[year]) {
            if (!(paperItem.title in existPapers)) {
                await joplin.data.post(['notes'], null, {title: paperItem.title, parent_id: name2FolderIds[year], body: buildPaperItemBody(paperItem)});
            } else {
                await replacePaperNoteBody(paperItem, existPapers[paperItem.title]);
            }
        }
    }
}

export async function updateAnnotations(noteId, noteBody) {
    console.log('Enhancement: In updateAnnotations...');
    const papersCookie = await joplin.settings.value(PAPERS_COOKIE);
    if (papersCookie.length === 0) {
        alert('Empty cookie for Papers. Please set it in the preferences.');
        return;
    }

    const papers = new PapersLib(papersCookie);
    const paperItemIdMatchR = noteBody.match(/\sid:\s*(\S{8}-\S{4}-\S{4}-\S{4}-\S{12})/);
    const paperCollectionIdMatchR = noteBody.match(/collection_id:\s*(\S{8}-\S{4}-\S{4}-\S{4}-\S{12})/);
    if (paperItemIdMatchR && paperCollectionIdMatchR) {
        const paperItemId = paperItemIdMatchR[1];
        const paperCollectionId = paperCollectionIdMatchR[1];
        const annoBody = buildAnnotationBody(await papers.getAnnotation(paperCollectionId, paperItemId));

        let fromIndex = noteBody.lastIndexOf('### Annotations');
        let modifiedNote = '';
        if (fromIndex > 0) {
            modifiedNote = noteBody.substr(0, fromIndex) + annoBody;
        }

        if (modifiedNote.length === 0) {
            modifiedNote = noteBody;
        }
        await joplin.data.put(['notes', noteId], null, { body: modifiedNote });
        await joplin.commands.execute('editor.setText', modifiedNote);
    }
}

async function replacePaperNoteBody(item, noteId) {
    const note = await joplin.data.get(['notes', noteId], { fields: ['body']});
    let fromIndex = note.body.indexOf('## Papers');
    let toIndex = note.body.indexOf('### Annotations');

    // avoid unnecessary note update
    const newMetadata = buildPaperNoteBody(item);
    if (newMetadata === note.body.substr(fromIndex, toIndex)) {
        console.log(`No update for ${item.title}`);
        return;
    }

    let modifiedNote = '';
    if (fromIndex > 0 && toIndex > 0) {
        modifiedNote = note.body.substr(0, fromIndex) + newMetadata + note.body.substr(toIndex);
    }

    if (modifiedNote.length === 0) {
        modifiedNote = note.body;
    }

    // avoid unnecessary note update
    if (modifiedNote === note.body) {
        return;
    }

    await joplin.data.put(['notes', noteId], null, { body: modifiedNote });
}

async function getOrCreatePaperRootFolder() {
    const folders = await joplin.data.get(['folders']);
    let folder_id;
    for (let folder of folders.items) {
        if (folder.parent_id === '' && folder.title === PAPERS_FOLDER_NAME) {
            folder_id = folder.id;
            break;
        }
    }

    if (!folder_id) {
        const folder = await joplin.data.post(['folders'], null, {title: PAPERS_FOLDER_NAME, parent_id: ''});
        folder_id = folder.id;
    }

    return folder_id;
}

async function getOrCreatePaperYearFolder(rootFolderId, subFolderNames) {
    const folders = await joplin.data.get(['folders']);
    let nameFolderIds = {}
    for (let folder of folders.items) {
        if (folder.parent_id === rootFolderId) {
            nameFolderIds[folder.title] = folder.id
        }
    }

    for (let folderName of subFolderNames) {
        if (folderName in nameFolderIds) {
            continue;
        }

        const subFolder = await joplin.data.post(['folders'], null, {title: folderName, parent_id: rootFolderId});
        nameFolderIds[folderName] = subFolder.id;
    }
    return nameFolderIds;
}

function buildPaperItemBody(item) {
    return "## Notes\n" +
        "\n" +
        buildPaperNoteBody(item) +
        "### Annotations\n" +
        "\n" +
        "Please click the sync button on the editor toolbar to fetch your annotations from Papers.\n";
}

function buildPaperNoteBody(item) {
    return "## Papers\n" +
    "\n" +
    "```papers\n" +
    "* Title: \t" + item.title + "\n" +
    "* Authors: \t" + item.authors.join(', ') + "\n" +
    "* From: \t" + item.from + "\n" +
    "* Rating: \t" + item.rating + "\n" +
    "* Tags: \t" + item.tags.join(', ') + "\n" +
    "* Abstract: \t" + item.abstract + "\n" +
    "* id: \t" + item.id + "\n" +
    "* collection_id: \t" + item.collection_id + "\n" +
    "```\n" +
    "\n" +
    "### Notes\n" +
    "\n" +
    item.notes + "\n" +
    "\n";
}

function buildAnnotationBody(annotations) {
    let annoBody = '### Annotations\n\n';
    for (let anno of annotations) {
        switch (anno.type) {
            case 'highlight':
                annoBody += `<mark>${anno.text.replaceAll('\n', '')}</mark>\n\n`;
                break;
            case 'underline':
                annoBody += `<u>${anno.text.replaceAll('\n', '')}</u>\n\n`;
                break;
            default:
                annoBody += anno.text.replaceAll('\n', '') + '\n\n';
                break;
        }
    }
    return annoBody;
}
