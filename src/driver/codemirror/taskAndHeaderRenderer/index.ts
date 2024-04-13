
import { taskAndHeaderRender as v5TaskAndHeaderRenderer } from './v5';
import v6TaskAndHeaderRenderer from './v6';

const taskAndHeaderRenderer = (cm: any) => {
    if (cm.cm6) {
        cm.addExtension(v6TaskAndHeaderRenderer());
    } else {
        v5TaskAndHeaderRenderer(cm);
    }
};

export default taskAndHeaderRenderer;