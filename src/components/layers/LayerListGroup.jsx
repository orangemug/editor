import React from 'react'
import PropTypes from 'prop-types'
import Collapser from './Collapser'

export default class LayerListGroup extends React.Component {
  static propTypes = {
    title: PropTypes.string.isRequired,
    isActive: PropTypes.bool.isRequired,
    onActiveToggle: PropTypes.func.isRequired
  }

  render() {
    return <li className="maputnik-layer-list-group">
      <a className="maputnik-layer-list-group-header"
        href="#"
        tabindex="0"
        onClick={e => this.props.onActiveToggle(!this.props.isActive)}
      >
        <span className="maputnik-layer-list-group-title">{this.props.title}</span>
        <span className="maputnik-space" />
        <Collapser
          style={{ height: 14, width: 14 }}
          isCollapsed={this.props.isActive}
        />
      </a>
    </li>
  }
}
