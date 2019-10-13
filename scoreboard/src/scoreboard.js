import React, { Component } from 'react';
import Controller from "./controller";
import Team from './team';
import Progress from './progress';
import CompactScoreboard from './compactscoreboard';
import AttacksPlot from './attacksplot';
import {getParameterByName} from "./utils"

const controller = new Controller();
const collapsedTeamWidth = 100;

class Scoreboard extends Component {
	constructor(props) {
		super(props);
		this.onTeamClick = this.onTeamClick.bind(this);
		this.compactScoreboardWidth = parseInt(getParameterByName("compactScoreboardWidth"), 10);
		this.compactScoreboardWidth = isNaN(this.compactScoreboardWidth) ? 0 : this.compactScoreboardWidth;
		this.autoOpenPeriod = parseInt(getParameterByName("autoOpen"), 10); // seconds
		this.autoOpenPeriod = isNaN(this.autoOpenPeriod) ? 0 : this.autoOpenPeriod * 1000;
		this.forSave = getParameterByName("forSave") !== null;
		this.additionalStyle = getParameterByName("style");
		this.nextTeamToOpen = 0;
	}

	componentDidMount () {
		let initialized = false;
		controller.on('start', m => {
			this.model = m;
			this.zoom = 1;
		});
		controller.on('updateScoreboard', () => {
			if(this.model.scoreboard === undefined)
				return;
			if (!initialized) {
				this.teamRefs = [];
				for (let i = 0; i < this.model.getScoreboard().length; i++)
					this.teamRefs.push(null);
			}
			this.forceUpdate();
			const _this = this;
			this.width = this.model.team_width + this.model.one_servive_width * this.model.active_services.length;
			_this.initResize();
			initialized = true;
			if(this.forSave) {
				this.prepareForSave();
			}
		});
		controller.on('history', () => {
			if(initialized) {
				this.forceUpdate();
			}
		});
		if(this.autoOpenPeriod !== 0) {
			this.autoOpenScript();
		}
		this.isFirefox = typeof InstallTrigger !== 'undefined';
		// Internet Explorer 6-11
		this.isIE = /*@cc_on!@*/false || !!document.documentMode;
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

	prepareForSave() {
		const _this = this;
		setInterval(() => {
			for (let i = 0; i < this.teamRefs.length; i++)
				_this.teamRefs[i].open();
		}, 5000);
	}

	initResize() {
		const width = this.width;
		const _this = this;
		function resize() {
			const container = document.getElementById('container');
			if(window.outerWidth < 150)
				return;
			if(container !== null && !_this.isIE) {
				if (window.outerWidth - _this.compactScoreboardWidth < width) {
					_this.zoom = (window.outerWidth - 40 - _this.compactScoreboardWidth) / width;
					if(_this.isFirefox)
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
		if(this.model === undefined || this.model.scoreboard === undefined)
			return null;
		const attacks = this.model.serviceIndex2attacksInRound.reduce(function(a, b) {return a + b;});
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
		return (
			<div className={this.additionalStyle === null ? "" : this.additionalStyle}>
			{this.compactScoreboardWidth === 0 ? null : <CompactScoreboard model={this.model} width={this.compactScoreboardWidth}/>}
			<div id="container-wrapper" style={{marginLeft: this.compactScoreboardWidth + "px"}}>
			<div id="container">
				<div id="header-container" style={{width: headerContainerWidth}}>
					<Progress width={this.width} start={this.model.info.start} end={this.model.info.end} compactScoreboardWidth={this.compactScoreboardWidth}/>
					<div id="header" style={{width: this.width + "px"}}>
						<div id="attacks-header">
							<AttacksPlot color={"white"} attacks={this.model.getDataForAttacksGraph()} model={_this.model}/>
							<div className="service-name">attacks</div>
							<div className="attacks">{attacks}</div>
							<div className="min">/round</div>
						</div>
						{this.model.services.slice(0, this.model.servicesCount).map((service, i) =>
							{
								if (! this.model.active_services.includes(parseInt(service.id)))
									return null;
								return (
									<div key={service.id} className="service-header">
										<AttacksPlot color={this.model.colors[i]} attacks={_this.model.getDataForAttacksGraph(i)} model={_this.model}/>
										<div className="service-name" style={{color: this.model.colors[i]}}>{service.name}</div>
										<div className="attacks">{this.model.serviceIndex2attacksInRound[i]}</div>
										<div className="min">/round</div>
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
