import _ from "underscore";

export class GameModel {
	constructor(info) {
		this.scoreboard = undefined;
		this.allScoreboards = [];
		this.previousScoreboard = undefined;
		this.max_score = 0;
		this.max_service_score = 0;
		this.max_flags_sum = 0;
		this.max_flags_allservices_sum = 0;
		this.initServices(info);
		this.colors = [
			"#BFD686", "#86D9E0", "#7AA6F3", "#E9CC76", "#AE86F2", "#EB8BD7", "#F7AB7C",
			"#D686BF", "#D9E086", "#A6F37A", "#CC76E9", "#86F2AE", "#8BD7EB", "#AB7CF7",
			"#86BFD6", "#E086D9", "#F37AA6", "#76E9CC", "#F2AE86", "#D7EB8B", "#7CF7AB",
		];
		this.fillClasses = ["c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8", "c9", "c10", "c11", "c12", "c13", "c14", "c15", "c16", "c17", "c18", "c19", "c20" ];
		if(this.servicesCount < 7)
		{
			this.colors.shift();
			this.fillClasses.shift();
		}
		this.serviceIndex2attacksInRound = this.services.map((s) => 0);
		this.teams = info.teams;
		this.info = info;
		this.preloadLogos();
		this.initAllRoundsSla(info);
		this.one_service_width = 160;
		this.team_width = 480;
		this.roundsCount = info.roundsCount;
		if(this.roundsCount === undefined)
			this.roundsCount = 1260; // TODO: set actual rounds count
		this.roundsPerGraphColumn = 20;
		this.roundsPerGraphBorder = 60;
		if(this.roundsCount > 600) {
			this.roundsPerGraphColumn *= 2;
			this.roundsPerGraphBorder *= 2;
		}
		this.selectedTeam = null;
		this.slalineWidth = 80;
		this.slaPeriodLength = Math.ceil(this.roundsCount / this.slalineWidth);
		this.slalineWidth = Math.ceil(this.roundsCount / this.slaPeriodLength);
		this.active_services = this.services.map((_service, index) => index);
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
		this.servicesCount = 0;
		for (const fieldName in info.services) {
			if (info.services.hasOwnProperty(fieldName)) {
				const name = info.services[fieldName];
				this.services.push({
					id: fieldName,
					name: name,
				});
				this.servicesCount++;
			}
		}
		this.services.sort(function(a, b) {return a.id > b.id;})
	}

	getHost(team) {
		return this.teams[team.team_id].host;
	}

	getLogo(team) {
		return this.teams[team.team_id].logo;
	}

	getRound() {
		return this.allScoreboards.length === 0 ? 0 : this.allScoreboards[this.allScoreboards.length - 1].round;
	}

