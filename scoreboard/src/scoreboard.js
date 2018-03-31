import React, { Component } from 'react';
import Controller from "./controller";
import Team from './team';
import Progress from './progress';

const controller = new Controller();

class Scoreboard extends Component {
	constructor(props) {
		super(props);
		this.onTeamClick = this.onTeamClick.bind(this);
	}

	componentWillMount () {
		let initialized = false;
		controller.on('start', m => {
			this.model = m;
			this.width = this.model.team_width +  this.model.one_servive_width * this.model.servicesCount;
			this.initResize();
		});
		controller.on('updateScoreboard', () => {
			this.forceUpdate();
			initialized = true;
		});
		controller.on('history', () => {
			if(initialized) {
				this.forceUpdate();
			}
		});
	}

	initResize() {
		const width = this.width;
		function resize() {
			const body = document.getElementsByTagName("body")[0];
			if (window.outerWidth < width) {
				body.setAttribute("style", "zoom:" + ((window.outerWidth - 40) / width) + ";");
			} else {
				body.setAttribute("style", "");
			}
		}
		window.onresize = function(event) {
			resize();
		};
		resize();
	}

	onTeamClick(clickedTeamId, deselectCallback) {
		if (this.model.selectedTeam !== null && this.model.selectedTeam.id !== clickedTeamId) {
			this.model.selectedTeam.deselectCallback();
		}
		if(this.model.selectedTeam !== null && this.model.selectedTeam.id === clickedTeamId) {
			this.model.selectedTeam = null;
		} else {
			this.model.selectedTeam = {"id": clickedTeamId, "deselectCallback": deselectCallback};
		}
	}

	getTeamRows() {
		return this.model.getScoreboard().map((t) =>
			<Team key={t.team_id} team={t} model={this.model} handleClick={this.onTeamClick}
				  isSelected={this.model.selectedTeam !== null && this.model.selectedTeam.id === t.team_id}/>
		);
	}

	render() {
		if(this.model === undefined)
			return null;
		const attacks = this.model.serviceIndex2attacksInRound.reduce(function(a, b) {return a + b;});
		return (
			<div id="container">
				<div id="header-container">
					<Progress width={this.width} start={this.model.info.start} end={this.model.info.end}/>
					<div id="header" style={{width: this.width + "px"}}>
						<div id="attacks-header">
							<div className="service-name">attacks</div>
							<div className="attacks">{attacks}</div>
							<div className="min">/min</div>
						</div>
						{this.model.services.slice(0, this.model.servicesCount).map((service, i) =>
							<div key={service.id} className="service-header">
								<div className="service-name" style={{color: this.model.colors[i]}}>{service.name}</div>
								<div className="attacks">{this.model.serviceIndex2attacksInRound[i]}</div>
								<div className="min">/min</div>
							</div>
						)}
					</div>
				</div>
				<div id="scoreboard">
					{this.getTeamRows()}
				</div>
			</div>
		);
	}
}

export default Scoreboard;
