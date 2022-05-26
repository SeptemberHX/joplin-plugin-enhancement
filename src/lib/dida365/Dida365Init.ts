import joplin from "../../../api";
import {debounce} from "ts-debounce";
import {convertNoteToTodo, list_regex} from "./didaUtils";

export async function dida365_init() {
    await joplin.workspace.onNoteChange(debounce(async function() {
        const currNote = await joplin.workspace.selectedNote();
        let match;
        let tasks = [];
        let allFinished = true;
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
        }

        await convertNoteToTodo(currNote.id, !allFinished);
    }, 500));
}
