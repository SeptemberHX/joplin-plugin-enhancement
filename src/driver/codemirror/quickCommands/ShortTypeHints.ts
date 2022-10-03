import { Hint } from "./quickCommands";

const ShortTypeHints: Hint[] = [
    {
        text: '- [ ] ',
        displayText: '/task',
        description: 'Checkbox',
        inline: true
    },
    {
        text: '``',
        displayText: '/inline',
        description: 'Inline Code',
        inline: true
    },
    {
        text: '```\n' +
            '\n' +
            '```',
        displayText: '/code',
        description: 'Codeblock',
        inline: false
    }
]

export default ShortTypeHints;
