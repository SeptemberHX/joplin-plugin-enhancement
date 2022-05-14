import path = require("path");
var mime = require('mime-types')


export function filePreviewRenderer(markdownIt, _options) {
    const defaultRender = markdownIt.renderer.rules.link_close || function (tokens, idx, options, env, self) {
        return self.renderToken(tokens, idx, options, env, self);
    };

    markdownIt.renderer.rules.link_close = function (tokens, idx, options, env, self) {
        let result = defaultRender(tokens, idx, options, env, self);
        if (tokens.length < 2) {
            return result;
        }

        const token = tokens[0];
        if (token.type !== 'link_open') {
            return result;
        }

        let link_path;
        if (!token.attrs) {
            return result;
        }

        for (let arr of token.attrs) {
            if (arr[0] === 'href') {
                link_path = arr[1];
            }
        }

        if (link_path.startsWith('file:///')) {
            let file_extension = path.extname(link_path).toUpperCase();
            switch (file_extension) {
                case '.PDF':
                    return result + `<object data="${link_path}" class="media-player media-pdf" type="${escape(mime.contentType(file_extension))}"></object>`;
            }
        }
        return result
    };
}