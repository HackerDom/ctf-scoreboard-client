import React, { Component } from "react"

function pad(num, size) {
    var s = "000000000" + num;
    return s.substr(s.length-size);
}

class Timer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            seconds: props.seconds,
        };
        let start = Date.now() / 1000;
        this.timer = setInterval(() => this.setState(s => {
            return {
                seconds: props.seconds - (Date.now() / 1000 - start)
            }
        }), 1000);
    }

    render() {
        let seconds = Math.floor(this.state.seconds);
        let minutes = Math.floor(seconds / 60);
        seconds = seconds % 60;
        let hours = Math.floor(minutes / 60);
        minutes = minutes % 60;
        return <div className="timer" title="This service will disappear soon">
            <span className="mdi mdi-timer green"></span>&nbsp;
            { hours }:{ pad(minutes, 2) }:{ pad(seconds, 2) }
        </div>
    }
}

export default Timer;