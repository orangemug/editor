import React from 'react'
import PropTypes from 'prop-types'
import ScrollContainer from './ScrollContainer'

class AppLayout extends React.Component {
  static propTypes = {
    toolbar: PropTypes.element.isRequired,
    layerList: PropTypes.element.isRequired,
    layerEditor: PropTypes.element,
    map: PropTypes.element.isRequired,
    bottom: PropTypes.element,
  }

  static childContextTypes = {
    reactIconBase: PropTypes.object
  }

  getChildContext() {
    return {
      reactIconBase: { size: 14 }
    }
  }

  render() {
    return <div className="maputnik-layout">
      {this.props.toolbar}
      <div style={{display: "flex", flexDirection: "column", flex: 1, boxShadow: "-1px 0px 6px 0px rgba(0, 0, 0, 0.28)"}}>
        <div style={{height: "41px", padding: "12px", borderBottom: "solid 1px #36383e"}}>
          {this.props.filename}
        </div>
        <div style={{display: "flex", flex: 1}}>
          <div className="maputnik-layout-list">
            <ScrollContainer>
              {this.props.layerList}
            </ScrollContainer>
          </div>
          <div className="maputnik-layout-drawer">
            <ScrollContainer>
              {this.props.layerEditor}
            </ScrollContainer>
          </div>
          {this.props.map}
          {this.props.bottom && <div className="maputnik-layout-bottom">
              {this.props.bottom}
            </div>
          }
        </div>
      </div>
    </div>
  }
}

export default AppLayout
