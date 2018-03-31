import React, { Component } from 'react';
import ServiceBlock from './serviceblock';
import {addSpacesToNumber} from "./utils"
import Numberline from './numberline';

class Team extends Component {

	render() {
		const team = this.props.team;
		const suffix = team.d ? (team.d > 0 ? "(+" + team.d + ")" : "(" + team.d + ")") : '';
		const logo = this.props.model.getLogo(team);
		const max_score = this.props.model.max_score;
		return (
		<div className="team">
			<div className="place"><span>{team.n}</span><span className="suffix">&thinsp;{suffix}</span></div>
			<div className="team_logo team_border"><img className="img" src={logo}/></div>
			<div className="team_info team_border">
				<div className="team_name" title={team.name}>{team.name}</div>
				<div className="ip">{team.host}</div>
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
				return (<ServiceBlock key={"t" + team.team_id + "s" + service.id} service={service} team={team} model={this.props.model} color={this.props.model.colors[i]}/>);
			})}
		</div>
		);
	}
}

export default Team;
