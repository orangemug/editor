import classnames from 'classnames'
import React from 'react'
import PropTypes from 'prop-types'
import ScrollContainer from './ScrollContainer'
import logoImage from 'maputnik-design/logos/logo-color.svg'
import pkgJson from '../../package.json'

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

  getStyleState(file) {
    let state;

    if(this.props.revisionStore.numberOfRevisions > 0) {
      state = "unsaved-changes";
    }
    else {
      state = "up-to-date";
    }

    const messages = {
      "up-to-date": "in sync",
      "unsaved-changes": "unsaved changes"
    }

    const message = messages[state];

    return (
      <div className={classnames({
        'filetype-icon': true,
        ['filetype-icon--'+state]: true
      })}>
        {message}
      </div>
    );
  }

  render() {
    return <div className="maputnik-layout">
      {this.props.toolbar}
      <div style={{display: "flex", flexDirection: "column", flex: 1, boxShadow: "-1px 0px 6px 0px rgba(0, 0, 0, 0.28)"}}>
        <div style={{height: "41px", padding: "4px", borderBottom: "solid 1px #36383e"}}>
          <div className="maputnik-toolbar-logo">
            <img src={logoImage} alt="Maputnik" />
              <h1>Maputnik
              <span className="maputnik-toolbar-version">v{pkgJson.version}</span>
            </h1>
          </div>
          {this.getStyleState()}
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
          <div className="maputnik-map-container">
            {this.props.map}
            {this.props.bottom && <div className="maputnik-layout-bottom">
                {this.props.bottom}
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  }
}

export default AppLayout
