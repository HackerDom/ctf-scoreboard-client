import React, {Component} from 'react';
import * as d3 from 'd3';
import {DataForAttacksGraph} from "./types";

const plotHeight = 30;
const width = 100;
const margin = 2;

interface AttacksplotProps {
    roundsCount: number;
    color: string;
    attacks: DataForAttacksGraph;
}

class attacksplot extends Component<AttacksplotProps> {
    render() {
        const roundsCount = this.props.roundsCount;
        const color = this.props.color;
        const graph = this.props.attacks.graph;
        let path = null;
        let circle = <circle cx={1} cy={plotHeight - 1} r={1} fill={color}/>;
        if (graph.length !== 1) {
            const max = Math.max(this.props.attacks.max);
            const points: [number, number][] = [];
            for (let i = 0; i < graph.length; i++) {
                points.push([graph[i].round * width / roundsCount + margin, plotHeight - (max < 1 ? 0 : graph[i].value * plotHeight / max) + margin]);
            }
            const l = d3.line()
                .x(function (d) {
                    return d[0];
                })
                .y(function (d) {
                    return d[1];
                })
                .curve(d3.curveMonotoneX);
            const d = l(points)!;
            path = <path key={color} d={d.replace(/\.\d+/g, "")}/>;
            circle = <circle cx={points[points.length - 1][0] - 0.5} cy={points[points.length - 1][1] - 0.5} r={1.5}
                             fill={color}/>;
        }
        return (<div className={"attacksplot"} title="Attacks amount per round">
            <svg width={width + 25} height={plotHeight + 4}>
                {path}
                {circle}
            </svg>
        </div>);
    }
}

export default attacksplot;
