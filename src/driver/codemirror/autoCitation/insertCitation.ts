export default class InsertCitation {
    constructor(private readonly editor) {}
    private readonly doc = this.editor.getDoc();

    insertItems(options) {
        const itemCitations: string[] = options[0];
        const itemRefNames: string[] = options[1];
        const selections = this.doc.listSelections();
        if (!selections || selections.length == 0) {
            return;
        }
        const currSelection = selections[0];

        let appendRefsText = '';
        let insertRefNames = [];
        let text = this.doc.getValue();
        for (const index in itemCitations) {
            const refText = `[^${itemRefNames[index]}]: ${itemCitations[index]}`;
            if (text.indexOf(refText) < 0) {
                appendRefsText += refText + '\n';
            }
            insertRefNames.push(`[^${itemRefNames[index]}]`);
        }

        if (appendRefsText.length > 0) {
            if (text[text.length - 1] != '\n') {
                text += '\n\n\n';
            }
            text += appendRefsText;
        }

        this.doc.setValue(text);
        this.doc.replaceRange(insertRefNames.join(''), currSelection.to());
        this.doc.setSelection(currSelection);
    }
}
