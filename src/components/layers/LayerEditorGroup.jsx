import React from 'react'
import PropTypes from 'prop-types'
import Collapser from './Collapser'
import Collapse from './Collapse'


export default class LayerEditorGroup extends React.Component {
  static propTypes = {
    "data-wd-key": PropTypes.string,
    title: PropTypes.string.isRequired,
    isActive: PropTypes.bool,
    children: PropTypes.node.isRequired
  }

  static defaultProps = {
    isActive: true
  }

  constructor(props) {
    super(props);
    this.state = {
      isActive: props.isActive
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
      <Collapse isActive={this.props.isActive}>
        <div className="react-collapse-container">
          {this.props.children}
        </div>
      </Collapse>
    </div>
  }
}
