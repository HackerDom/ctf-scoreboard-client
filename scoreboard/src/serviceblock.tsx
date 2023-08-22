import React, {Component} from 'react';
import {addSpacesToNumber} from "./utils"
import Numberline from './numberline';
import Plusminusline from './plusminusline';
import Slaline from './slaline';
import {GameModel} from "./model";
import {ServiceState, TeamState} from "./types";

const status2Name = {
    101: "up",
    102: "corrupt",
    103: "mumble",
    104: "down",
    110: "checker error",
    111: "service disabled"
};
const status2Class = {
    101: "up",
    102: "corrupt",
    103: "mumble",
    104: "down",
    110: "checker_error",
    111: "service_disabled"
};

interface ServiceblockProps {
    color: string;
    round: number;
    model: GameModel;
    team: TeamState;
    service: ServiceState;
    aggregate?: boolean;
}

class Serviceblock extends Component<ServiceblockProps> {
    render() {
        const color = this.props.color;
        const service = this.props.service;
        const team = this.props.team;
        const round = this.props.round;
        const model = this.props.model;
        const max_service_score = model.max_service_score;
        const max_flags_sum = model.max_flags_sum;
        const sla_periods = this.props.aggregate ? [] : model.getSlaPeriods(team.team_id.toString(), service.id.toString());
        const roundsCount = model.roundsCount;
        const maxSla = Math.ceil((service.sla * round + 100 * (roundsCount - round)) / roundsCount);
        let serviceReleased = true;
        model.services.forEach((s, i) => {
            if (s.id === service.id.toString()) {
                serviceReleased = model.services[i].phase !== "NOT_RELEASED";
            }
        })

        return (
            <div key={service.id} title={service.stdout} className="team_border team_service">
                <div className="fp">{addSpacesToNumber(Number(service.fp.toFixed(2)))}</div>
                <Numberline color={color} percent={service.fp / max_service_score * 100} className="service_fp_line"/>
                <div className="flags">
                    <span className="mdi mdi-flag"> <span title={"Flags amount stolen by " + team.name}>{service.flags}</span>{service.sflags > 0 ?
                        <span> / <span className="sflags" title={"Flags amount stolen from " + team.name}>-{service.sflags}</span></span> : null}</span>
                </div>
                <Plusminusline plus={service.flags} minus={service.sflags} maxsum={max_flags_sum}
                               className="flags_line"/>
                {serviceReleased && !this.props.aggregate && <div className="sla">
                    <div className={"slapercent " + status2Class[service.status]} title="SLA">
                        {Math.round(service.sla)}{Math.round(service.sla) < 100 ? "%" : ""}{service.status === 101
                        ? <span className="mdi mdi-arrow-up-bold"/>
                        : <span className="mdi mdi-arrow-down-bold"/>}
                    </div>
                    <Slaline className="slalineblock" periods={sla_periods} periodLength={model.slaPeriodLength}
                             width={model.slalineWidth}/>
                    <div className="status">
                        <div className={(service.status === 101 ? " hidden " : "" + status2Class[service.status])}>
                            {status2Name[service.status]}
                        </div>
                    </div>
                    <div className="maxSla">max {maxSla}%</div>
                </div>
                }
            </div>
        )
    }
}

export default Serviceblock;
