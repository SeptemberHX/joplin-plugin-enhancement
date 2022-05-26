import fetch from 'node-fetch';
import WebSocket from 'ws';
import ReconnectingWebSocket from "reconnecting-websocket";
import {Dida365, DidaTask} from "./Dida365Lib";
import {syncStatusFromDidaToNote} from "./Dida365Init";


const options = {
    WebSocket: WebSocket, // custom WebSocket constructor
    connectionTimeout: 30000,
    maxReconnectInterval: 5000
};

class Dida365TaskCache {
    tasks: {};

    constructor() {
        this.clear();
    }

    clear() {
        this.tasks = {};
    }

    update(didaTask: DidaTask) {
        if (didaTask.id) {
            this.tasks[didaTask.id] = didaTask;
        }
    }

    updateBatch(didaTasks: DidaTask[]) {
        for (const task of didaTasks) {
            this.update(task);
        }
    }

    delete(didaTaskId) {
        delete this.tasks[didaTaskId];
    }

    get(didaTaskId) {
        return this.tasks[didaTaskId];
    }
}


export class Dida365WS {
    ws: ReconnectingWebSocket;
    clientId: null;
    lastReceivedMessageDate: Date;
    dida365HBInterval;

    constructor() {
        this.ws = new ReconnectingWebSocket('wss://wss.dida365.com/web', [], options);
        this.ws.onmessage = this.onMessage.bind(this);
        this.ws.onopen = this.onOpen.bind(this);
        this.ws.onclose = this.onClose.bind(this);
        this.ws.onerror = this.onError.bind(this);
    }

    async onOpen(event) {
        await Dida365.init();

        this.dida365HBInterval = setInterval((() => {
            this.sendHeartbeat();
        }).bind(this), 300000);  // 5 min

        dida365Cache.updateBatch(await Dida365.batchCheckUpdate());  // first batch request with checkpoint 0
    }

    sendHeartbeat(): void {
        console.log('Dida365WebSocket: sent heartbeat message...');
        this.ws.send(`hello`);
    }

    async onMessage(event) {
        if (event.data.length === 60 && event.data[16] === '-' && event.data[25] === '-' && event.data[34] === '-' && event.data[51] === '-') {
            console.log('Dida365WebSocket: pushToken =', event.data);
            await Dida365.pushRegister(event.data);
        } else {
            console.log('Dida365WebSocket:', event.data);
            const dataJson = JSON.parse(event.data);

            switch (dataJson.type) {
                case 'needSync':
                    console.log('Dida365WebSocket: sync the remote task changes...');
                    const updatedTasks = await Dida365.batchCheckUpdate();
                    dida365Cache.updateBatch(updatedTasks);
                    for (const task of updatedTasks) {
                        await syncStatusFromDidaToNote(task);
                    }
                    console.log('Dida365WebSocket: sync the remote task changes finished');
                    break;
                default:
                    break;
            }
        }
    }

    onClose(event): void {
        console.log('Dida365WebSocket: Connection Closed.');
        if (this.dida365HBInterval) {
            clearInterval(this.dida365HBInterval);
        }
    }

    onError(): void {
        console.log('Dida365WebSocket: Error happened');
    }
}

export let dida365Cache = new Dida365TaskCache();
