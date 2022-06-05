import {Hint} from "./quickCommands";

const MermaidHints: Hint[] = [
    {
        text: '```mermaid\n' +
            'graph\n' +
            '\n' +
            '```',
        displayText: '/flowchart',
        description: 'mermaid flowchart',
        inline: false
    },
    {
        text: '```mermaid\n' +
            'sequenceDiagram\n' +
            '\n' +
            '```',
        displayText: '/sequenceDiagram',
        description: 'mermaid sequence diagram',
        inline: false
    },
    {
        text: '```mermaid\n' +
            'gantt\n' +
            '\n' +
            '```',
        displayText: '/gantt',
        description: 'mermaid gantt diagram',
        inline: false
    },
    {
        text: '```mermaid\n' +
            'classDiagram\n' +
            '\n' +
            '```',
        displayText: '/classDiagram',
        description: 'mermaid class diagram',
        inline: false
    },
    {
        text: '```mermaid\n' +
            'erDiagram\n' +
            '\n' +
            '```',
        displayText: '/erDiagram',
        description: 'mermaid entity relationship diagram',
        inline: false
    },
    {
        text: '```mermaid\n' +
            'journey\n' +
            '\n' +
            '```',
        displayText: '/journey',
        description: 'mermaid journey diagram',
        inline: false
    }
]

export default MermaidHints;
