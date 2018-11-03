import React, { Component } from 'react';
const d3 = Object.assign(require("d3-shape"));

const plotHeight = 30;
const width = 100;
const margin = 2;

class attacksplot extends Component {
	render() {
		const model = this.props.model;
		const color = this.props.color;
		const graph = this.props.attacks.graph;
		let path = null;
		let circle = <circle cx={1} cy={plotHeight - 1} r={1} fill={color}/>;
		if(graph.length !== 1) {
			const max = Math.max(this.props.attacks.max);
			const roundsCount = model.roundsCount;
			const points = [];
			for(let i=0; i<graph.length; i++) {
				points.push({"x":graph[i].round * width / roundsCount + margin, "y":plotHeight - (max < 1 ? 0 : graph[i].value * plotHeight / max) + margin});
			}
			const l = d3.line()
				.x(function(d){return d.x;})
				.y(function(d){return d.y;})
				.curve(d3.curveMonotoneX);
			const d = l(points);
			path = <path key={color} d={d.replace(/\.\d+/g, "")}/>;
			circle = <circle cx={points[points.length - 1].x - 0.5} cy={points[points.length - 1].y - 0.5} r={1.5} fill={color}/>;
		}
		return (<div className={"attacksplot"}>
			<svg width={width + 25} height={plotHeight + 4}>
				{path}
				{circle}
			</svg>
		</div>);
	}
}

export default attacksplot;