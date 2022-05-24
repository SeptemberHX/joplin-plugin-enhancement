import fetch from 'node-fetch';
import WebSocket from 'ws';
import ReconnectingWebSocket from "reconnecting-websocket";
import { Dida365 } from "./Dida365Lib";


const options = {
    WebSocket: WebSocket, // custom WebSocket constructor
    connectionTimeout: 30000,
    maxReconnectInterval: 5000
};


export class Dida365WS {
    ws: ReconnectingWebSocket;
    clientId: null;
    lastReceivedMessageDate: Date;

    constructor() {
        this.ws = new ReconnectingWebSocket('wss://wss.dida365.com/web', [], options);
        this.ws.onmessage = this.onMessage.bind(this);
        this.ws.onopen = this.onOpen.bind(this);
        this.ws.onclose = this.onClose.bind(this);
        this.ws.onerror = this.onError.bind(this);
    }

    async onOpen(event) {
        await Dida365.init();
    }

    async onMessage(event) {
        if (event.data.length === 60 && event.data[16] === '-' && event.data[25] === '-' && event.data[34] === '-' && event.data[51] === '-') {
            console.log('Dida365WebSocket: pushToken =', event.data);
            await Dida365.pushRegister(event.data);
        } else {
            console.log(event.data);
        }
    }

    onClose(event): void {
        console.log('Dida365WebSocket: Connection Closed.');
    }

    onError(): void {
        console.log('Dida365WebSocket: Error happened');
    }
}

const dws = new Dida365WS();
