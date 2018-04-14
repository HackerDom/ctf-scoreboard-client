import React, { Component } from 'react';

const svgheight = 70;
const barMargin = 4;
const minPartHeight = 20;
const minSumBorder = 30;
const lineBetweenBarsHeight = 2;

class Fbarchart extends Component {
	render() {
		const model = this.props.model;
		const graphData = this.props.graphData;
		const width = this.props.width;
		const plotHeight = svgheight - lineBetweenBarsHeight;
		const roundsCount = model.roundsCount;
		const roundsPerGraphColumn = model.roundsPerGraphColumn;
		const maxSumFlags = Math.max(minSumBorder, Math.max.apply(this, graphData.map((s) => s.map(x => {return x.flags;}).reduce((x, y) => x + y))));
		const maxSumSFlags = Math.max(minSumBorder, Math.max.apply(this, graphData.map((s) => s.map(x => {return x.sflags;}).reduce((x, y) => x + y))));
		const max = maxSumFlags + maxSumSFlags;
		const flagsResult = Array.from(Array(model.servicesCount).keys()).map(i => []);
		const sflagsResult = Array.from(Array(model.servicesCount).keys()).map(i => []);
		const barWidth = width / roundsCount * roundsPerGraphColumn;
		const plusHeight = Math.ceil(Math.min(plotHeight - minPartHeight, Math.max(minPartHeight, plotHeight * (maxSumFlags / max))));

		const flagsBars = [];
		const sflagsBars = [];
		for(let i=1; i<graphData.length; i++) {
			let flagsY = plusHeight;
			let sflagsY = plusHeight + lineBetweenBarsHeight + lineBetweenBarsHeight;
			for(let j=model.servicesCount - 1; j>=0; j--) {
				let flagsBarHeight = (maxSumFlags < 1 ? 0 : graphData[i][j].flags * plotHeight / max);
				let sFlagsBarHeight = (maxSumSFlags < 1 ? 0 : graphData[i][j].sflags * plotHeight / max);
				const color = this.props.model.colors[j];
				const width = barWidth - 2 * barMargin;
				const columnNumber = Math.ceil(graphData[i][j].round / roundsPerGraphColumn) - 1;
				const x = columnNumber * barWidth + barMargin;
				let flagsRect = {
					"x": x,
					"y": flagsY - flagsBarHeight,
					"width": width,
					"height": flagsBarHeight
				};
				flagsResult[j].push(flagsRect);
				flagsBars.push(<rect key={i.toString()+j.toString()+color} height={flagsRect.height} width={flagsRect.width} x={flagsRect.x} y={flagsRect.y} style={{"fill":color}}/>);
				let sflagsRect = {
					"x": x,
					"y": sflagsY,
					"width": width,
					"height": sFlagsBarHeight
				};
				sflagsResult[j].push(sflagsRect);
				flagsBars.push(<rect key={"s"+i.toString()+j.toString()+color} height={sflagsRect.height} width={sflagsRect.width} x={sflagsRect.x} y={sflagsRect.y} style={{"fill":color}}/>);
				flagsY -= flagsBarHeight;
				sflagsY += sFlagsBarHeight;
			}
		}

		const delimeters = [];
		const step = width / roundsCount * model.roundsPerGraphBorder;
		for(let i=1; i<=roundsCount/model.roundsPerGraphBorder; i++) {
			let x = Math.ceil(step*i) - 1;
			delimeters.push(<rect key={i} x={x} y={0} width={1} height={svgheight} className="plotborder"/>)
		}

		const gradientId="sflagsgradient" + Math.random();

		return (
			<div className={"fbarchart"}>
				<svg width={width} height={svgheight + 10}>
					<defs>
						<linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
							<stop offset="0%" stopColor="#FF5656"/>
							<stop offset="10%" stopColor="#FF5656"/>
							<stop offset="100%" stopColor="#FF5656" stopOpacity="0"/>
						</linearGradient>
					</defs>
					<rect fill={"url(#" + gradientId + ")"} fillOpacity="0.4" x="0" y={plusHeight + lineBetweenBarsHeight} width={width} height={svgheight - plusHeight - lineBetweenBarsHeight + 10}/>
					{delimeters}
					<rect height={lineBetweenBarsHeight} width={width} x={0} y={plusHeight} style={{"fill":"#000000"}}/>
					{flagsBars}
					{sflagsBars}
				</svg>
			</div>
		)
	}
}

export default Fbarchart;
