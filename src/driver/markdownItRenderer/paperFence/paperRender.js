function generateBodyForPaperFence(title, authors, from, tags, rating, abstract, collection_id, item_id,
                                   year, page, volume) {
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
    <th class="paper_tg_title" colspan="4"><a href="https://www.readcube.com/library/${collection_id}:${item_id}">${title}</a></th>
  </tr>
</thead>
<tbody>
  <tr>
    <td class="paper_tg_authors" colspan="4">${authors}</td>
  </tr>
  <tr>
    <td class="paper_tg_from"><i>${from}</i></td>
    <td class="paper_tg_year">${year}</td>
    <td class="paper_tg_tags">${tags.length > 0 ? tags : 'No tags'}</td>
    <td class="paper_tg_stars">${stars}</td>
  </tr>
  <tr>
    <td class="paper_tg_abstract" colspan="4">${abstract}</td>
  </tr>
</tbody>
</table>`
}

document.addEventListener('joplin-noteDidUpdate', () => {
    webviewApi.postMessage("enhancement_paper_fence_renderer").then(item => {
        console.log(item);
        if (item) {
            const html = generateBodyForPaperFence(item.title, item.authors, item.journal, item.tags, item.rating,
                item.abstract, item.collection_id, item.id, item.year, item.page, item.volume);
            let paperDetailDiv = document.createElement("div");
            paperDetailDiv.id = 'div_paper_detail';
            paperDetailDiv.innerHTML = html;
            document.getElementById('joplin-container-content').appendChild(paperDetailDiv);
        }
    });
});