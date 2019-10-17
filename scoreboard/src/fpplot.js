import React, { Component } from 'react';
const d3 = Object.assign(require("d3-shape"));

const svgheight = 210;
const minSumBorder = 3000;

class fpplot extends Component {
	render() {
		const model = this.props.model;
		const graphData = this.props.graphData;
		const width = this.props.width;
		const plotHeight = svgheight - 2;
		const roundsCount = model.roundsCount;
		let maxSum = Math.max.apply(this, graphData.map((s) => s.map(x => {return x.fp;}).reduce((x, y) => x + y)));
		maxSum = Math.max(minSumBorder, maxSum);
		const points = Array.from(Array(model.servicesCount).keys()).map(i => []);
		for(let i=0; i<graphData.length; i++) {
			let sum = 0;
			for(let j=model.servicesCount - 1; j>=0; j--) {
				sum += graphData[i][j].fp;
				points[j].push({"x":graphData[i][j].round * width / roundsCount, "y": plotHeight - (maxSum < 1 ? 0 : sum * plotHeight / maxSum)});
			}
		}
		const paths = points.map((r, i) => {
			const l = d3.line()
				.x(function(d){return d.x;})
				.y(function(d){return d.y;})
				.curve(d3.curveMonotoneX);
			const d = l(r)+"L"+r[r.length-1].x+","+r[0].y;
			const color = this.props.model.colors[i];
			return <path key={i} d={d.replace(/\.\d+/g, "")} fill={color}><title>{model.services[i].name.toUpperCase()}</title></path>
		});

		const delimeters = [];
		const step = width / roundsCount * model.roundsPerGraphBorder;
		for(let i=1; i<=roundsCount/model.roundsPerGraphBorder; i++) {
			let x = Math.ceil(step*i) - 1;
			delimeters.push(<rect key={i} x={x} y={0} width={1} height={svgheight} className="plotborder"/>);
			if(x < width - 30) {
				let text = <text key={"t" + i} x={x} y={svgheight + 20} className="plottext">{i * model.roundsPerGraphBorder}</text>;
				delimeters.push(text);
			}
		}

		return (
			<div className={"flagsgraph"}>
				<svg width={width} height={svgheight + 20}>
					{delimeters}
					<rect height="2" width={Math.ceil(width)} x={0} y={svgheight-2} className="svgDelimeter"/>
					{paths}
				</svg>
			</div>
		)
	}
}

export default fpplot;
