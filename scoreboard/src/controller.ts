import EventEmitter from "event-emitter-es6";
import {GameModel} from "./model";
import {History, Info, ReloadEventName, ScoreboardEvent, StateEventData, StateEventName} from "./types";

export default class Controller extends EventEmitter {
    model: GameModel | null;

    constructor() {
        super({emitDelay: 1});
        this.model = null;

        fetch("//" + (process.env.NODE_ENV === 'production' ? (window.location.hostname + (window.location.port ? ':' + window.location.port : '')) : "127.0.0.1:3000") + "/api/info", {mode: 'cors'})
            .then(response => {
                if (response.ok)
                    return response.json();
                else {
                    console.log("bad response");
                    return response.json();
                }
            }).then((info: Info) => {
            this.model = new GameModel(info);
            this.connectWebSocket();
            this.getAllScoreboards();
        });
    }

    getAllScoreboards() {
        fetch("//" + (process.env.NODE_ENV === 'production' ? (window.location.hostname + (window.location.port ? ':' + window.location.port : '')) : "127.0.0.1:3000") + "/history/scoreboard.json", {mode: 'cors'})
            .then(response => {
                if (response.ok)
                    return response.json();
                else {
                    console.log("bad response");
                    return response.json();
                }
            }).then((allScoreboards: History) => {
            this.model!.setScoreboards(allScoreboards.map((s) => s));
            this.model!.getSlaPeriodsForSomeServiceOfSomeTeam()
            this.emit('history');
        });
    }

    connectWebSocket() {
        let first = true;
        const isHttps = window.location.protocol === "https:";
        const ws = new WebSocket((isHttps ? "wss" : "ws") + "://" + (process.env.NODE_ENV === 'production' ? (window.location.hostname + (window.location.port ? ':' + window.location.port : '')) : "127.0.0.1:3000") + "/api/events");
        ws.onopen = (e) => {
            console.log('WebSocket opened.');
        };
        ws.onmessage = (e) => {
            let event: ScoreboardEvent = JSON.parse(e.data);
            if (event.type === ReloadEventName) {
                setTimeout(function () {
                    window.location.replace(window.location.href);
                })
            }
            if (first && event.type === StateEventName) {
                this.emitSync('start', this.model);
                const state: StateEventData = event.value;
                this.processState(state);
                first = false;
            }
            if (event.type === StateEventName)
                this.processState(event.value);
        };
        ws.onerror = (e) => {
            console.error('WebSocket encountered error. Closing websocket.');
            ws.close();
        };
        ws.onclose = (e) => {
            console.log('WebSocket is closed. Reconnect will be attempted in 1 second.');
            setTimeout(() => {
                this.connectWebSocket();
            }, 1000);
        };
    }

    processState(state: StateEventData) {
        this.model!.setScoreboard(state);
        this.model!.getSlaPeriodsForSomeServiceOfSomeTeam()
        this.emit('updateScoreboard');
    }
}
