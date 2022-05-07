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
        console.log(item.title);
        if (!(item.year in year2Items)) {
            year2Items[item.year] = [];
        }
        year2Items[item.year].push(item);
    }

    const name2FolderIds = await getOrCreatePaperYearFolder(paperRootFolderId, Object.keys(year2Items));
    for (let year in year2Items) {
        const notes = await joplin.data.get(['folders', name2FolderIds[year], 'notes']);
        console.log(notes);

        let existPapers = [];
        for (let note of notes.items) {
            existPapers.push(note.title);
        }

        for (let paperItem of year2Items[year]) {
            if (!(paperItem.title in existPapers)) {
                await joplin.data.post(['notes'], null, {title: paperItem.title, parent_id: name2FolderIds[year], body: buildPaperItemBody(paperItem)});
            }
        }
    }
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
    console.log(nameFolderIds);
    return nameFolderIds;
}

function buildPaperItemBody(item) {
    return "## Notes\n" +
        "\n" +
        "## Papers\n" +
        "\n" +
        "* Title: " + item.title + "\n" +
        "* Authors: " + item.authors.join(', ') + "\n" +
        "* From: " + item.from + "\n" +
        "* Rating: " + item.rating + "\n" +
        "* Tags: " + item.tags.join(', ') + "\n" +
        "* Abstract: " + item.abstract + "\n" +
        "* id: " + item.id + "\n" +
        "* collection_id: " + item.collection_id + "\n" +
        "\n" +
        "### Notes\n" +
        "\n" +
        item.notes + "\n" +
        "\n" +
        "### Annotations\n";
}