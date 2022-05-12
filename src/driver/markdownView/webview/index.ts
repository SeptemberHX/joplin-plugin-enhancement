import {AUTO_NOTE_LINK_PLUGIN_ID, MarkdownViewEvents, QueryAllNoteId2TitleRequest} from "../../../common";
import Dict = NodeJS.Dict;

declare const webviewApi: {
    postMessage: (
        id: string,
        payload: QueryAllNoteId2TitleRequest,
    ) => Promise<Dict<string>>;
};

export class MarkdownView {

    ready = this.init();
    private async init() {
        // this.view.on('NoteDidUpdate', () => {
        //     console.log('In index noteDidUpdate');
        // });

        document.addEventListener('joplin-noteDidUpdate', async () => {
            console.log('=====> In joplin-noteDidUpdate event');
            // this.emit(MarkdownViewEvents.NoteDidUpdate);
            const currentNoteId2Title = await webviewApi.postMessage(AUTO_NOTE_LINK_PLUGIN_ID, {
                event: 'queryAllNoteId2Title'
            });

            console.log(currentNoteId2Title);
            let titles = [];
            let title2Id = {}
            for (let noteId in currentNoteId2Title) {
                titles.push(currentNoteId2Title[noteId]);
                title2Id[noteId] = currentNoteId2Title[noteId];
            }
            let regStr = titles.join('|');
            let reg = new RegExp(`(${regStr})`, 'g');
            console.log(reg);
            // document.body.innerHTML = document.body.innerHTML.replace(reg, (text) => {
            //     if (text in title2Id) {
            //         return `[${text}](:/${title2Id[text]})`;
            //     } else {
            //         return text;
            //     }
            // });

            // document.body.innerHTML = document.body.innerHTML.replace('测试一下', '不要测试');
            // console.log(document.body.innerText);
            // console.log(document.body.innerHTML);
        });
    }
}

new MarkdownView();