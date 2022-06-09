const colorRegex = /\[color=(.*?)\]/;
const nameRegex = /\[name=(.*?)\]/;
const dateRegex = /\[date=(.*?)\]/;


export function quoteRenderer(markdownIt, _options) {
    const defaultRender = markdownIt.renderer.rules.blockquote_open || function (tokens, idx, options, env, self) {
        return self.renderToken(tokens, idx, options, env, self);
    };

    markdownIt.renderer.rules.blockquote_open = function (tokens, idx, options, env, self) {
        const token = tokens[idx];
        let name = null, date = null;
        for (let i = idx + 1; i < tokens.length; i++) {
            if (tokens[i].type === 'blockquote_close') {
                break;
            }

            const colorMatch = colorRegex.exec(tokens[i].content);
            const nameMatch = nameRegex.exec(tokens[i].content);
            const dateMatch = dateRegex.exec(tokens[i].content);

            if (colorMatch || nameMatch || dateMatch) {
                for (const child of tokens[i].children) {
                    if (child.type !== 'text') {
                        continue;
                    }

                    console.log(child.content);
                    let realColorMatch = colorRegex.exec(child.content);
                    if (realColorMatch) {
                        child.content = child.content.replace(colorRegex, '');
                        if (!token.attrs) {
                            token.attrs = [];
                        }
                        token.attrs.push(['style', `border-color:${realColorMatch[1]}`]);
                    }

                    let realNameMatch = nameRegex.exec(child.content);
                    if (realNameMatch) {
                        child.content = child.content.replace(nameRegex, '');
                        name = realNameMatch[1];
                    }

                    let realDateMatch = dateRegex.exec(child.content);
                    if (realDateMatch) {
                        child.content = child.content.replace(dateRegex, '');
                        date = realDateMatch[1];
                    }
                }
            }
        }

        let result = defaultRender(tokens, idx, options, env, self);
        let appendix = '';
        if (name) {
            appendix += `<span class="blockquote-name blockquote-enhancement"><i class="fas fa-user"></i>${name}</span>`;
        }
        if (date) {
            appendix += `<span class="blockquote-date blockquote-enhancement"><i class="fas fa-clock-o"></i>${date}</span>`;
        }

        if (appendix.length > 0) {
            result += `<small class="blockquote-enhancement-wrap">${appendix}</small>`;
        }

        return result;
    }
}
