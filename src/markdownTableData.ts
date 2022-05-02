// implemented by takumisoft68 at https://github.com/takumisoft68/vscode-markdown-table/blob/master/src/markdownTableData.ts

export default class MarkdownTableData {
    public readonly originalText: string;
    public readonly aligns: [string, string][];
    public readonly columns: string[];
    public readonly cells: string[][];
    public readonly leftovers: string[];
    public readonly indent: string;

    constructor(_text: string, _aligns: [string, string][], _columns: string[], _cells: string[][], _leftovers: string[], _indent: string) {
        this.originalText = _text;
        this.aligns = _aligns;
        this.columns = _columns;
        this.cells = _cells;
        this.leftovers = _leftovers;
        this.indent = _indent;
    }
};