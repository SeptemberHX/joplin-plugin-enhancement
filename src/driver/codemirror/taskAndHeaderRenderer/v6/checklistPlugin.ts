
import { requireCodeMirrorLanguage, requireCodeMirrorView } from '../../../../utils/cm-dynamic-require';
import type { Range } from '@codemirror/state';
import { Decoration, DecorationSet, EditorView, ViewUpdate, WidgetType } from '@codemirror/view';

// See https://codemirror.net/examples/decoration/

const checklistPlugin = () => {
    const { ViewPlugin, WidgetType, Decoration  } = requireCodeMirrorView();
    const { syntaxTree } = requireCodeMirrorLanguage();

    const checkboxClassName = 'cm-enhancement-checkbox';

    class CheckboxWidget extends WidgetType {
        public constructor(private checked: boolean) {
            super();
        }

        public override eq(other: WidgetType) {
            return (other instanceof CheckboxWidget) && this.checked === other.checked;
        }

        public override toDOM() {
            const container = document.createElement('span');
            container.setAttribute('aria-hidden', 'true');

            const input = document.createElement('input');
            input.type = 'checkbox';
            input.checked = this.checked;
            input.classList.add(checkboxClassName);

            container.appendChild(input);
            return container;
        }

        public override ignoreEvent(_event: Event) {
            // Allows toggling the checkbox on click.
            return false;    
        }
    }

    const checkboxDecorationChecked = Decoration.replace({
        widget: new CheckboxWidget(true),
    });
    const checkboxDecorationUnchecked = Decoration.replace({
        widget: new CheckboxWidget(false),
    });

    const buildCheckboxDecorations = (view: EditorView) => {
        const decorations: Range<Decoration>[] = [];
        const cursor = view.state.selection.main.from;

        for (const { from, to } of view.visibleRanges) {
            syntaxTree(view.state).iterate({
                from, to,
                enter: node => {
                    if (node.name === 'TaskMarker') {
                        // Generally, task markers are defined like this:
                        // - [x]
                        // CodeMirror doesn't include the "- " part in the TaskMarker syntax tree
                        // node. As such, we increase the concealed size by 2 to include it:
                        const beforeCheckbox = view.state.sliceDoc(node.from - 2, node.from);
                        const from = beforeCheckbox === '- ' ? node.from - 2 : node.from;

                        const containsCursor = cursor >= from && cursor <= node.to;
                        if (!containsCursor) {
                            const checkboxContent = view.state.sliceDoc(node.from, node.to);
                            const isChecked = checkboxContent.toLowerCase().includes('x');
                            const decoration = isChecked ? checkboxDecorationChecked : checkboxDecorationUnchecked;

                            decorations.push(decoration.range(from, node.to));
                        }
                    }
                },
            });
        }
        return Decoration.set(decorations);
    };

    // Toggles the checkbox just before `pos`.
    // `pos` should point to just after the checkbox.
    const toggleChecbox = (view: EditorView, pos: number) => {
        const before = view.state.sliceDoc(pos - 3, pos);
        let newContent = '[x]';
        if (before.toLowerCase() === '[x]') {
            newContent = '[ ]';
        }
        view.dispatch({ changes: { from: pos - 3, to: pos, insert: newContent }});
    };

    return ViewPlugin.fromClass(class {
        public decorations: DecorationSet;

        public constructor(view: EditorView) {
            this.decorations = buildCheckboxDecorations(view);
        }

        public update(update: ViewUpdate) {
            if (update.docChanged || update.viewportChanged || update.selectionSet) {
                this.decorations = buildCheckboxDecorations(update.view);
            }
        }
    }, {
        decorations: plugin => plugin.decorations,
        eventHandlers: {
            mousedown: (event, view) => {
                const target = event.target as HTMLElement;
                if (target.nodeName === 'INPUT' && target.classList.contains(checkboxClassName)) {
                    toggleChecbox(view, view.posAtDOM((target)));
                    return true;
                }
            },
        }
    });
};

export default checklistPlugin;