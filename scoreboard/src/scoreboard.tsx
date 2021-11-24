import React, {Component} from 'react';
import {detect} from 'detect-browser';
import Controller from "./controller";
import Team from './team';
import Progress from './progress';
import CompactScoreboard from './compactscoreboard';
import AttacksPlot from './attacksplot';
import {getParameterByName} from "./utils"
import Timer from "./timer"
import {GameModel} from "./model";
import {StateEventData} from "./types";

const controller = new Controller();
const collapsedTeamWidth = 100;
const maxFlagPrice = 30; // Extract to the checksystem API?


interface ScoreboardProps {
}

class Scoreboard extends Component<ScoreboardProps> {
    // query params
    compactScoreboardWidth: number;
    autoOpenPeriod: number;
    forSave: boolean;
    additionalStyle: string;
    servicesFrom: number;
    servicesTo: number;

    model: GameModel | null;
    nextTeamToOpen: number;
    services_count_part: number;
    zoom: number;
    isIE: boolean;
    isFirefox: boolean;
    width: number;
    teamRefs: (Team | null)[];

    constructor(props: ScoreboardProps) {
        super(props);
        this.compactScoreboardWidth = parseInt(getParameterByName("compactScoreboardWidth") ?? '', 10);
        this.compactScoreboardWidth = isNaN(this.compactScoreboardWidth) ? 0 : this.compactScoreboardWidth;
        this.autoOpenPeriod = parseInt(getParameterByName("autoOpen") ?? '', 10); // seconds
        this.autoOpenPeriod = isNaN(this.autoOpenPeriod) ? 0 : this.autoOpenPeriod * 1000;
        this.forSave = getParameterByName("forSave") !== null;
        this.additionalStyle = getParameterByName("style") ?? '';

        // Percentiles. I.e. ?servicesFrom=0&servicesTo=50
        this.servicesFrom = parseInt(getParameterByName("servicesFrom") ?? '', 10);
        if (isNaN(this.servicesFrom))
            this.servicesFrom = 0;
        this.servicesTo = parseInt(getParameterByName("servicesTo") ?? '', 10);
        if (isNaN(this.servicesTo))
            this.servicesTo = 100;

        this.model = null;
        this.nextTeamToOpen = 0;
        const browser = detect();
        this.isFirefox = (browser && browser.name === "firefox") ?? false;
        this.isIE = (browser && browser.name === "ie") ?? false;
        this.teamRefs = [];
        this.zoom = 1;
        this.width = 1000;
        this.services_count_part = 0;
    }

    componentDidMount() {
        let initialized = false;
        controller.on('start', m => {
            this.model = m;
            this.zoom = 1;
        });
        controller.on('updateScoreboard', () => {
            if (this.model!.scoreboard === undefined)
                return;
            if (!initialized) {
                this.teamRefs = [];
                for (let i = 0; i < this.model!.getScoreboard().length; i++)
                    this.teamRefs.push(null);
            }
            const _this = this;
            let services_count = this.model!.active_services.length;
            let services_count_part = 0;
            for (let service_index = 0; service_index < services_count; service_index++) {
                let service_percentile = service_index * 100 / services_count;
                if (service_percentile >= this.servicesFrom && service_percentile < this.servicesTo)
                    services_count_part++;
            }
            this.services_count_part = services_count_part;
            this.width = this.model!.team_width + this.model!.one_service_width * services_count_part;
            this.forceUpdate();
            _this.initResize();
            initialized = true;
            if (this.forSave) {
                this.prepareForSave();
            }
        });
        controller.on('history', () => {
            if (initialized) {
                this.forceUpdate();
            }
        });
        if (this.autoOpenPeriod !== 0) {
            this.autoOpenScript();
        }
    }

    autoOpenScript() {
        const _this = this;
        setInterval(() => {
            if (_this.teamRefs !== undefined) {
                const ref = _this.teamRefs[_this.nextTeamToOpen];
                if (ref != null) {
                    ref.handleClick();
                    window.scroll({
                        top: collapsedTeamWidth * this.zoom * _this.nextTeamToOpen,
                        left: 0,
                        behavior: 'smooth'
                    });
                }
                _this.nextTeamToOpen++;
                if (_this.nextTeamToOpen >= 10)
                    _this.nextTeamToOpen = 0;
            }
        }, this.autoOpenPeriod);
    }

