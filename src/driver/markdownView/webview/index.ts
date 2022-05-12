// import {MarkdownViewEvents} from "../../../common";

export class MarkdownView {

    ready = this.init();
    private async init() {
        // this.view.on('NoteDidUpdate', () => {
        //     console.log('In index noteDidUpdate');
        // });

        document.addEventListener('joplin-noteDidUpdate', async () => {
            console.log('=====> In joplin-noteDidUpdate event');
            // this.emit(MarkdownViewEvents.NoteDidUpdate);
        });

        console.log('===========================================');
    }
}

new MarkdownView();