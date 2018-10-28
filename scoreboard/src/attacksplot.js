import React, { Component } from 'react';
import fpplot from "./fpplot";
const d3 = Object.assign(require("d3-shape"));

class attacksplot extends Component {
	render() {
		const color = this.props.color;
		const graph = this.props.attacks.graph;
		const ybound = this.props.attacks.max;
		return (<div></div>);
	}
}

export default attacksplot;