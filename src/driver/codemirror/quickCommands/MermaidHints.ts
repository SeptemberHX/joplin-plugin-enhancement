import {Hint} from "./quickCommands";

const MermaidHints: Hint[] = [
    {
        text: '```mermaid\n' +
            'graph\n' +
            '\n' +
            '```',
        displayText: '/flowchart',
        description: 'Mermaid flowchart',
        inline: false
    },
    {
        text: '```mermaid\n' +
            'sequenceDiagram\n' +
            '\n' +
            '```',
        displayText: '/sequenceDiagram',
        description: 'Mermaid sequence diagram',
        inline: false
    },
    {
        text: '```mermaid\n' +
            'gantt\n' +
            '\n' +
            '```',
        displayText: '/gantt',
        description: 'Mermaid gantt diagram',
        inline: false
    },
    {
        text: '```mermaid\n' +
            'classDiagram\n' +
            '\n' +
            '```',
        displayText: '/classDiagram',
        description: 'Mermaid class diagram',
        inline: false
    },
    {
        text: '```mermaid\n' +
            'erDiagram\n' +
            '\n' +
            '```',
        displayText: '/erDiagram',
        description: 'Mermaid entity relationship diagram',
        inline: false
    },
    {
        text: '```mermaid\n' +
            'journey\n' +
            '\n' +
            '```',
        displayText: '/journey',
        description: 'Mermaid journey diagram',
        inline: false
    }
]

export default MermaidHints;
