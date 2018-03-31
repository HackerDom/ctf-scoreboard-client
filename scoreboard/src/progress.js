import React, { Component } from 'react';

const countdown_start = new Date(2017, 11, 2, 11, 0, 0, 0); // monthis from 0, utc start time
const diff = 8 * 60 * 60 * 1000;
const countdown_end = new Date(countdown_start.getTime() + diff);

class Progress extends Component {
	constructor(props) {
		super(props);
		this.start = Date.now();
		this.state = {elapsed: 0};
	}

	componentDidMount(){
		const _this = this;
		this.timer = setInterval(function() {_this.setState({elapsed: new Date() - _this.start})}, 60);
	}

	componentWillUnmount() {
		clearInterval(this.timer);
	}

	static countdown() {
		let now = new Date().getTime();
		const utcOffsetMilliseconds = new Date().getTimezoneOffset() * 60000;
		now += utcOffsetMilliseconds;
		if (now > countdown_start.getTime()) {
			if(now > countdown_end.getTime()) {
				return 0;
			}
			return countdown_end.getTime() - now;
		}
		return diff;
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
		const remainingMs = Progress.countdown();
		if(remainingMs === diff) {
			return null;
		}
		const percent = Math.round((diff - remainingMs) / diff * 100);
		const left = "-" + Progress.milisecondsToTimeStr(remainingMs);
		const current = Progress.milisecondsToTimeStr(diff - remainingMs).substr(0, 4);
		return (
			<div id="progress">
				<div id="scale" style={{width: percent + "%"}}></div>
				<div id="hatch" style={{left: percent + "%"}}></div>
				<div id="endhatch"></div>
				{remainingMs > 35*60*1000 ? <div id="current">{current}</div> : null}
				<div id="left" className={remainingMs > 35*60*1000 ? "" : "timedown"}>{left}</div>
			</div>
		);
	}
}

export default Progress;
