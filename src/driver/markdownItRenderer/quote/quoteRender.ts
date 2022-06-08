const regex = /\[color=(.*)\]/;


export function quoteRenderer(markdownIt, _options) {
    const defaultRender = markdownIt.renderer.rules.blockquote_open || function (tokens, idx, options, env, self) {
        return self.renderToken(tokens, idx, options, env, self);
    };

    markdownIt.renderer.rules.blockquote_open = function (tokens, idx, options, env, self) {
        const token = tokens[idx];
        for (let i = idx + 1; i < tokens.length; i++) {
            if (tokens[i].type === 'blockquote_close') {
                break;
            }
            let match = regex.exec(tokens[i].content);
            let finished = false;
            if (match) {
                for (const child of tokens[i].children) {
                    if (child.type !== 'text') {
                        continue;
                    }

                    let realMatch = regex.exec(child.content);
                    if (realMatch) {
                        child.content = child.content.replace(regex, '');
                        if (!token.attrs) {
                            token.attrs = [];
                        }
                        token.attrs.push(['style', `border-color:${realMatch[1]}`]);
                        finished = true;
                        break;
                    }
                }

                if (finished) {
                    break;
                }
            }
        }
        return defaultRender(tokens, idx, options, env, self)
    }
}
