// following https://gitlab.com/beatlink-code/joplin-plugin-repeating-todos/-/blob/main/src/core/database.ts

import joplin from "api";
import {PaperItem} from "./papersLib";
import exp = require("constants");
const fs = joplin.require('fs-extra')
const sqlite3 = joplin.require('sqlite3')

let databasePath = null;
let database = null;

export async function setupDatabase(){
    var pluginDir = await joplin.plugins.dataDir()
    databasePath = pluginDir + "/papers.sqlite3"
    await fs.ensureDir(pluginDir)
    database = new sqlite3.Database(databasePath)
    await createTable()
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
            journalAbbrev TEXT
        )
    `;

    const createMapQuery = `
        CREATE TABLE IF NOT EXISTS note2paper (
            id TEXT PRIMARY KEY,
            paperId TEXT,
            FOREIGN KEY(paperId) REFERENCES papers(id) ON DELETE CASCADE
        )
    `;
    await runQuery('run', createQuery, {});
    await runQuery('run', createMapQuery, {});
}

export async function getNoteId2PaperId() {
    const records = await runQuery('all', `SELECT * FROM papers`, {});
    let nodeId2PaperId = {};
    for (let record of records) {
        nodeId2PaperId[record.id] = record.paperId;
    }
    return nodeId2PaperId;
}

export async function createNoteId2PaperId(noteId, paperId) {
    await runQuery('run', `INSERT INTO note2paper (id, paperId) VALUES ($id, $paperId)`, {$id: noteId, $paperId: paperId});
}

export async function getPaperItemByNoteId(noteId: string) {
    const record = await runQuery('get', `SELECT * FROM note2paper WHERE id = $id`, {$id: noteId});
    if (record) {
        return getRecord(record.paperId);
    }
}

export async function getAllRecords() {
    const records = await runQuery('all', `SELECT * FROM papers`, {})
    return records.map((record) => ({id: record.id, recurrence: getRecordAsPaperItem(record)}))
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
            "journalAbbrev" = $journalAbbrev
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
        $journalAbbrev: paperItem.journal_abbrev
    };
    await runQuery('run', updateQuery, updateParameters);
}

export async function getRecord(id): Promise<PaperItem>{
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
