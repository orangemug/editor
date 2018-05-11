import React from 'react'
import PropTypes from 'prop-types'

export default class DocLabel extends React.Component {
  static propTypes = {
    label: PropTypes.oneOfType([
      PropTypes.object,
      PropTypes.string
    ]).isRequired,
    doc: PropTypes.string.isRequired,
    id: PropTypes.string,
  }

  render() {
    return <div className="maputnik-doc-wrapper">
      <div className="maputnik-doc-target">
        <label for={this.props.id+"_element"}>{this.props.label}</label>
        <div id={this.props.id} className="maputnik-doc-popup">
          {this.props.doc}
        </div>
      </div>
    </div>
  }
}
