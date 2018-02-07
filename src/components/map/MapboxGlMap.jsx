import React from 'react'
import PropTypes from 'prop-types'
import ReactDOM from 'react-dom'
import MapboxGl from 'mapbox-gl'
import MapboxInspect from 'mapbox-gl-inspect'
import FeatureLayerPopup from './FeatureLayerPopup'
import FeaturePropertyPopup from './FeaturePropertyPopup'
import style from '../../libs/style.js'
import tokens from '../../config/tokens.json'
import colors from 'mapbox-gl-inspect/lib/colors'
import Color from 'color'
import ZoomControl from '../../libs/zoomcontrol'
import { colorHighlightedLayer } from '../../libs/highlight'
import 'mapbox-gl/dist/mapbox-gl.css'
import '../../mapboxgl.css'
import '../../libs/mapbox-rtl'

function renderPropertyPopup(features) {
  var mountNode = document.createElement('div');
  ReactDOM.render(<FeaturePropertyPopup features={features} />, mountNode)
  return mountNode.innerHTML;
}

function buildInspectStyle(originalMapStyle, coloredLayers, highlightedLayer) {
  const backgroundLayer = {
    "id": "background",
    "type": "background",
    "paint": {
      "background-color": '#1c1f24',
    }
  }

  const layer = colorHighlightedLayer(highlightedLayer)
  if(layer) {
    coloredLayers.push(layer)
  }

  const sources = {}
  Object.keys(originalMapStyle.sources).forEach(sourceId => {
    const source = originalMapStyle.sources[sourceId]
    if(source.type !== 'raster') {
      sources[sourceId] = source
    }
  })

  const inspectStyle = {
    ...originalMapStyle,
    sources: sources,
    layers: [backgroundLayer].concat(coloredLayers)
  }
  return inspectStyle
}

export default class MapboxGlMap extends React.Component {
  static propTypes = {
    onDataChange: PropTypes.func,
    onLayerSelect: PropTypes.func.isRequired,
    onViewChange: PropTypes.func.isRequired,
    mapStyle: PropTypes.object.isRequired,
    inspectModeEnabled: PropTypes.bool.isRequired,
    highlightedLayer: PropTypes.object,
  }

  static defaultProps = {
    onMapLoaded: () => {},
    onDataChange: () => {},
    onViewChange: () => {},
    onLayerSelect: () => {},
    mapboxAccessToken: tokens.mapbox,
    lat: 0,
    lng: 0,
    zoom: 0,
  }

  constructor(props) {
    super(props)
    MapboxGl.accessToken = tokens.mapbox
    this.state = {
      map: null,
      inspect: null,
      isPopupOpen: false,
      popupX: 0,
      popupY: 0,
    }
  }

  _onViewChange() {
    if(!this.state.map) {
      return;
    }
    const center = this.state.map.getCenter();
    const zoom = this.state.map.getZoom();

    this.props.onViewChange({
      lng: center.lng, lat: center.lat, zoom
    })
  }

  componentWillReceiveProps(nextProps) {
    if(!this.state.map) return
    const metadata = nextProps.mapStyle.metadata || {}
    MapboxGl.accessToken = metadata['maputnik:mapbox_access_token'] || tokens.mapbox

    if (this.props.zoom != nextProps.zoom) {
      this.state.map.setZoom(nextProps.zoom);
    }

    if (
      this.props.lng != nextProps.lng ||
      this.props.lat != nextProps.lat
    ) {
      this.state.map.setCenter({
        lng: nextProps.lng,
        lat: nextProps.lat
      })
    }

    if(!nextProps.inspectModeEnabled) {
      //Mapbox GL now does diffing natively so we don't need to calculate
      //the necessary operations ourselves!
      this.state.map.setStyle(nextProps.mapStyle, { diff: true})
    }
  }

  componentDidUpdate(prevProps) {
    if(this.props.inspectModeEnabled !== prevProps.inspectModeEnabled) {
      this.state.inspect.toggleInspector()
    }
    if(this.props.inspectModeEnabled) {
      this.state.inspect.render()
    }
  }

  componentDidMount() {
    const map = new MapboxGl.Map({
      center: [
        this.props.lng,
        this.props.lat
      ],
      zoom: this.props.zoom,
      container: this.container,
      style: this.props.mapStyle
    })

    const zoom = new ZoomControl;
    map.addControl(zoom, 'top-right');

    const nav = new MapboxGl.NavigationControl();
    map.addControl(nav, 'top-right');

    const inspect = new MapboxInspect({
      popup: new MapboxGl.Popup({
        closeOnClick: false
      }),
      showMapPopup: true,
      showMapPopupOnHover: false,
      showInspectMapPopupOnHover: true,
      showInspectButton: false,
      assignLayerColor: (layerId, alpha) => {
        return Color(colors.brightColor(layerId, alpha)).desaturate(0.5).string()
      },
      buildInspectStyle: (originalMapStyle, coloredLayers) => buildInspectStyle(originalMapStyle, coloredLayers, this.props.highlightedLayer),
      renderPopup: features => {
        if(this.props.inspectModeEnabled) {
          return renderPropertyPopup(features)
        } else {
          var mountNode = document.createElement('div');
          ReactDOM.render(<FeatureLayerPopup features={features} onLayerSelect={this.props.onLayerSelect} />, mountNode)
          return mountNode
        }
      }
    })
    map.addControl(inspect)

    map.on("style.load", () => {
      this.setState({ map, inspect });
    })

    map.on('moveend', () => this._onViewChange());

    map.on("data", e => {
      if(e.dataType !== 'tile') return
      this.props.onDataChange({
        map: this.state.map
      })
    })
  }

  render() {
    return <div
      className="maputnik-map"
      ref={x => this.container = x}
    ></div>
  }
}
