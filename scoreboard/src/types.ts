// /api/info

export interface Info {
    start: number; // unixtime for start game
    end: number; // unixtime for end game
    services: { [serviceId: string]: string }; // dictionary with services (id -> name mapping)
    teams: { [teamId: string]: TeamInfo }; // teamId to team
    roundsCount: number;
    contestName: string;
}

export interface TeamInfo {
    id: number; // team id
    name: string; // team name
    host?: string; // ipv4|hostname, optional, host with game image
    network: string; // cidr, network for team
    logo?: string; // optional, URL for team logo
    country?: string; // optional, country of team
}

// /api/events

export const StateEventName = "state";
export const AttackEventName = "attack";
export const ReloadEventName = "reload";

export type ScoreboardEvent = { type: typeof ReloadEventName }
    | {
    type: typeof StateEventName;
    value: StateEventData;
}
    | {
    type: typeof AttackEventName;
    value: AttackEventData;
}

export interface StateEventData {
    round: number; // current round
    scoreboard: TeamState[]; // sorted array of teams in scoreboard
    services: { [serviceId: string]: IsServiceActive } // serviceId is service active for current round
}

export type Scoreboard = TeamState[];

export interface TeamState {
    team_id: number;
    n: number; // position in scoreboard
    name: string; // team name
    host?: string; // ipv4|hostname, optional, team host
    d: number; // delta for preivious position
    score: string; // float, current score for team
    old_score: string; // float, score for previous round
    services: ServiceState[]; // detailed info for services
    old_services: ServiceState[]; // detailed info for services from previous round

    scoreDelta?: number; // not from api. Delta with prev round
}

export interface ServiceState {
    id: number; // service id
    flags: number; // int, number fo flags
    sflags: number; // int, number of stolen flags
    sla: number; // float, SLA in percentage (0% - 100%)
    fp: number; // float, FP
    status: ServiceStatusCode; // status of service (101, 102, 103, 104, 110, 111)
    stdout: string; // stdout from checker
}

export type ServiceStatusCode = 101 | 102 | 103 | 104 | 110 | 111;

export interface IsServiceActive {
    name: string; // service name
    active: 0 | 1; // service status for current round
    disable_interval: number | null;
}

export interface AttackEventData {
    service_id: number;
    attacker_id: number;
    victim_id: number;
}

// /history/scoreboard.json

export type History = HistoricalRoundState[];

export interface HistoricalRoundState {
    round: number;
    scoreboard: HistoricalTeamState[];
}

export type HistoricalScoreboard = HistoricalTeamState[];

export interface HistoricalTeamState {
    id: number; // teamId
    score: number; // float, current score for team
    services: HistoricalServiceState[];

    scoreDelta?: number; // not from api. Delta with prev round
}

export interface HistoricalServiceState {
    flags: number; // int, number fo flags
    sflags: number; // int, number of stolen flags
    fp: number; // float, FP
    status: ServiceStatusCode; // status of service (101, 102, 103, 104, 110, 111)
}

// in model

export interface ServiceIdAndName {
    id: string;
    name: string;
}

export type AllRoundsSla = { [teamId: string]: { [serviceId: string]: boolean[] } } // boolean = isUp

export interface ServicesFlagsForGraphs {
    round: number;
    flags: number;
    sflags: number;
    fp: number;
}

export interface DataForAttacksGraph {
    graph: DataForAttacksGraphForRound[];
    max: number;
}

export interface DataForAttacksGraphForRound {
    value: number;
    round: number;
}

export interface SelectedTeam {
    id: number;
    deselectCallback: () => void;
}