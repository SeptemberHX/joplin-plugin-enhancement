import joplin from "../../../api";

export async function getAllNoteId2Title() {
    let result = {}
    let notes = await joplin.data.get(['notes'], { fields: ['id', 'parent_id', 'title']});
    for (let note of notes.items) {
        result[note.id] = note.title;
    }
    return result;
}
