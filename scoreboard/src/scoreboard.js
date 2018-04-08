import React, { Component } from 'react';
import Controller from "./controller";
import Team from './team';
import Progress from './progress';
import CompactScoreboard from './compactscoreboard';
import {getParameterByName} from "./utils"

const controller = new Controller();
const collapsedTeamWidth = 100;

class Scoreboard extends Component {
	constructor(props) {
		super(props);
		this.onTeamClick = this.onTeamClick.bind(this);
		this.compactScoreboardWidth = parseInt(getParameterByName("compactScoreboardWidth"));
		this.compactScoreboardWidth = isNaN(this.compactScoreboardWidth) ? 0 : this.compactScoreboardWidth;
		this.autoOpenPeriod = parseInt(getParameterByName("autoOpen")); // seconds
		this.autoOpenPeriod = isNaN(this.autoOpenPeriod) ? 0 : this.autoOpenPeriod * 1000;
		this.nextTeamToOpen = 0;
	}

	componentDidMount () {
		let initialized = false;
		controller.on('start', m => {
			this.model = m;
			this.width = this.model.team_width + this.model.one_servive_width * this.model.servicesCount;
			this.zoom = 1;
		});
		controller.on('updateScoreboard', () => {
			if (!initialized) {
				this.teamRefs = [];
				for (let i = 0; i < this.model.getScoreboard().length; i++)
					this.teamRefs.push(null);
			}
			this.forceUpdate();
			const _this = this;
			_this.initResize();
			initialized = true;
		});
		controller.on('history', () => {
			if(initialized) {
				this.forceUpdate();
			}
		});
		if(this.autoOpenPeriod !== 0) {
			this.autoOpenScript();
		}
	}

	autoOpenScript() {
		const _this = this;
		setInterval(() => {
			if(_this.teamRefs !== undefined) {
				if(_this.teamRefs[_this.nextTeamToOpen] !== null) {
					_this.teamRefs[_this.nextTeamToOpen].handleClick();
					window.scroll({top: collapsedTeamWidth * this.zoom * _this.nextTeamToOpen, left: 0, behavior: 'smooth'});
				}
				_this.nextTeamToOpen++;
				if(_this.nextTeamToOpen >= _this.model.getScoreboard().length)
					_this.nextTeamToOpen = 0;
			}
		}, this.autoOpenPeriod);
	}

	initResize() {
		const width = this.width;
		const _this = this;
		function resize() {
			const container = document.getElementById('container');
			if(container != null) {
				if (window.outerWidth - _this.compactScoreboardWidth < width) {
					_this.zoom = (window.outerWidth - 40 - _this.compactScoreboardWidth) / width;
					container.setAttribute("style", "zoom:" + _this.zoom + ";");
				} else {
					_this.zoom = 1;
					container.setAttribute("style", "");
				}
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
		return this.model.getScoreboard().map((t, i) =>
			<Team ref={instance => { this.teamRefs[i] = instance; }} key={t.team_id} team={t} model={this.model} handleClick={this.onTeamClick}
				  isSelected={this.model.selectedTeam !== null && this.model.selectedTeam.id === t.team_id}/>
		);
	}

	render() {
		if(this.model === undefined)
			return null;
		const attacks = this.model.serviceIndex2attacksInRound.reduce(function(a, b) {return a + b;});
		const container = document.getElementById('container');
		return (
			<div>
			{this.compactScoreboardWidth === 0 ? null : <CompactScoreboard model={this.model} width={this.compactScoreboardWidth}/>}
			<div id="container-wrapper" style={{marginLeft: this.compactScoreboardWidth + "px"}}>
			<div id="container">
				<div id="header-container" style={{width: this.compactScoreboardWidth === 0 ? "100%" : container == null ? this.width : container.offsetWidth}}>
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
			</div>
			</div>
		);
	}
}

export default Scoreboard;