    prepareForSave() {
        const _this = this;
        setInterval(() => {
            for (let i = 0; i < this.teamRefs.length; i++)
                _this.teamRefs[i]!.open();
        }, 5000);
    }

    initResize() {
        const width = this.width;
        const _this = this;

        function resize() {
            let html = document.getElementsByTagName("html")[0];
            if (window.innerWidth === window.screen.width && window.innerHeight === window.screen.height) {
                // Full screen, disable vertical scroll
                html.className = "fullscreen";
            } else {
                html.className = "";
            }

            const container = document.getElementById('container');
            if (window.outerWidth < 150)
                return;
            if (container !== null && !_this.isIE) {
                if (window.outerWidth - _this.compactScoreboardWidth < width) {
                    _this.zoom = (window.outerWidth - 40 - _this.compactScoreboardWidth) / width;
                    if (_this.isFirefox)
                        container.setAttribute("style", "transform:scale(" + _this.zoom + ");");
                    else
                        container.setAttribute("style", "zoom:" + _this.zoom + ";");
                } else {
                    _this.zoom = 1;
                    container.setAttribute("style", "");
                }
                _this.forceUpdate();
            }
        }

        window.onresize = function (event) {
            resize();
        };
        resize();
    }

    onTeamClick = (clickedTeamId: number, deselectCallback: () => void) => {
        if (this.model!.selectedTeam !== null && this.model!.selectedTeam.id !== clickedTeamId) {
            this.model!.selectedTeam.deselectCallback();
        }
        if (this.model!.selectedTeam !== null && this.model!.selectedTeam.id === clickedTeamId) {
            this.model!.selectedTeam = null;
        } else {
            this.model!.selectedTeam = {id: clickedTeamId, deselectCallback: deselectCallback};
        }
    }

    getTeamRows() {
        return this.model!.getScoreboard().map((t, i) =>
            <Team ref={instance => {
                this.teamRefs[i] = instance;
            }} key={t.team_id} team={t} model={this.model!} handleClick={this.onTeamClick}
                  servicesFrom={this.servicesFrom} servicesTo={this.servicesTo} servicesCount={this.services_count_part}
            />
        );
    }

    getBreaksTime(start: Date, end: Date, breaks: Date[][]) {
        let result = 0;
        breaks.forEach((b, _) => {
            console.log(b);
            let breakStart = b[0];
            let breakEnd = b[1];
            let commonStart = Math.max(breakStart.getTime(), start.getTime());
            let commonEnd = Math.min(breakEnd.getTime(), end.getTime());
            console.log("common", commonStart, commonEnd);
            if (commonStart <= commonEnd) {
                result += (commonEnd - commonStart) / 1000; // divide because getTime() returns milliseconds
            }
            console.log("result", result)
        });
        return result;
    }

