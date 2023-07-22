import _ from "underscore";
import {getParameterByName} from "./utils";
import {
    AllRoundsSla, DataForAttacksGraph, DataForAttacksGraphForRound,
    HistoricalRoundState,
    HistoricalScoreboard, HistoricalTeamState,
    Info, IsServiceActive, Scoreboard, SelectedTeam,
    ServiceIdAndName,
    ServicesFlagsForGraphs,
    StateEventData,
    TeamInfo, TeamState
} from "./types";

export class GameModel {
    // from api
    info: Info;
    teams: { [teamId: string]: TeamInfo };
    roundsCount: number;
    services: ServiceIdAndName[];
    servicesCount: number;

    // consts
    one_service_width: number;
    team_width: number;
    roundsPerGraphColumn: number;
    roundsPerGraphBorder: number;
    colors: string[];
    fillClasses: string[];
    slalineWidth: number;
    slaPeriodLength: number;

    images: HTMLImageElement[];
    allRoundsSla: AllRoundsSla;
    serviceIndex2attacksInRound: number[];
    max_score: number;
    max_service_score: number;
    max_flags_sum: number;
    max_flags_allservices_sum: number;
    scoreboard: StateEventData | HistoricalRoundState | null;
    allScoreboards: (StateEventData | HistoricalRoundState)[];
    previousScoreboard: StateEventData | HistoricalRoundState | null;
    active_services: number[];
    selectedTeam: SelectedTeam | null;
    service_infos: { [id: number]: IsServiceActive };

    constructor(info: Info) {
        this.scoreboard = null;
        this.allScoreboards = [];
        this.previousScoreboard = null;
        this.max_score = 0;
        this.max_service_score = 0;
        this.max_flags_sum = 0;
        this.max_flags_allservices_sum = 0;
        this.services = GameModel.initServices(info);
        this.servicesCount = this.services.length;
        this.colors = [
            "#FF887B",
            "#E1BB5A",
            // "#E9993C",
            "#96C840",
            // "#46CD68",
            "#4FD8C3",
            "#51ADFF",
            "#618AFF",
            "#AB84FF",
            "#C56FDA",
            "#DE6388",
            "#AA8164"
        ];
        this.fillClasses = ["c1", "c2", /*"c3",*/ "c4", /*"c5",*/ "c6", "c7", "c8", "c9", "c10", "c11", "c12", "c13", "c14", "c15", "c16", "c17", "c18", "c19", "c20"];
        if (this.servicesCount < 7) {
            this.colors.shift();
            this.fillClasses.shift();
        }
        this.serviceIndex2attacksInRound = this.services.map((s) => 0);
        this.teams = info.teams;
        this.info = info;
        document.title = info.contestName;
        this.images = GameModel.preloadLogos(this.teams);
        this.allRoundsSla = GameModel.initAllRoundsSla(info, this.services);
        this.one_service_width = 160;
        this.team_width = 480;
        this.roundsCount = info.roundsCount;
        if (this.roundsCount === undefined)
            this.roundsCount = 1280; // TODO: set actual rounds count
        this.roundsPerGraphColumn = 20;
        this.roundsPerGraphBorder = 60;

        let _roundsCount = this.roundsCount;
        while (_roundsCount > 600) {
            this.roundsPerGraphColumn *= 2;
            this.roundsPerGraphBorder *= 2;
            _roundsCount /= 2;
        }

        this.selectedTeam = null;
        this.slalineWidth = 80;
        this.slaPeriodLength = Math.ceil(this.roundsCount / this.slalineWidth);
        this.slalineWidth = Math.ceil(this.roundsCount / this.slaPeriodLength);
        this.active_services = this.services.map((_service, index) => index);
        this.service_infos = {}
    }

    private static preloadLogos(teams: { [teamId: string]: TeamInfo }): HTMLImageElement[] {
        const images: HTMLImageElement[] = [];
        let team_id = 1;
        while (true) {
            let team = teams[team_id];
            if (team === undefined)
                break;
            const image = new Image();
            image.src = team.logo!;
            images.push(image);
            team_id++;
        }
        return images;
    }

    private static initAllRoundsSla(info: Info, services: ServiceIdAndName[]): AllRoundsSla {
        const allRoundsSla: AllRoundsSla = {};
        for (const fieldName in info.teams) {
            if (info.teams.hasOwnProperty(fieldName)) {
                const team = info.teams[fieldName];
                let teamServices: { [serviceId: string]: [] } = {};
                for (let i = 0; i < services.length; i++)
                    teamServices[services[i].id] = [];
                allRoundsSla[team.id] = teamServices;
            }
        }
        return allRoundsSla;
    }

    private static initServices(info: Info) {
        const services: ServiceIdAndName[] = [];
        for (const fieldName in info.services) {
            if (info.services.hasOwnProperty(fieldName)) {
                const name = info.services[fieldName];
                services.push({
                    id: fieldName,
                    name: name,
                    phase: "",
                });
            }
        }
        services.sort((a, b) => parseInt(a.id) - parseInt(b.id));
        return services;
    }

