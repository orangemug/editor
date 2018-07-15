import React from 'react'
import PropTypes from 'prop-types'
import Collapser from './Collapser'
import classnames from 'classnames'

export default class LayerListGroup extends React.Component {
  static propTypes = {
    title: PropTypes.string.isRequired,
    "data-wd-key": PropTypes.string,
    isActive: PropTypes.bool.isRequired,
    onActiveToggle: PropTypes.func.isRequired
  }

  render() {
    return <li
      className={classnames({
        "maputnik-layer-list-group": true,
        "maputnik-layer-list-group--error": this.props.hasError
      })}
    >
      <div className="maputnik-layer-list-group-header"
        data-wd-key={"layer-list-group:"+this.props["data-wd-key"]}
        onClick={e => this.props.onActiveToggle(!this.props.isActive)}
      >
        <span className="maputnik-layer-list-group-title">
          {this.props.hasError && "[error] "}
          {this.props.title}
        </span>
        <span className="maputnik-space" />
        <Collapser
          style={{ height: 14, width: 14 }}
          isCollapsed={this.props.isActive}
        />
      </div>
    </li>
  }
}
