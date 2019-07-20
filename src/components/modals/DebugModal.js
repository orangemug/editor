import React from 'react'
import PropTypes from 'prop-types'

import Modal from './Modal'


class DebugModal extends React.Component {
  static propTypes = {
    isOpen: PropTypes.bool.isRequired,
    renderer: PropTypes.string.isRequired,
    onChangeMaboxGlDebug: PropTypes.func.isRequired,
    onChangeOpenlayersDebug: PropTypes.func.isRequired,
    onOpenToggle: PropTypes.func.isRequired,
    mapboxGlDebugOptions: PropTypes.object,
    openlayersDebugOptions: PropTypes.object,
    mapState: PropTypes.object,
  }

  static defaultProps = {
    mapState: {}
  }

  render() {
    const mapState = this.props.mapState;
    const {zoom} = mapState;
    const {lng, lat} = mapState.center || {};

    const providers = [
      {
        name: "OpenStreetMap",
        url: `http://www.openstreetmap.org/#map=${zoom+1}/${lat}/${lng}`
      },
      {
        name: "Google maps",
        url: `https://www.google.com/maps/@${lat},${lng},${zoom+1}z`
      },
      {
        name: "Bing",
        url: `https://bing.com/maps/default.aspx?cp=${lat}~${lng}&lvl=${zoom+1}`
      },
    ]

    return <Modal
      data-wd-key="debug-modal"
      isOpen={this.props.isOpen}
      onOpenToggle={this.props.onOpenToggle}
      title={'Debug'}
    >
      <div className="maputnik-modal-section">
        <h4>Map view inspector</h4>
        <p>
          The below links open the current map view in the various map providers.
        </p>
        <ul>
          {providers.map((provider) => {
            const {name, url} = provider;

            return (
              <li key={name}>
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href={url}
                >{name}</a>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="maputnik-modal-section">
        <h4>Options</h4>
        <div className="maputnik-modal-section maputnik-modal-shortcuts">
          {this.props.renderer === 'mbgljs' &&
            <ul>
              {Object.entries(this.props.mapboxGlDebugOptions).map(([key, val]) => {
                return <li key={key}>
                  <label>
                    <input type="checkbox" checked={val} onClick={(e) => this.props.onChangeMaboxGlDebug(key, e.target.checked)} /> {key}
                  </label>
                </li>
              })}
            </ul>
          }
          {this.props.renderer === 'ol' &&
            <ul>
              {Object.entries(this.props.openlayersDebugOptions).map(([key, val]) => {
                return <li key={key}>
                  <label>
                    <input type="checkbox" checked={val} onClick={(e) => this.props.onChangeOpenlayersDebug(key, e.target.checked)} /> {key}
                  </label>
                </li>
              })}
            </ul>
          }
        </div>
      </div>
    </Modal>
  }
}

export default DebugModal;