	getSlaPeriods(team_id, service_id) {
		if(this.allScoreboards.length === 0 || this.allScoreboards.length < this.allScoreboards[this.allScoreboards.length - 1].round) {
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
		if(scoreboard == null)
			return;
		this.scoreboard = scoreboard;
		this.service_disable_intervals = {};
		let active_services = [];
		for (let service_id in this.scoreboard.services) {
			if (! this.scoreboard.services.hasOwnProperty(service_id))
				continue;
			let service = this.scoreboard.services[service_id];
			if (service.active)
				active_services.push(parseInt(service_id));
			this.service_disable_intervals[service_id] = service.disable_interval;
		}
		this.active_services = active_services;

		this.max_score = Math.max.apply(null,
			this.scoreboard.scoreboard.map(
				function(t) { return parseFloat(t.score); }));
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
		this.max_flags_allservices_sum = Math.max.apply(null,
			this.scoreboard.scoreboard.map(
				function(t) {
					return t.services.map(function(s) {return parseFloat(s.flags + s.sflags)}).reduce((p, c) => p + c);
				}));
		this.setScoreboards([scoreboard]);
	}

	getScoreboard() {
		return this.scoreboard.scoreboard;
	}

	setScoreboards(scoreboards) {
		this.allScoreboards = this.allScoreboards.concat(scoreboards);
		this.allScoreboards = _.uniq(this.allScoreboards, function(item) {return item.round;});
		this.allScoreboards.sort(function(a, b) {return a.round - b.round;});
		if(this.allScoreboards.length > 2 && this.scoreboard !== undefined) {
			this.previousScoreboard = this.allScoreboards[this.allScoreboards.length - 2];
			const previousFlags = this.getFlagsCountInRoundForServices(this.previousScoreboard.scoreboard);
			const currentFlags = this.getFlagsCountInRoundForServices(this.scoreboard.scoreboard);
			for (let s=0; s<this.servicesCount; s++)
				this.serviceIndex2attacksInRound[s] = currentFlags[s] - previousFlags[s];
			for(let t=0; t<this.scoreboard.scoreboard.length; t++) {
				this.scoreboard.scoreboard[t].scoreDelta = this.scoreboard.scoreboard[t].score - this.previousScoreboard.scoreboard[t].score;
			}
		}
	}

	getFlagsCountInRoundForServices(scoreboard) {
		const result = this.services.map((s) => 0);
		for(let t=0; t<scoreboard.length; t++) {
			for(let s=0; s<this.servicesCount; s++) {
				result[s] += scoreboard[t].services[s].flags;
			}
		}
		return result;
	}

	getDataForAttacksGraph(service) {
		if(this.allScoreboards.length < this.allScoreboards[this.allScoreboards.length - 1].round) {
			return {"graph": [{"value" : 0, "round" : 0}], "max": 0};
		}
		let result = [];
		let maxAttacks = 0;
		let maxSum = 0;
		for(let round = 0; round < this.allScoreboards.length; round += this.roundsPerGraphColumn) {
			let attacksCount = this.services.map((s) => 0);
			if(round > 0) {
				const scoreboard = this.allScoreboards[round];
				const previousScoreboard = this.allScoreboards[round - 1];
				const flagsCount =  this.getFlagsCountInRoundForServices(scoreboard.scoreboard);
				const previousFlagsCount = this.getFlagsCountInRoundForServices(previousScoreboard.scoreboard);
				for (let i=0; i<this.services.length; i++) {
					attacksCount[i] = flagsCount[i] - previousFlagsCount[i];
				}
			}
			const maxInRound = Math.max.apply(null, attacksCount);
			maxAttacks = maxInRound > maxAttacks ? maxInRound : maxAttacks;
			const sum = attacksCount.reduce((a, b) =>  a + b, 0);
			maxSum = sum > maxSum ? sum : maxSum;
			if(service !== undefined)
				result.push({"value" : attacksCount[service], "round" : round});
			else
				result.push({"value" : sum, "round" : round});
		}
		return {"graph": result, "max": service !== undefined ? maxAttacks : maxSum};
	}

	getDataForGraphs(team_id) {
		if(this.allScoreboards.length < this.allScoreboards[this.allScoreboards.length - 1].round) {
			return [];
		}
		let prevRound = null;
		let result = [];
		for(let round = 0; round < this.allScoreboards.length; round += this.roundsPerGraphColumn) {
			result.push(GameModel.getDataForGraphsOneScoreboard(prevRound === null ? null : this.allScoreboards[prevRound], this.allScoreboards[round], team_id));
			prevRound = round;
		}
		if((this.allScoreboards.length - 1) % this.roundsPerGraphColumn !== 0) {
			result.push(GameModel.getDataForGraphsOneScoreboard(prevRound === null ? null : this.allScoreboards[prevRound], this.allScoreboards[this.allScoreboards.length - 1], team_id));
		}
		return result;
	}

	static getDataForGraphsOneScoreboard(prevScoreboard, scoreboard, team_id) {
		for(let t=0; t<scoreboard.scoreboard.length; t++)
		{
			const team = scoreboard.scoreboard[t];
			const t_id = team.id === undefined ? team.team_id : team.id;
			if(t_id !== team_id)
				continue;
			let services_flags = [];
			for(let s=0; s < team.services.length; s++) {
				const service = team.services[s];
				let prevTeamData = null;
				if(prevScoreboard !== null) {
					for(let pt=0; pt<prevScoreboard.scoreboard.length; pt++) {
						let prevTeam = prevScoreboard.scoreboard[pt];
						if(prevTeam.team_id === t_id || prevTeam.id === t_id) {
							prevTeamData = prevTeam;
							break;
						}
					}
				}
				const prevService = prevTeamData === null ? null : prevTeamData.services[s];
				const flags = service["flags"] - (prevService == null ? 0 : prevService["flags"]);
				const sflags = service["sflags"] - (prevService == null ? 0 : prevService["sflags"]);
				services_flags.push({"round": scoreboard.round, "flags": flags, "sflags": sflags, "fp" : service["fp"]});
			}
			return services_flags;
		}
	}
}
