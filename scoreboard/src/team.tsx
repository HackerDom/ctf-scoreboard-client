import React, {Component} from 'react';
import ServiceBlock from './serviceblock';
import {addSpacesToNumber} from "./utils"
import Numberline from './numberline';
import Flagsgraph from './fpplot';
import Fbarchart from './fbarchart';
import Plotsprogress from './plotsprogress';
import Plusminusline from './plusminusline';
import { TeamState, ServiceState } from './types';
import {GameModel} from "./model";

const plotsLeftMargin = 154;
const plotsAnimationDuration = 1000;

interface TeamProps {
    team: TeamState;
    model: GameModel;
    servicesCount: number;
    servicesFrom: number;
    servicesTo: number;
    handleClick: (clickedTeamId: number, deselectCallback: () => void) => void;
}

interface TeamComponentState {
    isSelected: boolean;
    plotIsVisible: boolean;
}

function arraySum(array: number[]) {
    return array.reduce((pv, cv) => pv + cv, 0);
}

class Team extends Component<TeamProps, TeamComponentState> {
    constructor(props: TeamProps) {
        super(props);
        this.state = {isSelected: false, plotIsVisible: false};
    }

    deselect = () => {
        this.setState(prevState => ({
            plotIsVisible: true,
            isSelected: false,
        }));
        setTimeout(() =>
            this.setState(prevState => ({
                isSelected: false,
                plotIsVisible: false
            })), plotsAnimationDuration);
    }

    open = () => {
        this.setState(prevState => ({
            plotIsVisible: true,
            isSelected: true,
        }));
    }

    handleClick = () => {
        this.props.handleClick(this.props.team.team_id, this.deselect);
        this.setState(prevState => ({
            plotIsVisible: true,
            isSelected: !prevState.isSelected,
        }));
        setTimeout(() =>
            this.setState(prevState => ({
                isSelected: prevState.isSelected,
                plotIsVisible: prevState.isSelected
            })), plotsAnimationDuration);
    }

    render() {
        const team = this.props.team;
        const suffix = team.d ? (team.d > 0 ? "(+" + team.d + ")" : "(" + team.d + ")") : '';
        const host = this.props.model.getHost(team.team_id);
        const tags = this.props.model.getTags(team.team_id);
        const logo = this.props.model.getLogo(team.team_id);
        const max_score = this.props.model.max_score;
        let almostDeadServices = this.props.model.almostDeadServices();
        const width = this.props.model.team_width + this.props.model.one_service_width * (this.props.servicesCount + (almostDeadServices.length ? 1 : 0));
        const graphData = this.state.plotIsVisible ? this.props.model.getDataForGraphs(team.team_id) : null;
        const round = this.props.model.getRound();
        const meanSLA = team.services.map((s) => s.sla).reduce((p, c) => p + c) / this.props.model.servicesCount;
        const flags = team.services.map((s) => s.flags).reduce((p, c) => p + c);
        const sflags = team.services.map((s) => s.sflags).reduce((p, c) => p + c);
        // TODO: use arraySum↑?
        let serviceIndex = 0;

        let almostDeadServiceIds = almostDeadServices.map(s => parseInt(s.id, 10))
        let almostDeadServiceInfos = team.services.filter(s => almostDeadServiceIds.includes(s.id))
        let uberDeadService = {
            flags: arraySum(almostDeadServiceInfos.map(s => s.flags)),
            fp: arraySum(almostDeadServiceInfos.map(s => s.fp)),
            sflags: arraySum(almostDeadServiceInfos.map(s => s.sflags)),
            id: -1,
        } as ServiceState;
        return (
            <div>
                <div className={"team " + (this.state.isSelected ? "team_selected" : "")} onClick={this.handleClick}>
                    <div className="team_centered" style={{width: width + "px"}}>
                        <div className="team_summary">
                            <div className="place"><span>{team.n}</span><span className="suffix">&thinsp;{suffix}</span>
                            </div>
                            <div className="team_logo team_border"><img className="img" src={logo} alt="Team logo"/></div>
                            <div className="team_info team_border">
                                <div className="team_name" title={team.name}>{team.name}</div>
                                <div className="tags">
                                    {tags.map((tag, _) => {
                                        return <span className={"tag tag_" + tag} key={tag}>{tag}</span>
                                    })}
                                </div>
                                <div className="ip">{host}</div>
                                <div className="score">
                                    <span>{addSpacesToNumber(GameModel.GetScore(team.score))} </span>
                                    {team.scoreDelta === undefined || team.scoreDelta === 0
                                        ? null
                                        : (team.scoreDelta > 0
                                                ? <span className="mdi mdi-arrow-top-right green"/>
                                                : <span className="mdi mdi-arrow-bottom-right red"/>
                                        )
                                    }
                                </div>
                                <Numberline color="white" percent={GameModel.GetScore(team.score) / max_score * 100}
                                            className="team_score_line"/>
                            </div>
                            {almostDeadServices.length > 0 && 
                                <ServiceBlock key={"t" + team.team_id + "s-old"} service={uberDeadService}
                                    team={team} model={this.props.model} color="white" round={round} aggregate={true}/>
                            }
                            {team.services.map((service, i) => {
                                if (i >= this.props.model.servicesCount)
                                    return null;
                                if (!this.props.model.active_services.includes(service.id))
                                    return null;

                                let servicePercentile = serviceIndex * 100 / this.props.model.active_services.length;
                                serviceIndex++;
                                if (servicePercentile < this.props.servicesFrom || servicePercentile >= this.props.servicesTo)
                                    return null;

                                return (<ServiceBlock key={"t" + team.team_id + "s" + service.id} service={service}
                                                      team={team} model={this.props.model}
                                                      color={this.props.model.colors[i]} round={round}/>);
                            })}
                        </div>
                        {graphData != null && graphData.length > 0 ?
                            <div className="team_plots" style={{marginLeft: 154 + "px"}}>
                                <Flagsgraph graphData={graphData} model={this.props.model} width={width - plotsLeftMargin}/>
                                <Fbarchart graphData={graphData} model={this.props.model} width={width - plotsLeftMargin}/>
                                <Plotsprogress round={round} model={this.props.model}/>
                                <div className="counts">
                                    <div className="sla_block">
                                        <div className="counts_title">SLA</div>
                                        <span>{Math.round(meanSLA)}%</span>
                                    </div>
                                    <div className="score_block">
                                        <div className="counts_title">SCORE</div>
                                        <span>{addSpacesToNumber(GameModel.GetScore(team.score))} </span>
                                        <Numberline color="white"
                                                    percent={GameModel.GetScore(team.score) / max_score * 100}
                                                    className="team_score_line"/>
                                    </div>
                                    <div className="flags_block">
                                        <div className="counts_title">FLAGS</div>
                                        <div className="flags">
                                            <span className=""> {flags}{sflags > 0 ?
                                                <span> / <span className="sflags">-{sflags}</span></span> : null}</span>
                                        </div>
                                        <Plusminusline plus={flags} minus={sflags}
                                                       maxsum={this.props.model.max_flags_allservices_sum}
                                                       className="flags_line"/>
                                    </div>
                                </div>
                            </div>
                            : null}
                    </div>
                </div>
                <div className="selectScriptHolder"/>
            </div>
        );
    }
}

export default Team;