    render() {
        if (this.model == null || this.model.scoreboard == null)
            return null;
        const attacks = this.model.serviceIndex2attacksInRound.reduce(function (a, b) {
            return a + b;
        });
        const container = document.getElementById('container');
        const _this = this;
        const headerContainerWidth =
            this.isFirefox
                ? container === null
                    ? this.width + "px"
                    : (container.offsetWidth / this.zoom) + "px"
                : this.compactScoreboardWidth === 0
                    ? "100%"
                    : container === null
                        ? this.width
                        : container.offsetWidth;
        const scoreboardWidth =
            this.isFirefox
                ? container === null
                    ? this.width + "px"
                    : (container.offsetWidth / this.zoom) + "px"
                : "auto";
        let serviceIndex = 0;
        return (
            <div className={this.additionalStyle === null ? "" : this.additionalStyle}>
                {this.compactScoreboardWidth === 0 ? null :
                    <CompactScoreboard model={this.model} width={this.compactScoreboardWidth}/>}
                <div id="container-wrapper" style={{marginLeft: this.compactScoreboardWidth + "px"}}>
                    <div id="container">
                        <div id="header-container" style={{width: headerContainerWidth}}>
                            <Progress width={this.width} start={this.model.info.start} end={this.model.info.end}
                                      compactScoreboardWidth={this.compactScoreboardWidth}/>
                            <div id="header" style={{width: this.width + "px"}}>
                                <div id="attacks-header">
                                    <AttacksPlot color={"white"} attacks={this.model.getDataForAttacksGraph()}
                                                 roundsCount={_this.model!.roundsCount}/>
                                    <div className="service-name">attacks</div>
                                    <div className="attacks">{attacks}</div>
                                    <div className="min">/round</div>
                                </div>
                                {this.model.services.slice(0, this.model.servicesCount).map((service, i) => {
                                        if (!this.model!.active_services.includes(parseInt(service.id, 10)))
                                            return null;
                                        let servicePercentile = serviceIndex * 100 / this.model!.active_services.length;
                                        serviceIndex++;
                                        if (servicePercentile < this.servicesFrom || servicePercentile >= this.servicesTo)
                                            return null;

                                        let serviceId = parseInt(service.id, 10);
                                        let serviceInfo = this.model!.service_infos[serviceId];
                                        let serviceDisableInterval = serviceInfo.disable_interval;
                                        let servicePhase = serviceInfo.phase?.replace("_", " ")
                                        let isGameActive = true;
                                        if (this.model!.scoreboard !== null && (this.model!.scoreboard! as StateEventData).game_status !== undefined) {
                                            isGameActive = (this.model!.scoreboard! as StateEventData).game_status === 1;
                                        }

                                        let phaseDuration = serviceInfo.phase_duration;
                                        if (phaseDuration !== null) {
                                            // The checksystem has a bug: it includes break time into phase_duration, so
                                            // we have to substitute it.
                                            phaseDuration -= this.getBreaksTime(new Date(Date.now() - phaseDuration * 1000), new Date(), [
                                                [
                                                    new Date(Date.UTC(2021, 10, 24, 14, 30, 0)),
                                                    new Date(Date.UTC(2021, 10, 24, 15, 30, 0)),
                                                ],
                                                [
                                                    new Date(Date.UTC(2021, 10, 25, 3, 0, 0)),
                                                    new Date(Date.UTC(2021, 10, 25, 5, 0, 0)),
                                                ]
                                            ]);
                                        }

                                        return (
                                            <div key={service.id} className="service-header">
                                                <AttacksPlot color={this.model!.colors[i]}
                                                             attacks={_this.model!.getDataForAttacksGraph(i)}
                                                             roundsCount={_this.model!.roundsCount}/>
                                                <div className="service-name"
                                                     style={{color: this.model!.colors[i]}}>{service.name}</div>
                                                <div className="attacks" title="Current amount of stolen flags on the last round">{this.model!.serviceIndex2attacksInRound[i]}</div>
                                                <div className="min">/round</div>
                                                {
                                                    serviceInfo.phase &&
                                                    <React.Fragment>
                                                        {
                                                            serviceInfo.phase !== "DYING" && serviceInfo.phase !== "REMOVED" &&
                                                            <Timer seconds={phaseDuration!}
                                                                   direction={isGameActive ? "forward" : "none"}
                                                                   title={"Time from the beginning of the " + servicePhase + " phase"}
                                                            />
                                                        }
                                                        {
                                                            serviceInfo.phase === "DYING" &&
                                                            <Timer seconds={serviceDisableInterval ?? 0}
                                                                   direction={isGameActive ? "backward" : "none"}
                                                                   title="This service will disappear soon"
                                                            />
                                                        }
                                                        <div className={"phase phase_" + serviceInfo.phase} title={"Base flag price"}>
                                                            { serviceInfo.flag_base_amount?.toFixed(2) }
                                                            { serviceInfo.phase === "HEATING" && serviceInfo.flag_base_amount !== maxFlagPrice && <span className="mdi mdi-arrow-up-bold" title="HEATING phase"/> }
                                                            { serviceInfo.phase === "COOLING_DOWN" && <span className="mdi mdi-arrow-down-bold" title="COOLING DOWN phase"/> }
                                                        </div>
                                                    </React.Fragment>
                                                }
                                            </div>
                                        )
                                    }
                                )}
                            </div>
                        </div>
                        <div id="scoreboard" style={{width: scoreboardWidth}}>
                            <div id="resizeScriptHolder"/>
                            {this.getTeamRows()}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default Scoreboard;
