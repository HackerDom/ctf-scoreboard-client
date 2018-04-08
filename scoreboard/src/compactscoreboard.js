import React, { Component } from 'react';
import {addSpacesToNumber} from "./utils"
import _ from "underscore";

class CompactScoreboard extends Component {
	render() {
		const model = this.props.model;
		const width = this.props.width;
		const scoreboard = model.getScoreboard();
		const img_height = Math.max((window.innerHeight - 60) / scoreboard.length - 10, 3);
		const place_size = Math.max(img_height - 4, 3);
		const teams = _.sortBy(scoreboard, function(t){ return parseFloat(t.score); }).reverse();
		return (
			<div id="compact-container-wrapper" style={{height:window.innerHeight+"px", width:width+"px"}}>
			<div id="compact-container">
				<table>
					<tbody>
					{teams.map((team, i) =>
						<tr key={"tr"+i}>
							<td><div className="place" style={{width:place_size + "px", height:place_size + "px", lineHeight:place_size + "px"}}>{i + 1}</div></td>
							<td><img height={img_height} width={img_height} src={model.getLogo(team)}/></td>
							<td><div>{team.name}</div></td>
							<td><div>{addSpacesToNumber(team.score)}</div></td>
						</tr>
					)}
					</tbody>
				</table>
			</div>
			</div>
		)
	}
}

export default CompactScoreboard;