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
		this.colors = ["#BFD686", "#86D9E0", "#7AA6F3", "#E9CC76", "#AE86F2", "#EB8BD7", "#F7AB7C" ];
		this.fillClasses = ["c1", "c2", "c3", "c4", "c5", "c6", "c7" ];
		this.initServices(info);
		this.serviceIndex2attacksInRound = this.services.map((s) => 0);
		this.teams = info.teams;
		this.info = info;
		this.preloadLogos();
		this.initAllRoundsSla(info);
		this.one_servive_width = 160;
		this.team_width = 480;
		this.roundsCount = info.roundsCount;
		if(this.roundsCount === undefined)
			this.roundsCount = 770;
		this.roundsPerGraphColumn = 15;
		this.roundsPerGraphBorder = 60;
		if(this.roundsCount > 600) {
			this.roundsPerGraphColumn *= 2;
			this.roundsPerGraphBorder *= 2;
		}
		this.selectedTeam = null;
		this.slalineWidth = 80;
		this.slaPeriodLength = Math.ceil(this.roundsCount / this.slalineWidth);
		this.slalineWidth = Math.ceil(this.roundsCount / this.slaPeriodLength);
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
