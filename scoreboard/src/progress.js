import React, { Component } from 'react';

class Progress extends Component {
	constructor(props) {
		super(props);
		this.countdown_start = props.start * 1000;
		this.countdown_end = props.end * 1000;
		this.diffMs = this.countdown_end - this.countdown_start;
		this.start = Date.now();
		this.state = {elapsed: 0};
		this.compactScoreboardWidth = props.compactScoreboardWidth;
	}

	componentDidMount(){
		const _this = this;
		this.timer = setInterval(function() {_this.setState({elapsed: new Date() - _this.start})}, 60);
	}

	componentWillUnmount() {
		clearInterval(this.timer);
	}

	countdown() {
		let now = Date.now();
		if (now > this.countdown_start) {
			if(now > this.countdown_end) {
				return 0;
			}
			return this.countdown_end - now;
		}
		return this.diffMs;
	}

	static milisecondsToTimeStr(msec) {
		const hh = Math.floor(msec / 1000 / 60 / 60);
		msec -= hh * 1000 * 60 * 60;
		const mm = Math.floor(msec / 1000 / 60);
		msec -= mm * 1000 * 60;
		const ss = Math.floor(msec / 1000);
		msec -= ss * 1000;
		return `${hh}:${Progress.leadingZero(mm)}:${Progress.leadingZero(ss)}`;
	}

	static leadingZero(n) {
		return n < 10 ? "0" + n : n;
	}

	render() {
		const remainingMs = this.countdown();
		if(remainingMs === this.diffMs) {
			return null;
		}
		const percent = Math.round((this.diffMs - remainingMs) / this.diffMs * 100);
		const left = "-" + Progress.milisecondsToTimeStr(remainingMs);
		const current = Progress.milisecondsToTimeStr(this.diffMs - remainingMs).substr(0, 4);
		return (
			<div>
				<div id="progress" style={{width: this.props.width + "px"}}>
					<div id="scale" style={{width: percent + "%"}}></div>
					<div id="hatch" style={{left: percent + "%"}}></div>
					<div id="endhatch" style={{left: this.props.width + "px"}}></div>
					{remainingMs > 35*60*1000 ? <div id="current">{current}</div> : null}
					<div id="left" className={remainingMs > 35*60*1000 ? "" : "timedown"}>{left}</div>
				</div>
				{this.compactScoreboardWidth === 0 ? null : <div id="bigleft">{left}</div>}
			</div>
		);
	}
}

export default Progress;
