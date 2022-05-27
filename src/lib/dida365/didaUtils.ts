// code mainly from
//  https://github.com/CalebJohn/joplin-inline-todo/blob/499aa36ec7f281397e345b53227412a9553625b6/src/settings_tables.ts

import joplin from "../../../api";

export const list_regex = {
    title: 'Confluence Style',
    regex: /^\s*- \[[xX ]\]\s.*(?<=\s)(?:[^\n]*)?$/gm,
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
        result = result.split(/- \[[xX ]\]/).join('');

        return result.trim();
    },
    done: (todo: string[]) => {
        const result = todo[0].match(/- \[[xX]\]/);
        return !!result;
    }
}
