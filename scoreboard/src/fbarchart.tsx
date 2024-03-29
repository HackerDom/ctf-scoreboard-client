import React, { Component } from 'react';
import {GameModel} from "./model";
import {ServicesFlagsForGraphs} from "./types";

const svgheight = 70;
const barMargin = 4;
const minPartHeight = 20;
const minSumBorder = 30;
const lineBetweenBarsHeight = 2;

interface FbarchartProps {
	model: GameModel;
	graphData: ServicesFlagsForGraphs[][];
	width: number;
}

interface Position {
	x: number;
	y: number;
	width: number;
	height: number;
}

class Fbarchart extends Component<FbarchartProps> {
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
		const flagsResult: Position[][] = Array.from(Array(model.servicesCount).keys()).map(i => []);
		const sflagsResult: Position[][] = Array.from(Array(model.servicesCount).keys()).map(i => []);
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
				const color = this.props.model.fillClasses[j];
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
				flagsBars.push(<rect key={i.toString()+j.toString()+color} height={Math.ceil(flagsRect.height)} width={Math.ceil(flagsRect.width)} x={Math.ceil(flagsRect.x)} y={Math.ceil(flagsRect.y)} className={color}/>);
				let sflagsRect = {
					"x": x,
					"y": sflagsY,
					"width": width,
					"height": sFlagsBarHeight
				};
				sflagsResult[j].push(sflagsRect);
				sflagsBars.push(<rect key={"s"+i.toString()+j.toString()+color} height={Math.ceil(sflagsRect.height)} width={Math.ceil(sflagsRect.width)} x={Math.ceil(sflagsRect.x)} y={Math.ceil(sflagsRect.y)} className={color}/>);
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
							<stop offset="0%" stopColor="#5b773d"/>
							<stop offset="10%" stopColor="#5b773d"/>
							<stop offset="100%" stopColor="#5b773d" stopOpacity="0"/>
						</linearGradient>
					</defs>
					<rect fill={"url(#" + gradientId + ")"} fillOpacity="0.4" x="0" y={plusHeight + lineBetweenBarsHeight} width={width} height={svgheight - plusHeight - lineBetweenBarsHeight + 10}/>
					{delimeters}
					<rect height={Math.round(lineBetweenBarsHeight)} width={Math.ceil(width)} x={0} y={Math.ceil(plusHeight)} className="svgDelimeter"/>
					{flagsBars}
					{sflagsBars}
				</svg>
			</div>
		)
	}
}

export default Fbarchart;
