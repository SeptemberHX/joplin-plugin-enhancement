// following https://gitlab.com/beatlink-code/joplin-plugin-repeating-todos/-/blob/main/src/core/database.ts

import joplin from "api";
import {PaperItem} from "./papersLib";
import {getOrCreatePaperRootFolder} from "./papersUtils";
import {extractInfo, PAPERS_NOTEID_TO_PAPERID_TITLE, SOURCE_URL_PAPERS_PREFIX} from "../../common";

const fs = joplin.require('fs-extra')
const sqlite3 = joplin.require('sqlite3')

let databasePath = null;
let database = null;

export async function setupDatabase(){
    var pluginDir = await joplin.plugins.dataDir();
    databasePath = pluginDir + "/papers.sqlite3";
    await fs.ensureDir(pluginDir);
    database = new sqlite3.Database(databasePath);
    await createTable();
}

async function createTable() {
    const createQuery = `
        CREATE TABLE IF NOT EXISTS papers (
            id TEXT PRIMARY KEY, 
            title TEXT,
            journal TEXT,
            authors TEXT,
            tags TEXT,
            rating INTEGER,
            abstract TEXT,
            collectionId TEXT,
            year INTEGER,
            notes TEXT,
            issn TEXT,
            volume TEXT,
            url TEXT,
            pagination TEXT,
            journalAbbrev TEXT,
            doi TEXT
        )
    `;

    await runQuery('run', createQuery, {});

    try {
        const alterTable = `
        ALTER TABLE papers ADD COLUMN doi TEXT
        `;
        await runQuery('run', alterTable, {});
    } catch (e) {
        
    }
}

export async function getAllRecords() {
    const records = await runQuery('all', `SELECT * FROM papers`, {})
    let results = [];
    for (let record of records) {
        results.push(getRecordAsPaperItem(record));
    }
    return results;
    return records.map((record) => getRecordAsPaperItem(record));
}

export async function createRecord(id: string, paperItem: PaperItem){
    await runQuery('run', `INSERT INTO papers (id) VALUES ($id)`, {$id: id})
    await updateRecord(id, paperItem);
}

export async function updateRecord(id: string, paperItem: PaperItem) {
    const updateQuery = `
        UPDATE papers
        SET
            "title" = $title,
            "journal" = $journal,
            "authors" = $authors,
            "tags" = $tags,
            "rating" = $rating,
            "abstract" = $abstract,
            "collectionId" = $collectionId,
            "year" = $year,
            "notes" = $notes,
            "issn" = $issn,
            "volume" = $volume,
            "url" = $url,
            "pagination" = $pagination,
            "journalAbbrev" = $journalAbbrev,
            "doi" = $doi
        WHERE "id" = $id
    `;
    const updateParameters = {
        $id: id,
        $title: paperItem.title,
        $journal: paperItem.journal,
        $authors: paperItem.authors ? paperItem.authors.join(', ') : "",
        $tags: paperItem.tags ? paperItem.tags.join(', ') : "",
        $rating: paperItem.rating,
        $abstract: paperItem.abstract,
        $collectionId: paperItem.collection_id,
        $year: paperItem.year,
        $notes: paperItem.notes,
        $issn: paperItem.issn,
        $volume: paperItem.volume,
        $url: paperItem.url,
        $pagination: paperItem.pagination,
        $journalAbbrev: paperItem.journal_abbrev,
        $doi: paperItem.doi
    };
    await runQuery('run', updateQuery, updateParameters);
}

export async function getRecord(id): Promise<PaperItem>{
    console.log(`Query paper item ${id}`);
    const record = await runQuery('get', `SELECT * FROM papers WHERE id = $id`, {$id: id})
    return getRecordAsPaperItem(record)
}

export async function deleteRecord(id){
    await runQuery('run', `DELETE FROM papers WHERE id = $id`, {$id: id})
}

function getRecordAsPaperItem(record): PaperItem{
    if (record != undefined){
        let recurrence = new PaperItem()
        recurrence.id = record.id;
        recurrence.title = record.title;
        recurrence.journal = record.journal;
        recurrence.authors = record.authors ? record.authors.split(', ') : [];
        recurrence.tags = record.tags ? record.tags.split(', ') : [];
        recurrence.rating = record.rating;
        recurrence.abstract = record.abstract;
        recurrence.collection_id = record.collectionId;
        recurrence.year = record.year;
        recurrence.notes = record.notes;
        recurrence.issn = record.issn;
        recurrence.volume = record.volume;
        recurrence.url = record.url;
        recurrence.pagination = record.pagination;
        recurrence.journal_abbrev = record.journalAbbrev;
        recurrence.doi = record.doi;
        return recurrence
    }
}

/** runQuery ****************************************************************************************************************************************
 * Sqlite3 does not support async/await functionality, thus the need for this promise based function to run the sqlite functions. If there are      *
 * better ways to do this, please let me know                                                                                                       *
 ***************************************************************************************************************************************************/
async function runQuery(func, SQLQuery, parameters): Promise<any>{
    return await new Promise(
        (resolve, reject) => {
            database[func](SQLQuery, parameters, (err, row) => { err ? reject(err) : resolve(row) })
        }
    )
}

// ---------------------------- NoteId2PaperId: because we want it synced between clients, we save it in a note

export async function getNoteId2PaperId() {
    let results = {}
    let page = 1;
    let notes = await joplin.data.get(['search'], {
        query: `sourceurl:*${SOURCE_URL_PAPERS_PREFIX}*`,
        fields: ['source_url', 'id']
    });
    while (true) {
        for (let item of notes.items) {
            const itemInfo = extractInfo(item.source_url);
            results[item.id] = itemInfo[SOURCE_URL_PAPERS_PREFIX];
        }

        if (notes.has_more) {
            page += 1;
            notes = await joplin.data.get(['search'], {
                query: `*sourceurl:${SOURCE_URL_PAPERS_PREFIX}*`,
                fields: ['source_url', 'id'],
                page: page
            });
        } else {
            break;
        }
    }

    return results;
}

export async function getPaperItemByNoteId(noteId: string) {
    let note = await joplin.data.get(['notes', noteId], {
        fields: ['source_url', 'id']
    });

    if (!note || !note.source_url.includes(SOURCE_URL_PAPERS_PREFIX)) {
        return undefined;
    }
    return await getRecord(extractInfo(note.source_url)[SOURCE_URL_PAPERS_PREFIX]);
}

export async function removeInvalidSourceUrlByAllItems(items: PaperItem[]) {
    const noteId2PaperId = await getNoteId2PaperId();
    let paperIdSet = new Set();

    for (let item of items) {
        paperIdSet.add(item.id);
    }

    for (let noteId in noteId2PaperId) {
        // remove the source_url when the paper is removed
        if (!paperIdSet.has(noteId2PaperId[noteId])) {
            await joplin.data.put(['notes', noteId], null, { source_url: "" });
        }
    }
}

export async function removeInvalidSourceUrlByItemId(itemId) {
    let notes = await joplin.data.get(['search'], {
        query: `sourceurl:*${SOURCE_URL_PAPERS_PREFIX}${itemId}*`,
        fields: ['id']
    });

    for (let note of notes.items) {
        await joplin.data.put(['notes', note.id], null, { source_url: "" });
    }
}

export async function getNoteIdByPaperId(paperId) {
    let notes = await joplin.data.get(['search'], {
        query: `sourceurl:*${SOURCE_URL_PAPERS_PREFIX}${paperId}*`,
        fields: ['id']
    });

    if (notes.items.length === 0) {
        return null;
    } else {
        return notes.items[0].id;
    }
}
