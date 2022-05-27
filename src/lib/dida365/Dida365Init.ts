import joplin from "../../../api";
import {debounce} from "ts-debounce";
import {convertNoteToTodo, list_regex} from "./didaUtils";
import {Dida365, DidaSubTask, DidaTask} from "./Dida365Lib";
import {DIDA_IGNORE_NOTE_TAG_NAME, ENABLE_DIDA365, extractInfo, SOURCE_URL_DIDA_PREFIX, updateInfo} from "../../common";
import {dida365Cache, Dida365WS} from "./dida365WS";

let debounce_dealNote = debounce(async function() {
    const currNote = await joplin.workspace.selectedNote();
    await syncNoteToDida365(currNote);
}, 5000);

export async function dida365_init() {
    const dida365EnableFlag = await joplin.settings.value(ENABLE_DIDA365);
    if (dida365EnableFlag) {
        const dws = new Dida365WS();
        await joplin.workspace.onNoteChange(debounce_dealNote);
    }
}

export async function syncNoteToDida365(currNote) {
    const tags = await joplin.data.get(['notes', currNote.id, 'tags']);
    let tagCheck = false;
    for (const tag of tags.items) {
        if (tag.title === DIDA_IGNORE_NOTE_TAG_NAME.toLowerCase()) {
            tagCheck = true;
        }
        break;
    }

    // ignore the note with 'Dida365Ignore' tag
    if (tagCheck) {
        return;
    }

    let match;
    let tasks = [];
    let allFinished = true;
    let subDidaTasks: DidaSubTask[] = [];
    while ((match = list_regex.regex.exec(currNote.body)) !== null) {
        const task = {
            note: currNote.id,
            note_title: currNote.title,
            parent_id: currNote.parent_id,
            msg: list_regex.msg(match),
            assignee: list_regex.assignee(match),
            date: list_regex.date(match),
            tags: list_regex.tags(match),
            done: list_regex.done(match)
        };
        tasks.push(task);
        if (!task.done) {
            allFinished = false;
        }

        let subDidaTask = new DidaSubTask();
        subDidaTask.title = task.msg;
        subDidaTask.status = task.done ? 2 : 0;
        subDidaTask.id = `${currNote.id}-${subDidaTasks.length}`;
        subDidaTasks.push(subDidaTask);
    }

    // Not support joplin todo note! We only accept the notes with todo items in note body
    if (subDidaTasks.length === 0) {
        return;
    }

    let didaTask = new DidaTask();
    didaTask.id = extractInfo(currNote.source_url)[SOURCE_URL_DIDA_PREFIX];
    didaTask.items = subDidaTasks;
    didaTask.status = allFinished ? 2 : 0;
    didaTask.title = currNote.title;

    const taskId = await syncTaskToDida365(didaTask);
    if (taskId && taskId !== didaTask.id) {
        console.log(`Dida365: connect note ${currNote.id} with remote task ${taskId}`);
        const info = updateInfo(currNote.source_url, SOURCE_URL_DIDA_PREFIX, taskId);
        await joplin.data.put(['notes', currNote.id], null, {source_url: info});
    }

    if (currNote.is_todo == allFinished) {
        await convertNoteToTodo(currNote.id, !allFinished);
    }
}

async function syncTaskToDida365(didaTask: DidaTask) {
    if (!didaTask.id || !dida365Cache.get(didaTask.id)) {
        const returnedTask = await Dida365.createJoplinTask(didaTask);
        console.log('Create remote task:', didaTask);
        console.log('Returned:', returnedTask);
        if (returnedTask) {
            return returnedTask.id;
        }
    } else {
        const cachedTask = dida365Cache.get(didaTask.id);
        if (cachedTask && didaTask.contentEquals(cachedTask)) {
            return cachedTask.id;
        }

        const returnedTask = await Dida365.updateJoplinTask(didaTask);
        if (returnedTask) {
            return returnedTask.id;
        }
    }
    return null;
}

async function getNoteIdByDidaTaskId(didaTaskId) {
    let notes = await joplin.data.get(['search'], {
        query: `sourceurl:*${SOURCE_URL_DIDA_PREFIX}${didaTaskId}*`,
        fields: ['id']
    });

    if (notes.items.length === 0) {
        return null;
    } else {
        return notes.items[0].id;
    }
}

export async function syncStatusFromDidaToNote(didaTask: DidaTask) {
    const noteId = await getNoteIdByDidaTaskId(didaTask.id);
    if (!noteId) return;

    const note = await joplin.data.get(['notes', noteId], {fields: ['id', 'source_url', 'body', 'todo_completed']});
    let match;
    let noteBody = note.body;
    while ((match = list_regex.regex.exec(note.body)) !== null) {
        for (let subTask of didaTask.items) {
            if (match[0].includes(subTask.title)) {
                if (subTask.status === 2 && match[0].includes('- [x]') || (subTask.status === 0 && match[0].includes('- [ ]'))) {
                    break;
                }
                noteBody = noteBody.substr(0, match.index) + (subTask.status === 2
                    ? noteBody.substr(match.index).replace('- [ ]', '- [x]')
                    : noteBody.substr(match.index).replace('- [x]', '- [ ]'));
                break;
            }
        }
    }
    if (noteBody !== note.body) {
        console.log('Dida365: note updated due to remote task status changes');
        await joplin.data.put(['notes', noteId], null, {body: noteBody});
    } else {
        console.log('Dida365: note was not updated due to the same status');
    }
}

export async function checkAllNotes() {
    let page = 0;
    let r;
    do {
        page += 1;
        // I don't know how the basic search is implemented, it could be that it runs a regex
        // query on each note under the hood. If that is the case and this behaviour crushed
        // some slow clients, I should consider reverting this back to searching all notes
        // (with the rate limiter)
        r = await joplin.data.get(['search'], { query: list_regex.query,  fields: ['id', 'body', 'title', 'parent_id', 'source_url'], page: page });
        if (r.items) {
            for (let note of r.items) {
                await syncNoteToDida365(note);
            }
        }
        // This is a rate limiter that prevents us from pinning the CPU
        if (r.has_more == 0) {
            // sleep
            await new Promise(res => setTimeout(res, 1000));
        }
    } while(r.has_more);
}
