// websocket for papers
import fetch from 'node-fetch';
import WebSocket from 'ws';
import ReconnectingWebSocket from "reconnecting-websocket";
// import {refreshItems} from "../../driver/papers/papersUtils";
// import joplin from "../../../api";
// import {PAPERS_COOKIE} from "../../common";
// import PapersLib from "./papersLib";

const papersCookie = ``;
const collectionId = `0a55aaeb-5cc6-466b-b5e9-61df735b17f3`;
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
        // const papersCookie = await joplin.settings.value(PAPERS_COOKIE);
        // if (papersCookie.length === 0) {
        //     alert('Empty cookie for Papers. Please set it in the preferences.');
        //     return;
        // }
        //
        // const papers = new PapersLib(papersCookie);
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
                this.sendSubscribe(collectionId);
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
        }, 1000);
    }

    async onMessage(event: any) {
        this.lastReceivedMessageDate = new Date();
        console.log('PapersWebSocket: Receive ', event.data);
        const message = JSON.parse(event.data);
        if (message[0].successful && message[0].channel === '/meta/connect') {
            this.sendHeartbeat();
        }

        let changeItemIds = [];
        if (message[0].channel.startsWith('/production/collections')) {
            for (let change of message[0].data.changes) {
                changeItemIds.push(change.id);
            }
        }
        // await refreshItems(changeItemIds);
    }

    onClose(event): void {
        console.log('PapersWebSocket: Connection Closed.');
    }

    onError(): void {
        console.log('PapersWebSocket: Error happened');
    }
}

new PapersWS();
