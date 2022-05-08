import fetch from 'node-fetch';

/**
 * API utils for Readcube PapersLib. All the apis are analyzed from the web application.
 */


type PaperItem = {
    title: string;
    from: string;
    authors: string[];
    tags: string[];
    rating: number;
    abstract: string;
    collection_id: string;
    year: number;
    id: string;
    notes: string;
    annotations: [];
}

type CollectionItem = {
    id: string;
}

type AnnotationItem = {
    id: string;
    type: string;
    text: string;
    note: string;
    color_id: number;
}


export default class PapersLib {
    constructor(private readonly cookie) {
    }

    async getCollections() {
        const response = await fetch(`https://sync.readcube.com/collections/`,
            { headers: {cookie: this.cookie }}
        );
        let results: CollectionItem[] = [];
        const resJson = await response.json();
        if (resJson && resJson.status === 'ok') {
            for (let item of resJson.collections) {
                results.push({id: item.id});
            }
        }
        return results;
    }

    async getItems(collection_id: string) {
        let requestUrl = `https://sync.readcube.com/collections/${collection_id}/items?size=50`;
        let results: PaperItem[] = [];
        while (true) {
            console.log('In the fetching while-loop...');
            const response = await fetch(requestUrl, {headers: {cookie: this.cookie}});
            const resJson = await response.json();
            if (resJson.status === 'ok') {
                for (let item of resJson.items) {
                    // const annoRes = await fetch(`https://sync.readcube.com/collections/${collection_id}/items/${item.id}/annotations`, {headers: {cookie: this.cookie}});
                    results.push({
                        title: item.article.title,
                        from: 'journal' in item.article ? item.article.journal : 'Unknown',
                        authors: 'authors' in item.article ? item.article.authors : [],
                        tags: 'tags' in item.user_data ? item.user_data.tags : [],
                        rating: 'rating' in item.user_data ? item.user_data.rating : -1,
                        abstract: item.article.abstract,
                        collection_id: collection_id,
                        id: item.id,
                        notes: 'notes' in item.user_data ? item.user_data.notes : '',
                        annotations: [],
                        year: 'year' in item.article ? item.article.year : 'Unknown'
                    });
                }
                console.log(results.length, '/', resJson.total);
                if (resJson.items.length != 0) {
                    requestUrl = `https://sync.readcube.com/collections/${collection_id}/items?sort%5B%5D=title,asc&size=50&scroll_id=${resJson.scroll_id}`;
                } else {
                    break;
                }
            } else {
                break;
            }
        }
        return results;
    }

    async getAnnotation(collection_id, item_id) {
        let requestUrl = `https://sync.readcube.com/collections/${collection_id}/items/${item_id}/annotations`;
        let results: AnnotationItem[] = [];
        const response = await fetch(requestUrl, { headers: { cookie: this.cookie} });
        const resJson = await response.json();
        if (resJson.status === 'ok') {
            for (let anno of resJson.annotations) {
                results.push({
                    id: anno.id,
                    type: anno.type,
                    text: anno.text,
                    note: anno.note,
                    color_id: anno.color_id
                });
            }
        }
        return results;
    }

    async getAllItems() {
        const collections = await this.getCollections();
        return await this.getItems(collections[0].id);
    }
}
