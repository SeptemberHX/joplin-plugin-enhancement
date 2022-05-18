import PapersLib, {PaperItem} from "../../lib/papers/papersLib";
import joplin from "../../../api";
import {PAPERS_COOKIE, PAPERS_FOLDER_NAME} from "../../common";
import exp = require("constants");
import {createRecord, getAllRecords, getNoteId2PaperId, updateRecord} from "../../lib/papers/papersDB";

export async function createNewNotesForPapers(paperItems: PaperItem[]) {
    let noteId2PaperId =  await getNoteId2PaperId();
    for (let item of paperItems) {

    }
}

export async function syncAllPaperItems() {
    console.log('Enhancement: In syncAllPaperItems...');
    const paperRootFolderId = await getOrCreatePaperRootFolder();
    const papersCookie = await joplin.settings.value(PAPERS_COOKIE);
    if (papersCookie.length === 0) {
        alert('Empty cookie for Papers. Please set it in the preferences.');
        return;
    }

    const papers = new PapersLib(papersCookie);
    const allRemotePapers = await papers.getAllItems();
    let exitedPaperItemIds = new Set();
    const existedPapers = await getAllRecords();
    for (let paperItem of existedPapers) {
        exitedPaperItemIds.add(paperItem.id);
    }

    for (let remotePaper of allRemotePapers) {
        if (exitedPaperItemIds.has(remotePaper.id)) {
            await updateRecord(remotePaper.id, remotePaper);
        } else {
            await createRecord(remotePaper.id, remotePaper);
        }
    }

    return;

    // get all the existing {paper item id : note id} in "ReadCube Papers"
    const folders = await joplin.data.get(['folders']);
    let existPapers = {};
    for (let folder of folders.items) {
        if (folder.parent_id === paperRootFolderId) {
            const notes = await joplin.data.get(['folders', folder.id, 'notes'], { fields: ['body', 'id', 'title']});
            for (let note of notes.items) {
                const paperItemIdMatchR = note.body.match(/\sid:\s*(\S{8}-\S{4}-\S{4}-\S{4}-\S{12})/);
                if (paperItemIdMatchR) {
                    existPapers[paperItemIdMatchR[1]] = note.id;
                }
            }
        }
    }

    // send request to ReadCube Papers to get the papers' information and split them by published year
    let year2Items = {}
    for (let item of allRemotePapers) {
        if (!(item.year in year2Items)) {
            year2Items[item.year] = [];
        }
        year2Items[item.year].push(item);
    }

    // create and get sub folders named by published year in "ReadCube Papers"
    const name2FolderIds = await getOrCreatePaperYearFolder(paperRootFolderId, Object.keys(year2Items));

    // create note or update exising notes
    for (let year in year2Items) {
        for (let paperItem of year2Items[year]) {
            if (!(paperItem.id in existPapers)) {  // create new note for new paper item or the paper item id is missing in the note
                await joplin.data.post(['notes'], null, {title: paperItem.title, parent_id: name2FolderIds[year], body: buildPaperItemBody(paperItem)});
            } else {  // if exists, update the paper item's information in the note body
                await replacePaperInfoBody(paperItem, existPapers[paperItem.id], name2FolderIds[year]);
            }
        }
    }
}

export async function buildPaperItemFromNotes() {
    const paperRootFolderId = await getOrCreatePaperRootFolder();
    // get all the existing {paper item id : note id} in "ReadCube Papers"
    const folders = await joplin.data.get(['folders']);

    let results: PaperItem[] = [];
    let noteIds: string[] = [];
    for (let folder of folders.items) {
        if (folder.parent_id === paperRootFolderId) {
            const notes = await joplin.data.get(['folders', folder.id, 'notes'], { fields: ['body', 'id', 'title']});
            for (let note of notes.items) {
                const paperItemIdMatchR = note.body.match(/\sid:\s*(\S{8}-\S{4}-\S{4}-\S{4}-\S{12})/);
                if (paperItemIdMatchR) {
                    const titleMatch = note.body.match(/\sTitle:\s*(.*)\n/);
                    const authorsMatch = note.body.match(/\sAuthors:\s*(.*)\n/);
                    const yearMatch = note.body.match(/\sYear:\s*(.*)\n/);
                    const fromMatch = note.body.match(/\sFrom:\s*(.*)\n/);
                    const volumeMatch = note.body.match(/\sVolume:\s*(.*)\n/);
                    const pageMatch = note.body.match(/\sPagination:\s*(.*)\n/);
                    results.push({
                        id: paperItemIdMatchR[1],
                        collection_id: '',
                        title: titleMatch ? titleMatch[1] : '',
                        authors: authorsMatch ? authorsMatch[1].split(', ') : '',
                        year: yearMatch ? yearMatch[1] : '',
                        journal: fromMatch ? fromMatch[1] : '',
                        volume: volumeMatch ? volumeMatch[1] : '',
                        pagination: pageMatch ? pageMatch[1] : '',
                        notes: '',
                        annotations: [],
                        issn: '',
                        url: '',
                        abstract: '',
                        journal_abbrev: '',
                        rating: -1,
                        tags: []
                    });
                    noteIds.push(note.id);
                }
            }
        }
    }
    return {items: results, ids: noteIds};
}