    getTags(team_id: number): string[] {
        return this.teams[team_id].tags ?? [];
    }

    getHost(team_id: number) {
        return this.teams[team_id].network;
    }

    getLogo(team_id: number) {
        return this.teams[team_id].logo;
    }

    getRound() {
        return this.allScoreboards.length === 0 ? 0 : this.allScoreboards[this.allScoreboards.length - 1].round;
    }

    getSlaPeriods(team_id: string, service_id: string) {
        if (this.allScoreboards.length === 0 || this.allScoreboards.length < this.allScoreboards[this.allScoreboards.length - 1].round) {
            return [];
        }
        if (this.allRoundsSla[team_id][service_id].length === this.allScoreboards.length) {
            return this.allRoundsSla[team_id][service_id];
        }
        if (this.allRoundsSla[team_id][service_id].length === this.allScoreboards.length - 1) {
            const scoreboard = this.allScoreboards[this.allScoreboards.length - 1].scoreboard;
            this.fillAllRoundsSlaForScoreboard(scoreboard);
        } else {
            this.allRoundsSla = GameModel.initAllRoundsSla(this.info, this.services);
            for (let r = 0; r < this.allScoreboards.length; r++) {
                const scoreboard = this.allScoreboards[r].scoreboard;
                this.fillAllRoundsSlaForScoreboard(scoreboard);
            }
        }
        return this.allRoundsSla[team_id][service_id];
    }

    getSlaPeriodsForSomeServiceOfSomeTeam() {
        let team_ids = Object.keys(this.allRoundsSla);
        if (team_ids.length == 0)
            return [];

        let team_id = team_ids[0];

        let service_ids = Object.keys(this.allRoundsSla[team_id]);
        if (service_ids.length == 0)
            return [];

        let service_id = service_ids[0];

        return this.getSlaPeriods(team_id, service_id);
    }

    fillAllRoundsSlaForScoreboard(scoreboard: Scoreboard | HistoricalScoreboard) {
        for (let t = 0; t < scoreboard.length; t++) {
            const team = scoreboard[t];
            const team_id = GameModel.GetTeamId(team);
            for (let s = 0; s < team.services.length; s++) {
                const service = team.services[s];
                const isUp = service.status === 101;
                this.allRoundsSla[team_id][s + 1].push(isUp);
            }
        }
    }

    setScoreboard(scoreboard: StateEventData) {
        if (scoreboard == null)
            return;
        this.scoreboard = scoreboard;
        this.service_infos = {}

        let showAll = getParameterByName("showAll") !== null;

        let active_services = [];
        for (let service_id in this.scoreboard.services) {
            if (!this.scoreboard.services.hasOwnProperty(service_id))
                continue;
            let service = this.scoreboard.services[service_id];
            if (service.active || showAll)
                active_services.push(parseInt(service_id));
            this.service_infos[parseInt(service_id)] = service;
        }
        this.active_services = active_services;

        this.max_score = Math.max.apply(null,
            this.scoreboard.scoreboard.map(
                function (t) {
                    return parseFloat(t.score);
                }));
        this.max_service_score = Math.max.apply(null,
            this.scoreboard.scoreboard.map(
                function (t) {
                    return Math.max.apply(null, t.services.map(function (s) {
                        return s.fp
                    }));
                }));
        this.max_flags_sum = Math.max.apply(null,
            this.scoreboard.scoreboard.map(
                function (t) {
                    return Math.max.apply(null, t.services.map(function (s) {
                        return s.flags + s.sflags;
                    }));
                }));
        this.max_flags_allservices_sum = Math.max.apply(null,
            this.scoreboard.scoreboard.map(
                function (t) {
                    return t.services.map(function (s) {
                        return s.flags + s.sflags;
                    }).reduce((p, c) => p + c);
                }));
        this.setScoreboards([scoreboard]);
    }

    getScoreboard(): TeamState[] {
        return this.scoreboard!.scoreboard as TeamState[];
    }

    setScoreboards(scoreboards: (StateEventData | HistoricalRoundState)[]) {
        this.allScoreboards = this.allScoreboards.concat(scoreboards);
        this.allScoreboards = _.uniq(this.allScoreboards, function (item) {
            return item.round;
        });
        this.allScoreboards.sort(function (a, b) {
            return a.round - b.round;
        });
        if (this.allScoreboards.length > 2 && this.scoreboard != null) {
            this.previousScoreboard = this.allScoreboards[this.allScoreboards.length - 2];
            const previousFlags = this.getFlagsCountInRoundForServices(this.previousScoreboard.scoreboard);
            const currentFlags = this.getFlagsCountInRoundForServices(this.scoreboard.scoreboard);
            for (let s = 0; s < this.servicesCount; s++)
                this.serviceIndex2attacksInRound[s] = currentFlags[s] - previousFlags[s];
            for (let t = 0; t < this.scoreboard.scoreboard.length; t++) {
                this.scoreboard.scoreboard[t].scoreDelta = GameModel.GetScore(this.scoreboard.scoreboard[t].score)
                    - GameModel.GetScore(this.previousScoreboard.scoreboard[t].score);
            }
        }
    }

