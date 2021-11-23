import React from "react"

interface TimerState {
    seconds: number,
}

interface TimerProps {
    seconds: number,
    direction: "forward" | "backward" | "none"
    title: string
}

class Timer extends React.Component<TimerProps, TimerState> {
    timer: NodeJS.Timer;

    constructor(props: TimerProps) {
        super(props);
        this.state = {
            seconds: props.seconds,
        };
        const start = Date.now() / 1000;
        this.timer = setInterval(() => this.setState(s => {
            if (this.props.direction === "backward")
                return {
                    seconds: Math.max(0, props.seconds - (Date.now() / 1000 - start))
                }
            if (this.props.direction === "forward")
                return {
                    seconds: props.seconds + (Date.now() / 1000 - start)
                }
        }), 1000);
    }

    render() {
        let seconds = Math.floor(this.state.seconds);
        let minutes = Math.floor(seconds / 60);
        seconds = seconds % 60;
        const hours = Math.floor(minutes / 60);
        minutes = minutes % 60;
        return <div className="timer" title={this.props.title}>
            { hours }:{ Timer.pad(minutes, 2) }:{ Timer.pad(seconds, 2) }
        </div>
    }

    static pad(num: number, size: number) {
        const s = "000000000" + num;
        return s.substring(s.length-size);
    }
}

export default Timer;
