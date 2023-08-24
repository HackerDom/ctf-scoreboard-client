import React, {Component} from 'react';

interface PlusminuslineProps {
    plus: number;
    minus: number;
    maxsum: number;
    className?: string;
}

class Plusminusline extends Component<PlusminuslineProps> {
    render() {
        const plus = this.props.plus;
        const minus = this.props.minus;
        const maxsum = this.props.maxsum;
        const className = (this.props.className === undefined) ? "" : " " + this.props.className;
        const plusWidth = Math.max(plus > 0 ? 1 : 0, Math.min(100, plus / maxsum * 99));
        const minusWidth = Math.max(minus > 0 ? 1 : 0, Math.min(100, minus / maxsum * 99));
        const margin = minus > 0 && plus > 0 ? 1 : 0;
        return (
            <div className={"plusminusline" + className}>
                <div className="background-green" style={{width: plusWidth + "%"}}/>
                <div className="background-red" style={{width: minusWidth + "%", marginLeft: margin + "px"}}/>
            </div>
        )
    }
}

export default Plusminusline;
