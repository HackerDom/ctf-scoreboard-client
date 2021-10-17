import React, {Component} from 'react';
import {GameModel} from "./model";

interface PlotsprogressProps {
    round: number;
    model: GameModel;
}

class Plotsprogress extends Component<PlotsprogressProps> {
    render() {
        const round = this.props.round;
        const model = this.props.model;
        const roundsCount = model.roundsCount;
        const percent = round / roundsCount * 100;
        return round < 60 ? null : (
            <div className="plotsprogress" style={{left: percent + "%"}}>
                <div className="counter">{round}</div>
                <div className="hatch"></div>
            </div>
        );
    }
}

export default Plotsprogress;