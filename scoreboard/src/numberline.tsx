import React, {Component} from 'react';

interface NumberlineProps {
    className?: string;
    percent: number;
    color: string;
}

class Numberline extends Component<NumberlineProps> {
    render() {
        const percent = Math.round(this.props.percent);
        const color = this.props.color;
        const className = (this.props.className === undefined) ? "" : " " + this.props.className;
        return (
            <div className={"numberline" + className}>
                <div style={{backgroundColor: color, width: Math.max(this.props.percent > 0 ? 1 : 0, percent) + "%"}}/>
            </div>
        )
    }
}

export default Numberline;
