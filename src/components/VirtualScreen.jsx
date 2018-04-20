import React from 'react'


export default class VirtualScreen extends React.Component {
  constructor(props) {
    super(props)
    this.state = this._scaleToMax(props.width, props.height, 500, 500, false);

    this._updateState = this._updateState.bind(this);
  }

	_scaleToMax(w, h, mw, mh, stretch) {
		var scale = 1;
		var scaledW = w;
		var scaledH = h;

		if(stretch || (h > mh || w > mw)) {
			var hd = mh/h;
			var wd = mw/w;
			var hd = parseFloat(hd.toFixed(3));
			var wd = parseFloat(wd.toFixed(3));
			
			if(hd<wd) {
				scale = hd;
			} else {
				scale = wd;
			}

			scaledW = w * scale;
			scaledH = h * scale;
		}

		return {
      width: w,
      height: h,
			scaledWidth: scaledW,
			scaledHeight: scaledH,
			scale: scale
		};
	}

  componentWillReceiveProps(nextProps) {
    this._updateState(nextProps);
  }

  _updateState(props=this.props) {
    const bb = this.el.getBoundingClientRect()

    this.setState(
      this._scaleToMax(props.width, props.height, bb.width, bb.height, false)
    );
  }

  componentDidMount() {
    this._updateState();
    window.addEventListener("resize", this._updateState);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this._updateState);
  }

  render() {
    const containerStyle = {
      width:  this.state.scaledWidth+"px",
      height: this.state.scaledHeight+"px",
      position: "relative",
      overflow: "hidden",
    }

    const screenStyle = {
      width:  this.state.width+"px",
      height: this.state.height+"px",
      transform: "scale("+this.state.scale+")",
      transformOrigin: "0px 0px 0px",
    }

    const labelStyle = {
      textAlign: "center",
      marginTop: "4px"
    }

    return (
      <div
        className="virtual-screen"
        style={{
          "width": "100%",
          "height": "100%",
          "display": "flex",
          "justifyContent": "center",
          "alignItems": "center",
          "width": "100%",
          "height": "100%"
        }}
        ref={(el) => this.el = el}
      >
        <div className="virtual-screen__screen">
          <div className="virtual-screen__container" style={containerStyle}>
            <div className="virtual-screen__screen__el" style={screenStyle}>
              {this.props.children}
            </div>
          </div>
          <div className="virtual-screen__screen__label" style={labelStyle}>
            Scaled by {this.state.scale}
          </div>
        </div>
      </div>
    )
  }
}
