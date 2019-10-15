import EventEmitter from "event-emitter-es6";
import {GameModel} from "./model";

export default class Controller extends EventEmitter {
	constructor() {
		super({emitDelay: 1});
		this.model = null;

		this.on('calcFlagStat', () => {
			this.model.updateFlagsStat();
			this.emit('flagStat');
		});

		fetch("//" + (process.env.NODE_ENV === 'production' ? (window.location.hostname + (window.location.port ? ':' + window.location.port : '' )) : "127.0.0.1:3000") + "/api/info", {mode: 'cors'})
			.then(response => {
				if (response.ok)
					return response.json();
				else {
					console.log("bad response");
					return response.json();
				}
			}).then(info => {
				this.model = new GameModel(info);
				this.connectWebSocket();
				this.getAllScoreboards();
			});
	}

	getAllScoreboards() {
		fetch("//" + (process.env.NODE_ENV === 'production' ? (window.location.hostname + (window.location.port ? ':' + window.location.port : '' )) : "127.0.0.1:3000") + "/history/scoreboard.json", {mode: 'cors'})
			.then(response => {
				if (response.ok)
					return response.json();
				else {
					console.log("bad response");
					return response.json();
				}
			}).then(allScoreboards => {
				this.model.setScoreboards(allScoreboards.map((s) => s));
				this.model.getSlaPeriods(1, 1);
				this.emit('history');
		});
	}

	connectWebSocket() {
		let first = true;
		const isHttps = window.location.protocol === "https:";
		const ws = new WebSocket((isHttps ? "wss": "ws") + "://" + (process.env.NODE_ENV === 'production' ? (window.location.hostname + (window.location.port ? ':' + window.location.port : '' )) : "127.0.0.1:3000") + "/api/events");
		ws.onopen = (e) => {
			console.log('WebSocket opened.');
		};
		ws.onmessage = (e) => {
			let event = JSON.parse(e.data);
			if(event.type === "reload") {
				setTimeout(function() {
					window.location.reload(true);
				}, event.value)
			}
			if(first && event.type === "state") {
				this.emitSync('start', this.model);
				this.processState(event.value);
				first = false;
			}
			if (event.type === "state")
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

	processState(state) {
		this.model.setScoreboard(state);
		this.model.getSlaPeriods(1, 1);
		this.emit('updateScoreboard');
	}
}
