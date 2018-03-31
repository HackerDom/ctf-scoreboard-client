import React, { Component } from 'react';

const PeriodLength = 6;

class Slaline extends Component {

	static unitePeriods(periods) {
		const unitedPeriods = [];
		for(let i=0; i<Math.floor(periods.length / PeriodLength); i++) {
			let trueCount = 0;
			for(let j=i*PeriodLength; j<(i+1)*PeriodLength; j++)
				trueCount += periods[j] ? 1 : 0;
			unitedPeriods.push(trueCount > PeriodLength / 2);
		}
		if(periods.length % PeriodLength > 0)
			unitedPeriods.push(periods[periods.length - 1]);
		else
			unitedPeriods[unitedPeriods.length - 1] = periods[periods.length - 1];
		return unitedPeriods;
	}

	static gluePeriods(periods) {
		if(periods.length === 0)
			return [];
		let result = [];
		for(let i=0; i<periods.length - 1; i++) {
			if(periods[i]) {
				if(result.length > 0 && result[result.length - 1].pos + result[result.length - 1].width === i)
					result[result.length - 1].width += 1;
				else
					result.push({isUp: periods[i], width: 1, pos: i});
			}
		}
		result.push({isUp: periods[periods.length-1], width: 1, pos: periods.length-1});
		return result;
	}

	render() {
		const periods = this.props.periods; // [0:true, 1:false, ...] true
		const className = (this.props.className === undefined) ? "" : " " + this.props.className;
		if(periods.length === 0)
			return null;
		const unitedPeriods = Slaline.unitePeriods(periods);
		const gluedPeriods = Slaline.gluePeriods(unitedPeriods);
		return (
			<div className={"slaline" + className}>
				<svg width="80" height="10">
					{gluedPeriods.map(function(p, i) {
						const className = (i === gluedPeriods.length - 1 ? "colored " : "") + (p.isUp ? "rect-green" : "rect-red");
						return (<rect key={p.pos} height="10" width={p.width} x={p.pos} y={0} className={className}/>);
					})}
				</svg>
			</div>
		)
	}
}

export default Slaline;