export async function copyCitationOfCurrentPaper(noteId, noteBody) {
    const titleMatch = noteBody.match(/\sTitle:\s*(.*)\n/);
    const authorsMatch = noteBody.match(/\sAuthors:\s*(.*)\n/);
    const fromMatch = noteBody.match(/\sFrom:\s*(.*)\n/);
    const yearMatch = noteBody.match(/\sYear:\s*(.*)\n/);
    const volumeMatch = noteBody.match(/\sVolume:\s*(.*)\n/);
    const pageMatch = noteBody.match(/\sPagination:\s*(.*)\n/);

    if (titleMatch && authorsMatch) {
       const showText = await buildCitation(
           titleMatch[1],
           authorsMatch[1].split(', '),
           fromMatch ? fromMatch[1] : '',
           volumeMatch ? volumeMatch[1] : '',
           pageMatch ? pageMatch[1] : '',
           yearMatch ? yearMatch[1] : '',
           noteId
       );
       await joplin.clipboard.writeText(showText);
    } else {
        return false;
    }

    return true;
}

export async function buildCitationForItem(item: PaperItem, noteId) {
    return buildCitation(
        item.title,
        item.authors,
        item.journal,
        item.volume,
        item.pagination,
        item.year,
        noteId
    );
}

export async function buildRefName(item: PaperItem) {
    let name = item.authors[0].split(/\s/)[0];
    name += item.year;
    for (const t of item.journal.split(/\s/)) {
        if (t[0] >= 'A' && t[0] <= 'Z') {
            name += t[0];
        }
    }
    return name;
}

async function buildCitation(title, authors, from, volume, page, year, noteId) {
    let showText = "";
    showText += authors.slice(0, authors.length - 1).join(', ') + `, and ${authors[authors.length - 1]}.`;
    showText += ` "[${title}](:/${noteId})."`;

    if (from.length > 0) {
        showText += ` In *${from}*.`;
    }

    if (volume.length > 0) {
        showText += ` vol. ${volume}.`;
    }

    if (page.length > 0) {
        showText += ` pp. ${page}.`;
    }

    if (year.length > 0) {
        showText += ` ${year}.`;
    }

    return showText;
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
        if (annoBody === noteBody.substr(fromIndex)) {
            return;
        }

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

export async function updateAllInfoForOneNote(noteId, noteBody) {
    const papersCookie = await joplin.settings.value(PAPERS_COOKIE);
    if (papersCookie.length === 0) {
        return;
    }

    const papers = new PapersLib(papersCookie);
    const paperItemIdMatchR = noteBody.match(/\sid:\s*(\S{8}-\S{4}-\S{4}-\S{4}-\S{12})/);
    const paperCollectionIdMatchR = noteBody.match(/collection_id:\s*(\S{8}-\S{4}-\S{4}-\S{4}-\S{12})/);
    if (paperItemIdMatchR && paperCollectionIdMatchR) {
        const paperItemId = paperItemIdMatchR[1];
        const paperCollectionId = paperCollectionIdMatchR[1];

        const paperInfoBody = buildPaperInfoBody(await papers.getItem(paperCollectionId, paperItemId));
        const annoBody = buildAnnotationBody(await papers.getAnnotation(paperCollectionId, paperItemId));

        let paperInfoFromIndex = noteBody.lastIndexOf('## Papers');

        let modifiedNote = '';
        if (paperInfoFromIndex > 0) {
            modifiedNote = noteBody.substr(0, paperInfoFromIndex) + paperInfoBody + annoBody;
        }

        if (modifiedNote.length === 0) {
            modifiedNote = noteBody;
        }

        if (modifiedNote === noteBody) {
            return;
        }

        await joplin.data.put(['notes', noteId], null, { body: modifiedNote });
        await joplin.commands.execute('editor.setText', modifiedNote);
        return true;
    } else {
        return false;
    }
}

async function replacePaperInfoBody(item, noteId, parentId) {
    const note = await joplin.data.get(['notes', noteId], { fields: ['body', 'parent_id', 'title']});
    let fromIndex = note.body.lastIndexOf('## Papers');
    let toIndex = note.body.lastIndexOf('### Annotations');

    // avoid unnecessary note update
    const newMetadata = buildPaperInfoBody(item);
    if (newMetadata === note.body.substr(fromIndex, toIndex - fromIndex) && parentId === note.parent_id && note.title === item.title) {
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
    if (modifiedNote === note.body && parentId === note.parent_id && note.title === item.title) {
        return;
    }

    // console.log(`Update for ${item.title}, raw parentId: ${note.parent_id}, now: ${parentId}; raw title: ${note.title}, now: ${item.title}`);
    await joplin.data.put(['notes', noteId], null, { body: modifiedNote, title: item.title, parent_id: parentId });
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
        buildPaperInfoBody(item) +
        "### Annotations\n" +
        "\n" +
        "Please click the sync button on the editor toolbar to fetch your annotations from Papers.\n";
}

function buildPaperInfoBody(item) {
    return `## Papers

> :warning: **Warning:** Contents below is auto generated when syncing with Papers. Any changes will be lost!

\`\`\`papers
* Title: \t${item.title}
* Authors: \t${item.authors.join(', ')}
* From: \t${item.from}
* Year: \t${item.year}
* Rating: \t${item.rating}
* Tags: \t${item.tags.join(', ')}
* Abstract: \t${item.abstract}
* Issn: \t${item.issn}
* Volume: \t${item.volume}
* Url: \t${item.url}
* Pagination: \t${item.pagination}
* Journal_abbrev: \t${item.journal_abbrev}
* id: \t${item.id}
* collection_id: \t${item.collection_id}
\`\`\`

### Notes

${item.notes}

`;
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
            case 'note':
                annoBody += `<blockquote>${anno.note}</blockquote>`;
                break;
            default:
                // annoBody += anno.text.replaceAll('\n', '') + '\n\n';
                break;
        }
    }
    return annoBody;
}
