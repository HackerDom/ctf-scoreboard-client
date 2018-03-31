import React, { Component } from 'react';
import Controller from "./controller";
import Team from './team';
import Progress from './progress';

const controller = new Controller();

class Scoreboard extends Component {
	componentWillMount () {
		let initialized = false;
		controller.on('start', m => {
			this.model = m;
		});
		this.data = [];
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

	getTeamRows() {
		return this.model.getScoreboard().map((t) =>
			<Team key={t.team_id} team={t} model={this.model}/>
		);
	}

	render() {
		if(this.model === undefined)
			return null;
		const attacks = this.model.serviceIndex2attacksInRound.reduce(function(a, b) {return a + b;});
		return (
			<div id="container">
				<div id="header-container">
					<Progress/>
					<div id="header">
						<div id="attacks-header">
							<div className="service-name">attacks</div>
							<div className="attacks">{attacks}</div>
							<div className="min">/min</div>
						</div>
						{this.model.services.map((service, i) =>
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
