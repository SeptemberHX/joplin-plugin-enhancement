export function paperFenceRenderer(markdownIt, _options) {
    const defaultRender = markdownIt.renderer.rules.fence || function (tokens, idx, options, env, self) {
        return self.renderToken(tokens, idx, options, env, self);
    };

    markdownIt.renderer.rules.fence = function (tokens, idx, options, env, self) {
        // console.log(tokens, idx);
        const token = tokens[idx];
        if (token.info !== 'papers') {
            return defaultRender(tokens, idx, options, env, self);
        }

        let title = '', authors = '', from = '', tags = '', rating = '-1', abstract = '', collection_id = '', item_id = '';
        for (let line of token.content.split('\n')) {
            const parts = line.split(/\s/);
            if (parts.length > 2 && parts[0] === '*') {
                switch (parts[1].toUpperCase()) {
                    case 'TITLE:':
                        title = parts.slice(3).join(' ');
                        break;
                    case 'AUTHORS:':
                        authors = parts.slice(3).join(' ');
                        break;
                    case 'FROM:':
                        from = parts.slice(3).join(' ');
                        break;
                    case 'RATING:':
                        rating = parts.slice(3).join(' ');
                        break;
                    case 'TAGS':
                        tags = parts.slice(3).join(' ');
                        break;
                    case 'ABSTRACT:':
                        abstract = parts.slice(3).join(' ');
                        break;
                    case 'ID:':
                        item_id = parts.slice(3).join(' ');
                        break;
                    case 'COLLECTION_ID:':
                        collection_id = parts.slice(3).join(' ');
                        break;
                    default:
                        break;
                }
            }
        }
        let result = generateBodyForPaperFence(title, authors, from, tags, rating, abstract, collection_id, item_id);
        return result
    }
}

function generateBodyForPaperFence(title: string, authors: string, from: string, tags: string,
                                   rating: string, abstract: string, collection_id: string, item_id: string) {
    let stars = '☆☆☆☆☆';
    switch (rating) {
        case "1":
            stars = '★☆☆☆☆';
            break;
        case "2":
            stars = '★★☆☆☆';
            break;
        case "3":
            stars = '★★★☆☆';
            break;
        case "4":
            stars = '★★★★☆';
            break;
        case "5":
            stars = '★★★★★';
            break;
        default:
            break;
    }

    return `<table class="paper_tg">
<thead>
  <tr>
    <th class="paper_tg_title" colspan="3"><a href="https://www.readcube.com/library/${collection_id}:${item_id}">${title}</a></th>
  </tr>
</thead>
<tbody>
  <tr>
    <td class="paper_tg_authors" colspan="3">${authors}</td>
  </tr>
  <tr>
    <td class="paper_tg_from">${from}</td>
    <td class="paper_tg_tags">${tags.length > 0 ? tags : 'No tags'}</td>
    <td class="paper_tg_stars">${stars}</td>
  </tr>
  <tr>
    <td class="paper_tg_abstract" colspan="3">${abstract}</td>
  </tr>
</tbody>
</table>`
}
