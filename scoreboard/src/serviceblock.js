import React, { Component } from 'react';
import {addSpacesToNumber} from "./utils"
import Numberline from './numberline';
import Plusminusline from './plusminusline';
import Slaline from './slaline';

const status2Name = {101: "up", 102: "corrupt", 103: "mumble", 104: "down", 110: "checker error"};
const status2Color = {101: "#84E668", 102: "#ffef65", 103: "#f9a963", 104: "#FF5656", 110: "#FFFFFF"};

class Serviceblock extends Component {
	render() {
		const color = this.props.color;
		const service = this.props.service;
		const team = this.props.team;
		const round = this.props.round;
		const max_service_score = this.props.model.max_service_score;
		const max_flags_sum = this.props.model.max_flags_sum;
		const sla_periods = this.props.model.getSlaPeriods(team.team_id, service.id);
		const roundsCount = this.props.model.info.roundsCount;
		const maxSla = Math.ceil((service.sla*round + 100*(roundsCount - round))/roundsCount);
		return (
			<div key={service.id} title={service.stdout} className="team_border team_service">
				<div className="fp">{addSpacesToNumber(Number(service.fp.toFixed(2)))}</div>
				<Numberline color={color} percent={service.fp / max_service_score * 100} className="service_fp_line"/>
				<div className="flags">
					<span className="mdi mdi-flag"> {service.flags}{service.sflags > 0 ? <span> / <span className="sflags">-{service.sflags}</span></span> : null}</span>
				</div>
				<Plusminusline plus={service.flags} minus={service.sflags} maxsum={max_flags_sum} className="flags_line"/>
				<div className="sla">
					<div className={"slapercent"} style={{"color": status2Color[service.status]}}>
						{Math.round(service.sla)}{Math.round(service.sla) < 100 ? "%" : ""}{service.status === 101
							? <span className="mdi mdi-arrow-up-bold"/>
							: <span className="mdi mdi-arrow-down-bold"/>}
					</div>
					<Slaline className="slalineblock" periods={sla_periods}/>
					<div className="status"><div className={(service.status === 101 ? " hidden" : "")}  style={{"color": status2Color[service.status]}}>{status2Name[service.status]}</div></div>
					<div className="maxSla">max {maxSla}%</div>
				</div>
			</div>
		)
	}
}

export default Serviceblock;
