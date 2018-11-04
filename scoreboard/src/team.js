import React, { Component } from 'react';
import ServiceBlock from './serviceblock';
import {addSpacesToNumber} from "./utils"
import Numberline from './numberline';
import Flagsgraph from './fpplot';
import Fbarchart from './fbarchart';
import Plotsprogress from './plotsprogress';
import Plusminusline from './plusminusline';

const plotsLeftMargin = 154;
const plotsAnimationDuration = 1000;

class Team extends Component {
	constructor(props) {
		super(props);
		this.handleClick = this.handleClick.bind(this);
		this.open = this.open.bind(this);
		this.deselect = this.deselect.bind(this);
		this.state = {isSelected: false, plotIsVisible: false};
	}

	deselect() {
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

	open() {
		this.setState(prevState => ({
			plotIsVisible: true,
			isSelected: true,
		}));
	}

	handleClick() {
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
		const host = this.props.model.getHost(team);
		const logo = this.props.model.getLogo(team);
		const max_score = this.props.model.max_score;
		const width = this.props.model.team_width + this.props.model.one_servive_width * this.props.model.servicesCount;
		const graphData = this.state.plotIsVisible ? this.props.model.getDataForGraphs(team.team_id) : null;
		const round = this.props.model.getRound();
		const meanSLA = team.services.map((s) => s.sla).reduce((p, c) => p + c) / this.props.model.servicesCount;
		const flags = team.services.map((s) => s.flags).reduce((p, c) => p + c);
		const sflags = team.services.map((s) => s.sflags).reduce((p, c) => p + c);
		return (
		<div><div className={"team " + (this.state.isSelected ? "team_selected" : "")} onClick={this.handleClick}>
			<div className="team_centered" style={{width: width + "px"}}>
				<div className="team_summary">
					<div className="place"><span>{team.n}</span><span className="suffix">&thinsp;{suffix}</span></div>
					<div className="team_logo team_border"><img className="img" src={logo}/></div>
					<div className="team_info team_border">
						<div className="team_name" title={team.name}>{team.name}</div>
						<div className="ip">{host}</div>
						<div className="score">
							<span>{addSpacesToNumber(team.score)} </span>
							{team.scoreDelta === undefined || team.scoreDelta === 0
								? null
								: (team.scoreDelta > 0
									? <span className="mdi mdi-arrow-top-right green"></span>
									: <span className="mdi mdi-arrow-bottom-right red"></span>
								)
							}
						</div>
						<Numberline color="white" percent={team.score / max_score * 100} className="team_score_line"/>
					</div>
					{team.services.map((service, i) => {
						if(i >= this.props.model.servicesCount)
							return null;
						return (<ServiceBlock key={"t" + team.team_id + "s" + service.id} service={service} team={team} model={this.props.model} color={this.props.model.colors[i]} round={round}/>);
					})}
				</div>
				{graphData != null && graphData.length > 0 ?
				<div className="team_plots" style={{marginLeft: 154 + "px"}}>
					<Flagsgraph graphData={graphData} round={round} model={this.props.model} width={width - plotsLeftMargin}></Flagsgraph>
					<Fbarchart graphData={graphData} round={round} model={this.props.model} width={width - plotsLeftMargin}></Fbarchart>
					<Plotsprogress round={round} model={this.props.model} width={width - plotsLeftMargin}></Plotsprogress>
					<div className="counts">
						<div className="sla_block">
							<div className="counts_title">SLA</div>
							<span>{Math.round(meanSLA)}%</span>
						</div>
						<div className="score_block">
							<div className="counts_title">FLAGPOINTS</div>
							<span>{addSpacesToNumber(team.score)} </span>
							<Numberline color="white" percent={team.score / max_score * 100} className="team_score_line"/>
						</div>
						<div className="flags_block">
							<div className="counts_title">FLAGS</div>
							<div className="flags">
								<span className=""> {flags}{sflags > 0 ? <span> / <span className="sflags">-{sflags}</span></span> : null}</span>
							</div>
							<Plusminusline plus={flags} minus={sflags} maxsum={this.props.model.max_flags_allservices_sum} className="flags_line"/>
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