    getFlagsCountInRoundForServices(scoreboard: (TeamState | HistoricalTeamState)[]) {
        const result = this.services.map((s) => 0);
        for (let t = 0; t < scoreboard.length; t++) {
            for (let s = 0; s < this.servicesCount; s++) {
                result[s] += scoreboard[t].services[s].flags;
            }
        }
        return result;
    }

    getDataForAttacksGraph(serviceId?: number): DataForAttacksGraph {
        if (this.allScoreboards.length < this.allScoreboards[this.allScoreboards.length - 1].round) {
            return {graph: [{value: 0, round: 0}], max: 0};
        }
        let result: DataForAttacksGraphForRound[] = [];
        let maxAttacks = 0;
        let maxSum = 0;
        for (let round = 0; round < this.allScoreboards.length; round += this.roundsPerGraphColumn) {
            let attacksCount = this.services.map((s) => 0);
            if (round > 0) {
                const scoreboard = this.allScoreboards[round];
                const previousScoreboard = this.allScoreboards[round - 1];
                const flagsCount = this.getFlagsCountInRoundForServices(scoreboard.scoreboard);
                const previousFlagsCount = this.getFlagsCountInRoundForServices(previousScoreboard.scoreboard);
                for (let i = 0; i < this.services.length; i++) {
                    attacksCount[i] = flagsCount[i] - previousFlagsCount[i];
                }
            }
            const maxInRound = Math.max.apply(null, attacksCount);
            maxAttacks = maxInRound > maxAttacks ? maxInRound : maxAttacks;
            const sum = attacksCount.reduce((a, b) => a + b, 0);
            maxSum = sum > maxSum ? sum : maxSum;
            if (serviceId !== undefined)
                result.push({value: attacksCount[serviceId], round: round});
            else
                result.push({value: sum, round: round});
        }
        return {graph: result, max: serviceId !== undefined ? maxAttacks : maxSum};
    }

    getDataForGraphs(team_id: number): ServicesFlagsForGraphs[][] {
        if (this.allScoreboards.length < this.allScoreboards[this.allScoreboards.length - 1].round) {
            return [];
        }
        let prevRound: number | null = null;
        let result: ServicesFlagsForGraphs[][] = [];
        for (let round = 0; round < this.allScoreboards.length; round += this.roundsPerGraphColumn) {
            const data = GameModel.getDataForGraphsOneScoreboard(prevRound === null ? null : this.allScoreboards[prevRound], this.allScoreboards[round], team_id);
            if (data != null)
                result.push(data);
            prevRound = round;
        }
        if ((this.allScoreboards.length - 1) % this.roundsPerGraphColumn !== 0) {
            const data = GameModel.getDataForGraphsOneScoreboard(prevRound === null ? null : this.allScoreboards[prevRound], this.allScoreboards[this.allScoreboards.length - 1], team_id);
            if (data != null)
                result.push(data);
            result.push();
        }
        return result;
    }

    static getDataForGraphsOneScoreboard(
        prevScoreboard: StateEventData | HistoricalRoundState | null,
        scoreboard: StateEventData | HistoricalRoundState,
        team_id: number)
        : ServicesFlagsForGraphs[] | null {
        for (let t = 0; t < scoreboard.scoreboard.length; t++) {
            const team = scoreboard.scoreboard[t];
            const t_id = GameModel.GetTeamId(team);
            if (t_id !== team_id)
                continue;
            const services_flags: ServicesFlagsForGraphs[] = [];
            for (let s = 0; s < team.services.length; s++) {
                const service = team.services[s];
                let prevTeamData = null;
                if (prevScoreboard !== null) {
                    for (let pt = 0; pt < prevScoreboard.scoreboard.length; pt++) {
                        let prevTeam = prevScoreboard.scoreboard[pt];
                        const prevTeam_id = GameModel.GetTeamId(prevTeam);
                        if (prevTeam_id === t_id) {
                            prevTeamData = prevTeam;
                            break;
                        }
                    }
                }
                const prevService = prevTeamData === null ? null : prevTeamData.services[s];
                const flags = service.flags - (prevService == null ? 0 : prevService.flags);
                const sflags = service.sflags - (prevService == null ? 0 : prevService.sflags);
                services_flags.push({round: scoreboard.round, flags: flags, sflags: sflags, fp: service.fp});
            }
            return services_flags;
        }
        return null;
    }

    static GetTeamId(team: TeamState | HistoricalTeamState): number {
        return (team as any).id === undefined ? (team as any).team_id : (team as any).id;
    }

    static GetScore(score: number | string): number {
        return parseFloat(score as string);
    }
}
