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
    issn: string;
    volume: string;
    url: string;
    pagination: string;
    journal_abbrev: string;
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

    /**
     * Get all the collections
     */
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

    /**
     * Get all the items in the given collection
     * @param collection_id
     */
    async getItems(collection_id: string) {
        let requestUrl = `https://sync.readcube.com/collections/${collection_id}/items?size=50`;
        let results: PaperItem[] = [];
        while (true) {
            console.log('In the fetching while-loop...');
            const response = await fetch(requestUrl, {headers: {cookie: this.cookie}});
            const resJson = await response.json();
            if (resJson.status === 'ok') {
                for (let item of resJson.items) {
                    results.push(this.parseItemJson(item, collection_id));
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

    /**
     * Get the description for one item
     * @param collection_id
     * @param item_id
     */
    async getItem(collection_id: string, item_id: string) {
        let requestUrl = `https://sync.readcube.com/collections/${collection_id}/items/${item_id}`;
        const response = await fetch(requestUrl, {headers: {cookie: this.cookie}});
        const resJson = await response.json();
        if (resJson.status === 'ok') {
            return this.parseItemJson(resJson.item, collection_id);
        } {
            return null;
        }
    }

    /**
     * Get the user annotations of specific paper item created through ReadCube Papers
     * @param collection_id
     * @param item_id
     */
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

    /**
     * Get all the paper items in the first collections
     */
    async getAllItems() {
        const collections = await this.getCollections();
        return await this.getItems(collections[0].id);
    }

    parseItemJson(itemData, collection_id) {
        const item: PaperItem = {
            title: itemData.article.title,
            from: 'journal' in itemData.article ? itemData.article.journal : 'Unknown',
            authors: 'authors' in itemData.article ? itemData.article.authors : [],
            tags: 'tags' in itemData.user_data ? itemData.user_data.tags : [],
            rating: 'rating' in itemData.user_data ? itemData.user_data.rating : -1,
            abstract: itemData.article.abstract,
            collection_id: collection_id,
            id: itemData.id,
            notes: 'notes' in itemData.user_data ? itemData.user_data.notes : '',
            annotations: [],
            year: 'year' in itemData.article ? itemData.article.year : 'Unknown',
            issn: 'issn' in itemData.article ? itemData.article.year : '',
            volume: 'volume' in itemData.article ? itemData.article.volume : '',
            url: 'url' in itemData.article ? itemData.article.url : '',
            pagination: 'pagination' in itemData.article ? itemData.article.pagination : '',
            journal_abbrev: 'journal_abbrev' in itemData.article ? itemData.article.journal_abbrev : ''
        }
        return item;
    }
}
