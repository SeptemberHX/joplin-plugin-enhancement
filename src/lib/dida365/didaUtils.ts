// code mainly from
//  https://github.com/CalebJohn/joplin-inline-todo/blob/499aa36ec7f281397e345b53227412a9553625b6/src/settings_tables.ts

import joplin from "../../../api";

const list_regex = {
    title: 'Confluence Style',
    regex: /^\s*- \[ \]\s.*(?<=\s)(?:(@[^\s]+)|(\/\/[^\s]+)|(\+[^\s]+))(?:[^\n]*)?$/gm,
    query: '/"- [ ]"',
    assignee: (todo: string[]) => {
        const result = todo[0].match(/(?<=\s@)([^\s]+)/);
        return result ? result[0] : '';
    },
    date: (todo: string[]) => {
        const result = todo[0].match(/(?<=\s\/\/)([^\s]+)/);
        return result ? result[0] : '';
    },
    tags: (todo: string[]) => {
        // the /g is important to get multiple results instead of a single match
        const result = todo[0].match(/(?<=\s\+)[^\s]+/g);
        return result ? result : [];
    },
    msg: (todo: string[]) => {
        let result = todo[0].split(/\s@[^\s]+/).join('');
        result = result.split(/\s\/\/[^\s]+/).join('');
        result = result.split(/\s\+[^\s]+/).join('');
        result = result.split(/- \[ \]/).join('');

        return result.trim();
    }
}


class SummaryBuilder {
    _summary = {};
    // Maps folder ids to folder name
    // Record<id, name>
    _folders: Record<string, string> = {};
    // Don't overwrite the summary note unless all notes have been checked
    _initialized: boolean = false;

    constructor () {}

    async search_in_note(note): Promise<boolean> {
        // Conflict notes are duplicates usually
        if (note.is_conflict) { return; }
        let matches = [];
        // This introduces a small risk of a race condition
        // (If this is waiting, the note.body could become stale, but this function would
        // continue anyways and update the summary with stale data)
        // I don't think this will be an issue in practice, and if it does crop up
        // there won't be any data loss
        let folder = await this.get_parent_title(note.parent_id);
        let match;
        while ((match = list_regex.regex.exec(note.body)) !== null) {
            matches.push({
                note: note.id,
                note_title: note.title,
                parent_id: note.parent_id,
                parent_title: folder,
                msg: list_regex.msg(match),
                assignee: list_regex.assignee(match),
                date: list_regex.date(match),
                tags: list_regex.tags(match),
            });
        }

        if (matches.length > 0 || this._summary[note.id]?.length > 0) {
            // Check if the matches actually changed
            const dirty = JSON.stringify(this._summary[note.id]) != JSON.stringify(matches);

            this._summary[note.id] = matches;

            return dirty;
        }

        return false;
    }

    // This function scans all notes, but it's rate limited to it from crushing Joplin
    async search_in_all() {
        this._summary = {};
        let todos = {};
        let page = 0;
        let r;
        do {
            page += 1;
            // I don't know how the basic search is implemented, it could be that it runs a regex
            // query on each note under the hood. If that is the case and this behaviour crushed
            // some slow clients, I should consider reverting this back to searching all notes
            // (with the rate limiter)
            r = await joplin.data.get(['search'], { query: list_regex.query,  fields: ['id', 'body', 'title', 'parent_id', 'is_conflict'], page: page });
            if (r.items) {
                for (let note of r.items) {
                    await this.search_in_note(note);
                }
            }
            // This is a rate limiter that prevents us from pinning the CPU
            if (r.has_more == 0) {
                // sleep
                await new Promise(res => setTimeout(res, 1000));
            }
        } while(r.has_more);

        this._initialized = true;
    }

    // Reads a parent title from cache, or uses the joplin api to get a title based on id
    async get_parent_title(id: string): Promise<string> {
        if (!(id in this._folders)) {
            let f = await joplin.data.get(['folders', id], { fields: ['title'] });
            this._folders[id] = f.title;
        }

        return this._folders[id];
    }
}

export const summaryBuilder = new SummaryBuilder();
