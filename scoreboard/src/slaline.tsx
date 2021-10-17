import React, {Component} from 'react';

interface SlalineProps {
    periodLength: number;
    className?: string;
    width: number;
    periods: boolean[];
}

interface GluePeriod {
    isUp: boolean;
    width: number;
    pos: number;
}

class Slaline extends Component<SlalineProps> {

    static unitePeriods(periods: boolean[], periodLength: number) {
        const unitedPeriods = [];
        for (let i = 0; i < Math.floor(periods.length / periodLength); i++) {
            let trueCount = 0;
            for (let j = i * periodLength; j < (i + 1) * periodLength; j++)
                trueCount += periods[j] ? 1 : 0;
            unitedPeriods.push(trueCount > periodLength / 2);
        }
        if (periods.length % periodLength > 0)
            unitedPeriods.push(periods[periods.length - 1]);
        else
            unitedPeriods[unitedPeriods.length - 1] = periods[periods.length - 1];
        return unitedPeriods;
    }

    static gluePeriods(periods: boolean[]): GluePeriod[] {
        if (periods.length === 0)
            return [];
        let result: GluePeriod[] = [];
        for (let i = 0; i < periods.length - 1; i++) {
            if (periods[i]) {
                if (result.length > 0 && result[result.length - 1].pos + result[result.length - 1].width === i)
                    result[result.length - 1].width += 1;
                else
                    result.push({isUp: periods[i], width: 1, pos: i});
            }
        }
        result.push({isUp: periods[periods.length - 1], width: 1, pos: periods.length - 1});
        return result;
    }

    render() {
        const periodLength = this.props.periodLength;
        const width = this.props.width;
        const periods = this.props.periods; // [0:true, 1:false, ...] true
        const className = (this.props.className === undefined) ? "" : " " + this.props.className;
        if (periods.length === 0)
            return null;
        const unitedPeriods = Slaline.unitePeriods(periods, periodLength);
        const gluedPeriods = Slaline.gluePeriods(unitedPeriods);
        return (
            <div className={"slaline" + className}>
                <svg width={width} height="10">
                    {gluedPeriods.map(function (p, i) {
                        const className = (i === gluedPeriods.length - 1 ? "colored " : "") + (p.isUp ? "rect-green" : "rect-red");
                        return (<rect key={p.pos} height="10" width={p.width} x={p.pos} y={0} className={className}/>);
                    })}
                </svg>
            </div>
        )
    }
}

export default Slaline;
