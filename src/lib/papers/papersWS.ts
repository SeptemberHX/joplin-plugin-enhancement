// websocket for papers
import fetch from 'node-fetch';
import WebSocket from 'ws';
import ReconnectingWebSocket from "reconnecting-websocket";
import joplin from "../../../api";
import {PAPERS_COOKIE} from "../../common";
import { PapersLib } from "./papersLib";
import {createRecord, deleteRecord, getRecord, removeInvalidSourceUrlByItemId, updateRecord} from "./papersDB";
import {syncAllPaperItems} from "./papersUtils";

const options = {
    WebSocket: WebSocket, // custom WebSocket constructor
    connectionTimeout: 30000,
    maxReconnectInterval: 5000
};


export class PapersWS {
    ws: ReconnectingWebSocket;
    clientId: null;
    lastReceivedMessageDate: Date;
    currMessageId: 1;
    papers: typeof PapersLib;

    constructor() {
        this.ws = new ReconnectingWebSocket('wss://push.readcube.com/bayeux', [], options);
        this.ws.onopen = this.onOpen.bind(this);
        this.ws.onmessage = this.onMessage.bind(this);
        this.ws.onclose = this.onClose.bind(this);
        this.ws.onerror = this.onError.bind(this);
        this.currMessageId = 1;
    }

    sendHeartbeat(): void {
        console.log('PapersWebSocket: sent heartbeat message...');
        this.ws.send(`[{"channel":"/meta/connect","clientId":"${this.clientId}","connectionType":"websocket","id":"${this.getNextMessageId()}"}]`);
    }

    getNextMessageId(): string {
        this.currMessageId += 1;
        return this.currMessageId.toString(36);
    }

    /**
     * Not sure why we need to repeat the subscription. Just do the same as observed in the webapp.
     * @param collectionId
     */
    sendSubscribe(collectionId): void {
        this.ws.send(`[{"channel":"/meta/subscribe","clientId":"${this.clientId}","subscription":"/production/users/${collectionId}","id":"${this.getNextMessageId()}"}]`);
        this.ws.send(`[{"channel":"/meta/subscribe","clientId":"${this.clientId}","subscription":"/production/collections/${collectionId}/changes","id":"${this.getNextMessageId()}"}]`);
        this.ws.send(`[{"channel":"/meta/subscribe","clientId":"${this.clientId}","subscription":"/production/collections/${collectionId}/changes","id":"${this.getNextMessageId()}"}]`);
        this.ws.send(`[{"channel":"/meta/subscribe","clientId":"${this.clientId}","subscription":"/production/users/${collectionId}","id":"${this.getNextMessageId()}"}]`);
        this.ws.send(`[{"channel":"/meta/subscribe","clientId":"${this.clientId}","subscription":"/production/users/${collectionId}","id":"${this.getNextMessageId()}"}]`);
    }

    async onOpen() {
        const papersCookie = await joplin.settings.value(PAPERS_COOKIE);
        if (papersCookie.length === 0) {
            alert('Empty cookie for Papers. Please set it in the preferences.');
            return;
        }

        this.papers = PapersLib;
        this.lastReceivedMessageDate = null;

        let requestUrl = `https://push.readcube.com/bayeux?message=[{"channel":"/meta/handshake","version":"1.0","supportedConnectionTypes":["websocket","eventsource","long-polling","cross-origin-long-polling","callback-polling"],"id":"1"}]&jsonp=__jsonp1__`;
        const response = await fetch(requestUrl, {headers: {cookie: papersCookie}});
        const responseBody = await response.text();
        if (responseBody.length > 15) {
            const responseJson = JSON.parse(responseBody.substr(15, responseBody.length - 1 - 15));
            if (responseJson.length > 0) {
                this.clientId = responseJson[0].clientId;
                console.log('PapersWebSocket: clientId = ', this.clientId);
                this.sendHeartbeat();
                this.sendSubscribe(PapersLib.defaultCollectionId);
            }
        }

        // Make sure we can reconnect when something wrong happen to the network.
        setInterval(function () {
            if (this.lastReceivedMessageDate) {
                const nowDate = new Date();
                if (nowDate.getTime() - this.lastReceivedMessageDate.getTime() > 30000) {
                    console.log('PapersWebSocket: No message received in the last 30s. Try to reconnect');
                    this.ws.close();
                    this.lastReceivedMessageDate = null;
                    this.ws.reconnect();
                }
            }
        }.bind(this), 1000);

        // once connect to the server successfully, update the database immediately.
        await syncAllPaperItems();
    }

    async onMessage(event: any) {
        this.lastReceivedMessageDate = new Date();
        const messages = JSON.parse(event.data);
        if (messages[0].successful && messages[0].channel === '/meta/connect') {
            this.sendHeartbeat();
            return;
        }

        console.log('PapersWebSocket: Receive ', event.data);
        let changeItemIds = [];
        let removedItemIds = [];
        for (let message of messages) {
            if (message.channel.startsWith('/production/collections')) {  // collection change
                for (let change of message.data.changes) {
                    // ignore other type changes
                    if (change.type !== 'item') {
                        continue;
                    }

                    if (change.action === 'created' || change.action === 'updated') {  // new paper is created or updated
                        changeItemIds.push(change.id);
                    } else if (change.action === 'deleted') {  // paper is deleted
                        removedItemIds.push(change.id);
                    }
                }
            }
        }
        await this.refreshItems(changeItemIds);
        await this.deleteItems(removedItemIds);
    }

    onClose(event): void {
        console.log('PapersWebSocket: Connection Closed.');
    }

    onError(): void {
        console.log('PapersWebSocket: Error happened');
    }

    async refreshItems(itemIds: string[]) {
        if (this.papers) {
            try {
                for (let itemId of itemIds) {
                    const item = await this.papers.getItem(PapersLib.defaultCollectionId, itemId);
                    console.log(`PapersWebSocket: Update item ${item.id}|${item.title}`);
                    if (await getRecord(itemId)) {
                        await updateRecord(item.id, item);
                    } else {
                        await createRecord(item.id, item);
                    }
                }
            } catch (err) {
                console.log(err);
            }
        }
    }

    async deleteItems(itemIds: string[]) {
        for (let itemId of itemIds) {
            console.log(`PapersWebSocket: Delete item ${itemId}`);
            await deleteRecord(itemId);
            await removeInvalidSourceUrlByItemId(itemId);
        }
    }
}
