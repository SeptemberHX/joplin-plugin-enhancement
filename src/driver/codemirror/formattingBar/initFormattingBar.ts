import { ContentScriptContext } from "api/types";
import v6FormattingBar from "./v6/formattingBar"
import v5FormattingBar from "./v5/formattingBar";

const initFormattingBar = (context: ContentScriptContext, cm: any) => {
    if (cm.cm6) {
        cm.addExtension(v6FormattingBar(context));
    } else {
        v5FormattingBar(context, cm);
    }
};

export default initFormattingBar;