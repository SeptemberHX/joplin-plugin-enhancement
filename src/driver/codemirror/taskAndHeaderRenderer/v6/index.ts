import checklistPlugin from './checklistPlugin';

const taskAndHeaderRenderer = () => {
    return [
        checklistPlugin(),
    ];
};

export default taskAndHeaderRenderer;