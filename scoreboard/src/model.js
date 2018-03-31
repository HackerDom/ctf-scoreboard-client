import _ from "underscore";

export class GameModel {
	constructor(info) {
		this.servicesCount = 6;
		this.scoreboard = undefined;
		this.allScoreboards = [];
		this.previousScoreboard = undefined;
		this.max_score = 0;
		this.max_service_score = 0;
		this.max_flags_sum = 0;
		this.colors = ["#86D9E0", "#EB8BD7", "#E9CC76", "#7AA6F3", "#F7AB7C", "#AE86F2"];
		this.initServices(info);
		this.serviceIndex2attacksInRound = this.services.map((s) => 0);
		this.teams = info.teams;
		this.info = info;
		this.preloadLogos();
		this.initAllRoundsSla(info);
	}

	preloadLogos() {
		this.images = [];
		let team_id = 1;
		while (true) {
			let team = this.teams[team_id];
			if(team === undefined)
				break;
			let image = new Image();
			image.src = team.logo;
			this.images.push(image);
			team_id++;
		}
	}

	initAllRoundsSla(info) {
		this.allRoundsSla = {};
		for (const fieldName in info.teams) {
			if (info.teams.hasOwnProperty(fieldName)) {
				const team = info.teams[fieldName];
				let services = {};
				for (let i = 0; i < this.services.length; i++)
					services[this.services[i].id] = [];
				this.allRoundsSla[team.id] = services;
			}
		}
	}

	initServices(info) {
		this.services = [];
		for (const fieldName in info.services) {
			if (info.services.hasOwnProperty(fieldName)) {
				const name = info.services[fieldName];
				this.services.push({
					id: fieldName,
					name: name,
				});
			}
		}
		this.services.sort(function(a, b) {return a.id > b.id;})
	}

	getLogo(team) {
		return this.teams[team.team_id].logo;
	}

	getSlaPeriods(team_id, service_id) {
		if(this.allScoreboards.length < this.allScoreboards[this.allScoreboards.length - 1].round) {
			return [];
		}
		if(this.allRoundsSla[team_id][service_id].length === this.allScoreboards.length) {
			return this.allRoundsSla[team_id][service_id];
		}
		if(this.allRoundsSla[team_id][service_id].length === this.allScoreboards.length - 1)
		{
			const scoreboard = this.allScoreboards[this.allScoreboards.length - 1].scoreboard;
			this.fillAllRoundsSlaForScoreboard(scoreboard);
		} else {
			this.initAllRoundsSla(this.info);
			for (let r = 0; r < this.allScoreboards.length; r++) {
				const scoreboard = this.allScoreboards[r].scoreboard;
				this.fillAllRoundsSlaForScoreboard(scoreboard);
			}
		}
		return this.allRoundsSla[team_id][service_id];
	}

	fillAllRoundsSlaForScoreboard(scoreboard) {
		for(let t=0; t<scoreboard.length; t++)
		{
			const team = scoreboard[t];
			const team_id = team.id === undefined ? team.team_id : team.id;
			for(let s=0; s < team.services.length; s++) {
				const service = team.services[s];
				const isUp = service.status === 101;
				this.allRoundsSla[team_id][s + 1].push(isUp);
			}
		}
	}

	setScoreboard(scoreboard) {
		this.scoreboard = scoreboard;
		this.max_score = parseFloat(this.scoreboard.scoreboard[0].score);
		this.max_service_score = Math.max.apply(null,
			this.scoreboard.scoreboard.map(
				function(t) {
					return Math.max.apply(null, t.services.map(function(s) {return parseFloat(s.fp)}));
				}));
		this.max_flags_sum = Math.max.apply(null,
			this.scoreboard.scoreboard.map(
				function(t) {
					return Math.max.apply(null, t.services.map(function(s) {return parseFloat(s.flags + s.sflags)}));
				}));
		this.setScoreboards([scoreboard]);
	}

	getScoreboard() {
		return this.scoreboard.scoreboard;
	}

	setScoreboards(scoreboards) {
		this.allScoreboards = this.allScoreboards.concat(scoreboards);
		this.allScoreboards = _.uniq(this.allScoreboards, function(item) {return item.round;});
		this.allScoreboards.sort(function(a, b) {return a.round > b.round;});
		if(this.allScoreboards.length > 2 && this.scoreboard !== undefined) {
			this.previousScoreboard = this.allScoreboards[this.allScoreboards.length - 2];
			const previousFlags = this.getAttacksCountInLastRoundForService(this.previousScoreboard.scoreboard);
			const currentFlags = this.getAttacksCountInLastRoundForService(this.scoreboard.scoreboard);
			for (let s=0; s<this.servicesCount; s++)
				this.serviceIndex2attacksInRound[s] = currentFlags[s] - previousFlags[s];
			for(let t=0; t<this.scoreboard.scoreboard.length; t++) {
				this.scoreboard.scoreboard[t].scoreDelta = this.scoreboard.scoreboard[t].score - this.previousScoreboard.scoreboard[t].score;
			}
		}
	}

	getAttacksCountInLastRoundForService(scoreboard) {
		const result = this.services.map((s) => 0);
		for(let t=0; t<scoreboard.length; t++) {
			for(let s=0; s<this.servicesCount; s++) {
				result[s] += scoreboard[t].services[s].flags;
			}
		}
		return result;
	}
}
