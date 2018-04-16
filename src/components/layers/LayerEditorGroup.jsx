import React from 'react'
import PropTypes from 'prop-types'
import Collapse from 'react-collapse'
import Collapser from './Collapser'

export default class LayerEditorGroup extends React.Component {
  static propTypes = {
    "data-wd-key": PropTypes.string,
    title: PropTypes.string.isRequired,
    isActive: PropTypes.bool.isRequired,
    children: PropTypes.element.isRequired,
    onActiveToggle: PropTypes.func.isRequired
  }

  constructor(props) {
    super(props);
    this.state = {
      isActive: true
    };
  }

  onActiveToggle() {
    this.setState({
      isActive: !this.state.isActive
    })
  }

  render() {
    return <div>
      <div className="maputnik-layer-editor-group"
        data-wd-key={"layer-editor-group:"+this.props["data-wd-key"]}
        onClick={e => this.onActiveToggle()}
      >
        <span>{this.props.title}</span>
        <span style={{flexGrow: 1}} />
        <Collapser isCollapsed={this.state.isActive} />
      </div>
      <Collapse isOpened={this.state.isActive}>
        {this.props.children}
      </Collapse>
    </div>
  }
}
